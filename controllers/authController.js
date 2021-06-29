const jwt = require("jsonwebtoken");

// Cryptography
const crypto = require("crypto");

// Promisify
const { promisify } = require("util");
const User = require("../models/userModel");

// Email
const Email = require("../utils/sendEmail");

// Errors
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const signToken = (id) =>
  // The payload is just the id, the header is created automatically.
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSignTokenAndResponse = (user, status_code, response, message) => {
  // Signing Token
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // Cannot be modified by browser.(XSS Attacks).
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
  };

  // Sent only via HTTPS during production.
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  // 90d is understood only by JWT, not cookie. Days in milliseconds.
  response.cookie("jwt", token, cookieOptions);

  response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  response.setHeader("Access-Control-Allow-Headers", "jwt");
  response.setHeader("Access-Control-Allow-Credentials", "true");

  // Removes password from output
  user.password = undefined;
  response.status(status_code).json({
    status: message,
    token,
    data: {
      user: user,
    },
  });
};

// This required request, response, next to be in order. The above function doesn't as its just params to a self made function, unlike this one.
exports.signup = catchAsync(async (request, response, next) => {
  // The flaw with this, is that everyone signs up as admin, we definietly don't want that.
  // const newUser = await User.create(request.body);

  // People might specifiy roles, so just store the data required in the database, no more, no less.
  const newUser = await User.create({
    name: request.body.name,
    email: request.body.email,
    password: request.body.password,
    passwordConfirm: request.body.passwordConfirm,
    // role: request.body.role,
  });

  // Sending the Email. the url is the upload photo button and specifies this URL.
  const url = `${request.protocol}://${request.get("host")}/me`;
  await new Email(newUser, url).sendWelcomeEmail();

  createSignTokenAndResponse(newUser, 201, response, "Success");
});

exports.login = catchAsync(async (request, response, next) => {
  const { email, password } = request.body;

  // 1. Check if email and password actually exist
  if (!email || !password) {
    return next(new AppError("Please provide email or password", 400));
  }

  // 2. Check if user exists and password is correct. (+ password for selecting all and also password as it has select false.)
  const user = await User.findOne({ email: email }).select("+password");

  // To prevent running of the checkHash function, when user is not in database.
  if (!user || !(await user.checkHash(password, user.password))) {
    // 401 is unauthorized. This error message makes it vague and hackers don't know what they entered wrong.
    return next(new AppError("Enter valid username or password", 401));
  }
  // The user is an instance method and is available in all documents, hence its in user.

  // 3. Send back token to client, if everything is fine.
  createSignTokenAndResponse(user, 200, response, "Success");
});

// As we can't manipulate the cookie in the client side as we have set httpOnly property to true. So we can only access the cookie in the backend, hence we need route for logout to keep it super secure.
exports.logout = (request, response, next) => {
  response.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds expiration time.
    httpOnly: true,
  });
  response.status(200).json({
    status: "Successfully logged out.",
  });
};

// Now, when accessing a prive route, we need to send the token with the request so as to let the route know whether you are logged in or not, and the way to do that is via a header.
exports.protect = catchAsync(async (request, response, next) => {
  // 1. Getting the token and checking if its there

  // Scope of variable
  let token;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith("Bearer ")
  ) {
    // Bearer and a token, we extract the token.
    token = request.headers.authorization.split(" ")[1];
  } else if (request.cookies.jwt) {
    token = request.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("Please login to get access", 401));
  }

  // 2. Verification of the token(signature of the token). This is a sync function, so we need to promisify it. Checking if the payload has been tapped into.
  const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3. Check if user exists, if the user has been deleted in the meantime after the token as been issued, basically the user decoded by the payload.
  const currentUser = await User.findById(verified.id);

  if (!currentUser)
    next(new AppError("The user belonging to the token no longer exists", 400));

  // 4. Check if the user changed password after token was issued
  if (currentUser.changedPassword(verified.iat)) {
    return next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }

  // So that we can use the request object in another middleware. Remember that the request object travels from middleware to middleware. Hence if you wanna pass data to middleware from middleware, we use the request object.
  request.user = currentUser;
  response.locals.user = currentUser;
  next();
});

