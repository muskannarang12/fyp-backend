require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoute = require("./routes/orderRoute");
const creativeRoutes = require("./routes/creativeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://creative-scrapcraft.vercel.app/"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoute);
app.use("/api/payments", paymentRoutes);
app.use("/api/creative", creativeRoutes);

// Instead of app.listen
module.exports = app;
