require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const BookableSite = require('../models/BookableSite');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const { generateVerificationToken, generateBookingReference, formatSlotRange } = require('../utils/qrHelper');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_connect';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // 1. Seed Demo Users (Upsert to preserve passwords if existing, or re-create safely)
    console.log('[Seed] Creating demo user accounts...');
    
    // Clear existing demo accounts
    await User.deleteMany({ email: { $in: ['admin@heritageconnect.org', 'staff@heritageconnect.org', 'visitor@heritageconnect.org'] } });

    const adminUser = await User.create({
      name: 'Dr. Rajesh Sharma (Director)',
      email: 'admin@heritageconnect.org',
      password: 'Admin@123456',
      role: 'admin',
      phone: '+91 98765 43210',
      isVerified: true,
    });

    const staffUser = await User.create({
      name: 'Sunita Verma (Gate Officer)',
      email: 'staff@heritageconnect.org',
      password: 'Staff@123456',
      role: 'staff',
      phone: '+91 98765 12345',
      isVerified: true,
    });

    const visitorUser = await User.create({
      name: 'Aarav Patel (Visitor)',
      email: 'visitor@heritageconnect.org',
      password: 'Visitor@123456',
      role: 'visitor',
      phone: '+91 91234 56789',
      isVerified: true,
    });

    console.log('  ✓ Admin:   admin@heritageconnect.org / Admin@123456');
    console.log('  ✓ Staff:   staff@heritageconnect.org / Staff@123456');
    console.log('  ✓ Visitor: visitor@heritageconnect.org / Visitor@123456');

    // 2. Seed Initial Bookable Configurations mapped to real OSM IDs
    console.log('[Seed] Configuring verified bookable heritage sites...');
    
    // Clear demo bookable sites and slots
    await BookableSite.deleteMany({
      osmId: { $in: ['way/107049449', 'way/103233860', 'node/245647537', 'way/103233861'] }
    });

    const bookableSitesData = [
      {
        osmId: 'way/107049449',
        name: 'Taj Mahal',
        city: 'Agra',
        state: 'Uttar Pradesh',
        category: 'monument',
        coordinates: { lat: 27.1751, lng: 78.0421 },
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
        imageAttribution: 'Unsplash / Jovyn Chamb (CC0)',
        description: 'An immense mausoleum of white marble, built in Agra between 1631 and 1648 by order of the Mughal emperor Shah Jahan in memory of his favourite wife. The jewel of Muslim art in India and a universally admired UNESCO World Heritage masterpiece.',
        entryFee: 50,
        isActive: true,
        crowdCapacityPerSlot: 200,
        openingHours: '06:00 AM - 06:30 PM (Closed Fridays)',
        verifiedBy: adminUser._id,
      },
      {
        osmId: 'way/103233860',
        name: 'Red Fort (Lal Qila)',
        city: 'Delhi',
        state: 'Delhi',
        category: 'fort',
        coordinates: { lat: 28.6562, lng: 77.2410 },
        imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
        imageAttribution: 'Unsplash / Fardeen Ahmad (CC0)',
        description: 'Historic fortification in Old Delhi constructed in 1639 by Emperor Shah Jahan. The red sandstone walls represent the zenith of Mughal creativity under which Persian, Timurid and Hindu architectural traditions culminated.',
        entryFee: 35,
        isActive: true,
        crowdCapacityPerSlot: 150,
        openingHours: '09:30 AM - 05:00 PM (Closed Mondays)',
        verifiedBy: adminUser._id,
      },
      {
        osmId: 'node/245647537',
        name: 'Qutb Minar Complex',
        city: 'New Delhi',
        state: 'Delhi',
        category: 'monument',
        coordinates: { lat: 28.5245, lng: 77.1855 },
        imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&w=1200&q=80',
        imageAttribution: 'Unsplash / Sylwia Bartyzel (CC0)',
        description: 'A 72.5-metre high victory tower built in red sandstone and marble, commenced in 1192 by Qutb-ud-din Aibak. Surrounding buildings and the iron pillar constitute one of the finest early Indo-Islamic archaeological complexes.',
        entryFee: 40,
        isActive: true,
        crowdCapacityPerSlot: 150,
        openingHours: '07:00 AM - 06:00 PM (All Days)',
        verifiedBy: adminUser._id,
      },
      {
        osmId: 'way/103233861',
        name: 'Amber Palace & Fort',
        city: 'Jaipur',
        state: 'Rajasthan',
        category: 'palace',
        coordinates: { lat: 26.9855, lng: 75.8513 },
        imageUrl: 'https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=1200&q=80',
        imageAttribution: 'Unsplash / Aditya Chache (CC0)',
        description: 'Spectacular fortress-palace located high on a hill overlooking Maota Lake, built in red sandstone and marble by Raja Man Singh I. Renowned for its artistic Rajput and Mughal style elements, including the iconic Sheesh Mahal (Mirror Palace).',
        entryFee: 100,
        isActive: true,
        crowdCapacityPerSlot: 180,
        openingHours: '08:00 AM - 05:30 PM (All Days)',
        verifiedBy: adminUser._id,
      },
    ];

    const createdSites = [];
    for (const siteData of bookableSitesData) {
      const site = await BookableSite.create(siteData);
      createdSites.push(site);
    }
    console.log(`  ✓ Configured ${createdSites.length} verified bookable sites.`);

    // 3. Generate slots for today and next 7 days
    console.log('[Seed] Generating time slots and initial crowd utilization...');
    const today = new Date();

    const slotTimes = [
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '12:00', endTime: '15:00' },
      { startTime: '15:00', endTime: '18:00' },
    ];

    const createdSlots = [];
    for (const site of createdSites) {
      for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + dayOffset);
        const dateStr = slotDate.toISOString().slice(0, 10);

        for (const st of slotTimes) {
          // Provide some realistic initial booked visitors for demonstration
          let initialBooked = 0;
          if (dayOffset === 0) {
            // Today's slots: vary to demonstrate low, moderate, and high crowd levels
            if (st.startTime === '09:00') initialBooked = Math.round(site.crowdCapacityPerSlot * 0.35); // Low (35%)
            if (st.startTime === '12:00') initialBooked = Math.round(site.crowdCapacityPerSlot * 0.60); // Moderate (60%)
            if (st.startTime === '15:00') initialBooked = Math.round(site.crowdCapacityPerSlot * 0.78); // High (78%)
          }

          const slot = await TimeSlot.create({
            siteId: site._id,
            date: dateStr,
            startTime: st.startTime,
            endTime: st.endTime,
            capacity: site.crowdCapacityPerSlot,
            bookedVisitors: initialBooked,
          });
          createdSlots.push(slot);
        }
      }
    }
    console.log(`  ✓ Created ${createdSlots.length} time slots across all dates.`);

    // 4. Seed an initial booking for the demo visitor
    console.log('[Seed] Creating demo ticket bookings for presentation...');
    const todayStr = today.toISOString().slice(0, 10);
    const demoTajSlot = createdSlots.find((s) => s.siteId.toString() === createdSites[0]._id.toString() && s.date === todayStr);

    if (demoTajSlot) {
      const demoRef = generateBookingReference();
      const demoToken = generateVerificationToken();
      const slotTimeReadable = formatSlotRange(demoTajSlot.startTime, demoTajSlot.endTime);

      await Booking.create({
        bookingReference: demoRef,
        userId: visitorUser._id,
        siteId: createdSites[0]._id,
        slotId: demoTajSlot._id,
        date: todayStr,
        slotTime: slotTimeReadable,
        visitorCount: 2,
        unitPrice: createdSites[0].entryFee,
        totalPrice: createdSites[0].entryFee * 2,
        status: 'confirmed',
        verificationToken: demoToken,
        visitorName: visitorUser.name,
        visitorEmail: visitorUser.email,
        visitorPhone: visitorUser.phone,
      });

      console.log(`  ✓ Demo Confirmed Booking: Reference [${demoRef}] for ${visitorUser.name}`);
    }

    console.log('\n========================================================');
    console.log('✅ Seeding completed successfully!');
    console.log('Ready for live viva demo and testing.');
    console.log('========================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();

