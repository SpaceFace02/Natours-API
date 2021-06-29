module.exports = (fn) => (request, response, next) => {
  // The async function below returns a promise, hence we can catch it and pass it to next, i.e the global error handling middleware.
  fn(request, response, next).catch((error) => next(error));
};
