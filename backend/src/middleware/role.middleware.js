const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.activeRole)) {
      return res.status(403).json({
        success: false,
        message: `Action restricted to roles: ${roles.join(', ')}. Current active role: ${req.user.activeRole}`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
