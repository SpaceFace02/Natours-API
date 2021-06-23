const express = require("express");
const viewController = require("../controllers/viewsController");

const router = express.Router();

// As router is basically a mini-app.
router.get("/", viewController.getOverview);
router.get("/tour/:slug", viewController.getTour);

module.exports = router;
