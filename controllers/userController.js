const User = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("../middleware/tryCatch");
const sendToken = require("../utils/jwtTokens");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// User Register
exports.register = tryCatchError(async (req, res, next) => {
  const { email, password, avatar, mobile, name } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "This is avatar",
      url: "lsdfknsd",
    },
    mobile,
  });
  // Uncomment below line if you want to log in the user immediately after registration
  //   const token = userRegister.getJWTToken();
  sendToken(user, 201, res);
});

// Login
exports.login = tryCatchError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please Enter Email", 400));
  }
  if (!password) {
    return next(new ErrorHandler("Please Enter Password", 400));
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email", 401));
  }
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid Password", 401));
  }

  sendToken(user, 200, res);
});

// Logout
exports.logout = tryCatchError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    HttpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Loged Out Successfuly",
  });
});

// Forgot Password Email varification..
exports.forgotPassword = tryCatchError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Generate the reset token
  const resetToken = user.getResetPasswordToken();

  // Save the user with the new token and expiration date
  await user.save({ validateBeforeSave: false });

  console.log("Saved Hashed Token in DB:", user.resetPasswordToken);
  console.log(
    "Token Expiry in DB:",
    new Date(user.resetPasswordExpire).toISOString()
  );

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;
  const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you did not request this, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password Recovery`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Email could not be sent", 500));
  }
});

// Reset Password..
exports.resetPassword = tryCatchError(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  console.log("Hashed Token from URL:", resetPasswordToken);

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    console.log("User not found with token:", resetPasswordToken);
    return next(
      new ErrorHandler("Reset Password Token is invalid or has expired", 400)
    );
  }

  // Check if passwords match
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update the password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Forgot Password Email with OPT verification  ..
exports.forgotPasswordOtp = tryCatchError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Generate a random OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in the user schema (you can store it temporarily in a separate field)
  user.resetPasswordToken = otp;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
  await user.save({ validateBeforeSave: false });

  const message = `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`;

  try {
    // Send OTP to user via email
    await sendEmail({
      email: user.email,
      subject: `Password Reset OTP`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Email could not be sent", 500));
  }
});

// Reset Password using OTP
exports.resetPasswordWithOtp = tryCatchError(async (req, res, next) => {
  const { otp, newPassword, confirmPassword } = req.body;

  // Find user by OTP
  const user = await User.findOne({
    resetPasswordToken: otp,
    resetPasswordExpire: { $gt: Date.now() }, // Check if OTP is still valid
  });

  if (!user) {
    return next(new ErrorHandler("Invalid OTP or OTP has expired", 400));
  }

  // Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update the password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // Send token response after successful password reset
  sendToken(user, 200, res);
});

// Get User Details
exports.getUserDetails = tryCatchError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Password
exports.updateUserPassword = tryCatchError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatch = await user.comparePassword(req.body.oldPpassword);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Old Password is incorrect", 400));
  }
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }
  user.password = req.body.newPassword;
  await user.save();
  sendToken(user, 200, res);

  res.status(200).json({
    success: true,
    user,
  });
});


// Update user Profile
exports.updateUserProfile = tryCatchError(async (req, res, next) => {
  const { name, email, mobile, password } = req.body;
  const user = await User.findById(req.user.id);
  user.name = name || user.name;
  user.email = email || user.email;
  user.mobile = mobile || user.mobile;

  // Only update password if provided
  if (password) {
    user.password = password;
  }

  // Save the user and trigger the pre-save hook
  await user.save();

  // Send token response
  return sendToken(user, 200, res);
});

// Get all User Only Admit can access this api
exports.getAllUsers = tryCatchError(async (req, res, next) => {
  const allUser = await User.find({});

  if (!allUser) {
    return next(new ErrorHandler("No Users found", 400));
  }
  res.status(200).json({
    success: true,
    allUser,
  });
});

// Get single user details Only Admit can access this api
exports.getUser = tryCatchError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler(`User Does Not exits: ${req.params.id}`));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// Update user role only admin can access this api
exports.updateUserRole = tryCatchError(async (req, res, next) => {
  const updateRole = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  const user = await User.findByIdAndUpdate(req.params.id, updateRole, {
    new: true,
  });
  if (!user) {
    return next(
      new ErrorHandler(`User does not exits with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
  });
});

// Delete user only admin can access this api.
exports.deleteUser = tryCatchError(async (req, res, next) => { 
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exits with Id: ${req.params.id}`)
    );
  }
  await User.deleteOne({ _id: id });
  res.status(200).json({
    success: true,
    message: "User deleted Succesfuly",
  });
});
