const Product = require("../models/productModels");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("../middleware/tryCatch");
const ApiFeatures = require("../utils/apiFeatures");

// Create Product
exports.createProduct = tryCatchError(async (req, res, next) => {
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});

// Get All Products
exports.getAllProducts = tryCatchError(async (req, res, next) => {
  const productCount = await Product.countDocuments();
  const apifeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();
  const products = await apifeature.query;

  if (!products || products.length === 0) {
    return next(new ErrorHandler("No products found", 404));
  }

  res.status(200).json({
    success: true,
    products,
    productCount,
  });
});

// Update Product
exports.updateProduct = tryCatchError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    product,
  });
});

// Get Product By Id
exports.getProductById = tryCatchError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product By Id
exports.deleteProduct = tryCatchError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  await Product.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Create New Review or update the review
exports.createProductReview = tryCatchError(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const isReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  // Calculate average rating
  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Review submitted successfully",
  });
});

// Get All Reviews of a product.
exports.getProductReviews = tryCatchError(async (req, res, next) => {
  const product = await Product.findById(req.query.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
exports.deleteReviews = tryCatchError(async (req, res, next) => {
  const { productID, id } = req.query;

  // Ensure the user is logged in
  if (!req.user) {
    return next(
      new ErrorHandler("You must be logged in to perform this action", 401)
    );
  }

  const product = await Product.findById(productID);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Find the review to delete
  const review = product.reviews.find(
    (rev) => rev._id.toString() === id.toString()
  );
  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  // Check if the logged-in user is the owner of the review
  if (review.user.toString() !== req.user.id) {
    return next(
      new ErrorHandler("You are not authorized to delete this review", 403)
    );
  }

  // Filter out the review and update the product
  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== id.toString()
  );
  const numOfReviews = reviews.length;
  const avg = reviews.reduce((acc, rev) => acc + rev.rating, 0);
  const ratings = numOfReviews > 0 ? avg / numOfReviews : 0;

  await Product.findByIdAndUpdate(
    productID,
    { reviews, ratings, numOfReviews },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Review Deleted Successfully",
  });
});

// Product Like and Unlike
exports.productLike = tryCatchError(async (req, res, next) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const isLiked = product.likes.find(
    (like) => like.toString() === req.user._id.toString()
  );

  if (isLiked) {
    // Unlike the product
    product.likes = product.likes.filter(
      (like) => like.toString() !== req.user._id.toString()
    );
    product.likeCount = Math.max(0, product.likes.length); // Ensure likeCount doesn't go negative
  } else {
    // Like the product
    product.likes.push(req.user._id);
    product.likeCount = product.likes.length;
  }

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: isLiked
      ? "Product unliked successfully"
      : "Product liked successfully",
    likeCount: product.likeCount,
  });
});
