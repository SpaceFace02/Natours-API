const Review = require("../models/reviewModel");
// const catchAsync = require("../utils/catchAsync");

// Factory functions
const factoryFn = require("./handlerFactory");

// Normal middleware, can be any function.
exports.setTourAndUserIds = (request, response, next) => {
  // Allowing nested routes, if not specified in the request body.
  if (!request.body.tour) request.body.tour = request.params.tourId;
  // We get this request.user from middleware stack.(from protect middleware).
  if (!request.body.user) request.body.user = request.user.id;
  next();
};

exports.getAllReviews = factoryFn.getAll(Review, "review");
exports.getReview = factoryFn.getOne(Review, "review");
exports.createReview = factoryFn.createOne(Review, "review");
exports.deleteReview = factoryFn.deleteOne(Review, "review");
exports.updateReview = factoryFn.updateOne(Review, "review");

// THIN CONTROLLERS, FAT MODELS.
