// src/middleware/authMiddleware.js
// Reads the accessToken cookie (or Bearer header as fallback).
// On expiry, returns { code: "TOKEN_EXPIRED" } so the frontend
// interceptor can silently call /api/auth/refresh and retry.

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import redis from "../config/redis.js";

export const protect = async (req, res, next) => {
  let token;

  // SECURITY: Read accessToken cookie first (XSS-safe).
  // Fall back to legacy "token" cookie for backward compat,
  // then to Authorization header for API clients / mobile apps.
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.cookies && req.cookies.token) {
    // Legacy single-cookie support
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token, not authorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
    );
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    // FIX C3: Block suspended accounts
    if (req.user.isActive === false) {
      return res.status(401).json({
        message: "Your account has been suspended. Please contact support."
      });
    }

    // UPGRADE 1: Check Redis blacklist — token may have been invalidated on logout.
    // Fail-open: if Redis is unavailable, allow request through to preserve availability.
    try {
      if (redis) {
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res.status(401).json({
            message: "Token has been invalidated. Please login again.",
            code: "TOKEN_BLACKLISTED"
          });
        }
      }
    } catch (redisErr) {
      logger.warn("Redis blacklist check failed (fail-open):", redisErr.message);
    }

    next();
  } catch (error) {
    // Differentiate between expired and invalid tokens so the
    // frontend knows whether to attempt a silent refresh.
    if (error.name === "TokenExpiredError") {
      logger.info("Access token expired — client should refresh");
      return res.status(401).json({
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    logger.error("Auth middleware error:", error.message);
    return res.status(401).json({
      message: "Not authorized, token failed",
      code: "TOKEN_INVALID"
    });
  }
};

// FIX C4: Authoritative adminOnly — uses role field only.
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};
