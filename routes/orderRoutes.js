const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/Autho");
const {
  newOrder,
  myOrders,
  getSingleOrder,
  getAllOrders,
  updateOrder,
  deleteOrder,
  getIncomeStatistics,
  getOrderHistoryByCategory,
  applyVoucher,
} = require("../controllers/orderController");

const router = express.Router();

router.route("/post/order/new").post(isAuthenticatedUser, newOrder);
router.route("/get/order/:id").get(isAuthenticatedUser, getSingleOrder);
router.route("/get/myorders").get(isAuthenticatedUser, myOrders);
router
  .route("/get/orders")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);

router
  .route("/put/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder);

router
  .route("/delete/order/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);

router
  .route("/get/income")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getIncomeStatistics);

router
  .route("/get/orders/history/categories")
  .get(isAuthenticatedUser, getOrderHistoryByCategory);

router.route("/post/voucher/apply").post(isAuthenticatedUser, applyVoucher);

module.exports = router;
