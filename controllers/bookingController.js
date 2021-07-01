// Stripe for payments
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../models/tourModel");
const User = require("../models/userModel");

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

    // We can't secuurely create a booking, unless the website has been deployed. TEMP METHOD!

    // success_url: `${request.protocol}://${request.get("host")}/?tour=${
    //   request.params.tourId
    // }&user=${request.user.id}&price=${tour.price}`,

    ///////////////////////////// PERMANENT METHOD   ////////////////////////////
    success_url: `${request.protocol}://${request.get("host")}/mytours`,
    cancel_url: `${request.protocol}://${request.get("host")}/tour/${tour.slug}`,
    customer_email: request.user.email,
    client_reference_id: request.params.tourId,
    // 2. Product info
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: `${tour.summary}`,
        images: [
          `${request.protocol}://${request.get("host")}/img/tours/${
            tour.imageCover
          }`,
        ],
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

/////////////////  THIS IS A TEMPORARY SOLUTION UNTIL DEPLOYMENT ////////////////////////

/*
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
*/

/////////////////////////////////////////  END ////////////////////////////////////////////////

// The session is what we created as a session above.
const createBookingCheckout = async (session) => {
  // We don't have access to URL in the success URL, hence we forethought and added the client-reference-id.
  const tour = session.client_reference_id;
  const user = (await User.find({ email: session.customer_email })).id;

  // It just returns the same session object we created, hence price is there, however we need tourId for the booking model, hence we specified the client reference_id.
  const price = session.amount_total / 100; // Again in dollars.

  // The bookings are parent referencing, contain the ids of tour and user.
  await Booking.create({ tour, user, price });
};

/////////////////////// DEPLOYED WEBSITE, SECURE SOLUTION USING WEB-HOOKS ////////////////////////
exports.webhookCheckout = (request, response, next) => {
  // When stripe calls our webhook, it adds this special header for the web-hook.
  const stripeSignature = request.headers["stripe-signature"];

  let event;
  try {
    // Stripe event, must be raw and not JSON.
    event = stripe.webhooks.constructEvent(
      request.body,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Stripe receives this response as it calls the web-hook function.
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed")
    createBookingCheckout(event.data.object);

  response.status(200).json({
    received: true,
  });
};

///////////////////////// CRUD OPERATIONS OF BOOKINGS(FOR ADMINS ONLY) ///////////////////////////
exports.getAllBookings = factoryFn.getAll(Booking, "booking");
exports.createBooking = factoryFn.createOne(Booking, "booking");
// I automatically query and populate every booking query, as implemented in the bookingModel.
exports.getBooking = factoryFn.getOne(Booking, "booking");
exports.updateBooking = factoryFn.updateOne(Booking, "booking");
exports.deleteBooking = factoryFn.deleteOne(Booking, "booking");

// These queries are not going to be done many times as they can only be done by an admin, so populating is no big issue.
