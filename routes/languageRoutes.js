const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/Autho");
const {
  addLanguages,
  getAllLanguages,
  getLanguage,
  deleteLanguage,
  selectLanguage,
} = require("../controllers/languageController");

const router = express.Router();

router.route("/post/add").post(isAuthenticatedUser, authorizeRoles("admin"),addLanguages)
router.route("/get/languages").get(isAuthenticatedUser, getAllLanguages);
router.route("/get/language/:id").get(isAuthenticatedUser,getLanguage)
router.route("/delete/language/:id").delete(isAuthenticatedUser, authorizeRoles("admin"),deleteLanguage)



module.exports = router;
