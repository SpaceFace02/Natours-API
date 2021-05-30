const fs = require("fs");

// Reading JSON file
const tours = JSON.parse(
  // Dirname is the name of the directory you are currently in, go up has syntax /../
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

// Another MIDDLEWARE function which checks for invalid id's. It is not a valid practice to repeat code, hence we create a middleware function which checks everytime there's an id in the URL.
exports.checkID = (request, response, next, value) => {
  console.log(`Tour id is: ${value}`);
  // Or if(!tour) {} is another way.
  if (request.params.id >= tours.length || request.params.id < 0) {
    return response.status(404).json({
      status: "fail",
      message: "Invalid ID",
    });
  }
  next();
};

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
  response.status(200).json({
    status: "success",
    results: tours.length,
    datestring: request.requestTime,
    data: {
      tours: tours,
    },
  });
};

exports.getTour = (request, response) => {
  // Add double equals as its a string and we just want to compare without the types (one is string and one is int)
  const tour = tours.find((el) => el.id == request.params.id);
  response.status(200).json({
    status: "success",
    data: {
      tours: tour,
    },
  });
};

exports.addTour = (request, response) => {
  const newID = tours[tours.length - 1].id + 1;
  // Combines two objects with enumerable properties, read the docs for more indo
  const newTour = Object.assign({ id: newID }, request.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      response.status(201).json({
        status: "success",
        data: {
          tours: newTour,
        },
      });
    }
  );
};

// All of these api handlers only do their job, i.e getting tours, updating them etc. Authentication and cleaning of code is done in another function, but as we are using express, we need to do it in middleware, to make the code look professional.
