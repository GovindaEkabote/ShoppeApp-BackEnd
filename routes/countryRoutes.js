const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/Autho");
const {
  addCountries,
  getAllCountries,
  updateCountry,
  getCountry,
  deleteCountry,
//   insertSingleCountry,
} = require("../controllers/countryController");
const router = express.Router();

router
  .route("/post/countries")
  .post(isAuthenticatedUser, authorizeRoles("admin"), addCountries);


router.route("/get/countries").get(isAuthenticatedUser, getAllCountries);

router
  .route("/put/country/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateCountry);

router.route("/get/country/:id").get(isAuthenticatedUser, getCountry);

router
  .route("/delete/country/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteCountry);

module.exports = router;
