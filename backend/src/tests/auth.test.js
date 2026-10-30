const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');

describe('HeritageConnect Real Authentication & Email Verification Tests', () => {
  const testEmail = 'varid.personal@gmail.com';
  const testPassword = 'Password@123';
  let verificationToken = '';
  let verificationOtp = '';
  let authToken = '';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_connect';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    // Clean any previous test accounts
    await User.deleteMany({
      email: { $in: [testEmail, 'unverified.user@gmail.com', 'hacker.admin@gmail.com'] },
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: [testEmail, 'unverified.user@gmail.com', 'hacker.admin@gmail.com'] },
    });
    await mongoose.connection.close();
  });

  // 1 & 2: Register a new visitor with personal email & confirm saved in MongoDB
  it('1 & 2. Should register a new visitor with personal Gmail address and save to MongoDB', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Varid Sharma',
      email: '  Varid.Personal@Gmail.COM  ', // uppercase & spaces to test normalization
      password: testPassword,
      confirmPassword: testPassword,
      phone: '+91 98765 43210',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBe('visitor');
    expect(res.body.data.user.isVerified).toBe(false);

    // Verify record in MongoDB
    const dbUser = await User.findOne({ email: testEmail }).select(
      '+password +verificationToken +verificationOtp'
    );
    expect(dbUser).not.toBeNull();
    expect(dbUser.name).toBe('Varid Sharma');
    expect(dbUser.email).toBe(testEmail);
    expect(dbUser.isVerified).toBe(false);

    // Save tokens for verification tests
    verificationToken = dbUser.verificationToken;
    verificationOtp = dbUser.verificationOtp;
    expect(verificationToken).toBeDefined();
    expect(verificationOtp).toMatch(/^\d{6}$/);

    // 3. Confirm password is encrypted with bcrypt
    expect(dbUser.password).not.toBe(testPassword);
    const isBcryptHash = await bcrypt.compare(testPassword, dbUser.password);
    expect(isBcryptHash).toBe(true);
  });

  // 4: Duplicate registration rejection
  it('4. Should reject duplicate registration with clear error message', async () => {
    // First, temporarily mark user verified to test existing account conflict
    await User.updateOne({ email: testEmail }, { $set: { isVerified: true } });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Varid Sharma Duplicate',
      email: 'varid.personal@gmail.com',
      password: testPassword,
      confirmPassword: testPassword,
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);

    // Revert to unverified for subsequent email verification tests
    await User.updateOne(
      { email: testEmail },
      { $set: { isVerified: false, verificationToken, verificationOtp } }
    );
  });

  // 9: Unverified accounts cannot log in or access protected features
  it('9. Should prevent unverified account from logging in directly', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.isUnverified).toBe(true);
    expect(res.body.message).toMatch(/not verified/i);
  });

  // 8: Incorrect password rejected
  it('8. Should reject login with incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPassword999!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  // 10: Confirm visitor cannot register as admin
  it('10. Should strictly enforce visitor role even if client passes admin in request body', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker Attempt',
      email: 'hacker.admin@gmail.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'admin', // Malicious attempt to elevate role
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('visitor');

    const dbUser = await User.findOne({ email: 'hacker.admin@gmail.com' });
    expect(dbUser.role).toBe('visitor');
  });

  // 6: Verify account through single-use link or 6-digit OTP
  it('6. Should verify account using valid 6-digit OTP and issue authenticated session', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: testEmail,
      otp: verificationOtp,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.isVerified).toBe(true);

    // Confirm verified in MongoDB
    const dbUser = await User.findOne({ email: testEmail });
    expect(dbUser.isVerified).toBe(true);
  });

  // 7: Login using the exact registered email and password after verification
  it('7. Should successfully log in with registered email and password after verification', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'varid.personal@gmail.com',
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.name).toBe('Varid Sharma');
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBe('visitor');

    authToken = res.body.data.token;
  });

  // 11: Access visitor's protected pages
  it('11. Should allow verified visitor to access their profile and protected endpoints', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Varid Sharma');
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.isVerified).toBe(true);
  });

  // 12 & 13: Logout and confirm unauthenticated access fails
  it('12 & 13. Should process logout and reject requests with no token', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Request without token must be rejected
    const unauthRes = await request(app).get('/api/auth/me');
    expect(unauthRes.status).toBe(401);
  });

  // 14: Log in again with the same credentials
  it('14. Should allow visitor to log in again anytime with the same credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.name).toBe('Varid Sharma');
  });

  // Rate limiting on resend verification
  it('Should rate-limit resend verification requests within 60 seconds', async () => {
    // Create an unverified user
    await User.create({
      name: 'Unverified Visitor',
      email: 'unverified.user@gmail.com',
      password: 'Password@123',
      role: 'visitor',
      isVerified: false,
      lastVerificationEmailSentAt: new Date(), // Just sent
    });

    const res = await request(app).post('/api/auth/resend-verification').send({
      email: 'unverified.user@gmail.com',
    });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/wait.*seconds/i);
  });
});
