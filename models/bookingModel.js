const mongoose = require("mongoose");

// Bookings can grow indefinitely, so we use parent referencing
const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    required: [true, "A Booking must belong to a tour"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "A Booking must belong to a user"],
  },
  // Price may change in the future.
  price: {
    type: Number,
    required: [true, "A Booking must have a price"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  // paid just specifies whether the user paid using the card directly, or maybe paid by cash and the admin has to add it to the database.
  paid: {
    type: Boolean,
    default: true,
  },
});

// Populating the booking, whenever there is a query for this. No performance issues while populating both the fields as only the guides and leadGuides can query bookings, so that they find out who has booked their tour.
bookingSchema.pre(/^find/, function (next) {
  // First populate user, then populate tour.
  this.populate("user").populate({
    path: "tour",
    select: "name",
  });
  next();
});
// Remember that post middlewares don't have access to the next function. You don't need it.

module.exports = mongoose.model("Booking", bookingSchema);
