require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require('./routes/sellerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoute = require("./routes/orderRoute"); // ✅ FIXED (was orderRoute)
const creativeRoutes = require("./routes/creativeRoutes");


const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB FIRST
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/products', productRoutes);
app.use("/api/orders", orderRoute); // ✅ correctly registered


app.use("/api/payments", paymentRoutes);
app.use("/api/creative", creativeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
