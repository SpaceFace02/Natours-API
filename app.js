// Everything related to middleware goes here, the middleware is added to the web application in this file.

// Using mongoose schema really prevents a lot of attacks.

const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

// Data Sanitization
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

// Parameter pollution, more that one parameter in sort or any of the APIFeatures
const hpp = require("hpp");

// The folder is routes, coz it contains routes, but we exported the router from there.
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

// Errors
const AppError = require("./utils/AppError");
const globalErrorController = require("./controllers/errorControllers");

// Env must be before app for it to be accessable.
dotenv.config({ path: "./config.env" });
const app = express();

/////////////////  GLOBAL MIDDLWARE ///////////////////////////

// Remember, order matters in middleware, we can't use the middle ware after the response has been sent back to the client.

// Special HTTP headers, we pass a function in, not a function call, but here the function returns a function, so its good.
app.use(helmet());

////////   BODY PARSER, reads data from body into request.body
app.use(
  express.json({
    limit: "10kb",
  })
);

// Limit request from same IP.
const limiter = rateLimit({
  max: 100,
  // In milliseconds.
  windowMs: 60 * 60 * 1000,
  message: "Rate limit exceeded, try again in an hour",
});

// Affect all routes that start with /api
app.use("/api", limiter);

// Data Sanitization agains NOSQL query injection. Filters out the dollar signs.
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution. If we want to find duration=5 and duration=9, we can whitelist duration as a parameter, but keep it working on sort.
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// Serving static files like HTML, CSS etc in the browser.
// Using logging middleware
app.use(express.static(`${__dirname}/public`));

// Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Creating MIDDLEWARE, next is to go to the next middleware in the middleware stack
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Mounting a router on a route below as middleware
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// When the code reaches here, it means that none of the routes were able to catch it, the * stands for every http method

app.all("*", (request, response, next) => {
  // Whenever we pass something in next, it recognizes it as an error, and skips all middlewares and go to the app.use i.e. the global error -handling middleware .
  next(new AppError(`Can't access ${request.url} on this server!`, 404));
  // Status is automatically figured out.
});

// Express recognizes it as a error global middleware when we specify error first.
app.use(globalErrorController);

//////////////////////// END OF MIDDLEWARE \\\\\\\\\\\\\\\\\\\\\\

// Server Listening
app.get("/", (request, response) => {
  response.status(200).json({
    message: "Hello from the Server!",
    app: "Natours",
  });
});

module.exports = app;

//

// This is the start of old redundant code.

// The question mark signifies a optional parameter
// app.get("/api/v1/tours/:id/:x/:y?
// app.get("/api/v1/tours/:id", getTour);
// app.get("/api/v1/tours", getAllTours);
// app.post("/api/v1/tours", addTour);

// When we use middleware to serve static files, we don't include the /public in the URL, because nodeJS will automatically look into the public folder if it can't find the route in the URL, kinda sets the folder to be the root.

//  It kinda works only for static files, not for anything as if we dont specify a static file, node will treat it as a route and say its not defined
