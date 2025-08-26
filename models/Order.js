// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title: String,
  price: Number,
  qty: Number,
  image: String,
  sellerEmail: String,
});

const orderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true }, // buyer email
    shipping: {
      firstName: String,
      lastName: String,
      address1: String,
      address2: String,
      country: String,
      province: String,
      city: String,
      postalCode: String,
      phone: String,
    },
    paymentMethod: { type: String, default: "COD" },
    items: [orderItemSchema],
    pricing: {
      subtotal: Number,
      shipping: Number,
      total: Number,
      currency: String,
    },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
