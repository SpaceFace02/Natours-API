// The concept of fat models and thin controllers, a lot of code is repeated in the catch blocks, the rey catch block is copy pasted many times, and its not focused, hence not a good practice.
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/APIFeatures");

// Error Handling
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// We dont wanna change the allTours controller, nor do we want to make a whole function for this. Hence we use a middleware to parse the URL before sending it.
exports.aliasTopTours = (request, response, next) => {
  request.query.limit = "5";
  request.query.sort = "-ratingsAverage,price";
  request.query.fields =
    "name,price,ratingsAverage,duration,summary,difficulty";
  next();
};

//////////////////////// Functions \\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getAllTours = async (request, response) => {
  //   console.log(request.requestTime);
  try {
    /////   BUILD QUERY //////

    ///////  EXECUTE QUERY //ratingsAverage/////
    const features = new APIFeatures(Tour.find(), request.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const allTours = await features.mongoQuery;

    ///////  RESPONSE //////////
    response.status(200).json({
      status: "Success",
      results: allTours.length,
      data: allTours,
    });
  } catch (err) {
    response.status(404).json({
      status: "Fail",
      message: err,
    });
  }
};

// We add next for error handling, if there's an error, call next and if we pass an argument in next, express will regard that argument as an error.
exports.getTour = catchAsync(async (request, response, next) => {
  // Add double equals as its a string and we just want to compare without the types (one is string and one is int)

  //   Tour.findOne({ _id: request.params.id })
  const tour = await Tour.findById(request.params.id);

  if (!tour) {
    // We return as we want to stop execution of the function at that stage.
    return next(new AppError("No tour found for that ID", 404));
  }

  response.status(200).json({
    status: "success",
    data: tour,
  });
});

// Focusing code, preventing copy-paste. This function returns another function which is assigned to addTour, as we don't want addTour to be a function called inside another function.

// The rejected promise is caught by this block

// next is required, so that it can be handled in the global error handling middleware.
exports.addTour = catchAsync(async (request, response, next) => {
  //   This method calls the method Create in the Tour object itself, use try catch if using async await
  // In JavaScript, Model.prototype is the new object created from the class, which here is the model( the prototype is the document. The prototype object of the class Tour is new Tour)
  const newTour = await Tour.create(request.body);

  response.status(201).json({
    status: "Success",
    data: newTour,
  });
});

exports.updateTour = catchAsync(async (request, response, next) => {
  const updatedTour = await Tour.findByIdAndUpdate(
    request.params.id,
    request.body,
    {
      //   Returns the modified object
      new: true,
      // Runs the validation on the updated data wrt the schema, otherwise there's no validation.
      runValidators: true,
    }
  );

  if (!updatedTour) {
    // We return as we want to stop execution of the function at that stage.
    return next(new AppError("No tour found for that ID", 404));
  }

  response.status(201).json({
    status: "Success",
    data: {
      tour: updatedTour,
    },
  });
});

exports.deleteTour = catchAsync(async (request, response, next) => {
  const deletedTour = await Tour.findByIdAndDelete(request.params.id);

  if (!deletedTour) {
    // We return as we want to stop execution of the function at that stage.
    return next(new AppError("No tour found for that ID", 404));
  }

  response.status(204).json({
    status: null,
  });
});

exports.getMonthlyPlan = catchAsync(async (request, response) => {
  // To transform ot a number, we multiply by 1
  const year = request.params.year * 1;
  console.log(year);

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
