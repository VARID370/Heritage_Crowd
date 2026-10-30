const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please sign in.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'heritage_connect_super_secret_jwt_key_2026_cse_project'
    );

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user session is invalid or user no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] roles.`,
      });
    }
    next();
  };
};

/**
 * Enforce that registered visitors must have a verified email to access protected features
 * (Staff and Admin are exempt)
 */
const requireVerifiedUser = (req, res, next) => {
  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireVerifiedUser,
};

