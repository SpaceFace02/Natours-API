const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

// Each router has access to the params of their specific route. So /tour leads to tourRoutes and that has access to the URL params.(/:id), but review routes is a different route and doesn't have access to that param, unless we specify mergeParams.

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// 2 URL's LEAD TO THE SAME ROUTER.
// POST /tour/tourId/reviews
// POST /reviews

// So now what we wanna do is create nested queries and access queries in the same route.
router
  .route("/")
  // Automatically comes here, due to the re-routing performed.
  .get(reviewController.getAllReviews)
  .post(
    // Sets the tour and user IDs, refer the revieController.
    authController.restrictTo("user"),
    reviewController.setTourAndUserIds,
    reviewController.createReview
  );

// restrict must come after protect as the request.user object is created in the protect middleware.
router
  .route("/:id")
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview
  )
  .get(reviewController.getReview);

module.exports = router;
