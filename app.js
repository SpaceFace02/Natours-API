// EPIPHANY: While publishing documentation, choose no env as it would then replace the env variables with their actual values.

// Everything related to middleware goes here, the middleware is added to the web application in this file.

// Using mongoose schema really prevents a lot of attacks.

const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

// Manipulate path names
const path = require("path");

// CORS
const cors = require("cors");

// Cookie
const cookieParser = require("cookie-parser");

// Compressing responses
const compression = require("compression");

// Data Sanitization
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

// Parameter pollution, more that one parameter in sort or any of the APIFeatures
const hpp = require("hpp");

// The folder is routes, coz it contains routes, but we exported the router from there.
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter = require("./routes/bookingRoutes");

// Booking controller
const bookingController = require("./controllers/bookingController");

// Errors
const AppError = require("./utils/AppError");
const globalErrorController = require("./controllers/errorControllers");

const app = express();

// Trusting proxies which heroku uses to modify requests. At the top is a must.
// https://stackoverflow.com/questions/39930070/nodejs-express-why-should-i-use-app-enabletrust-proxy
app.enable("trust proxy");

// Set a template engine using express. Pug templates are called views in express(MVC's)
app.set("view engine", "pug");
// ./ is relative to the directory from which we launch the node application. We don't know whether the path provided is with a slash or not, so path.join() prevents this bug.
app.set("views", path.join(__dirname, "views"));

/////////////////  GLOBAL MIDDLEWARE ///////////////////////////
// Remember that the server has no restriction on accessing any website or domain, as its okay. Only the browser has restrictions.
const options = {
  origin: "*",
};

app.use(cors(options));
// api.natours.com and natours.com, then natours.com is the origin to the API as CORS is mainly for API's.

// Remember, order matters in middleware, we can't use the middle ware after the response has been sent back to the client.

////////////////////////////////////  PREFLIGHT CHECK ///////////////////////////////////
// REVIEW:
// Options is not to create any new options in our application. Its just a method like get or post,that we have to respond to. The browser sends a request to the server asking if the method is safe to perform. We need to respond to it.
app.options("*", cors());
// Complex routes, complex requests.
// app.options("/api/v1/tours/:id", cors());

// Special HTTP headers, we pass a function in, not a function call, but here the function returns a function, so its good.
app.use(helmet());

// Serving static files like HTML, CSS etc in the browser. public folder is considered default, hence all assets come from here. Each asset triggers a get request. Its path location is the route of a get request.
app.use(express.static(path.join(__dirname, "public")));

// Card Checkout handler to create bookings. Stripe calls our web-hook and posts data there. This pre-defined webhook needs data to be a readable stream, not JSON, hence we need to define it before converting the request body in JSON, which is done in the body parser, next line.
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  bookingController.webhookCheckout
);

////////   BODY PARSER, reads data from body into request.body. This can't parse files, only text for now.
app.use(
  express.json({
    limit: "10kb",
  })
);

////// FORM DATA PARSER, reads data from URLEncoded form(normal form, as its this by default) into request.body.
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

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

// Using logging middleware
// Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Compress all text only, not images as jpgs are already compressed, sent to client, more like a bandwidth control system. Add this before the router so that the router gets access to it.
app.use(compression());

// Creating MIDDLEWARE, next is to go to the next middleware in the middleware stack
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// Mounting view viewRoutes
app.use("/", viewRouter);

// Mounting a router on a route below as middleware. We could add cors or other middleware in front of tourRouter or userRouter, as its a middleware.
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

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
