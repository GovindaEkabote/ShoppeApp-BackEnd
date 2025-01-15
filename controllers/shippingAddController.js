const shippingAddress = require("../models/shippingAddModels");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("../middleware/tryCatch");
const Country = require("../models/countryModels");

// Create Shipping Address..
exports.addShippingAddress = tryCatchError(async (req, res, next) => {
  const { countryId, address, townCity, postcode, phoneNumber } = req.body;
  const user = req.user._id;
  
  if (!address || !townCity || !postcode || !phoneNumber || !countryId) {
    return next(new ErrorHandler("All fields are required", 404));
  }

  const country = await Country.findById(countryId);
  if (!country) {
    return next(new ErrorHandler("Invalid country ID", 400));
  }
  const ShippingAddress = await shippingAddress.create({
    user,
    country: country._id,
    address,
    townCity,
    postcode,
    phoneNumber,
  });

  res.status(201).json({
    success: true,
    message: "Shipping address added successfully",
    ShippingAddress,
  });
});

// Get Shipping Address..
exports.getUserShippingAddress = tryCatchError(async (req, res, next) => {
  const user = req.user.id;
  const address = await shippingAddress
    .find({ user })
    .populate("country", "name");
  if (address.length === 0) {
    return next(
      new ErrorHandler("No shipping addresses found for this user", 404)
    );
  }

  res.status(200).json({
    success: true,
    address,
  });
});

// Update Shipping Address..
exports.updateAddress = tryCatchError(async (req, res, next) => {
  let address = await shippingAddress.findById(req.params._id);
  address = await shippingAddress.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    address,
  });
});

// get all users Address..
exports.getAllAddress = tryCatchError(async (req, res, next) => {
  const address = await shippingAddress
    .find()
    // .populate("user", "id name email")
    .populate("country", "name");
  if (!address || address.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No shipping addresses found",
    });
  }

  res.status(200).json({
    success: true,
    address,
  });
});

// Get Address By ID Not Really required..
// exports.getAddressById = tryCatchError(async (req, res, next) => {
//   const address = await shippingAddress.findById(req.params.id);
//   res.status(200).json({
//     success: true,
//     address,
//   });
// });

// Delete Address if Required...


