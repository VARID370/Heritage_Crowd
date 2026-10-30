const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const BookableSite = require('../models/BookableSite');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const { generateVerificationToken, generateBookingReference } = require('../utils/qrHelper');

describe('QR Ticket Verification & Entry Management Tests', () => {
  let staffToken;
  let visitorToken;
  let testSite;
  let testSlot;
  let validBooking;
  let cancelledBooking;
  let futureBooking;

  const todayStr = new Date().toISOString().slice(0, 10);
  const futureDateStr = '2026-12-31';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_connect';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean test accounts
    await User.deleteMany({ email: { $in: ['staff_verifier@example.com', 'visitor_verify@example.com'] } });

    // Create staff account
    await User.create({
      name: 'Gate Verifier Staff',
      email: 'staff_verifier@example.com',
      password: 'Password@123',
      role: 'staff',
      isVerified: true,
    });
    const sLogin = await request(app).post('/api/auth/login').send({
      email: 'staff_verifier@example.com',
      password: 'Password@123',
    });
    staffToken = sLogin.body.data.token;

    // Create visitor account
    const vUser = await User.create({
      name: 'Visitor Person',
      email: 'visitor_verify@example.com',
      password: 'Password@123',
      role: 'visitor',
      isVerified: true,
    });
    const vLogin = await request(app).post('/api/auth/login').send({
      email: 'visitor_verify@example.com',
      password: 'Password@123',
    });
    visitorToken = vLogin.body.data.token;
    const visitorId = vUser._id.toString();

    // Create test site
    testSite = await BookableSite.create({
      osmId: 'node/verify-site-101',
      name: 'Gate Verification Monument',
      entryFee: 50,
      isActive: true,
      crowdCapacityPerSlot: 100,
      coordinates: { lat: 28.6, lng: 77.2 },
    });

    testSlot = await TimeSlot.create({
      siteId: testSite._id,
      date: todayStr,
      startTime: '09:00',
      endTime: '12:00',
      capacity: 50,
    });

    // 1. Valid booking for today
    validBooking = await Booking.create({
      bookingReference: generateBookingReference(),
      userId: visitorId,
      siteId: testSite._id,
      slotId: testSlot._id,
      date: todayStr,
      slotTime: '09:00 AM - 12:00 PM',
      visitorCount: 2,
      unitPrice: 50,
      totalPrice: 100,
      status: 'confirmed',
      verificationToken: generateVerificationToken(),
      visitorName: 'Visitor Person',
      visitorEmail: 'visitor_verify@example.com',
    });

    // 2. Cancelled booking
    cancelledBooking = await Booking.create({
      bookingReference: generateBookingReference(),
      userId: visitorId,
      siteId: testSite._id,
      slotId: testSlot._id,
      date: todayStr,
      slotTime: '09:00 AM - 12:00 PM',
      visitorCount: 1,
      unitPrice: 50,
      totalPrice: 50,
      status: 'cancelled',
      cancelledAt: new Date(),
      verificationToken: generateVerificationToken(),
      visitorName: 'Visitor Person',
      visitorEmail: 'visitor_verify@example.com',
    });

    // 3. Future booking
    futureBooking = await Booking.create({
      bookingReference: generateBookingReference(),
      userId: visitorId,
      siteId: testSite._id,
      slotId: testSlot._id,
      date: futureDateStr,
      slotTime: '09:00 AM - 12:00 PM',
      visitorCount: 1,
      unitPrice: 50,
      totalPrice: 50,
      status: 'confirmed',
      verificationToken: generateVerificationToken(),
      visitorName: 'Visitor Person',
      visitorEmail: 'visitor_verify@example.com',
    });
  });

  afterAll(async () => {
    await Booking.deleteMany({ siteId: testSite._id });
    await TimeSlot.deleteMany({ siteId: testSite._id });
    await BookableSite.deleteOne({ _id: testSite._id });
    await User.deleteMany({ email: { $in: ['staff_verifier@example.com', 'visitor_verify@example.com'] } });
    await mongoose.connection.close();
  });

  it('should reject unauthorized visitor attempting verification', async () => {
    const res = await request(app)
      .post('/api/verify/scan')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        token: validBooking.verificationToken,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should verify and admit valid ticket with authorized staff token', async () => {
    const res = await request(app)
      .post('/api/verify/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        token: validBooking.verificationToken,
        method: 'qr_scan',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.outcome).toBe('valid');
    expect(res.body.data.visitorName).toBe('Visitor Person');
    expect(res.body.data.visitorCount).toBe(2);

    // Verify DB status transitioned to checked_in
    const updated = await Booking.findById(validBooking._id);
    expect(updated.status).toBe('checked_in');
    expect(updated.checkedInAt).toBeDefined();
  });

  it('should reject already used ticket on second verification attempt', async () => {
    const res = await request(app)
      .post('/api/verify/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        token: validBooking.verificationToken,
        method: 'qr_scan',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.outcome).toBe('already_used');
    expect(res.body.message).toMatch(/already been used/i);
  });

  it('should reject cancelled ticket pass', async () => {
    const res = await request(app)
      .post('/api/verify/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        token: cancelledBooking.verificationToken,
        method: 'qr_scan',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.outcome).toBe('cancelled');
    expect(res.body.message).toMatch(/cancelled/i);
  });

  it('should reject future ticket not yet valid for today', async () => {
    const res = await request(app)
      .post('/api/verify/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        token: futureBooking.verificationToken,
        method: 'qr_scan',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.outcome).toBe('not_yet_valid');
  });

  it('should support manual booking reference verification fallback', async () => {
    const manualBooking = await Booking.create({
      bookingReference: 'HC-TESTMANUAL-001',
      userId: validBooking.userId,
      siteId: testSite._id,
      slotId: testSlot._id,
      date: todayStr,
      slotTime: '09:00 AM - 12:00 PM',
      visitorCount: 1,
      unitPrice: 50,
      totalPrice: 50,
      status: 'confirmed',
      verificationToken: generateVerificationToken(),
      visitorName: 'Manual Entry Visitor',
      visitorEmail: 'visitor_verify@example.com',
    });

    const res = await request(app)
      .post('/api/verify/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        bookingReference: 'HC-TESTMANUAL-001',
        method: 'manual',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.outcome).toBe('valid');
    expect(res.body.data.visitorName).toBe('Manual Entry Visitor');
  });
});

