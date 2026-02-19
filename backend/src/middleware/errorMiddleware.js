// src/middleware/errorMiddleware.js
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // SECURITY: In production, never expose internal error details to clients.
  // Only return the real error message in development for debugging.
  const isProduction = process.env.NODE_ENV === "production";

  res.json({
    message: isProduction ? "Internal server error" : (err.message || "Server Error"),
    stack: isProduction ? undefined : err.stack
  });
};
