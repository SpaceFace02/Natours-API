/* eslint-disable */

//* eslint-disable-next-line */
import axios from "axios";
import { showAlert, hideAlert } from "./alert";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "post",
      url: "http://localhost:3000/api/v1/users/login/",
      data: {
        email: email,
        password: password,
      },
      withCredentials: true,
    });
    if (res.status === 200) {
      showAlert("success", "Logged In Successfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1100);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }

  // Axios throws the same error as the one thrown by the server.
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://localhost:3000/api/v1/users/login",
      withCredentials: true,
    });

    // Reload as true to prevent cache reload, we want server reload.
    if (res.status === 200) location.replace("/");
  } catch (err) {
    console.log(err);
    showAlert("error", "Error logging out! Try again.");
  }
};
