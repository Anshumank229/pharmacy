// src/middleware/adminMiddleware.js

/**
 * Admin-only middleware
 * Checks if the authenticated user has admin privileges
 * Must be used AFTER the protect middleware
 * H1 FIX: removed deprecated isAdmin check — User schema uses role field only.
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

/**
 * Optional: Super admin middleware (if you have different admin levels)
 */
export const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Super admin privileges required.'
    });
  }
};

/**
 * Check if user owns the resource or is admin
 */
export const isOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // H1 FIX: removed isAdmin — only role-based check
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user._id.toString() === resourceUserId.toString();

    if (isAdmin || isOwner) {
      next();
    } else {
      res.status(403).json({
        message: 'Access denied. You do not own this resource.'
      });
    }
  };
};