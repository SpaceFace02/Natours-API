// Parent referencing, the child references the tour and user parent as a review can be only by one user and about one particular tour.
const mongoose = require("mongoose");

// For average Ratings and nRatings
const Tour = require("./tourModel");

// If we don't specift new, we won't get access to the this keyword I guess.🤷🏻‍♂️
const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
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

// Indexes tour and user, and makes sure that each combination of tour and user is unique. Unique compound index. To ensure that one user cannot write multiple reviews for the same tour.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

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

// statics are same as instance method, but they are functions defined on the model. Tourid of the current review.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this points to the current model. We used statics, because we wanted to call aggregate and in statics, the this keyword points directly to the model, because the function created by statics acts on the model itself. If we used .methods, then the this keyword would point to the current document, not the current model.
  const reviewStats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      //  group by each tour.
      $group: {
        _id: "$tour",
        // Sum of all tours as gotten in the first stage. This group stage is only for calulating the nRatings.
        nRatings: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (reviewStats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: reviewStats[0].avgRating,
      ratingsQuantity: reviewStats[0].nRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: null,
      ratingsQuantity: 0,
    });
  }
};

// If we use pre, the review is not saved in the collection at that time, just yet.
// New review, a review is updated or deleted: all these operation change the rating.
reviewSchema.post("save", function (document, next) {
  // this points to current review. this.tour is the parameter, i.e this.tourId.

  // this points to the document, its constructor is the model(points to the model), as we created the document using the model. Review.create(), remember?
  this.constructor.calcAverageRatings(this.tour);
  next();
});

// For FindByIdAndUpdate and Delete, we don't have document middleware, but only query middleware. FindByIdAndUpdate is just short hand for findOneAndUpdate(filter obj).

// We can't do findById here as findById is an abstraction of findOneAndUpdate(id), so whenever we execute findById, findOne is called at last. Also we can't do just find, as that runs indefinitely, because we have a line of code after that, that runs this.findOne(), so everytime we execute the pre middleware below with only findOne, that line of code is run always indefinitely, as thats also a query and the pre middleware runs before that query as well, and the code never reaches the next() line of code.

// EPIPHANY:!!!!!
// findOne is below on line 111, hence we can't just specify /findOne/ as it would run indefinitely and the code execution will always loop over line 109 to 111.

// ALSO THIS PART OF THE CODE MAY BREAK!!!!!!!
// FIXME: REVIEW: DEBUG:
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this is a query, and we execute another query and call it, which returns the data.
  this.review = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne()  This doesn't work as we don't have access to the query as it has already been executed.

  // Its a statics function, so we need to call it on the model. this.r returns the document, so its constructor is the model.

  // Even this here is a query, we have put the review field in the query. The review field's constructor is the Model.
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

// Now we declare stats on reviewSchema, and it runs in sequence. Hence if we move this above the pre save middleware, it wouldn't contain the calcAverageRatings function.
module.exports = mongoose.model("Review", reviewSchema);
