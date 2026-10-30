const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const BookableSite = require('../models/BookableSite');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');

describe('Ticket Booking, Concurrency & Cancellation Tests', () => {
  let visitorToken;
  let visitorId;
  let otherVisitorToken;
  let testSite;
  let testSlot;
  const testDate = '2026-11-15'; // Future date

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_connect';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean test accounts
    await User.deleteMany({ email: { $in: ['bookingtester1@example.com', 'bookingtester2@example.com'] } });
    await BookableSite.deleteMany({ osmId: 'node/test-monument-999' });

    // Create primary visitor
    const u1 = await User.create({
      name: 'Primary Visitor',
      email: 'bookingtester1@example.com',
      password: 'Password@123',
      role: 'visitor',
      isVerified: true,
    });
    visitorId = u1._id.toString();
    const l1 = await request(app).post('/api/auth/login').send({
      email: 'bookingtester1@example.com',
      password: 'Password@123',
    });
    visitorToken = l1.body.data.token;

    // Create secondary visitor
    await User.create({
      name: 'Other Visitor',
      email: 'bookingtester2@example.com',
      password: 'Password@123',
      role: 'visitor',
      isVerified: true,
    });
    const l2 = await request(app).post('/api/auth/login').send({
      email: 'bookingtester2@example.com',
      password: 'Password@123',
    });
    otherVisitorToken = l2.body.data.token;

    // Create test bookable site with verified fee = 100
    testSite = await BookableSite.create({
      osmId: 'node/test-monument-999',
      name: 'Test Archaeological Fortress',
      city: 'Jaipur',
      state: 'Rajasthan',
      category: 'fort',
      coordinates: { lat: 26.9, lng: 75.8 },
      entryFee: 100,
      isActive: true,
      crowdCapacityPerSlot: 10,
    });

    // Create test slot with small capacity of 5 visitors
    testSlot = await TimeSlot.create({
      siteId: testSite._id,
      date: testDate,
      startTime: '10:00',
      endTime: '12:00',
      capacity: 5,
      bookedVisitors: 0,
      isActive: true,
    });
  });

  afterAll(async () => {
    await Booking.deleteMany({ siteId: testSite._id });
    await TimeSlot.deleteMany({ siteId: testSite._id });
    await BookableSite.deleteOne({ _id: testSite._id });
    await User.deleteMany({ email: { $in: ['bookingtester1@example.com', 'bookingtester2@example.com'] } });
    await mongoose.connection.close();
  });

  it('should successfully book tickets and calculate correct total price', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        siteId: testSite._id.toString(),
        slotId: testSlot._id.toString(),
        date: testDate,
        visitorCount: 2,
        visitorName: 'Primary Visitor',
        visitorEmail: 'bookingtester1@example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.unitPrice).toBe(100);
    expect(res.body.data.booking.totalPrice).toBe(200); // 100 * 2
    expect(res.body.data.booking.status).toBe('confirmed');
    expect(res.body.data.booking.bookingReference).toMatch(/^HC-/);
    expect(res.body.data.booking.qrCodeDataUrl).toBeDefined();

    // Check slot remaining capacity in database
    const slot = await TimeSlot.findById(testSlot._id);
    expect(slot.bookedVisitors).toBe(2);
  });

  it('should reject booking with invalid visitor count (e.g. 0 or >10)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        siteId: testSite._id.toString(),
        slotId: testSlot._id.toString(),
        date: testDate,
        visitorCount: 15, // Limit is 10
        visitorName: 'Primary Visitor',
        visitorEmail: 'bookingtester1@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject booking when capacity is insufficient', async () => {
    // Current slot has capacity 5, 2 already booked, remaining is 3
    // Requesting 4 should fail
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        siteId: testSite._id.toString(),
        slotId: testSlot._id.toString(),
        date: testDate,
        visitorCount: 4,
        visitorName: 'Primary Visitor',
        visitorEmail: 'bookingtester1@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/insufficient capacity/i);

    // Ensure capacity was not touched
    const slot = await TimeSlot.findById(testSlot._id);
    expect(slot.bookedVisitors).toBe(2);
  });

  it('should handle concurrent booking attempts safely without overbooking', async () => {
    // Slot capacity = 5, booked = 2, remaining = 3
    // Launch two simultaneous requests each requesting 2 visitors (total 4 > 3 remaining)
    const req1 = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        siteId: testSite._id.toString(),
        slotId: testSlot._id.toString(),
        date: testDate,
        visitorCount: 2,
        visitorName: 'Concurrent User 1',
        visitorEmail: 'bookingtester1@example.com',
      });

    const req2 = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${otherVisitorToken}`)
      .send({
        siteId: testSite._id.toString(),
        slotId: testSlot._id.toString(),
        date: testDate,
        visitorCount: 2,
        visitorName: 'Concurrent User 2',
        visitorEmail: 'bookingtester2@example.com',
      });

    const [res1, res2] = await Promise.all([req1, req2]);

    // Exactly one must succeed and one must fail
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 400]);

    // Verify slot capacity never exceeded 5
    const slot = await TimeSlot.findById(testSlot._id);
    expect(slot.bookedVisitors).toBe(4); // 2 previous + 2 successful concurrent
    expect(slot.bookedVisitors).toBeLessThanOrEqual(slot.capacity);
  });

  it('should prevent visitor from viewing another visitor booking', async () => {
    // Get visitor 1's booking
    const myBookings = await request(app)
      .get('/api/bookings/my-bookings')
      .set('Authorization', `Bearer ${visitorToken}`);

    const bookingId = myBookings.body.data[0]._id;

    // Try accessing with visitor 2's token
    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${otherVisitorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should cancel booking and restore slot capacity exactly once', async () => {
    // Get visitor 1's booking
    const myBookings = await request(app)
      .get('/api/bookings/my-bookings')
      .set('Authorization', `Bearer ${visitorToken}`);

    const booking = myBookings.body.data[0];
    const initialSlot = await TimeSlot.findById(testSlot._id);
    const initialBooked = initialSlot.bookedVisitors;

    // 1. First cancellation should succeed
    const cancelRes = await request(app)
      .patch(`/api/bookings/${booking._id}/cancel`)
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // Slot capacity should be restored
    const updatedSlot = await TimeSlot.findById(testSlot._id);
    expect(updatedSlot.bookedVisitors).toBe(initialBooked - booking.visitorCount);

    // 2. Repeated cancellation MUST fail and NOT restore capacity a second time
    const repeatRes = await request(app)
      .patch(`/api/bookings/${booking._id}/cancel`)
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(repeatRes.status).toBe(400);
    expect(repeatRes.body.success).toBe(false);
    expect(repeatRes.body.message).toMatch(/already been cancelled/i);

    // Slot capacity remains unchanged
    const slotAfterRepeat = await TimeSlot.findById(testSlot._id);
    expect(slotAfterRepeat.bookedVisitors).toBe(updatedSlot.bookedVisitors);
  });
});

