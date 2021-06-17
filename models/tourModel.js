const mongoose = require("mongoose");
const validator = require("validator");
// import validator from "validator";
const slugify = require("slugify");
// This is the business logic, not the application logic. Fat models, thin controllers. This has nothing to do with request and responses, hence the name.

//   Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A Name is required"],
      // unique, so that no other name value can have the same name.
      unique: true,
      trim: true,
      maxlength: [40, "A tour must be within 40 letters long."],
      minlength: [10, "A tour must have atleast 10 letters."],
      // validate: {
      //   validator: validator.isAlpha,
      //   message: "Enter only Alphabets",
      // },
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a maxGroupSize"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Enter valid difficulty ",
      },
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      // All these validators, we have specified using arrays, is just a short hand for the real object created with values and a message.
      required: [true, "A Price is required"],
    },
    discount: {
      type: Number,
      validate: {
        validator: function (value) {
          // Discount must always be lower than the price.
          // this keyword is being used when you create a new document, not while updating it.
          return value < this.price;
        },
        // ({VALUE}) is a mongoose thing(template) and will get access to the value inputted.
        message: "Discount price ({VALUE}) should be below the regular price.",
      },
    },
    summary: {
      type: String,
      //   Similar to stripping off all white spaces prepending or appending a string
      trim: true,
      required: [true, "A Description is required"],
    },
    description: {
      type: String,
      trim: true,
    },

    // By default, they are false, not a secret tour. Remember, this is a mongoose schema, made wrt the data in the database. Its used by mongoose as reference. Hence changing stuff will result in mongoose displaying stuff differently, but database stores stuff as per imported from the file and created.
    secretTour: {
      type: Boolean,
      default: false,
      select: false,
    },
    imageCover: {
      //   Image URL
      type: String,
      required: [true, "A Image is required"],
    },
    images: [String],
    slug: String,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
  },
  {
    toJSON: { virtuals: true },
  }
);

// For every get request. Also we can't query in this as its not stored in MongoDB.
// We don't use an arrow function as it does not get its own this keyword, unlike a normal function. this points to the current document.
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Pre Document Middleware after the save command in the application and create command in the database. Before a document is saved to the database. It runs between ONLY .save command and .create command, findOne, findById or updateMany etc. will NOT WORK.

// This is called a middleware or a pre-save hook.
tourSchema.pre("save", function (next) {
  // Slug must be defined in the schema or else it will be ignored.
  this.slug = slugify(this.name, { lower: true });
  next();
});

// We can run middleware before and after the save event. In pre middleware, we have access to the this keyword.

// Query Middleware, processing a query, there are some secret tours, which are accessible to only VIP's or internally, hence we use the query middleware to filter those out of the result.

// All query strings that start with find, using regex for that.
tourSchema.pre(/^find/, function (next) {
  // Chaining the original find query, to just filter out again based on secret tours, based on mongoose schema, not database schema.
  this.find({ secretTour: { $ne: true } });

  // Creating a new attribute of the object
  this.start = Date.now();
  next();
});

// Post gets access to all docs returned from that query, not the query itself as its executed after the query.
tourSchema.post(/^find/, function (documents, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// Before the aggregation is executed, we want to exclude the secret tours from any calculation happening in the aggregation

tourSchema.pre("aggregate", function (next) {
  // Unshift adds at the beginning of the array. (push, pop, shift, unshift)
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });

  // console.log(this._pipeline);
  console.log(this.pipeline());

  next();
});

// Model, always call this after all middleware and business logic, just before exporting it.
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
