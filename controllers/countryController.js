const Country = require("../models/countryModels");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("../middleware/tryCatch");
const ApiFeatures = require("../utils/apiFeatures");


// Create Countries used Json File
exports.addCountries = tryCatchError(async (req, res, next) => {
  const country = await Country.create(req.body);

  res.status(201).json({
    success: true,
    country,
  });
});

// Get all countries
exports.getAllCountries = tryCatchError(async (req, res, next) => {
  const countries = await Country.find();
  if (countries.length === 0) {
    return next(new ErrorHandler("Not Countries Found", 404));
  }
  res.status(200).json({
    success: true,
    countries,
  });
});

// Update country
exports.updateCountry = tryCatchError(async (req, res, next) => {
  let country = await Country.findById(req.params.id);
  if (!country) return next(new ErrorHandler("Country not found", 404));

  country = await Country.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    country,
  });
});

// get Country by ID
exports.getCountry = tryCatchError(async (req, res, next) => {
  const getCountry = await Country.findById(req.params.id);
  if (!getCountry) {
    return next(new ErrorHandler("Country not Found", 404));
  }
  res.status(200).json({
    success: true,
    getCountry,
  });
});

// delete Country
exports.deleteCountry = tryCatchError(async (req, res, next) => {
  const deleteCountry = await Country.findById(req.params.id);
  if (!deleteCountry) {
    return next(new ErrorHandler("Country does not Exits", 404));
  }
  await Country.deleteOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "country deleted successfully",
  });
});
