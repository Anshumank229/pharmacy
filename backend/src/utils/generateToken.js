// src/utils/generateToken.js
// Generates short-lived access tokens and long-lived refresh tokens.
// Falls back to legacy JWT_SECRET / 7d expiry if new env vars are absent,
// so existing deployments continue to work without breaking.

import jwt from "jsonwebtoken";

/**
 * Generate a short-lived access token (default 15m).
 * Used for API authentication on every request.
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m" }
  );
};

/**
 * Generate a long-lived refresh token (default 7d).
 * Only used to obtain a new access token via POST /api/auth/refresh.
 */
export const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d" }
  );
};

// Legacy default export for backward compatibility
const generateToken = (userId, role) => generateAccessToken(userId, role);
export default generateToken;
