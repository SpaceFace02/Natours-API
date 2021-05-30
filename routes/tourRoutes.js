const express = require("express");
const tourControllers = require("../controllers/tourControllers");

// Using the route as middleware to connect it to the specific route.
const router = express.Router();

// Middleware, only when id is present in the URL, we use param to define the middleware, checkIS is just a function.
router.param("id", tourControllers.checkID);

////////////////////// Tours \\\\\\\\\\\\\\\\\\\\\\\\\\

// The router runs at the specified URL, hence we don't specify the entire path.
router
  .route("/")
  .get(tourControllers.getAllTours)
  .post(tourControllers.checkBody, tourControllers.addTour);
router.route("/:id").get(tourControllers.getTour);

// Exporting the module
module.exports = router;
