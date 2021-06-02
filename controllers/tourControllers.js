const Tour = require("../models/tourModel");

// Middleware function to check if name and price are present while posting a new tour
exports.checkBody = (request, response, next) => {
  if (!request.body.name || !request.body.price) {
    return response.status(400).json({
      status: "fail",
      message: "Enter all required details.",
    });
  }
  next();
};

//////////////////////// Functions \\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getAllTours = (request, response) => {
  //   console.log(request.requestTime);
};

exports.getTour = (request, response) => {
  // Add double equals as its a string and we just want to compare without the types (one is string and one is int)
  response.status(200).json({
    status: "success",
  });
};

exports.addTour = (request, response) => {
  //   const newTour = { ...request.body, id: newID };
};

// All of these api handlers only do their job, i.e getting tours, updating them etc. Authentication and cleaning of code is done in another function, but as we are using express, we need to do it in middleware, to make the code look professional.

// Reading JSON file
// const tours = JSON.parse(
//   // Dirname is the name of the directory you are currently in, go up has syntax /../
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//  fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       response.status(201).json({
//         status: "success",
//         data: {
//           tours: newTour,
//         },
//       });
//     }
//   );
