const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
// const { use } = require("../routes/userRoutes");
const jwt = require("jsonwebtoken");
// const bcrypt = require("crypto");
const { type } = require("os");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    // required:true
  },
  email: {
    type: String,
    required: [true, "Please Enter Email"],
    unique: true,
    validate: [validator.isEmail, "Please valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,
    validate: {
      validator: function (value) {
        return /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/.test(value);
      },
      message:
        "Password must contain at least one uppercase letter, one symbol, and one number",
    },
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  mobile: {
    type: Number,
    validate: {
      validator: function (value) {
        return /^[0-9]{10}$/.test(value);
      },
      message: (props) => `${props.value} is not equal to 10`,
    },
    required: [true, "Number field is required"],
  },
  role: {
    type: String,
    default: "user",
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

//
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// JWT Token Generated...
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare Password.
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing  and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  console.log("Generated Reset Token (Unhashed):", resetToken);
  console.log("Hashed Token to be saved:", this.resetPasswordToken);
  console.log(
    "Token Expiry Time:",
    new Date(this.resetPasswordExpire).toISOString()
  );
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
