const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');

describe('HeritageConnect Direct Registration & Login Integration Tests', () => {
  const testEmail = 'varid.student@gmail.com';
  const testPassword = 'Password@123';
  let authToken = '';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_connect';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    // Clean test accounts
    await User.deleteMany({
      email: { $in: [testEmail, 'hacker.admin@gmail.com'] },
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: [testEmail, 'hacker.admin@gmail.com'] },
    });
    await mongoose.connection.close();
  });

  it('1. Should register a new visitor with personal email and immediately return auth token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Varid Sharma',
      email: '  Varid.Student@Gmail.COM  ', // uppercase & spaces to test normalization
      password: testPassword,
      confirmPassword: testPassword,
      phone: '+91 98765 43210',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBe('visitor');
    expect(res.body.data.user.isVerified).toBe(true);

    authToken = res.body.data.token;

    // Verify record in MongoDB
    const dbUser = await User.findOne({ email: testEmail }).select('+password');
    expect(dbUser).not.toBeNull();
    expect(dbUser.name).toBe('Varid Sharma');
    expect(dbUser.email).toBe(testEmail);
    expect(dbUser.role).toBe('visitor');

    // Confirm password is encrypted with bcrypt
    expect(dbUser.password).not.toBe(testPassword);
    const isBcryptHash = await bcrypt.compare(testPassword, dbUser.password);
    expect(isBcryptHash).toBe(true);
  });

  it('2. Should reject duplicate registration with clear error message', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Varid Sharma Duplicate',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('3. Should reject login with incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPassword999!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('4. Should strictly enforce visitor role even if client passes admin in request body', async () => {
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

  it('5. Should successfully log in with registered email and password anytime', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
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

  it('6. Should allow verified visitor to access their profile and protected endpoints', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Varid Sharma');
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('7. Should process logout and reject requests with no token', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Request without token must be rejected
    const unauthRes = await request(app).get('/api/auth/me');
    expect(unauthRes.status).toBe(401);
  });
});
