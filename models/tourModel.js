const mongoose = require("mongoose");

//   Schema
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A name is required"],
    // unique, so that no other name value can have the same name.
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, "A Price is required"],
  },
});

// Model
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

// New Objects out of a class called Tour.
// const testTour = new Tour({
//   name: "The Spooky Cavern",
//   rating: 4.8,
//   price: 699,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log(err);
//   });
