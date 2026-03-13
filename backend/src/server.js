// src/server.js
import express from "express";
import logger from "./utils/logger.js";
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
import mongoSanitize from "express-mongo-sanitize"; // NoSQL injection protection

// Import rate limiters from separate file - FIX: Only import once
import { limiter, authLimiter } from "./middleware/rateLimiter.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
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
import medicineRequestRoutes from "./routes/medicineRequestRoutes.js";
import twoFactorRoutes from "./routes/twoFactorRoutes.js";
import Medicine from "./models/Medicine.js";
import { sendLowStockAlert } from "./services/emailService.js";
import { isRedisConnected } from "./config/redis.js";

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
    logger.info(`Created directory: ${dir}`);
  }
});

const app = express();

// ========================
// SECURITY MIDDLEWARE
// ========================

// 1. Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// 2. Rate Limiting - FIX: Remove the duplicate limiter declaration below
const isProduction = process.env.NODE_ENV === 'production';

logger.info(`Rate limiter: ${isProduction ? '100' : '1000'} req/15 min (auth: ${isProduction ? '10' : '100'})`);
app.use("/api/", limiter);

// 3. MongoDB Sanitization - Prevent NoSQL injection attacks
app.use(mongoSanitize());

// ========================
// BODY PARSERS & COOKIES
// ========================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ========================
// CORS CONFIGURATION
// ========================
logger.info('CORS Origin:', process.env.CLIENT_URL || 'http://localhost:5173');

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
app.use("/uploads/medicines", express.static(path.join(process.cwd(), "uploads", "medicines")));

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
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    redis: isRedisConnected() ? 'Connected' : 'Disconnected (caching disabled)'
  };

  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
});

// Authentication Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/otp", otpRoutes);
app.use("/api/auth/google", googleAuthRoutes);

// Other API Routes
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
app.use("/api/medicine-requests", medicineRequestRoutes);
app.use("/api/2fa", twoFactorRoutes);

// ========================
// ERROR HANDLERS
// ========================
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);

  // Scheduled Tasks
  const checkStock = async () => {
    try {
      const outOfStockMedicines = await Medicine.find({ stock: 0 });
      if (outOfStockMedicines.length > 0) {
        const names = outOfStockMedicines.map(m => m.name).join(', ');
        logger.warn(`[STOCK ALERT] ${outOfStockMedicines.length} medicines out of stock: ${names}`);

        if (process.env.EMAIL_USER) {
          sendLowStockAlert(outOfStockMedicines).catch(err =>
            logger.error("Failed to send stock alert email:", err.message)
          );
        }
      }
    } catch (error) {
      logger.error("Stock check failed:", error.message);
    }
  };

  checkStock();
  setInterval(checkStock, 24 * 60 * 60 * 1000);
});

// Process error handlers
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED PROMISE REJECTION!', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION!', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  server.close(() => logger.info('Process terminated'));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down...');
  server.close(() => logger.info('Process terminated'));
});

logger.info('Process error handlers registered');