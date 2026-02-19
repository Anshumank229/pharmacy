// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import path from "path";
import fs from "fs";

// ========================
// SECURITY MIDDLEWARE
// ========================
import helmet from "helmet";                        // Secure HTTP headers
import rateLimit from "express-rate-limit";         // Rate limiting
import mongoSanitize from "express-mongo-sanitize"; // NoSQL injection protection

// Routes
import authRoutes from "./routes/authRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import medicineRequestRoutes from "./routes/medicineRequestRoutes.js"; // NEW: Import medicine request routes
import Medicine from "./models/Medicine.js";
import { sendLowStockAlert } from "./services/emailService.js";

dotenv.config();
validateEnv(); // ✅ Fail fast if required env vars are missing
connectDB();

// Create upload directories if they don't exist
const uploadDirs = [
  path.join(process.cwd(), "uploads", "medicines"),
  path.join(process.cwd(), "uploads", "prescriptions"),
  path.join(process.cwd(), "uploads", "temp")
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

const app = express();

// ========================
// SECURITY MIDDLEWARE
// ========================

// 1. Helmet - Set security HTTP headers
app.use(helmet());

// 2. Rate Limiting - Limit requests from same IP (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api/", limiter); // Apply to all API routes

// 3. MongoDB Sanitization - Prevent NoSQL injection attacks
app.use(mongoSanitize());

// ========================
// BODY PARSERS & COOKIES
// ========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========================
// CORS CONFIGURATION
// ========================
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);

// ========================
// REQUEST LOGGING
// ========================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ========================
// STATIC FILES - PUBLIC
// ========================
// FIX: Only serve medicine images publicly, NOT prescriptions
app.use("/uploads/medicines", express.static(path.join(process.cwd(), "uploads", "medicines")));

// REMOVED: app.use("/uploads", express.static(...)) - This was the security leak!
// Prescriptions should NEVER be served statically

// ========================
// API ROUTES
// ========================
app.get("/", (req, res) => {
  res.send("Medicine Store API is running...");
});

// Health check endpoint
app.get("/health", (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  };

  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/medicine-requests", medicineRequestRoutes); // NEW: Add medicine request routes

// ========================
// ERROR HANDLERS
// ========================
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);

  // ── Scheduled Tasks (Simple Cron) ───────────────────────────────────────────
  const checkStock = async () => {
    try {
      const outOfStockMedicines = await Medicine.find({ stock: 0 });
      if (outOfStockMedicines.length > 0) {
        const names = outOfStockMedicines.map(m => m.name).join(', ');
        console.warn(`[STOCK ALERT] ${outOfStockMedicines.length} medicines out of stock: ${names}`);

        // Send email alert
        if (process.env.EMAIL_USER) {
          sendLowStockAlert(outOfStockMedicines).catch(err =>
            console.error("Failed to send stock alert email:", err.message)
          );
        }
      }
    } catch (error) {
      console.error("Stock check failed:", error.message);
    }
  };

  // Run once on startup
  checkStock();

  // Run every 24 hours (86400000 ms)
  setInterval(checkStock, 24 * 60 * 60 * 1000);
});

// ==========================================
// PROCESS ERROR HANDLERS (Crash Prevention)
// ==========================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED PROMISE REJECTION! Shutting down gracefully...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack:', err.stack);

  // Close server gracefully
  server.close(() => {
    console.log('💥 Process terminated due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack:', err.stack);

  process.exit(1);
});

// Graceful shutdown on SIGTERM (e.g., from PM2, Docker, Ctrl+C)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated cleanly');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated cleanly');
  });
});

console.log('✅ Process error handlers registered');