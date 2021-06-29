const express = require("express");
const tourControllers = require("../controllers/tourControllers");
const authController = require("../controllers/authController");
const reviewRouter = require("./reviewRoutes");
const Tour = require("../models/tourModel");

// Using the route as middleware to connect it to the specific route.
const router = express.Router();

// Middleware, only when id is present in the URL, we use param to define the middleware, checkIS is just a function. We can use parameter middleware.

// router.param("id", tourControllers.checkID);

/////////////////   MERGE PARAMS, USED IN NESTED URLS ///////////////////

// router is just a middleware, so like app.use, we can mount reviewRouter here when we hit the URL.
// routed in app.js to tourRouter and here to reviewRouter.

// whenever /tours/tourId shows up, its redirected here, so only this router has access to the tourId parameter, not the reviewRouter, after we redirect it to the reviewRouter.
router.use("/:tourId/reviews", reviewRouter);

////////////////////// Tours \\\\\\\\\\\\\\\\\\\\\\\\\\

// The router runs at the specified URL, hence we don't specify the entire path.
router
  .route("/")
  // We wanna expose this part of the route to everyone.
  .get(tourControllers.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "leadTourGuide"),
    tourControllers.createTour
  );

// Middleware first, prefill the query object and then running the getAllTours controller
router
  .route("/top-5-cheap")
  .get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router.route("/tour-stats").get(tourControllers.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "leadTourGuide", "guides"),
    tourControllers.getMonthlyPlan
  );
// Easier to understand, we could also used queryStrings.
router.get(
  "/tours-within/distance/:distance/center/:latlng/distUnit/:unit",
  tourControllers.getToursWithin
);
//  Even this can work ---> /tours-distance?distance=200&center=40,45&unit=mile

router.get("/distances/:latlng/distUnit/:unit", tourControllers.getDistances);

// request.params.id will give the id in the URL, as we have defined it here.
router
  .route("/:id")
  .get(tourControllers.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "leadTourGuide"),
    tourControllers.uploadTourImages,
    tourControllers.resizeTourImages,
    tourControllers.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "leadTourGuide"),
    tourControllers.deleteTour
  );

// POST /tours/23dsa3/reviews reviews for the tour id
// GET /tour/23dsa3/reviws  gets reviews for that tour
// GET /tour/23dsa3/reviews/987hf3   gets that particular review for that particular tour.

// Counter-intuitive that we are calling reviewControllers here, but we want to post the review to the tour and also its /tour, so it comes first. Hence you can keep it, however, I'm using merge params.

// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewControllers.createReview
//   );

// Exporting the module
module.exports = router;
