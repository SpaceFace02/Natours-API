// Stripe for payments
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../models/tourModel");

const catchAsync = require("../utils/catchAsync"); // This catches all errors.
const factoryFn = require("./handlerFactory");

// Bookings
const Booking = require("../models/bookingModel");

exports.getCheckoutSession = catchAsync(async (request, response, next) => {
  // 1. Get current booked tour. await a pending promise.
  const tour = await Tour.findById(request.params.tourId);

  // 2. Create checkout session.
  const session = await stripe.checkout.sessions.create({
    // 1. Session info
    payment_method_types: ["card"],
    // We can't secuurely create a booking, unless the website has been deployed.
    success_url: `${request.protocol}://${request.get("host")}/?tour=${
      request.params.tourId
    }&user=${request.user.id}&price=${tour.price}`,
    cancel_url: `${request.protocol}://${request.get("host")}/tour/${tour.slug}`,
    customer_email: request.user.email,
    client_reference_id: request.params.tourId,
    // 2. Product info
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: `${tour.summary}`,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, // In cents
        currency: "usd",
        quantity: 1,
      },
    ],
  });

  // 3. Create session as response and send it to client.
  response.status(200).json({
    status: "Success",
    session,
  });
});

// The next middleware is the overview page handler. If the query params are absent, then it goes to the "/" route and just shows the overview.
exports.createBookingCheckout = catchAsync(async (request, response, next) => {
  // TEMPORARY SOLUTION, NOT SECURE, everyone can make bookings without paying, by knowing which URL to hit.
  const { tour, user, price } = request.query;

  if (!tour || !user || !price) return next();

  // Create booking with tour, user and price.
  const booking = await Booking.create({ tour, user, price });

  // Redirecting to the overview page, to reset URL back to overview, we don't want that URL to be visible to the client. Requests the home page, but now the tour, user and price are not defined(no query string), hence it goes to the next middleware.
  response.status(200).redirect("/");

  // We could also do redirect(request.originalUrl.split("?")[0]) This is the home-page.
});

///////////////////////// CRUD OPERATIONS OF BOOKINGS(FOR ADMINS ONLY) ///////////////////////////
exports.getAllBookings = factoryFn.getAll(Booking, "booking");
exports.createBooking = factoryFn.createOne(Booking, "booking");
// I automatically query and populate every booking query, as implemented in the bookingModel.
exports.getBooking = factoryFn.getOne(Booking, "booking");
exports.updateBooking = factoryFn.updateOne(Booking, "booking");
exports.deleteBooking = factoryFn.deleteOne(Booking, "booking");

// These queries are not going to be done many times as they can only be done by an admin, so populating is no big issue.
