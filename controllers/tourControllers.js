// Image uploading and processing
const multer = require("multer");
const sharp = require("sharp");

// The concept of fat models and thin controllers, a lot of code is repeated in the catch blocks, the rey catch block is copy pasted many times, and its not focused, hence not a good practice.
const Tour = require("../models/tourModel");

// For geo-spatial error validation.
const AppError = require("../utils/AppError");

// Error Handling
const catchAsync = require("../utils/catchAsync");

// Factory functions
const factoryFn = require("./handlerFactory");

// We dont wanna change the allTours controller, nor do we want to make a whole function for this. Hence we use a middleware to parse the URL before sending it.
exports.aliasTopTours = (request, response, next) => {
  request.query.limit = "5";
  request.query.sort = "-ratingsAverage,price";
  request.query.fields = "name,price,ratingsAverage,duration,summary,difficulty";
  next();
};

//////////////////////// MULTER /////////////////////////////
// Creates a buffer object of sorts.
const multerMemStorage = multer.memoryStorage();

// This specifies that whether the files uploaded are images or not.
const multerFilter = (request, file, callback) => {
  // For all images, mimetype starts with "image".
  if (file.mimetype.startsWith("image")) callback(null, true);
  // callback is used for error handling and the first argument is error, second argument is the whether the validation is true or false. Only when its a middleware and not a instance of multer, this holds true, otherwise the second argument is the filename.
  else callback(new AppError("Please upload only images", 400), false);
};

// Where the files are uploaded when multer is used. Images are not uploaded in the database, they are just put in the file system and we put the path in the database.
const upload = multer({
  storage: multerMemStorage,
  fileFilter: multerFilter,
});

// As per docs, an array of field objects.
exports.uploadTourImages = upload.fields([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 3,
  },
]);

exports.resizeTourImages = catchAsync(async (request, response, next) => {
  if (!request.files.imageCover || !request.files.images) return next();

  // 1. ImageCover

  // This routes always contains the id of the tour in its URL params
  const imgCoverFilename = `tour-${request.params.id}-${Date.now()}-cover.jpeg`;

  // 1. Cover image processing. ImageCover is an array.
  await sharp(request.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imgCoverFilename}`);

  // Saving the filename to request.body as its passed in the updateOne function in the handlerFactory. This is not the updateMe function, so there's not filtered body, just body.

  // Save it to the database, with this fixed name in schema definition.
  request.body.imageCover = imgCoverFilename;

  // 2. Images

  // request.body doesn't contain anything, so we pass request.body.images to database, converted to an array of strings.
  request.body.images = [];

  // We are awaiting the callback function, not the mapping(forEach) function, hence we need to await the whole wrapper, otherwise it will go to the next next() line. So we can await an array of promises using Promise.all. The resizing works as its running in the background asynchronously and not in the event loop.

  // We do map as map returns a new array of promises(as its an async function inside it) over which we can execute promise.all, forEach mutates the original array and doesn't return anything.

  await Promise.all(
    request.files.images.map(async (file, i) => {
      const imageFilename = `tour-${request.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageFilename}`);

      // So that the updateTour handler puts data in new document, when it updates it.
      request.body.images.push(imageFilename);
    })
  );

  next();
});

// One field, many images, for example
// upload.array("images", 5) request.files (plural)

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

//  "/tours-within/distance/:distance/center/:latlng/distUnit/:unit",
//  "/tours-within/distance/200/center/34.042546, -118.24075/distUnit/mile",

// Also in mongoDB Compass, all documents must have startLocations to see the map in analyzeSchema in start Locations.
exports.getToursWithin = catchAsync(async (request, response, next) => {
  // Destructuring to get all variables at once from an object.
  const { distance, latlng, unit } = request.params;
  // Destructuring in an array.
  const [lat, lng] = latlng.split(",");

  if (unit !== "mile" && unit !== "km")
    return next(new AppError("Enter 'mile' or 'km' exactly."));

  if (!lat || !lng)
    return next(
      new AppError("Please enter latitude and longitude in the format lat,lng.", 400)
    );

  // To convert to radians, we need to divide the distance by the radius of the earth.EPIPHANY:
  // We know that S = R(theta(in radians)), S is distance on sphere, R is radius of sphere and thetha is in radians. Draw a diagram for better understanding.
  const radius = unit === "mile" ? distance / 3963.2 : distance / 6378.1;

  // Geo-spatial query implementation. Finds document in a particular geometry. Here the geometry is a circle, with center as latlng and radius as distance.
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  // To do geo-spatial queries, we need to attribute an index to the field where the geo-spatial data is stored, i.e startLocation.
  response.status(200).json({
    status: "Success",
    results: tours.length,
    data: tours,
  });
});

exports.getDistances = catchAsync(async (request, response, next) => {
  const { latlng, unit } = request.params;

  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mile" ? 0.000621 : 0.001;

  if (unit !== "mile" && unit !== "km")
    return next(new AppError("Enter 'mile' or 'km' exactly."));

  if (!lat || !lng)
    return next(
      new AppError("Please enter latitude and longitude in the format lat,lng.", 400)
    );
  // startLocation already has 2dsphere geospatial index on it.
  const distances = await Tour.aggregate([
    // The stages are always in curly brackets and after one stage is over.
    {
      $geoNear: {
        // GeoJSON.
        near: {
          type: "Point",
          // Refer docs, coordinates must be integers.
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distances",
        // Divide by 1000 to convert to km.
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distances: 1,
        name: 1,
      },
    },
  ]);

  response.status(200).json({
    status: "Success",
    results: distances.length,
    data: distances,
  });
});

// All of these api handlers only do their job, i.e getting tours, updating them etc. Authentication and cleaning of code is done in another function, but as we are using express, we need to do it in middleware, to make the code look professional.
