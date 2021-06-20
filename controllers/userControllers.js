const User = require("../models/userModel");

// Update Me function
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// Factory functions
const factoryFn = require("./handlerFactory");

//////////////////////// Functions \\\\\\\\\\\\\\\\\\\\\\\\\\

// Factory Functions.
exports.getAllUsers = factoryFn.getAll(User, "user");
exports.getUser = factoryFn.getOne(User, "user");

// Do NOT UPDATE password with this.
exports.updateUser = factoryFn.updateOne(User, "user");
exports.deleteUser = factoryFn.deleteOne(User, "user");

// ...allowedFields is for making sure that multiple parameters are passed, and those parameters are converted into an array.
const filterBody = (obj, ...allowedFields) => {
  // We can't use a for loop as that will loop through a lot of unknown paramters and declared while creating the object.

  const filteredBody = {};
  Object.keys(obj).forEach((element) => {
    if (allowedFields.includes(element)) {
      filteredBody[element] = obj[element];
    }
  });

  return filteredBody;
};

// Faking that the request.params.id is actually the id of the currently logged in user.
exports.getMe = (request, response, next) => {
  request.params.id = request.user.id;
  next();
};

exports.updateMe = catchAsync(async (request, response, next) => {
  // 1. Create error if user tries to update password, as that has a different route altogether.
  if (request.body.password || request.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates!! Please use update password route for that.",
        400
      )
    );
  }

  // 2.The user must only be able to update the name and email, not the role or resetToken etc.
  const filteredBody = filterBody(request.body, "name", "email");

  // 3. Update user document.
  const updatedUser = await User.findByIdAndUpdate(
    request.user.id,
    filteredBody,
    {
      new: true,
      // For invalid email addresses for example.
      runValidators: true,
    }
  );

  response.status(200).json({
    status: "Success",
    user: updatedUser,
  });
});

// These are all middleware functions and data is passed from one middleware to another.
exports.deleteMe = catchAsync(async (request, response, next) => {
  await User.findByIdAndUpdate(request.user.id, { active: false });

  response.status(204).json({
    status: "Successfully deleted",
    data: null,
  });
});
