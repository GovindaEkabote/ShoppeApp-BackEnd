const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Enter Product Name"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Please Enter Product Price"],
    max: [99999999, "Price cannot exceed 8 digits"],
  },
  salePrice: {
    type: Number,
    required: [true, "Please Enter Sale Price"],
    max: [99999999, "Sale Price cannot exceed 8 digits"],
  },
  discount: {
    type: Number,
    default: 0, // Discount percentage, e.g., 10 for 10%
  },
  description: {
    type: String,
    required: [true, "Please Enter Product Description"],
  },
  variations: {
    colors: [String], // e.g., ["Pink", "Red"]
    sizes: [String], // e.g., ["S", "M", "L", "XL"]
  },
  specifications: {
    material: String,
    origin: String,
  },
  deliveryOptions: {
    standard: {
      time: { type: String, required: true }, // e.g., "5-7 days"
      price: { type: Number, required: true }, // e.g., 00
    },
    express: {
      time: { type: String, required: true }, // e.g., "1-2 days"
      price: { type: Number, required: true }, // e.g., 12.00
    },
  },
  selectedDelivery: {
    type: String,
    enum: ["standard", "express"], // Allows only "standard" or "express" values
    required: true,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],

  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "Please Enter Product Category"],
  },
  stock: {
    type: Number,
    required: [true, "Please Enter Product Stock"],
    default: 1,
  },
  likes: [{ type: mongoose.Schema.ObjectId, ref: "User" }], // Reference to User model
  likeCount: { type: Number, default: 0 },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
