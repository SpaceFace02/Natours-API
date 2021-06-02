// Everything related to the server goes here including the env variables.
const mongoose = require("mongoose");
const dotenv = require("dotenv");
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
  .then(() => console.log("Connected"))
  .catch((err) => console.log(err));
// Saving the object to the database.

// Start Server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
