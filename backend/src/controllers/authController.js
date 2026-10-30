const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../utils/validators');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'heritage_connect_super_secret_jwt_key_2026_cse_project',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new visitor account with personal email
 * Directly creates the account and automatically logs the user in.
 * Public registration ALWAYS assigns the 'visitor' role.
 */
const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const normalizedEmail = validatedData.email.trim().toLowerCase();

    // Check if an account already exists with this normalized email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // Create real user with strictly 'visitor' role
    const user = await User.create({
      name: validatedData.name.trim(),
      email: normalizedEmail,
      password: validatedData.password, // Automatically hashed via User pre-save bcrypt hook
      phone: validatedData.phone?.trim() || '',
      role: 'visitor', // NEVER allow visitors to register as admin or staff
      isVerified: true,
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to HeritageConnect.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate real user using registered email and password from MongoDB
 */
const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const normalizedEmail = validatedData.email.trim().toLowerCase();

    // Fetch user from MongoDB including password hash for bcrypt comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password hash
    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        isVerified: true,
      },
    },
  });
};

/**
 * Log out and invalidate client session
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
