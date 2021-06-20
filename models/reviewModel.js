// Parent referencing, the child references the tour and user parent as a review can be only by one user and about one particular tour.
const mongoose = require("mongoose");

// If we don't specift new, we won't get access to the this keyword I guess.🤷🏻‍♂️
const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: String,
      required: [true, "Please enter a rating"],
    },
    review: {
      type: String,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Please enter your user details."],
    },
  },
  {
    toJSON: { virtuals: true },
  }
);

// Before finding, a query.
reviewSchema.pre(/^find/, function (next) {
  // Populate returns a new query, so you can chain after that.

  // We turn this off for optimization, a tour must have reviews, but a review doesn't need to have a lot of info about the tour.
  // this.populate({
  //   path: "tour",
  //   select: "name",
  // }).populate({
  //   path: "user",
  //   select: "name photo",
  // });

  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

module.exports = mongoose.model("Review", reviewSchema);
