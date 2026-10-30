const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  verifyOtpSchema,
  resendVerificationSchema,
} = require('../utils/validators');
const { sendVerificationEmail, isEmailConfigured } = require('../services/emailService');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'heritage_connect_super_secret_jwt_key_2026_cse_project',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new visitor account with personal email and email verification
 * Strict rule: Public registration ALWAYS assigns the 'visitor' role.
 */
const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const normalizedEmail = validatedData.email.trim().toLowerCase();

    // Check if an account already exists with this normalized email
    const existingUser = await User.findOne({ email: normalizedEmail }).select('+verificationToken +verificationOtp');
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.',
        });
      }

      // If user exists but is NOT verified yet, update their details and re-issue verification
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationOtp = crypto.randomInt(100000, 999999).toString();

      existingUser.name = validatedData.name.trim();
      existingUser.password = validatedData.password; // pre('save') hashes it
      existingUser.phone = validatedData.phone?.trim() || existingUser.phone || '';
      existingUser.verificationToken = verificationToken;
      existingUser.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      existingUser.verificationOtp = verificationOtp;
      existingUser.verificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      existingUser.lastVerificationEmailSentAt = new Date();
      await existingUser.save();

      const emailResult = await sendVerificationEmail({
        email: existingUser.email,
        name: existingUser.name,
        token: verificationToken,
        otp: verificationOtp,
      });

      return res.status(200).json({
        success: true,
        message: emailResult.sent
          ? 'Account pending verification. A fresh verification link and OTP have been sent to your email.'
          : 'Account pending verification. Please verify your email using the verification code.',
        data: {
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            phone: existingUser.phone,
            isVerified: false,
          },
          emailSent: emailResult.sent,
          emailProviderConfigured: isEmailConfigured(),
          emailNotice: emailResult.sent
            ? `Verification email sent via ${emailResult.provider}`
            : emailResult.error,
        },
      });
    }

    // Generate secure single-use verification token (64 hex characters) and 6-digit OTP
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationOtp = crypto.randomInt(100000, 999999).toString();

    // Create real user with strictly 'visitor' role
    const user = await User.create({
      name: validatedData.name.trim(),
      email: normalizedEmail,
      password: validatedData.password, // Automatically hashed via User pre-save hook
      phone: validatedData.phone?.trim() || '',
      role: 'visitor', // NEVER allow visitors to register as admin or staff
      isVerified: false,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      verificationOtp,
      verificationOtpExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      lastVerificationEmailSentAt: new Date(),
    });

    // Send genuine verification email
    const emailResult = await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken,
      otp: verificationOtp,
    });

    res.status(201).json({
      success: true,
      message: emailResult.sent
        ? 'Account registered successfully! A verification link and 6-digit code have been sent to your email.'
        : 'Account created successfully. Please verify your email to unlock all visitor features.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: false,
        },
        emailSent: emailResult.sent,
        emailProviderConfigured: isEmailConfigured(),
        emailNotice: emailResult.sent
          ? `Verification email sent via ${emailResult.provider}`
          : emailResult.error,
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

    // Check verification status: unverified visitors cannot sign in directly
    if (user.role === 'visitor' && !user.isVerified) {
      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: user.email,
        message: 'Your email address is not verified yet. Please check your inbox or verify your code to sign in.',
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
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email via single-use link token
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    }).select('+verificationToken +verificationTokenExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired. Please request a new verification link.',
      });
    }

    // Mark user verified and clear tokens
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    // Generate authenticated session token
    const sessionToken = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully! You now have full access to ticket bookings.',
      data: {
        token: sessionToken,
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
 * Verify user email via 6-digit OTP code
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      verificationOtp: otp.trim(),
      verificationOtpExpires: { $gt: new Date() },
    }).select('+verificationOtp +verificationOtpExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired 6-digit verification code. Please check your code or request a new one.',
      });
    }

    // Mark user verified and clear tokens
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    // Generate authenticated session token
    const sessionToken = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully! You now have full access to ticket bookings.',
      data: {
        token: sessionToken,
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
 * Resend verification email with 60-second rate-limiting
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+lastVerificationEmailSentAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account has already been verified. Please sign in.',
      });
    }

    // Rate-limiting: must wait 60 seconds between resend requests
    if (user.lastVerificationEmailSentAt) {
      const elapsedMs = Date.now() - new Date(user.lastVerificationEmailSentAt).getTime();
      const cooldownMs = 60 * 1000;
      if (elapsedMs < cooldownMs) {
        const secondsRemaining = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsRemaining} seconds before requesting another verification email.`,
          secondsRemaining,
        });
      }
    }

    // Generate fresh single-use verification token and OTP
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationOtp = crypto.randomInt(100000, 999999).toString();

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    user.verificationOtp = verificationOtp;
    user.verificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    user.lastVerificationEmailSentAt = new Date();
    await user.save();

    const emailResult = await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken,
      otp: verificationOtp,
    });

    res.status(200).json({
      success: true,
      message: emailResult.sent
        ? 'A new verification link and 6-digit code have been sent to your email.'
        : 'New verification code generated.',
      data: {
        emailSent: emailResult.sent,
        emailProviderConfigured: isEmailConfigured(),
        emailNotice: emailResult.sent
          ? `Verification email sent via ${emailResult.provider}`
          : emailResult.error,
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
        isVerified: req.user.isVerified,
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
  verifyEmail,
  verifyOtp,
  resendVerification,
  getMe,
  logout,
};
