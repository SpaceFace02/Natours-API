import axios from "axios";
import { showAlert } from "./alert";

// Update name and email. Data is an object of all the data to update and type is whether the data is normal data or a password.
export const updateUserDataSettings = async (data, type) => {
  // Whether type is password or not. Change URLs if it is.
  const url =
    type === "password"
      ? "http://localhost:3000/api/v1/users/updateMyPassword"
      : "http://localhost:3000/api/v1/users/updateMe";

  try {
    const res = await axios({
      method: "PATCH",
      url,
      data: data,
      withCredentials: true,
    });
    if (res.status === 200)
      showAlert(
        "success",
        `${type.toUpperCase()} updated successfully! Reload for changes to take place!`
      );
  } catch (err) {
    showAlert("error", err.response.data.message);
    console.log(err);
  }

  // We have specified err.response.data.message as the error comes from the API, and it is an operational error, we know about the error.
};