// Wrapped in catchAsync, sends data down to the global error handling middleware, but we don't want that. We want no errors in logging out, hence we remove the catchAsync.
// Only for rendered pages, there will be no error, either logged in or not.
exports.isLoggedIn = async (request, response, next) => {
  // Cookie
  let token;
  if (request.cookies.jwt) {
    try {
      token = request.cookies.jwt;

      // 1. Token verification
      // We cannot pass any value to the verified function, it must be a token generated by jwt.sign as it checks payload and other stuff. So the loggedout cookie won't work here, as its not a vlid jwt. Not in the format that this algorithm expected.
      const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      const currentUser = await User.findById(verified.id);

      if (!currentUser) return next();

      // 4. Check if the user changed password after token was issued
      if (currentUser.changedPassword(verified.iat)) {
        return next();
      }

      // At the end, there is a logged in user. Every pug template has access to response.locals as its available locally as per docs.
      response.locals.user = currentUser;
      return next();
    } catch (err) {
      // We get the jwt malformed error, but we don't care about that, just move on.
      return next();
    }
  }
  // If there's no cookie, next middleware is called as there's no logged in user.
  next();
};

// Restricting deleting tours only to administrators.
exports.restrictTo = (...roles) =>
  function (request, response, next) {
    // Roles is an array , ['admin', 'leadTourGuide'], that we pass in.

    // We could use find by id again. it would be copy paste, hence we stored it in request.user.
    if (!roles.includes(request.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (request, response, next) => {
  // 1. Get user based on posted email
  const user = await User.findOne({ email: request.body.email });

  if (!user) {
    return next(new AppError("No user for that email", 404));
  }

  // 2. Generate random token
  // There is some code for this part, its best if we use an instance method as its available to all documents.

  const resetToken = user.createPasswordResetUserToken();

  // Saving the document after modifying it.
  await user.save({ validateBeforeSave: false });

  // Sending RESET email.
  try {
    // 3. Send it to user email.
    const resetURL = `${request.protocol}://${request.hostname}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendResetEmail();

    response.status(200).json({
      status: "Success",
      message: "Token sent to mail.",
    });
  } catch (err) {
    // If there's an error, set all of the following fields to undefined.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Save the data
    await user.save({ validateBeforeSave: false });

    return next(new AppError("There was an error sending the email", 500));
  }
});

exports.resetPassword = catchAsync(async (request, response, next) => {
  // 1. Get user based on token from the URL. We specified the parameter called token.
  const hashedToken = crypto
    .createHash("sha256")
    .update(request.params.token)
    .digest("hex");

  // MongoDB converts timestamps to strings internally.
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired, and if the user still exists, then set the new password.
  // We could also use Date.now, but lets use filters.
  if (!user) {
    return next(new AppError("Invalid token or the token has expired.", 400));
  }

  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 3. Update the password and the changedPasswordAt field. We want the validator to confirm whether password == passwordConfirm, so we don't specify it here.
  await user.save();

  // We run save as we want to run all validators and middleware functions before saving. We don't just want to save data without validation.

  // 4. Log the user in by sending the JWT
  createSignTokenAndResponse(user, 200, response, "Success");

  next();
});

exports.updatePassword = catchAsync(async (request, response, next) => {
  // 1. Get user from collection, middlware function passes from one middleware to another.
  const user = await User.findById(request.user._id).select("+password");

  // 2. Check if POSTed current password is correct, so that no hacker can change password if your pc was found lying with the account open.
  if (!(await user.checkHash(request.body.currentPassword, user.password))) {
    return next(new AppError("Please enter correct Current Password", 401));
  }

  // 3. If so, update password and save the new password as password and passwordConfirm is not saved, its just used for validation. Hence we need to save it to the database, not only modify it in the back-end.
  user.password = request.body.newPassword;
  user.passwordConfirm = request.body.newPasswordConfirm;
  await user.save();

  // We can't use findByIdAndUpdate as validator only works on create and save(check the user schema), also we want the pre-save middleware functions to run.

  // 4. Log user in, send JWT with the new updated Password credentials.
  createSignTokenAndResponse(
    user,
    200,
    response,
    "Successfully changed password! 🎉"
  );

  // Setting a new password takes some time due to the encryption process.
});
