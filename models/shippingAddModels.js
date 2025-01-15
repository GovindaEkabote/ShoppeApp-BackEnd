const mongoose = require("mongoose");

const shippingAddressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  country: {
    type: mongoose.Schema.ObjectId,
    ref: "Country",
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  townCity: {
    type: String,
    required: true,
  },
  postcode: {
    type: Number,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ShippingAddress = mongoose.model(
  "ShippingAddress",
  shippingAddressSchema
);

module.exports = ShippingAddress;
