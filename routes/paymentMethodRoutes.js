const express = require("express");
const { isAuthenticatedUser } = require("../middleware/Autho");
const {
  addCard,
  getCardInfo,
  updateCard,
  deleteCard,
} = require("../controllers/paymentMethodController");

const router = express.Router();

router.route("/post/addcard").post(isAuthenticatedUser, addCard);
router.route("/get/card").get(isAuthenticatedUser, getCardInfo);
router.route("/update/card/:id").put(isAuthenticatedUser, updateCard);
router.route("/get/card/:id").get(isAuthenticatedUser, updateCard);
router.route("/delete/card/:id").delete(isAuthenticatedUser, deleteCard);



module.exports = router;
