// Pug email template
const pug = require("pug");

// Email and error handling packages
const nodemailer = require("nodemailer");
const { convert } = require("html-to-text");
const catchAsync = require("./catchAsync");

// a new email must have info about the user and the url(like resetURL)
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Chirag Rao < ${process.env.EMAIL_FROM} >`;
  }

  newTransport() {
    // A. Production -- Real emails(Send-Grid)
    if (process.env.NODE_ENV === "production") {
      // Send Grid is supported by nodemailer.
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    // B. Development -- Mailtrap

    // 1. Create a transporter.
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendTemplateEmail(template, subject) {
    // This sends the actual email

    // 1. Render the HTML using a pug template
    const emailHTML = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject: subject,
      }
    );

    // 2. Define the email options. Here text is the minimal form of mail, with no HTML elements. Its also good for spam filters.
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      text: convert(emailHTML),
      html: emailHTML,
    };

    // 3. Create a transport and send email. sendMail is a nodemailer method.
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcomeEmail() {
    await this.sendTemplateEmail(
      "welcome",
      "Welcome to Natours! We are so pumped and elated to have you here!"
    );
  }

  async sendResetEmail() {
    // We await it so that this function only returns after the email has been sent.
    await this.sendTemplateEmail(
      "passwordReset",
      "Your password reset token(valid for 10min)"
    );
  }
};
