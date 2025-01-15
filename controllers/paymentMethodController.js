const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("../middleware/tryCatch");
const PaymentMethod = require("../models/paymentMethodModels");

// create new card..
exports.addCard = tryCatchError(async (req, res, next) => {
  const { cardHolder, cardNumber, expiryDate, cvv } = req.body;
  const user = req.user._id;

  // Check if all required fields are present
  if (!cardHolder || !cardNumber || !expiryDate || !cvv) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // Validate card number (16 digits)
  if (!/^\d{16}$/.test(cardNumber)) {
    return next(new ErrorHandler("Invalid card number format", 400));
  }

  // Validate expiry date (MM/YY format)
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
    return next(new ErrorHandler("Invalid expiry date format (MM/YY)", 400));
  }

  // Validate CVV (3 or 4 digits)
  if (!/^\d{3,4}$/.test(cvv)) {
    return next(new ErrorHandler("Invalid CVV format", 400));
  }

  // Check for duplicate card (optional)
  const existingCard = await PaymentMethod.findOne({ user, cardNumber });
  if (existingCard) {
    return next(new ErrorHandler("This card is already added", 400));
  }

  // Add new card to database
  const cardMethod = await PaymentMethod.create({
    user,
    cardHolder,
    cardNumber,
    expiryDate,
    cvv,
  });

  // Success response
  res.status(201).json({
    success: true,
    message: "Card added successfully",
    card: {
      id: cardMethod._id,
      cardHolder: cardMethod.cardHolder,
      expiryDate: cardMethod.expiryDate,
    }, // Exclude sensitive details from response
  });
});

// Get Card Info..
exports.getCardInfo = tryCatchError(async (req, res, next) => {
  const userId = req.user.id; // Get user ID from authenticated user

  // Fetch the card(s) for the user, including the user's name via populate
  const cards = await PaymentMethod.find({ user: userId }).populate({
    path: "user",
    select: "name", // Only retrieve the name field from the User model
  });

  // If no cards found, return an appropriate message
  if (!cards || cards.length === 0) {
    return next(new ErrorHandler("No cards found for this user", 404));
  }

  // Respond with card information
  res.status(200).json({
    success: true,
    cards, // Return the cards, including user name
  });
});

// update card..
exports.updateCard = tryCatchError(async (req, res, next) => {
  // Find the card by ID
  let card = await PaymentMethod.findById(req.params.id);

  // Check if the card exists
  if (!card) {
    return next(new ErrorHandler("Card not found", 404));
  }

  // Update the card details
  card = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the updated card document
    runValidators: true, // Validate the fields based on the schema
  });

  // Respond with success and the updated card
  res.status(200).json({
    success: true,
    card,
  });
});

// get card by id..
exports.getCardById = tryCatchError(async (req, res, next) => {
  const card = await PaymentMethod.findById(req.params.id);
  res.status(200).json({
    success: true,
    card,
  });
});

// Remove card by id..
exports.deleteCard = tryCatchError(async (req, res, next) => {
    // Find and delete the card by ID
    const card = await PaymentMethod.findByIdAndDelete(req.params.id);
  
    // Check if the card exists
    if (!card) {
      return next(new ErrorHandler("Card not found", 404));
    }
  
    // Respond with success
    res.status(200).json({
      success: true,
      message: "Card deleted successfully",
    });
  });


// Pay 
  