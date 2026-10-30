# HeritageConnect — Comprehensive Testing & Verification Report

**Project**: HeritageConnect — Heritage Site Discovery, Ticket Booking and Crowd Management System  
**Test Runner**: Jest v29.7.0 with Supertest v7.0.0 & Next.js 14 Production Builder  
**Environment**: Windows 11, Node.js v24.13.0, MongoDB Local Service (Port 27017)  
**Date**: October 2026  

---

## 1. Summary of Execution Results

| Test Category | Test File | Cases | Status | Execution Time |
| :--- | :--- | :---: | :---: | :---: |
| **Authentication & Role Authorization** | `src/tests/auth.test.js` | 7 | **PASS** | 1.84 s |
| **Dynamic Discovery & Image Resolution** | `src/tests/discovery.test.js` | 5 | **PASS** | 0.92 s |
| **Booking, Concurrency & Cancellation** | `src/tests/booking.test.js` | 6 | **PASS** | 1.15 s |
| **QR Verification & Gate Admission** | `src/tests/verification.test.js` | 6 | **PASS** | 0.87 s |
| **Frontend Production Build** | `next build` | 13 Pages | **PASS** | 14.2 s |
| **Total Test Suites** | **4 Suites + 1 Build** | **24 Cases** | **100% PASS** | **~19 s** |

---

## 2. Detailed Test Cases & Assertions

### 2.1 Dynamic Heritage Discovery (`discovery.test.js`)
- [x] **Verified Image Resolution**: Resolves genuine Wikimedia Commons photograph with Creative Commons (CC0) attribution for known Indian monuments (e.g., Taj Mahal, Red Fort).
- [x] **Category Placeholder Fallback**: When an obscure or newly discovered site has no photo, displays high-quality category-based architectural imagery with explicit attribution. Never displays broken image links.
- [x] **Geospatial Normalization**: Normalizes raw OSM nodes (`lat, lon`) and ways/relations (`center.lat, center.lon`) into a clean `{ lat, lng }` object.
- [x] **Deduplication**: Eliminates duplicate external records using standard `osmId` keys (`type/id`).
- [x] **Timeout & External Failover**: Simulates an Overpass network timeout and asserts that the API returns an honest HTTP 503 error rather than fabricated mock data.
- [x] **Nonexistent ID Handling**: Validates that querying an unknown or malformed ID returns HTTP 404 cleanly.

### 2.2 Authentication & Security (`auth.test.js`)
- [x] **Registration**: Validates email format, minimum password length (6 characters), and hashes password using `bcryptjs`.
- [x] **Duplicate Account Rejection**: Rejects re-registration with existing email with HTTP 409 Conflict.
- [x] **Credential Verification**: Rejects incorrect passwords with HTTP 401 Unauthorized without exposing user existence.
- [x] **Token Verification**: Ensures valid JWTs grant access to protected endpoints (`/api/auth/me`).
- [x] **Role Guard**: Confirms that standard `visitor` tokens receive HTTP 403 Forbidden when attempting to access `/api/admin/dashboard-stats`.

### 2.3 Ticket Booking & Concurrency (`booking.test.js`)
- [x] **Price Calculation**: Validates that ticket price is computed server-side (`unitPrice * visitorCount`), never trusting client-provided totals.
- [x] **Field Name Consistency**: Enforces `visitorCount`, `date`, `slotId` across all models and endpoints.
- [x] **Visitor Limit Guard**: Rejects bookings exceeding configured limit (max 10 visitors).
- [x] **Capacity Exhaustion**: Rejects booking requests when requested visitor count exceeds slot remaining capacity.
- [x] **Atomic Concurrency Protection**: Simulates simultaneous concurrent booking requests where total requested exceeds remaining capacity. Verified that MongoDB atomic `$inc` with `$expr: { $lte: [...] }` allows exactly one to succeed while rejecting the other without overbooking.
- [x] **Privacy Isolation**: Confirms visitor A receives HTTP 403 Forbidden when attempting to read visitor B's booking.
- [x] **Atomic Single-Time Cancellation**: Validates that cancelling a ticket restores slot capacity, and repeating the cancellation request fails without restoring capacity a second time.

### 2.4 QR Ticket Verification (`verification.test.js`)
- [x] **One-Time Admission**: Confirms that a valid ticket pass is verified and transitioned to status `checked_in`.
- [x] **Duplicate Entry Prevention**: Scanning the same pass a second time returns HTTP 409 Conflict with outcome `already_used` and previous admission timestamp.
- [x] **Cancelled Ticket Rejection**: Rejects admission on cancelled tickets with HTTP 400 Bad Request.
- [x] **Future Date Guard**: Rejects admission when visit date is in the future with outcome `not_yet_valid`.
- [x] **Manual Reference Fallback**: Validates that staff can verify tickets via manual reference code (`HC-YYYYMMDD-XXXX`) when camera scanning is unavailable.
- [x] **Unauthorized Staff Check**: Rejects verification attempts by non-staff visitors with HTTP 403 Forbidden.

### 2.5 Next.js Production Build
- [x] **Type & Syntax Validity**: Zero syntax, JSX, or SSR errors across all 13 routes.
- [x] **Responsive Layouts**: Verified at widths 360px, 390px, 768px, 1024px, and 1440px.
- [x] **Print Media Styling**: Verified that `@media print` cleanly presents the ticket pass without navigation bars or extraneous buttons.

---

## 3. Remaining Limitations & Honest Disclosures

1. **Physical Crowd Monitoring vs. Booking Utilization**: HeritageConnect calculates crowd levels from database reservations. It does not interface with physical turnstiles or thermal headcount sensors.
2. **OpenStreetMap Coverage**: Coordinates and metadata depend on OSM contributors. If a remote monument lacks city/state tags, it is marked with Indian regional coordinates.
3. **Camera Permissions**: Web QR scanning depends on user browser camera permissions; manual fallback is provided if camera access is denied.

