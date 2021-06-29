const express = require("express");
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

// // To every single route, as it runs in sequence. But we don't do this as protect and this route are similar and if we do this, the query for getting current user will be performed twice.
// router.use(authController.isLoggedIn);

// As router is basically a mini-app.
router.get(
  "/",
  authController.isLoggedIn,
  bookingController.createBookingCheckout,
  viewsController.getOverview
);
router.get("/tour/:slug", authController.isLoggedIn, viewsController.getTour);
router.get("/login", authController.isLoggedIn, viewsController.getLoginForm);
// protect is similar to isLogged In, so we don't want to do the query twice for performance issues.
router.get("/me", authController.protect, viewsController.getAccountDetails);
router.get("/mytours", authController.protect, viewsController.getMyTours);

router.post(
  "/submit-user-data",
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
