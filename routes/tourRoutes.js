const express = require("express");
const tourControllers = require("../controllers/tourControllers");

// Using the route as middleware to connect it to the specific route.
const router = express.Router();

// Middleware, only when id is present in the URL, we use param to define the middleware, checkIS is just a function. We can use parameter middleware.

// router.param("id", tourControllers.checkID);

////////////////////// Tours \\\\\\\\\\\\\\\\\\\\\\\\\\

// The router runs at the specified URL, hence we don't specify the entire path.
router
  .route("/")
  .get(tourControllers.getAllTours)
  .post(tourControllers.addTour);

// Middleware first, prefill the query object and then running the getAllTours controller
router
  .route("/top-5-cheap")
  .get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router.route("/tour-stats").get(tourControllers.getTourStats);
router.route("/monthly-plan/:year").get(tourControllers.getMonthlyPlan);

// request.params.id will give the id in the URL, as we have defined it here.
router
  .route("/:id")
  .get(tourControllers.getTour)
  .patch(tourControllers.updateTour)
  .delete(tourControllers.deleteTour);

// Exporting the module
module.exports = router;
