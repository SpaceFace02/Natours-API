// Everything related to the server goes here including the env variables.
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Uncaught Error

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);

  console.log("UNCAUGHT EXCEPTION 🤯");
  console.log("Shutting down gracefully");

  // Happens synchronously, no need of any server.
  process.exit(1);
});

const app = require("./app");

// ENVS, config them before app, or else we cannot see the env variables in app.js as it hasn't been configured yet in the above case.
dotenv.config({ path: "./config.env" });

// Mongoose
const db_string = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// Connecting to database
mongoose
  .connect(db_string, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected"));

// Start Server
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

// Whenever there's an unhandled promise rejection, a unhandled rejector event is emitted, and we can subscribe to it and follow it further, like a safety net.

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Shutting down gracefully");

  // Shut down the server, then slowly shut down the application, so that there are no outgoing or expecting responses.
  server.close(() => {
    process.exit(1);
  });
});

// If there's an error in a middleware, then express will automatically go to the global error handling middleware, i.e in the errorController.js file, not an operational error.
