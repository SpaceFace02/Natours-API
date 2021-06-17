const nodemailer = require("nodemailer");
const catchAsync = require("./catchAsync");

const sendEmail = catchAsync(async (options) => {
  // 1. Create a transporter.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Define email optional.
  const mail = {
    from: "Chirag Rao <hey@chirag.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3. Send the email.
  await transporter.sendMail(mail);
});

module.exports = sendEmail;
