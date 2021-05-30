const express = require("express");
const userControllers = require("../controllers/userControllers");

const router = express.Router();

//////////////////////// Routes \\\\\\\\\\\\\\\\\\\\\\\\\\
router
  .route("/")
  .get(userControllers.getAllUsers)
  .post(userControllers.createNewUser);
router
  .route("/:id")
  .get(userControllers.getUser)
  .post(userControllers.updateUser)
  .delete(userControllers.deleteUser);

// Export the modules
module.exports = router;
