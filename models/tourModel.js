const mongoose = require("mongoose");
const validator = require("validator");
// import validator from "validator";
const slugify = require("slugify");
// This is the business logic, not the application logic. Fat models, thin controllers. This has nothing to do with request and responses, hence the name.

// For the guides
const User = require("./userModel");

//   Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A Name is required"],
      // unique, so that no other name value can have the same name. So it creates an index basically. Check mongoDB compass for more info.
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
      default: null,
      set: (value) => Math.round(value * 10) / 10, // 4.666,   4.66 * 10 = 46.6666   , 46.666 rounded -> 47 (nearest integer)
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
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    startLocation: {
      // GeoJSON for geo-spatial data.

      // Now here, type must be set to "Point", check the tours.json file. type of startLocation is not String, but Point, hence the type of the type of the startLocation is String and the type of the startLocation is Point. Get it??
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // We choose to embed data, because a tour and location are closely related, a tour cannot happen without a location.
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
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
    users: [
      {
        type: mongoose.Schema.ObjectId,
        // References the User Model.
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Indexes improve the read performance of your application. Never ignore it.

// 1 is ascending order, -1 is descending order. Creating an ordered list basically. Research more about it. Compound index, can also be single field index.
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// An index is resource intensive, and must be updated whenever the collection, so if the collection has a high write-read ratio, indexes will update always often, and uses up memory. Balance the cost of maintaining the index with how often the query is used.

// This index needs to be a 2Dsphere index, for earth like points on an earth-like sphere, whereas use 2d index if you are querying for imaginary points on a 2D plane.
tourSchema.index({ startLocation: "2dsphere" });

// For every get request. Also we can't query in this as its not stored in MongoDB.
// We don't use an arrow function as it does not get its own this keyword, unlike a normal function. this points to the current document.
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE.
// The field in the ref property, which references to this tourSchema.
tourSchema.virtual("reviews", {
  ref: "Review",
  // In reviewModel, tour references this tourModel.
  foreignField: "tour",
  // In this tourModel, id of this tour is referenced in reviewModel.
  localField: "_id",
  justOne: false,
});

// PRE DOCUMENT Middleware after the save command in the application and create command in the database. Before a document is saved to the database. It runs between ONLY .save command and .create command, findOne, findById or updateMany etc. will NOT WORK.

// This is called a document middleware or a pre-save hook.
tourSchema.pre("save", function (next) {
  // Slug must be defined in the schema or else it will be ignored.
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embeds the tours data into the tours object, but if a user changes his role or gets promoted, then we need to change a lot of stuff, find which user has been modified and so on. Hence we simply use referencing.

//////////// EMBEDDING //////////////
// tourSchema.pre("save", async function (next) {
//   // The map function returns promises as the function is asynchronous. Multiple outputs, put into an array, hence they are promises, not the data itself.
//   const guidesPromises = await this.guides.map(
//     async (id) => await User.findById(id)
//   );
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// We can run middleware before and after the save event. In pre middleware, we have access to the this keyword.

//QUERY MIDDLEWARE, processing a query, there are some secret tours, which are accessible to only VIP's or internally, hence we use the query middleware to filter those out of the result.

// All query strings that start with find, using regex for that.
tourSchema.pre(/^find/, function (next) {
  // Chaining the original find query, to just filter out again based on secret tours, based on mongoose schema, not database schema.
  this.find({ secretTour: { $ne: true } });

  // Creating a new attribute of the object
  this.start = Date.now();
  next();
});

// Before the aggregation is executed, we want to exclude the secret tours from any calculation happening in the aggregation

tourSchema.pre("aggregate", function (next) {
  // $geoNear must always be first in the aggregation pipeline.
  if (this.pipeline()[0].$geoNear) {
    return next();
  }

  // Unshift adds at the beginning of the array. (push, pop, shift, unshift)
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });

  console.log(this._pipeline);
  next();
});

// We wanna populate/fill up the guides field. This creates a new query.
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    // - __v and - passwordChangedAt says that we want to exclude those fields, hence the -. Also we don't want any comma or else it won't work.
    select: "-__v -passwordChangedAt",
  });
  next();
});

// Post gets access to all docs returned from that query, not the query itself as its executed after the query.
tourSchema.post(/^find/, function (documents, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
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
