import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

// Global limiter — all /api/* routes
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProduction && req.path === '/api/auth/me'
});

// Stricter limiter for sensitive auth endpoints (login, register, OTP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: isProduction ? 10 : 100, // 10 in prod, lenient in dev
  message: { message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Even stricter limiter for OTP endpoints (optional)
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: isProduction ? 5 : 20,
  message: { message: "Too many OTP requests. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});