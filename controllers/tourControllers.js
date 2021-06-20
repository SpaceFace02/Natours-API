// The concept of fat models and thin controllers, a lot of code is repeated in the catch blocks, the rey catch block is copy pasted many times, and its not focused, hence not a good practice.
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/APIFeatures");

// Error Handling
const catchAsync = require("../utils/catchAsync");

// Factory functions
const factoryFn = require("./handlerFactory");

// We dont wanna change the allTours controller, nor do we want to make a whole function for this. Hence we use a middleware to parse the URL before sending it.
exports.aliasTopTours = (request, response, next) => {
  request.query.limit = "5";
  request.query.sort = "-ratingsAverage,price";
  request.query.fields =
    "name,price,ratingsAverage,duration,summary,difficulty";
  next();
};

//////////////////////// Functions \\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getAllTours = factoryFn.getAll(Tour, "tour");
exports.getTour = factoryFn.getOne(Tour, "tour", { path: "reviews" });
exports.createTour = factoryFn.createOne(Tour, "tour");
exports.updateTour = factoryFn.updateOne(Tour, "tour");
exports.deleteTour = factoryFn.deleteOne(Tour, "tour");

exports.getMonthlyPlan = catchAsync(async (request, response) => {
  // To transform ot a number, we multiply by 1
  const year = request.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          // This creates a date with the template specifies and its between 2020-2021, if year = 2020.
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numToursPerMonth: { $sum: 1 },
        // { $push : ["name"] }
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $limit: 100,
    },
  ]);

  // Remember, the fields in the database are specified by double quotes and fields we have created in the aggregation pipeline can be accessed without quotes, like _id or tours or numToursPerMonth.

  response.status(200).json({
    status: "Success",
    data: {
      plan,
    },
  });
});

// Aggregation Pipeline to calculate stuff taking aggregates like averages or stats or distances etc.
exports.getTourStats = catchAsync(async (request, response) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // Don't group by id, as we want to group all the documents in the collection.
        _id: { $toUpper: "$difficulty" },
        numRatings: { $sum: "$ratingsQuantity" },
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        masPrice: { $max: "$price" },
      },
    },
    {
      // Sort by only the fields in group, as its a pipeline, and the 1 stands for ascending.
      $sort: { avgPrice: 1 },
    },
    {
      // We can use match in more than 1 stage.
      // As its a pipeline, id is already set to difficulty and we can use not equal to, to filter out the difficult results in this case.
      $match: { _id: { $ne: "DIFFICULT" } },
    },
  ]);

  // Response
  response.status(200).json({
    status: "Success",
    data: {
      length: stats.length,
      stats,
    },
  });
});

// All of these api handlers only do their job, i.e getting tours, updating them etc. Authentication and cleaning of code is done in another function, but as we are using express, we need to do it in middleware, to make the code look professional.
