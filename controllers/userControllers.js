// Multer and image resizing
const multer = require("multer");
const sharp = require("sharp");

// User Model
const User = require("../models/userModel");

// Update Me function
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// Factory functions
const factoryFn = require("./handlerFactory");

///////////////////// Configuring Multer ////////////////////////////

// For saving to disk, but we don't want that for resizing, hence we don't use the function.
const multerStorage = multer.diskStorage({
  destination: "public/img/users",
  filename: (request, file, callback) => {
    // To prevent overwriting files uploaded by same user and 2 users uploading files at same timestamp.
    // user - userId - timestamp.jpg
    const extension = file.mimetype.split("/")[1];
    // Id from protect middleware which always runs before this.
    callback(null, `user-${request.user.id}-${Date.now()}.${extension}`);
  },
});

// Creates a buffer object of sorts.
const multerMemStorage = multer.memoryStorage();

// This specifies that whether the files uploaded are images or not.
const multerFilter = (request, file, callback) => {
  // For all images, mimetype starts with "image".
  if (file.mimetype.startsWith("image")) callback(null, true);
  // callback is used for error handling and the first argument is error, second argument is the whether the validation is true or false. Only when its a middleware and not a instance of multer, this holds true, otherwise the second argument is the filename.
  else callback(new AppError("Please upload only images", 400), false);
};

// Where the files are uploaded when multer is used. Images are not uploaded in the database, they are just put in the file system and we put the path in the database.
const upload = multer({
  storage: multerMemStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

// Resize images to fit size limit and shape limit. Here we already have the file in our request as its done after the upload.
exports.resizeUserPhoto = catchAsync(async (request, response, next) => {
  if (!request.file) return next();

  // Lets not save these images to disc after uploading, more efficient, rather than writing the file to the disc and re-reading it, just store it in memory.

  // While saving to memory, a random 32-bit string is used as the file-name as its just cache. This file name is used in the updateMe middleware.

  request.file.filename = `user-${request.user.id}-${Date.now()}.jpeg`;

  // request.file.buffer contains a buffer of bits, cache values in machine code encoding basically.
  await sharp(request.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${request.file.filename}`);

  next();
});

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
  if (request.file) filteredBody.photo = request.file.filename;

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
