const { response } = require("express");
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/APIFeatures");

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

exports.getTour = async (request, response) => {
  // Add double equals as its a string and we just want to compare without the types (one is string and one is int)

  try {
    //   Tour.findOne({ _id: request.params.id })
    const tour = await Tour.findById(request.params.id);
    response.status(200).json({
      status: "success",
      data: tour,
    });
  } catch (err) {
    response.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.addTour = async (request, response) => {
  // This method calls the save method on the document newTour
  //   const newTour = new Tour({});
  //   newTour.save();

  //   This method calls the method Create in the Tour object itself, use try catch if using async await
  try {
    // In JavaScript, Model.prototype is the new object created from the class, which here is the model( the prototype is the document. The prototype object of the class Tour is new Tour)
    const newTour = await Tour.create(request.body);
    response.status(201).json({
      status: "Success",
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    response.status(400).json({
      status: "Fail",
      message: err,
    });
  }
};

exports.updateTour = async (request, response) => {
  try {
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

    response.status(201).json({
      status: "Success",
      data: {
        tour: updatedTour,
      },
    });
  } catch (err) {
    response.status(400).json({
      status: "Fail",
      message: err,
    });
  }
};

exports.deleteTour = async (request, response) => {
  try {
    await Tour.findByIdAndDelete(request.params.id);
    response.status(204).json({
      status: null,
    });
  } catch (err) {
    response.status(400).json({
      status: "Failed To delete",
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (request, response) => {
  try {
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
  } catch (err) {
    response.status(400).json({
      status: "Failed To Query data",
      message: err,
    });
  }
};

// Aggregation Pipeline to calculate stuff taking aggregates like averages or stats or distances etc.
exports.getTourStats = async (request, response) => {
  try {
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
  } catch (err) {
    response.status(400).json({
      status: "Failed",
      err: err,
    });
  }
};

// All of these api handlers only do their job, i.e getting tours, updating them etc. Authentication and cleaning of code is done in another function, but as we are using express, we need to do it in middleware, to make the code look professional.
