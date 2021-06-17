const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

// For user token
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please tell us your email"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Invalid Email!"],
  },
  photo: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  role: {
    type: String,
    enum: {
      values: ["admin", "user", "tourGuide", "leadTourGuide"],
      message: "Enter valid role!",
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: 8,
    select: false,
  },
  passwordChangedAt: Date,
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    // This only works with SAVE!!!! on creating a new object. (CREATE AND SAVE)
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // 12 is the default salt, cost parameter, more CPU intensive the encryption password is, and more secure. This returns a promise, so we await it.

  // Salting the password changes the hash for each different user. Two exactly same hashes generate different hashes.
  this.password = await bcrypt.hash(this.password, 12);

  // We just needed this passwordConfirm in the client side, for validation, not for storing. Its required, just for the schema, not to be persisted in the database.
  this.passwordConfirm = undefined;
  next();
});

// We are creating an instance method, which is available to every document of a certain collection, hence we define it in the schema.
userSchema.methods.checkHash = async function (
  candidatePassword,
  userPassword
) {
  // this won't work as select is false, hence we pass in userPassword as well.
  // this.password

  // Now when a password is encrypted, there's no way to get the original password. There's no decryption algorithm. Hence we encrypt the password entered and compare it with the one in the database.
  return await bcrypt.compare(candidatePassword, userPassword);
};

// We will be using this in 2 places, hence we specify a middleware for this.
userSchema.pre("save", function (next) {
  // Refer the docs always, isNew property is whenever a document is new.
  if (this.isModified("password") || this.isNew) {
    // Saving to the database is a bit slow than signing the web token, hence we compensate by subtracting 1 second.
    this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});

// Query Middleware prevents the document with the active field from showing up in. RegEx starts with find.
userSchema.pre(/^find/, function (next) {
  // Some documents don't have the active property, hence active should not be false.
  this.find({ active: { $ne: false } });
  next();
});

// Code, if the user changed the password after the jwt was issued.
userSchema.methods.changedPassword = function (JWTTimeStamp) {
  // A lot of people, don't change passwords, so they don't have this field. Only when jwt is already issued. If its not issued no need to do this shit.

  // Also its in milliseconds. Or you can also use parseInt.
  if (this.passwordChangedAt) {
    const changedTimeStamp = Number(this.passwordChangedAt.getTime() / 1000);
    // console.log(changedTimeStamp, JWTTimeStamp);

    // JWT created at 19th Nov for example, changed on 20th, expired on 24th. Hence password is changed. Normally JWT is issued after(greater) the password has been created.

    // False means not changed
    return JWTTimeStamp < changedTimeStamp; // 100 < 200
  }
};

userSchema.methods.createPasswordResetUserToken = function () {
  // Its a simple hexadecimal string.
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // In milliseconds.

  // We need to send the plain token to email, for it to work, not the encrypted one.
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
