const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    type: mongoose.Schema.ObjectId,
    ref: "ShippingAddress", // Reference to the ShippingAddress model
    required: true,
  },
  orderItems: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product", // Reference to the Product model
        required: true,
      },
      category: {
        type: String,
        // required: true, // Example: "Clothing", "Shoes", etc.
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  paymentInfo: {
    id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  paidAt: {
    type: Date,
    required: true,
  },
  itemPrice: {
    type: Number,
    required: true,
  },
  shippingPrice: {
    type: Number,
    required: true,
  },
  deliveryOption: {
    time: { type: String }, // Delivery time from Product
    price: { type: Number }, // Delivery price from Product
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  orderStatus: {
    type: String,
    required: true,
    default: "Processing",
  },
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  voucher: {
    type: mongoose.Schema.ObjectId,
    ref: "Voucher",
    default: null,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
