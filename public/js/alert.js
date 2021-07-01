// type is either success or error.
export const hideAlert = () => {
  const alertEl = document.querySelector(".alert");
  if (alertEl) alertEl.parentElement.removeChild(alertEl);
};

export const showAlert = (type, message, seconds = 6) => {
  // Before showing a new alert, hide the previous alert.
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>">`;
  // Inside the body, but right at the beginning. Using Javascript we can add it dynamically.
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
  window.setTimeout(hideAlert, seconds * 1000);
};

// But what if we wanted to add it directly from the back-end. Hence we will manually specify a data attribute on the base right inside the body, at the start. That data attribute will come from response.locals so that we can access it in the pug template.
