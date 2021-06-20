const express = require("express");
const authController = require("../controllers/authController");
const userControllers = require("../controllers/userControllers");

// Router
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

// Router is just a mini-application, and middleware always runs in sequence. Protect is basically just a middleware. It will only call the next middlware if the user is authenticated.
router.use(authController.protect);

router.patch("/updateMe", userControllers.updateMe);
// The user is still in out database, but we don't want anybody to access that account from anywhere, hence delete verb works.
router.delete("/deleteMe", userControllers.deleteMe);
// Gives all information about myself.
router.get("/me", userControllers.getMe, userControllers.getUser);

router.use(authController.restrictTo("admin"));
// The below code says that the name of the route has nothing to do with the action. Everything is specified by simple http headers and using appropriate ids. 100% REST
router.route("/").get(userControllers.getAllUsers);

router
  .route("/:id")
  .get(userControllers.getUser)
  .delete(userControllers.deleteUser)
  .patch(userControllers.updateUser);

// Export the modules
module.exports = router;
