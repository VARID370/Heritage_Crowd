const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');

describe('Admin Analytics & Management API Tests', () => {
  let adminToken;
  let visitorToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_connect';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const secret = process.env.JWT_SECRET || 'heritage_connect_super_secret_jwt_key_2026_cse_project';

    // Mock admin user
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin-test@heritageconnect.org' },
      { name: 'Test Admin', role: 'admin', password: 'Password@123' },
      { upsert: true, new: true }
    );

    const visitorUser = await User.findOneAndUpdate(
      { email: 'visitor-test@heritageconnect.org' },
      { name: 'Test Visitor', role: 'visitor', password: 'Password@123' },
      { upsert: true, new: true }
    );

    adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, secret, { expiresIn: '1h' });
    visitorToken = jwt.sign({ id: visitorUser._id, role: 'visitor' }, secret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['admin-test@heritageconnect.org', 'visitor-test@heritageconnect.org'] } });
    await mongoose.connection.close();
  });

  it('GET /api/admin/dashboard-stats returns 200 with all capacity, booking and crowd metrics', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard-stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { summary, crowdAnalysis, siteVolume } = res.body.data;
    expect(summary).toBeDefined();
    expect(typeof summary.overallTodayCapacity).toBe('number');
    expect(typeof summary.overallTodayBooked).toBe('number');
    expect(typeof summary.totalRevenue).toBe('number');
    expect(typeof summary.totalVisitors).toBe('number');
    expect(summary.overallCrowdStatus).toBeDefined();

    expect(Array.isArray(crowdAnalysis)).toBe(true);
    expect(Array.isArray(siteVolume)).toBe(true);
  });

  it('GET /api/admin/dashboard-stats rejects unauthorized visitor with 403', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard-stats')
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
