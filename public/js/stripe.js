/* eslint-disable */

import axios from "axios";
import { showAlert } from "./alert";

export const bookTour = async (tourId) => {
  try {
    // As per docs, putting this function inside the bookTour handler.
    const stripe = Stripe(
      "pk_test_51J718rSHExWYKDwHG56nLf3HDorsuytW4HWQeH9WrZTIEinX7vggyfZ98YUm460PdF9pyvvx1v718EETpFT5bbEg00oEmNav1a"
    );
    // 1. Request the session from the server
    const session = await axios({
      method: "GET",
      url: `/api/v1/bookings/checkout/${tourId}`,
      // withCredentials: true,
    });

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert("error", err);
  }
};
// 2. Initialize the payment on the client side and create checkout form.

// 3. Charge the credit card
