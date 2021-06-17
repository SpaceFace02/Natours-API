// Everything related to middleware goes here, the middleware is added to the web application in this file.

const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
// The folder is routes, coz it contains routes, but we exported the router from there.
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

// Errors
const AppError = require("./utils/AppError");
const globalErrorController = require("./controllers/errorControllers");

// Env must be before app for it to be accessable.
dotenv.config({ path: "./config.env" });
const app = express();

////////////////////////////////// MIDDLEWARE \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Remember, order matters in middleware, we can't use the middle ware after the response has been sent back to the client.
app.use(express.json());
// Using logging middleware

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// Serving static files like HTML, CSS etc in the browser.
app.use(express.static(`${__dirname}/public`));

// Creating MIDDLEWARE, next is to go to the next middleware in the middleware stack
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Mounting a router on a route below as middleware
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

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
