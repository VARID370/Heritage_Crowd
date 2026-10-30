# HeritageConnect — Architecture & Technical Design

## 1. Executive Summary

**HeritageConnect** is an integrated web application for dynamic Indian heritage site discovery, authenticated digital ticketing, and capacity-based crowd management. Engineered as a third-year Computer Science Engineering capstone project, it bridges the gap between open geospatial exploration (via OpenStreetMap Overpass API) and reliable internal transactional ticket reservations and gate management.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION TIER                             │
│       Next.js 14 App Router • React 18 • Tailwind CSS • Lucide-React   │
│                                                                        │
│  Public Pages:                Authenticated Visitor:    Staff / Admin: │
│  - / (Home & Search)          - /booking/[siteId]       - /admin       │
│  - /sites (Discovery)         - /my-bookings            - /admin/sites │
│  - /sites/[id] (Details)      - /ticket/[bookingId]     - /admin/slots │
│  - /login & /register                                   - /admin/verify│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / JWT (Bearer)
┌───────────────────────────────────▼────────────────────────────────────┐
│                          APPLICATION TIER                              │
│                   Express.js RESTful API (Node.js)                     │
│                                                                        │
│   Middleware:      Controllers:             Services:                  │
│   - JWT Auth       - Auth Controller        - OSM Overpass Service     │
│   - Role Guard     - Site Controller        - Image Attribution Engine │
│   - Rate Limiter   - Booking Controller     - Crowd Analytics Engine   │
│   - Error Handler  - Verification Engine    - QR Token Generator       │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ Mongoose                        │ Overpass QL / HTTPS
┌──────────────────▼───────────────────┐  ┌──────────▼───────────────────┐
│              DATA TIER               │  │       EXTERNAL SERVICES      │
│    MongoDB Document Database         │  │ - OpenStreetMap Overpass API │
│  - Users (visitor, staff, admin)     │  │ - Wikimedia Commons Archive  │
│  - BookableSites (OSM mapping, fees) │  │                              │
│  - TimeSlots (Atomic capacity count) │  │                              │
│  - Bookings (References, QR tokens)  │  │                              │
│  - VerificationLogs (Gate audit log) │  │                              │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 2. Dynamic Heritage Discovery vs. Internal Bookable Catalog

A fundamental design requirement of HeritageConnect is that **the monument directory is not hardcoded or statically seeded**. 

### 2.1 Dynamic OpenStreetMap Pipeline
- **Query Strategy**: Uses the Overpass QL dialect to search historic cultural tags (`historic=monument`, `historic=fort`, `historic=palace`, `historic=archaeological_site`, `historic=ruins`, `historic=city_gate`, and heritage temple sites) bounded within India (`8.0N - 37.0N, 68.0E - 97.5E`).
- **Resilience & Fallback**: Evaluates multiple Overpass endpoints with automated failover and 18-second connection timeouts.
- **In-Memory TTL Cache**: Stores normalized responses for 15 minutes to respect OSM server acceptable usage policies.
- **Deduplication & Center Normalization**: OpenStreetMap nodes have exact coordinates (`lat, lon`), while ways and relations are centered using `out center tags` so boundary polygons resolve to a single visitor destination pin.

### 2.2 Distinction: Discovered vs. Bookable Sites
- **Discovered Sites**: Any monument discovered via OSM can be browsed, mapped, and explored.
- **Bookable Sites**: Only sites verified and configured by an administrator (with verified ASI entry fee, slot capacities, and guidelines) display the "Book Ticket" action. Sites without booking configuration display an honest notice: *"Online booking is not currently available for this site."*

---

## 3. Atomic Concurrency & Capacity Reservation

A critical flaw in standard student ticketing systems is the **race condition** where simultaneous booking requests cause a monument to exceed its safety threshold.

HeritageConnect uses MongoDB's atomic operator `$inc` with an expression check in a single atomic database operation:

```javascript
const updatedSlot = await TimeSlot.findOneAndUpdate(
  {
    _id: slotId,
    siteId: site._id,
    date: date,
    isActive: true,
    $expr: {
      $lte: [{ $add: ['$bookedVisitors', visitorCount] }, '$capacity'],
    },
  },
  {
    $inc: { bookedVisitors: visitorCount },
  },
  {
    new: true,
  }
);
```

- If `updatedSlot` is null, the slot is immediately recognized as sold out or lacking sufficient capacity for the requested visitor count.
- If saving the subsequent `Booking` document throws an unexpected error, a safe rollback undoes the reservation:
  ```javascript
  await TimeSlot.findByIdAndUpdate(slotId, {
    $inc: { bookedVisitors: -visitorCount },
  });
  ```

---

## 4. Single-Time Cancellation Restoration

When a visitor cancels a ticket:
1. Status is atomically updated from `'confirmed'` to `'cancelled'`:
   ```javascript
   const updated = await Booking.findOneAndUpdate(
     { _id: bookingId, status: 'confirmed' },
     { status: 'cancelled', cancelledAt: new Date() },
     { new: true }
   );
   ```
2. Only if the status transitioned successfully is the slot capacity restored:
   ```javascript
   await TimeSlot.findByIdAndUpdate(booking.slotId, {
     $inc: { bookedVisitors: -booking.visitorCount },
   });
   ```
This guarantees repeated cancellation calls can **never restore capacity more than once**.

---

## 5. Standardized Crowd Classification Engine

To provide consistent visitor transparency, crowd levels are computed uniformly on the server:

$$\text{Utilization Percentage} = \min\left(100, \left\lfloor \frac{\text{Booked Visitors}}{\text{Slot Capacity}} \times 100 \right\rfloor\right)$$

- **Low Crowd**: $< 40\%$ (Minimal queues, comfortable sightseeing)
- **Moderate Crowd**: $40\% \le \text{Utilization} < 70\%$ (Steady visitor flow)
- **High Crowd**: $70\% \le \text{Utilization} < 85\%$ (Heavy footfall expected)
- **Peak Crowd**: $\ge 85\%$ (Nearing capacity limits, strict gate admission)

---

## 6. Real Cryptographic QR Ticket Verification

1. When a booking is confirmed, a cryptographic verification token (`crypto.randomBytes(24).toString('hex')`) is generated and signed into a Base64 QR code data URL.
2. The gate turnstile or security guard scans the QR code via webcam or enters the booking reference fallback on `/admin/verify-ticket`.
3. The server validates:
   - Does the ticket exist?
   - Is the visit date today? (Rejects future or expired tickets)
   - Is it cancelled?
   - Has it already been admitted?
4. Atomically transitions ticket status to `'checked_in'` and writes an auditable record to `VerificationLog`.

