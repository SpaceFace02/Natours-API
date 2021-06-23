// This is a function that returns another function

const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// The inner function gets access to the variables passed in the outer function, even after the outer function has already returned.
// As this function can delete any type of collection, reviews, tours or users.
exports.deleteOne = (Model, type) =>
  catchAsync(async (request, response, next) => {
    const deletedDocument = await Model.findByIdAndDelete(request.params.id);

    if (!deletedDocument) {
      // We return as we want to stop execution of the function at that stage.
      return next(new AppError(`No ${type} found for that ID`, 404));
    }

    response.status(204).json({
      status: null,
    });
  });

exports.updateOne = (Model, type) =>
  catchAsync(async (request, response, next) => {
    const updatedDocument = await Model.findByIdAndUpdate(
      request.params.id,
      request.body,
      {
        //   Returns the modified object
        new: true,
        // Runs the validation on the updated data wrt the schema, otherwise there's no validation.
        runValidators: true,
      }
    );

    if (!updatedDocument) {
      // We return as we want to stop execution of the function at that stage.
      return next(new AppError(`No  ${type} found for that ID`, 404));
    }

    response.status(201).json({
      status: "Success",
      data: {
        data: updatedDocument,
      },
    });
  });

// Focusing code, preventing copy-paste. This function returns another function which is assigned to addTour, as we don't want addTour to be a function called inside another function.

// The rejected promise is caught by this block
// next is required, so that it can be handled in the global error handling middleware.
exports.createOne = (Model, type) =>
  catchAsync(async (request, response, next) => {
    //   This method calls the method Create in the Tour object itself, use try catch if using async await
    // In JavaScript, Model.prototype is the new object created from the class, which here is the model( the prototype is the document. The prototype object of the class Tour is new Tour)
    const newDocument = await Model.create(request.body);

    response.status(201).json({
      status: `Successfully created new ${type}`,
      data: newDocument,
    });
  });

exports.getOne = (Model, type, populateOptions) =>
  // We add next for error handling, if there's an error, call next and if we pass an argument in next, express will regard that argument as an error.
  catchAsync(async (request, response, next) => {
    // Add double equals as its a string and we just want to compare without the types (one is string and one is int)

    let query = Model.findById(request.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    //   Tour.findOne({ _id: request.params.id }).
    const document = await query;

    if (!document) {
      // We return as we want to stop execution of the function at that stage.
      return next(new AppError(`No ${type}  tour found for that ID`, 404));
    }

    response.status(200).json({
      status: "success",
      data: document,
    });
  });

exports.getAll = (Model, type) =>
  catchAsync(async (request, response) => {
    //   console.log(request.requestTime);
    /////   BUILD QUERY //////

    // GET /tour/tourId/reviews -- All reviews for a particular tour.
    // To allow for nested queries like GET reviews on tour.
    let filter = {};

    if (request.params.tourId) filter = { tour: request.params.tourId };

    const features = new APIFeatures(Model.find(filter), request.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    ///////  EXECUTE QUERY //ratingsAverage/////
    const documents = await features.mongoQuery;

    // To understand indexing better, see the executionStats field when the following code is uncommented.
    // const documents = await features.mongoQuery.explain();

    ///////  RESPONSE //////////
    response.status(200).json({
      status: `Successfully returned all ${type}s`,
      results: documents.length,
      data: documents,
    });
  });
