// src/middleware/adminMiddleware.js

/**
 * Admin-only middleware
 * Checks if the authenticated user has admin privileges
 * Must be used AFTER the protect middleware
 */
export const adminOnly = (req, res, next) => {
  // Check if user exists and is admin
  if (req.user && (req.user.isAdmin === true || req.user.role === 'admin')) {
    next(); // User is admin, proceed
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin privileges required.' 
    });
  }
};

/**
 * Optional: Super admin middleware (if you have different admin levels)
 * Checks if user is a super admin
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
 * Optional: Check if user owns the resource or is admin
 * Useful for routes where users can access their own data, admins can access all
 */
export const isOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const isAdmin = req.user.isAdmin || req.user.role === 'admin';
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