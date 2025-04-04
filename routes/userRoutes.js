const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  getAllUsers,
  resetPassword,
  getUserDetails,
  updateUserPassword,
  updateUserProfile,
  getUser,
  updateUserRole,
  deleteUser,
  forgotPasswordOtp,
  resetPasswordWithOtp,
} = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/Autho");

const router = express.Router();

router.route("/post/userregister").post(register);

router.route("/post/login").post(login);
router.route("/post/password/forgot").post(forgotPassword);
// router.route('/get/allusers').get(isAuthenticatedUser,authorizeRoles('admin') ,getAllUsers);

router.route("/password/reset/:token").put(resetPassword);

router.route("/get/logout").get(logout);
router.route("/get/userdetails").get(isAuthenticatedUser, getUserDetails);
router
  .route("/put/password/update")
  .put(isAuthenticatedUser, updateUserPassword);
router
  .route("/put/userprofile/update")
  .put(isAuthenticatedUser, updateUserProfile);
router
  .route("/get/admin/users")
  .get(isAuthenticatedUser, authorizeRoles("admin"),getAllUsers);
router
  .route("/get/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getUser);
router
  .route("/put/admin/updaterole/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole);
router
  .route("/delete/admin/deleteuser/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

router
  .route("/post/password/forgot-otp")
  .post(isAuthenticatedUser, forgotPasswordOtp);

router
  .route("/post/password/reset-otp")
  .post(isAuthenticatedUser, resetPasswordWithOtp);

module.exports = router;
