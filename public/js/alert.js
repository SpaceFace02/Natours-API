// type is either success or error.
export const hideAlert = () => {
  const alertEl = document.querySelector(".alert");
  if (alertEl) alertEl.parentElement.removeChild(alertEl);
};

export const showAlert = (type, message) => {
  // Before showing a new alert, hide the previous alert.
  hideAlert();
  const markup = `<div class="alert alert--${type}">${message}</div>">`;
  // Inside the body, but right at the beginning.
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
  window.setTimeout(hideAlert, 5000);
};
