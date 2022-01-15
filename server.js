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

// ENVS, config them before app, or else we cannot see the env variables in app.js as it hasn't been configured yet. Otherwise, we require app without the env variables and it doesn't get listen properly later on. It must be defined in global variables as early as possible in the code as per its docs. TODO: REVIEW: EPIPHANY:
dotenv.config({ path: "./.env" });

const app = require("./app");

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

// Start Server. Port is extremely important for heroku to work and deploy your model. A static port will not work.
const port = process.env.PORT || 3000;
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

// SIGTERM is a signal which heroku emanates after 24 hours. It shuts down the server temporarily to keep things healthy. Hence we don't want any hanging request when we receive the signal. Hence we shut down gracefully.
process.on("SIGTERM", () => {
  console.log("👋🏻❌SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    // No need to close it as SIGTERM automatically shuts down the server. SIGTERM is a polite way to terminate a program.
    console.log("💥 Process Terminated");
  });
});

// If there's an error in a middleware, then express will automatically go to the global error handling middleware, i.e in the errorController.js file, not an operational error.
