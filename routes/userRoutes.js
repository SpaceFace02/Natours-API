const express = require("express");
const authController = require("../controllers/authController");
const userControllers = require("../controllers/userControllers");

const router = express.Router();

//////////////////////// Routes \\\\\\\\\\\\\\\\\\\\\\\\\\

// Auth is something soo different than what we have been doing, also it has its own controller, hence we create a new route for it. This is not 100% REST, but its okay sometimes.

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router
  .route("/updateMyPassword")
  .patch(authController.protect, authController.updatePassword);

router.patch("/updateMe", authController.protect, userControllers.updateMe);

// The user is still in out database, but we don't want anybody to access that account from anywhere, hence delete verb works.
router.delete("/deleteMe", authController.protect, userControllers.deleteMe);

// The below code says that the name of the route has nothing to do with the action. Everything is specified by simple http headers and using appropriate ids. 100% REST
router
  .route("/")
  .get(userControllers.getAllUsers)
  .post(userControllers.createNewUser);

router.route("/:id").get(userControllers.getUser);

// Export the modules
module.exports = router;
