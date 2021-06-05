// . operator is relative to in which directory you started the node application in. Suppose you were currently in dir 1 and didnt use cd to get into dir2, then . would be dir1 itself. If we used dirname then it would be the path of the script, not the path where you executed the script from.
// (Stack Overflow)

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Tour = require("../../models/tourModel");

// Env
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

// Read JSON File
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8")
);

// Import data from database
const importData = async () => {
  try {
    // Accepts a JS Object
    await Tour.create(tours);
    console.log("Data Successfully Loaded");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete all data currently in the database
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log("Data deleted");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === "--import") importData();
else if (process.argv[2] === "--delete") deleteData();

// console.log(process.argv);
