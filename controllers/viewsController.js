const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const factoryFn = require("./handlerFactory");

exports.getOverview = catchAsync(async (request, response, next) => {
  // It searches in the view folder as we have specified on line 39 and knows its pug as we have specified the view engine.

  // 1. Get tour data from collection
  const tours = await Tour.find({});
  // 2. Build template
  // 3. Render the website from the data received from step 1
  response.status(200).render("overview", {
    title: "Exciting Tours for adventurous people!",
    tours,
  });
  // This data is called locals in the pug file
});

exports.getTour = catchAsync(async (request, response) => {
  // Retreiving the slug
  const { slug } = request.params;
  const tour = await Tour.findOne({ slug: slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  response.status(200).render("tour", {
    title: tour.name,
    tour,
  });
});

// if (populateOptions) query = query.populate(populateOptions);

// //   Tour.findOne({ _id: request.params.id }).
// const document = await query;

// if (!document) {
//   // We return as we want to stop execution of the function at that stage.
//   return next(new AppError(`No ${type}  tour found for that ID`, 404));
// }
