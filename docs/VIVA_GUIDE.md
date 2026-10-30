# HeritageConnect — College Viva & Project Defense Guide

This guide is designed for a third-year Computer Science Engineering student presenting **HeritageConnect** to an external examiner.

---

## 1. Quick Project Pitch (30-Second Elevator Pitch)

> *"Good morning, Sir/Madam. My project is **HeritageConnect — Heritage Site Discovery, Ticket Booking and Crowd Management System**. It addresses two major challenges in Indian cultural tourism: discovering cultural sites dynamically without rigid static catalogs, and preventing dangerous overcrowding at historical monuments. 
> 
> I implemented dynamic site discovery using OpenStreetMap Overpass API, an atomic capacity reservation engine in MongoDB to eliminate overbooking race conditions, a standardized crowd utilization classifier, and a cryptographic QR verification system for gate admission. The system is built with Next.js 14, Node.js, Express, and MongoDB."*

---

## 2. Recommended 3-Minute Live Demo Walkthrough

When asked to demonstrate the working project, follow this exact sequence:

### Step 1: Dynamic Discovery (1 minute)
1. Open the homepage at `http://localhost:3000`.
2. Type **"Fort"** or **"Agra"** into the search bar and press **Explore**.
3. Point out:
   - *"Notice that the results are not from a fixed SQL/NoSQL list; our backend queries the OpenStreetMap Overpass API dynamically across India."*
   - Show the distinction: **"Taj Mahal"** has a green **Bookable** badge, while unconfigured discovered monuments have a **Discovery Record** badge with an honest notice: *"Online booking is not currently available for this site."*
   - Click on **"Taj Mahal"** to show genuine photo attribution, coordinates, directions link, and opening hours.

### Step 2: Reliable Ticket Booking (1 minute)
1. Click **Book Tickets Now**.
2. Select today's date or tomorrow's date.
3. Show the available time slots with their live crowd badges (*Low*, *Moderate*, *High*, *Peak*).
4. Increase visitor count to **2**. Point out:
   - *"The price calculation is performed strictly on the backend. The frontend cannot tamper with prices."*
5. Click **Confirm & Generate Ticket**.
6. The system instantly generates the official digital ticket with a **cryptographic QR code**, human-readable slot range (e.g. *09:00 AM - 12:00 PM*), verified price, and a working **Print / Save as PDF** button.

### Step 3: Gate Verification & Crowd Analytics (1 minute)
1. Open a new tab or incognito window, navigate to `http://localhost:3000/login`.
2. Click the one-click **"Gate Staff"** demo button (`staff@heritageconnect.org` / `Staff@123456`) and sign in.
3. Go to **Admin Portal -> Gate QR Verification** (`/admin/verify-ticket`).
4. Enter the booking reference from the ticket (e.g. `HC-20261029-XXXX`) and click **Verify & Admit Visitor**.
5. The system displays a green **"VALID PASS — Admitted"** banner and logs the entry timestamp.
6. Try submitting the exact same reference again. Show the examiner:
   - *"Duplicate entry denied! Outcome: ALREADY_USED with the previous admission time."*
7. Open **Crowd Dashboard** (`/admin`) to show the live Recharts visitor volume graph and slot capacity utilization percentages.

---

## 3. Potential Examiner Questions & Model Answers

### Q1: "Why did you use OpenStreetMap instead of hardcoding monuments in MongoDB?"
> **Answer**: *"A hardcoded catalogue limits visitors to 5 or 10 monuments and requires manual database maintenance. OpenStreetMap contains hundreds of forts, palaces, and ruins across India with accurate GPS coordinates. By querying Overpass API dynamically on the backend and caching results for 15 minutes, HeritageConnect allows visitors to discover monuments anywhere in India while keeping our application database lightweight."*

### Q2: "How do you prevent two visitors from booking the last ticket at the exact same millisecond?"
> **Answer**: *"I solved this race condition by using MongoDB's atomic operator `$inc` combined with an expression condition `$expr: { $lte: [{ $add: ['$bookedVisitors', visitorCount] }, '$capacity'] }` in a single `findOneAndUpdate` query. Because MongoDB documents are locked at the document level during write operations, only one request can satisfy the condition. The second request receives a null return and is immediately informed that capacity is exhausted."*

### Q3: "What happens if a user repeatedly clicks 'Cancel Ticket'? Does capacity increase indefinitely?"
> **Answer**: *"No. The cancellation uses an atomic status check: `findOneAndUpdate({ _id: bookingId, status: 'confirmed' }, { status: 'cancelled' })`. The slot capacity is only incremented downwards if the ticket status successfully transitioned from 'confirmed' to 'cancelled'. If called a second time, the status is already 'cancelled', the query returns null, and capacity is never touched twice."*

### Q4: "What information is encoded in the QR code?"
> **Answer**: *"The QR code encodes a secure, signed JSON payload with an opaque verification token (`crypto.randomBytes(24).toString('hex')`) and the booking reference. To protect user privacy, personal details, government IDs, and passwords are never placed inside the QR code."*

### Q5: "How is crowd level calculated?"
> **Answer**: *"The backend calculates utilization as `(Booked Visitors / Slot Capacity) * 100`. It classifies crowd density into four standard brackets: Low (< 40%), Moderate (40% to 70%), High (70% to 85%), and Peak (>= 85%). This classification is consistent across the frontend and backend."*

