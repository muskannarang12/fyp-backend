const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false }, // Email verification status
  verificationToken: { type: String }, // Token for email verification
  resetToken: { type: String }, // Token for password reset
  resetTokenExpiry: { type: Date }, // Expiry time for the reset token
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    console.log("Hashing password before saving:", this.password); // Log the password before hashing
    this.password = await bcrypt.hash(this.password, 10);
    console.log("Hashed password:", this.password); // Log the hashed password
  }
  next();
});

module.exports = mongoose.model("User", userSchema);