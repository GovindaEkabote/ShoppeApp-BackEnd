const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/Autho");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  getProductById,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteReviews,
  productLike,
} = require("../controllers/productController");

const router = express.Router();

router
  .route("/post/newproduct")
  .post(isAuthenticatedUser, authorizeRoles("admin"), createProduct);
router.route("/get/getAllProducts").get(getAllProducts);
router
  .route("/put/updateProduct/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct);
router.route("/get/getProductById/:id").get(getProductById);
router
  .route("/delete/deleteProduct/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);
router.route("/put/review").put(isAuthenticatedUser, createProductReview);

router.route("/get/reviews").get(getProductReviews);
router.route("/delete/review").delete(isAuthenticatedUser, deleteReviews);

router.route("/post/like").post(isAuthenticatedUser, productLike);

module.exports = router;
