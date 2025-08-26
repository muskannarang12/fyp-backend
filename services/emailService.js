const nodemailer = require("nodemailer");

// Log environment variables for debugging
console.log("Email User:", process.env.EMAIL_USER);
console.log("Email Password:", process.env.EMAIL_PASSWORD);

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
});

// Function to send a verification email
const sendVerificationEmail = async (email, verificationToken) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    html: `
      <p>Please click the link below to verify your email:</p>
      <a href="http://localhost:5000/api/auth/verify-email?token=${verificationToken}">Verify Email</a>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Function to send a password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password",
    html: `
      <p>Please click the link below to reset your password:</p>
      <a href="http://localhost:3000/reset-password?token=${resetToken}">Reset Password</a>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

