// For prod to work , SET NODE_ENV=development
// node foo.js

// Operational Errors and Programming Errors are the 2 types of error that occur mostly.

const AppError = require("../utils/AppError");

/////////////// ALL OPERATIONAL ERROR HANDLERS FOR PRODUCTION, SENT TO THE GLOBAL MIDDLEWARE SO THAT IT'S EASY TO UNDERSTAND BY THE CLIENT /////////////////
const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}.`;
  return new AppError(message, 404);
};

const handleDuplicateFieldsDB = (error) => {
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value ${value} . Please use another value`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = (error) => {
  // Object.values returns an array, may ways of doing this.
  const Errors = Object.values(error.errors).map((element) => element.message);
  // console.log(Errors);
  const message = `Invalid input data: ${Errors.join(" , ")}.`;
  return new AppError(message, 404);
};

const handleJsonWebTokenErrorDB = (error) =>
  new AppError("Invalid token. Please login again", 404);

// No else after return, not needed. Also an else block cannot have a lonely if, only an if, it must have an else as well.

const sendErrorDev = (error, response, request) => {
  // Without the host. Must start with api for operational errors, else we render the template out to see. Only the 1. API shows all error details without the website displayed. DUH!
  if (request.originalUrl.startsWith("/api")) {
    return response.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      stack: error.stack,
      error: error,
    });
  }
  // 2. RENDERED TEMPLATE IS DISPLAYED WHEN /api is not in url.
  console.error("ERROR 💥", error);
  return response.status(error.statusCode).render("error", {
    title: "Something went Wrong!",
    message: error.message,
  });
};

const sendErrorProduction = (error, response, request) => {
  // Only Operational errors, not programming errors. Errors that are known by us and defined by us as next(new AppError)

  // FOR API
  if (request.originalUrl.startsWith("/api")) {
    // 1a. Operational trusted error, send to client.
    if (error.isOperational) {
      return response.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }
    // 1b. These are programming errors, don't leak details to client.
    // 1. Logging
    console.error("ERROR 💥", error);
    // 2. Sending generic message.
    return response.status(500).json({
      status: "error",
      message: "Something went wrong on our side 😢.Please try again.",
    });
  }

  // 2a. FOR RENDERED WEBSITE, no api in url.
  if (error.isOperational) {
    // RENDERED TEMPLATE IS DISPLAYED WHEN /api is not in url.
    return response.status(error.statusCode).render("error", {
      title: "Something went Wrong!",
      message: error.message,
    });
  }
  // 2b. Programmming errors, don't leak details to client.
  return response.status(error.statusCode).render("error", {
    title: "Something went Wrong!",
    message: "Please try again later.",
  });
};

////////////////// GLOBAL MIDDLEWARE ///////////////

// Express recognizes it as a error global middleware when we specify error first.
module.exports = (error, request, response, next) => {
  // This shows the stack trace, which shows how the error propagated, something you see quite often.
  // console.log(error.stack);

  // Some errors don't have status code, hence 500 is default.
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, response, request);
  } else if (process.env.NODE_ENV === "production") {
    // Not a good practice to change the arguments passed into a function, hence we don't use error.
    let errorCopy = { ...error };
    errorCopy.message = error.message;

    if (error.name === "CastError") errorCopy = handleCastErrorDB(error);

    // We don't use MongoError here, as there can be multiple mongoerrors like same name, same duration or other errors, related to mongodb in general.
    if (error.code === 11000) errorCopy = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError") errorCopy = handleValidationErrorDB(error);

    if (error.name === "JsonWebTokenError")
      errorCopy = handleJsonWebTokenErrorDB(error);

    // This must be at the last, as its the response.
    sendErrorProduction(errorCopy, response, request);
  }
};
