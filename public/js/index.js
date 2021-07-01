// To make the bundlers work with older browsers
/* eslint-disable */
import "@babel/polyfill";
import { displayMap } from "./mapBox";
import { login, logout } from "./login";
import { updateUserDataSettings } from "./updateUserData";
import { showAlert } from "./alert";
import { bookTour } from "./stripe";

// Our Script is integrated at the beginning of the file, hence the DOM is not completely loaded. Onw way to fix this is to move it to the bottom of the file, beu we could also use the following code, i.e a handy event listener.

// DOM ELEMENTS
const mapbox = document.getElementById("map");
const loginForm = document.querySelector(".uniqueIdentifierLogin");
const logoutBtn = document.querySelector(".nav__el--logout");
const updateForm = document.querySelector(".form-user-data");
const updatePasswordForm = document.querySelector(".form-user-password");
const bookTourBtn = document.querySelector("#booktour");

// DELEGATION
if (mapbox) {
  // This file gets data from the client and delegates the action to some functions.
  const locations = JSON.parse(
    document.querySelector("#map").getAttribute("data-locations")
  );
  displayMap(locations);
  window.scroll(0, 0);
}

// Get data from user interface and delegate the action to some custom functions.
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    // FORM VALUES, we can't put it above as it is not yet loaded when the page loads, hence we pass it inside the function.
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    e.preventDefault();
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

if (updateForm) {
  updateForm.addEventListener("submit", (e) => {
    const name = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    // Its an array of files, hence we want only the first one, the only file.
    const photo = document.querySelector("#photo").files[0];

    // Lets use the form data API, to create a multipart form-data. Also the enc-type = "multipart/form-data", hence the name.
    const form = new FormData();
    form.append("name", name);
    form.append("email", email);
    form.append("photo", photo);
    e.preventDefault();

    // Our AJAX call from axios recognizes this (form) as an object.
    updateUserDataSettings(form, "data");

    // TODO: FIXME:  Deprecated, so fix this later.
    if (photo !== undefined)
      showAlert(
        "success",
        "DATA updated successfully! RELOAD for changes to take effect."
      );
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener("submit", async (e) => {
    // Prevent form from reloading.
    const currentPassword = document.querySelector("#password-current").value;
    const newPassword = document.querySelector("#password").value;
    const newPasswordConfirm = document.querySelector("#password-confirm").value;

    e.preventDefault();

    document.querySelector(".update-password-button").innerHTML = "Updating...";

    // We can't use .value here, as value is only useful when 2 buttons have the same name and we want them to submit different values when clicked. It doesn't change the text on the button in any way.

    // Updating password data as per the API arguments and how it expects it, as defined in the authController.updatePassword function.

    // We await the promise, so that we can execute some code after the data has been sent and executed. If we do it synchronously, we can't know for sure whether the data has been updated, then the fields have cleared. On a slower internet, things become more noticeable.
    await updateUserDataSettings(
      { currentPassword, newPassword, newPasswordConfirm },
      "password"
    );

    document.querySelector(".update-password-button").textContent = "Save Password";

    updatePasswordForm.reset();
    // Now we have a salt in encrytion, so password with same value are encrypted differently and stored with different values in the database.

    // To be more elaborate, currentPassword: currentPassword, newPassword: newPassword and so on
  });
}

if (bookTourBtn) {
  bookTourBtn.addEventListener("click", (e) => {
    // Changing text
    e.target.innerHTML = "Processing...";
    // destructuring, otherwise do dataset.tourId. Even the getAttribute function works as used above for locations.
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}

const messageAlert = document.querySelector("body").getAttribute("data-alert");

if (messageAlert) {
  showAlert("success", messageAlert, 12);
}
