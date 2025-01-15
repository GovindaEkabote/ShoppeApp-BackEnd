const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  cardHolder: {
    type: String,
    required: true,
    trim: true,
  },
  cardNumber: {
    type: String,
    required: true,
    match: /^\d{16}$/, // Ensures exactly 16 digits
  },
  expiryDate: {
    type: String,
    required: true,
    match: /^(0[1-9]|1[0-2])\/\d{2}$/, // Ensures MM/YY format
  },
  cvv: {
    type: String,
    required: true,
    match: /^\d{3,4}$/, // Ensures 3 or 4 digits
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Model creation
const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

module.exports = PaymentMethod;
