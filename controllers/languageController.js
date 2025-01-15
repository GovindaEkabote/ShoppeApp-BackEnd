const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("../middleware/tryCatch");
const Language = require("../models/languageModels");
const User = require('../models/userModel')

// Create Countries used Json File
exports.addLanguages = tryCatchError(async (req, res, next) => {
  const language = await Language.create(req.body);

  res.status(201).json({
    success: true,
    language,
  });
});

// Get All Langugage..
exports.getAllLanguages = tryCatchError(async (req, res, next) => {
  const languages = await Language.find();
  if (languages.length === 0) {
    return next(new ErrorHandler("There is no language found"));
  }
  res.status(200).json({
    success: true,
    languages,
  });
});

// Get Language by Id..
exports.getLanguage = tryCatchError(async (req, res, next) => {
  const getLanguage = await Language.findById(req.params.id);
  if (!getLanguage) {
    return next(new ErrorHandler("Language not found", 404));
  }
  res.status(200).json({
    success: true,
    getLanguage,
  });
});

// delete Language..
exports.deleteLanguage = tryCatchError(async (req, res, next) => {
  const deleteLanguage = await Language.findById(req.params.id);
  if (!deleteLanguage) {
    return next(new ErrorHandler("Language does not Exits", 404));
  }
  await Language.deleteOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "Language Deleted successfully",
  });
});




