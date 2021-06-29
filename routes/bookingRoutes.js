const express = require("express");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

const router = express.Router();

// Middleware runs in sequence, hence all routes are protected.
router.use(authController.protect);

// This will not exactly be REST as its not for creating or booking etc. Its just for creating a checkout session.

// tourId is just so that we can fill the session with the tour being bought, its name and price etc.
router.get("/checkout/:tourId", bookingController.getCheckoutSession);

router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
