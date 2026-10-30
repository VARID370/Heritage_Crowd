# HeritageConnect REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### 1.1 Register New Account
- **Route**: `POST /auth/register`
- **Body**:
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "password": "Password@123",
    "phone": "+91 98765 43210"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Account registered successfully",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "6720f...",
        "name": "Aarav Sharma",
        "email": "aarav@example.com",
        "role": "visitor"
      }
    }
  }
  ```

### 1.2 Sign In
- **Route**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "admin@heritageconnect.org",
    "password": "Admin@123456"
  }
  ```
- **Response**: `200 OK`

### 1.3 Get Current User Session
- **Route**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## 2. Dynamic Discovery & Monument Endpoints

### 2.1 Dynamic Heritage Discovery (OSM Overpass Proxy)
- **Route**: `GET /sites/discover`
- **Query Parameters**:
  - `q`: Search keyword or monument name (e.g. `Red Fort`)
  - `city`: City name (e.g. `Agra`, `Jaipur`)
  - `state`: State or region (e.g. `Rajasthan`)
  - `category`: Heritage category (`fort`, `palace`, `monument`, `archaeological_site`, `temple_heritage`)
  - `bookableOnly`: `true` or `false`
  - `limit`: Number of results (default `30`, max `50`)
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "total": 6,
    "isFromCache": false,
    "data": [
      {
        "osmId": "way/107049449",
        "name": "Taj Mahal",
        "city": "Agra",
        "state": "Uttar Pradesh",
        "category": "monument",
        "coordinates": { "lat": 27.1751, "lng": 78.0421 },
        "imageUrl": "https://images.unsplash.com/...",
        "imageAttribution": "Unsplash / Jovyn Chamb (CC0)",
        "isBookable": true,
        "entryFee": 50,
        "crowdStatus": {
          "level": "low",
          "label": "Low Crowd",
          "percent": 35,
          "color": "emerald"
        }
      }
    ]
  }
  ```

### 2.2 Monument Details by ID
- **Route**: `GET /sites/:id`
- **Params**: `id` can be an OSM ID (e.g. `way/107049449`) or MongoDB ObjectId
- **Response**: `200 OK` (or `404 Not Found`)

### 2.3 Available Slots for Monument
- **Route**: `GET /sites/:siteId/slots?date=YYYY-MM-DD`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "site": {
      "id": "6720f...",
      "name": "Taj Mahal",
      "entryFee": 50
    },
    "slots": [
      {
        "id": "6720e...",
        "date": "2026-10-29",
        "slotTime": "09:00 AM - 12:00 PM",
        "capacity": 200,
        "bookedVisitors": 70,
        "remainingCapacity": 130,
        "isAvailable": true,
        "crowdStatus": {
          "level": "low",
          "label": "Low Crowd",
          "percent": 35
        }
      }
    ]
  }
  ```

---

## 3. Booking & Ticketing Endpoints

### 3.1 Create Ticket Booking (Atomic Capacity Reservation)
- **Route**: `POST /bookings`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "siteId": "6720f...",
    "slotId": "6720e...",
    "date": "2026-10-30",
    "visitorCount": 2,
    "visitorName": "Aarav Sharma",
    "visitorEmail": "aarav@example.com",
    "visitorPhone": "+91 98765 43210"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Booking confirmed successfully",
    "data": {
      "booking": {
        "id": "6720b...",
        "bookingReference": "HC-20261029-A7F2",
        "date": "2026-10-30",
        "slotTime": "09:00 AM - 12:00 PM",
        "visitorCount": 2,
        "unitPrice": 50,
        "totalPrice": 100,
        "status": "confirmed",
        "qrCodeDataUrl": "data:image/png;base64,iVBORw..."
      }
    }
  }
  ```

### 3.2 Authenticated User Bookings
- **Route**: `GET /bookings/my-bookings`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### 3.3 Get Single Ticket Pass
- **Route**: `GET /bookings/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### 3.4 Cancel Ticket Pass (Atomic Capacity Restoration)
- **Route**: `PATCH /bookings/:id/cancel`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (Rejects if already cancelled or already used)

---

## 4. Gate QR Verification (Staff & Admin Only)

### 4.1 Verify and Admit Ticket Pass
- **Route**: `POST /verify/scan`
- **Headers**: `Authorization: Bearer <token>` (Staff or Admin required)
- **Body**:
  ```json
  {
    "token": "4a7f9c2d1b...",
    "method": "qr_scan"
  }
  ```
  *or via manual reference:*
  ```json
  {
    "bookingReference": "HC-20261029-A7F2",
    "method": "manual"
  }
  ```
- **Outcomes**:
  - `200 OK` (Outcome: `valid` — Admitted)
  - `409 Conflict` (Outcome: `already_used` — Duplicate entry attempt)
  - `400 Bad Request` (Outcome: `cancelled` or `not_yet_valid`)
  - `404 Not Found` (Outcome: `invalid` — Fake reference)

### 4.2 Gate Verification Logs
- **Route**: `GET /verify/logs?limit=50`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## 5. Administration & Analytics Endpoints

### 5.1 Dashboard Analytics
- **Route**: `GET /admin/dashboard-stats`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Returns metrics, slot-wise crowd analysis, and site booking volumes.

### 5.2 Configure Bookable Site
- **Route**: `POST /admin/sites/configure`
- **Body**: Configures `entryFee`, `crowdCapacityPerSlot`, and links to `osmId`.

### 5.3 Create Time Slot
- **Route**: `POST /admin/slots`
- **Body**: Creates slots for a site and date with specific capacity.

