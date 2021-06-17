// Inheriting the Error class
class AppError extends Error {
  constructor(message, statusCode) {
    // Message is the only parameter that error takes in, super is required always, while inheriting.
    super(message);

    this.statusCode = statusCode;

    // Not needed, as we passed super(message) and the Error class has only a message param.
    this.message = message;
    this.status = `${this.statusCode}`.startsWith("4") ? "Fail" : "Success";

    // Only operational errors are detected via this AppError class, hence we create a new attribute like this.
    this.isOperational = true;

    // What this does is it removes the Error class from being extended in the callstack. When an error occurs, it won't occur here, but where this class' methods were called. Hence this class may not be in the stack trace.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
