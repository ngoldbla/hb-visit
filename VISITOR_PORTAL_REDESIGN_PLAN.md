# HatchBridge Visitor Portal Redesign Plan
**Vision: A Dramatically Smoother Kiosk Experience**

---

## Executive Summary

We're transforming the HatchBridge visitor portal from a traditional multi-step web application into a **frictionless, kiosk-first experience** inspired by Envoy's simplicity while maintaining HatchBridge's warm, professional aesthetic. This redesign prioritizes **speed, delight, and zero training required** for both visitors and guards.

**Current State:** Angular/Node/MongoDB app with manual registration, guard-operated QR scanning, and basic entry/exit tracking.

**Target State:** Modern kiosk interface with pre-arrival digital passes, self-service check-in, Apple/Google Wallet integration, and optional NFC hardware support.

---

## Design Philosophy: The Founding Team Perspective

### UX Team Vision

**Core Principle: "Invisible is Better"**

The best visitor experience is one that feels like *no experience at all*. Visitors should:
1. **Pre-register from home** → Receive digital pass instantly
2. **Walk up to kiosk** → Scan QR/tap NFC
3. **Get welcomed** → See personalized greeting, host notification sent
4. **Walk in** → Total time: 5 seconds

**Aesthetic Alignment with HatchBridge.com:**
- **Warm, Not Corporate**: Cream backgrounds (#fff9e9), soft shadows, friendly typography (Nunito Sans)
- **Premium, Not Sterile**: 16px border radius, subtle gradients, thoughtful micro-interactions
- **Confident, Not Cluttered**: Single-focus screens, generous whitespace, clear CTAs
- **Accessible**: WCAG 2.1 AA compliant, high contrast ratios, large touch targets (min 48px)

**Kiosk-Specific Design Requirements:**
- **Portrait orientation** (iPad/tablet mounted vertically at entrance)
- **Touch-first interactions** (no hover states, 60px minimum button size)
- **Ambient animations** (attract attention when idle, show "ready to scan")
- **Immediate feedback** (haptic-style visual feedback, success animations <500ms)
- **Auto-reset after 10 seconds** (return to attract mode, protect privacy)

**Inspiration from Envoy (What We're Adopting):**
- ✅ Pre-arrival digital passes (QR codes sent via email)
- ✅ Mobile-first registration flow
- ✅ One-tap check-in (no typing at kiosk)
- ✅ Host notifications (SMS/email when visitor arrives)
- ✅ Photo capture during registration (security & recognition)
- ✅ Compliance-ready (visitor logs with timestamps, badge printing)

**What We're NOT Doing (Scope Boundaries):**
- ❌ No complex integrations (Slack, Teams, calendar sync) in Phase 1
- ❌ No recurring visitor recognition (facial recognition) in Phase 1
- ❌ No multi-tenant/multi-location support yet
- ❌ No analytics dashboard (Phase 1 focuses on visitor experience)

---

### Engineering Team Vision

**Core Principle: "Progressive Enhancement with Pragmatic Choices"**

We're building a **modern, maintainable system** that can scale from a single kiosk to multiple locations without a complete rewrite.

**Technology Stack Evolution:**

| Component | Current State | Proposed Migration | Rationale |
|-----------|---------------|-------------------|-----------|
| **Backend** | Node.js/Express | **Keep Node.js/Express** | Stable, team knows it, ecosystem mature for QR/NFC/passes |
| **Database** | MongoDB | **Keep MongoDB** | Document model suits evolving visitor data, easy schema changes |
| **Frontend** | Angular (compiled) | **React with Vite** | Faster dev cycles, better kiosk UI libraries (Framer Motion), smaller bundle |
| **Auth** | JWT (20min TTL) | **JWT + Refresh Tokens** | Extend sessions for kiosks (12hr), shorter for mobile (1hr) |
| **Real-time** | Socket.io | **Keep Socket.io** | Guard dashboards need live updates, proven tech |
| **QR Codes** | `qrcode` lib | **Keep `qrcode`** + add `eqrcode_ex` for advanced | No need to change working solution |
| **Styling** | Bootstrap 4.5 | **TailwindCSS** | Faster prototyping, better consistency, smaller CSS |
| **Deployment** | Railway | **Keep Railway** | Works well, MongoDB plugin, env vars handled |

**Why React over Angular for Kiosk UI:**
- **Component Reusability**: Shared components between kiosk, mobile, and admin UIs
- **Animation Libraries**: Framer Motion for delightful kiosk animations (attract mode, success states)
- **Bundle Size**: Vite tree-shaking reduces load time (critical for kiosk boot speed)
- **Developer Experience**: Faster iteration on UI/UX with hot reload
- **Ecosystem**: Better libraries for QR scanning (react-qr-scanner), camera access, NFC web APIs

**Why NOT Rewrite Everything:**
- Express API layer stays intact (reduce risk)
- MongoDB schemas evolve incrementally (no migration hell)
- Socket.io for real-time keeps working (don't break guard dashboards)
- Gradual rollout: New kiosk UI + old admin UI can coexist during transition

---

## Current State Analysis

### Existing System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CURRENT SYSTEM (MEAN Stack)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Angular    │◄────►│ Express API  │◄────►│  MongoDB  │ │
│  │  (compiled)  │      │  (Node.js)   │      │           │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                             │
│         │                      ├─ /api/auth (JWT)           │
│         │                      ├─ /api/visitors (CRUD)      │
│         │                      ├─ /api/visits (tracking)    │
│         │                      └─ /api/guards (mgmt)        │
│         │                                                    │
│  ┌──────────────┐                                           │
│  │  Socket.io   │  (Real-time guard dashboard updates)      │
│  └──────────────┘                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Pain Points Identified

**1. Visitor Experience (Current Flow is Clunky):**
```
Current:  Register → Login → Show QR → Guard scans → Guard enters count → Entry
Time:     30s + variable wait time for guard interaction
Friction: Multiple steps, guard dependency, no pre-arrival option
```

**Ideal Flow:**
```
Proposed: Pre-register (home) → Walk to kiosk → Scan QR → Auto-entry
Time:     5 seconds at kiosk
Friction: Zero (QR code acts as pre-authorized pass)
```

**2. Guard Experience (Too Manual):**
- Current: Guard must manually scan QR, enter visitor count, select gate
- Proposed: Guard monitors dashboard, intervenes only for issues (99% automation)

**3. Security Gaps:**
- **Passwords stored in plaintext** (CRITICAL: Must bcrypt immediately)
- **No session invalidation** on logout
- **No rate limiting** on auth endpoints (brute-force vulnerable)
- **Client-side registration** allows self-provisioning without approval

**4. UX/UI Issues:**
- Compiled Angular app (no source code to modify)
- Auth page separate from main app (inconsistent UX)
- No mobile-optimized kiosk interface
- QR scanning requires photo upload (no live camera stream)

---

## Phase 2: QR Codes + Kiosk Mode + Check-In Database

### 2.1 Database Schema Evolution

**New Collections:**

#### `check_ins` (Replaces current `visits` with enhanced tracking)
```javascript
{
  _id: ObjectId,
  visitor_id: ObjectId,               // FK to visitors
  digital_pass_id: ObjectId,          // FK to digital_passes (pre-approved booking)

  // Entry event
  check_in_time: Date,
  check_in_method: String,            // 'qr_scan', 'nfc_tap', 'manual'
  check_in_gate: String,              // 'main_lobby', 'side_entrance'
  check_in_kiosk_id: String,          // Device identifier

  // Exit event (nullable until checkout)
  check_out_time: Date,
  check_out_method: String,
  check_out_gate: String,
  check_out_kiosk_id: String,

  // Metadata
  party_size: Number,                 // Number of people in group
  host_id: ObjectId,                  // FK to employees (who they're visiting)
  host_notified_at: Date,             // When host was alerted
  purpose: String,                    // 'meeting', 'delivery', 'interview', 'tour'

  // Compliance & audit
  photo_url: String,                  // Visitor photo (captured at registration)
  agreement_signed: Boolean,          // NDA/safety waiver
  temperature_check: Number,          // Optional health screening
  access_level: String,               // 'lobby_only', 'floor_2', 'full_building'

  // Status tracking
  status: String,                     // 'checked_in', 'checked_out', 'overstay', 'flagged'
  duration_minutes: Number,           // Auto-calculated on checkout

  created_at: Date,
  updated_at: Date
}
```

#### `digital_passes` (Pre-arrival booking system)
```javascript
{
  _id: ObjectId,
  pass_code: String,                  // Unique 8-char alphanumeric (e.g., 'HB-A3K9M2')
  qr_data: String,                    // Encrypted JSON payload for QR code

  // Visitor info
  visitor_id: ObjectId,               // FK to visitors (nullable for first-time visitors)
  visitor_name: String,
  visitor_email: String,
  visitor_phone: String,

  // Booking details
  scheduled_date: Date,               // Expected arrival date
  scheduled_time: String,             // Expected arrival time (e.g., '14:00')
  expires_at: Date,                   // Pass valid until (scheduled_date + 24hrs)

  // Host & purpose
  host_id: ObjectId,                  // FK to employees
  host_name: String,
  host_email: String,
  purpose: String,
  notes: String,                      // Special instructions (e.g., 'Park in Lot B')

  // Pass status
  status: String,                     // 'pending', 'active', 'used', 'expired', 'revoked'
  used_at: Date,                      // When QR was scanned for check-in
  check_in_id: ObjectId,              // FK to check_ins (links pass to visit)

  // Digital wallet integration (Phase 3)
  apple_pass_serial: String,          // Apple Wallet serial number
  google_pass_id: String,             // Google Pay pass object ID
  wallet_updated_at: Date,            // Last push notification sent

  created_at: Date,
  updated_at: Date
}
```

**Migration Strategy:**
1. **Add new collections** alongside existing `visits`
2. **Dual-write** during transition (write to both old and new schemas)
3. **Backfill** historical data from `visits` → `check_ins` (one-time script)
4. **Deprecate** old `visits` API after 2 weeks of parallel operation

---

### 2.2 QR Code Generation & Security

**Implementation Plan:**

#### QR Code Payload Structure
```javascript
// Encrypted payload stored in QR code
{
  "v": 1,                           // Schema version
  "pid": "HB-A3K9M2",               // Pass ID (lookup key)
  "exp": 1735689600,                // Expiration timestamp (Unix)
  "sig": "a3f8bc2..."               // HMAC signature (prevent tampering)
}
```

**Why encrypt?**
- Prevent QR code forgery (can't just generate valid-looking codes)
- Hide internal database IDs (security through obscurity adds friction for attackers)
- Enable offline validation (kiosk can verify signature without DB query)

**Library Choice: `qrcode` (current) + `eqrcode_ex` (future enhancement)**
- **Phase 2**: Stick with Node.js `qrcode` library (battle-tested, simple)
- **Phase 3**: Add `eqrcode_ex` for error correction levels (better scanning reliability)

**API Endpoint Design:**

```javascript
// POST /api/digital-passes/create
// Creates a new visitor pass (host-initiated or self-registration)
{
  visitor_email: "jane@example.com",
  visitor_name: "Jane Doe",
  visitor_phone: "+1-555-0100",
  scheduled_date: "2025-01-15",
  scheduled_time: "14:00",
  host_email: "john@hatchbridge.com",
  purpose: "Client meeting"
}

// Response includes QR code data URL + email sent confirmation
{
  pass_id: "HB-A3K9M2",
  qr_code_data_url: "data:image/png;base64,...",
  email_sent: true,
  apple_wallet_url: "https://visit.hatchbridge.com/passes/HB-A3K9M2.pkpass",
  google_wallet_url: "https://pay.google.com/save/..."
}
```

**Email Template (Sent to Visitor):**
```
Subject: Your HatchBridge Visit Pass – [Date]

Hi Jane,

You're all set for your visit to HatchBridge on January 15 at 2:00 PM.

[QR CODE IMAGE]

**What to do when you arrive:**
1. Walk up to the kiosk in the main lobby
2. Scan this QR code (or show it to the greeter)
3. You'll be checked in automatically!

**Add to your phone:**
[Add to Apple Wallet Button]  [Add to Google Pay Button]

Meeting with: John Smith
Purpose: Client meeting

Questions? Reply to this email or call (555) 123-4567.

See you soon!
– The HatchBridge Team
```

---

### 2.3 Kiosk Mode Interface (The Star of the Show)

**UX Flow: Attract → Scan → Success → Reset**

#### Screen 1: Attract Mode (Idle State)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│          [HatchBridge Logo (animated)]          │
│                                                 │
│                                                 │
│         👋  Welcome to HatchBridge!             │
│                                                 │
│         Scan your QR code to check in           │
│                                                 │
│         [Animated QR code icon pulsing]         │
│                                                 │
│         ┌─────────────────────────────┐        │
│         │                             │        │
│         │   [Tap to start scanning]   │        │
│         │                             │        │
│         └─────────────────────────────┘        │
│                                                 │
│         Or enter your email address:            │
│         [Email input field (fallback)]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Design Notes:**
- **Ambient animation**: Logo gently fades in/out, QR icon pulses (2s cycle)
- **Accessibility**: High contrast (dark blue text on cream bg), 24px font minimum
- **Touch targets**: "Tap to start" button is 80px tall, full-width
- **Auto-reset**: Returns to this screen after 10s of inactivity

---

#### Screen 2: Camera Scanning (Active State)
```
┌─────────────────────────────────────────────────┐
│  [< Back]                          [Cancel]     │
│                                                 │
│    ┌─────────────────────────────────────┐    │
│    │                                     │    │
│    │        [Live camera feed]           │    │
│    │                                     │    │
│    │    ┌─────────────────────┐         │    │
│    │    │                     │         │    │
│    │    │   [Scan target      │         │    │
│    │    │    frame overlay]   │         │    │
│    │    │                     │         │    │
│    │    └─────────────────────┘         │    │
│    │                                     │    │
│    └─────────────────────────────────────┘    │
│                                                 │
│         Position QR code in the frame           │
│         [Scanning indicator animation]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Technical Implementation:**
- **Library**: `react-qr-scanner` or `@zxing/browser` (WebRTC camera access)
- **Performance**: 30fps scanning, debounced decode (max 1 attempt per 200ms)
- **Feedback**: Haptic-style flash + sound on successful decode
- **Error handling**: Show "QR code not recognized" after 30s, offer email fallback

---

#### Screen 3: Processing (Loading State)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│                                                 │
│            [Spinner animation]                  │
│                                                 │
│              Checking you in...                 │
│                                                 │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Duration**: 500ms–1500ms (validate pass → create check-in → notify host)

---

#### Screen 4: Success (Confirmation)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│            ✅  Welcome, Jane!                    │
│                                                 │
│         [Visitor photo from registration]       │
│                                                 │
│         Meeting with: John Smith                │
│         Floor 2, Conference Room B              │
│                                                 │
│         John has been notified.                 │
│                                                 │
│         Enjoy your visit! 🎉                    │
│                                                 │
│         [Auto-closes in 5 seconds]              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Delight Factor:**
- Confetti animation (subtle, not obnoxious)
- Personalized greeting (uses visitor name from pass)
- Shows next steps (floor/room number from booking)
- Auto-notification sent to host (SMS/email: "Jane Doe has arrived")

---

#### Screen 5: Error States

**Expired Pass:**
```
┌─────────────────────────────────────────────────┐
│         ⚠️  This pass has expired               │
│                                                 │
│         Please contact your host:               │
│         john@hatchbridge.com                    │
│                                                 │
│         Or register as a new visitor:           │
│         [Scan here to register]                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Duplicate Scan (Already Checked In):**
```
┌─────────────────────────────────────────────────┐
│         ℹ️  You're already checked in!          │
│                                                 │
│         Checked in at: 2:15 PM                  │
│         Meeting with: John Smith                │
│                                                 │
│         Need to check out?                      │
│         [Scan QR again to check out]            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Kiosk Hardware Recommendations

**Phase 2 Setup (Minimal Kiosk):**
- **Device**: iPad Air 11" (portrait mount) or Android tablet (10-11")
- **Mounting**: Wall-mounted lockable enclosure (e.g., ArmorActive)
- **Power**: USB-C power passthrough (always-on, no battery drain)
- **Network**: Hardwired Ethernet preferred (WiFi as fallback)
- **Camera**: Built-in front camera (sufficient for QR scanning)
- **Cost**: ~$500–700 per kiosk (device + mount + config)

**Kiosk Software Configuration:**
- **Browser**: Chromium kiosk mode (Linux) or Safari kiosk mode (iPad)
- **Auto-launch**: Boot directly to https://visit.hatchbridge.com/kiosk
- **Session management**: Clear localStorage every 10s (privacy)
- **Offline mode**: Cache last 100 valid passes (works during internet outage)
- **MDM**: Jamf (iPad) or Fully Kiosk Browser (Android) for remote management

---

## Phase 3: Apple Wallet + Google Pay Integration

### 3.1 Apple Wallet (.pkpass Generation)

**Why Apple Wallet?**
- **Ubiquity**: 70%+ of visitors have iPhones (assumption for corporate visitors)
- **Convenience**: Pass auto-appears on lock screen when near location (geofencing)
- **Security**: Passes can be revoked/updated remotely (via push notifications)
- **Professionalism**: Shows HatchBridge is modern, visitor-centric

**Technical Implementation:**

#### PassKit Web Service Architecture
```
┌──────────────────────────────────────────────────────────┐
│                  Apple PassKit Flow                       │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  1. Visitor clicks "Add to Apple Wallet" in email         │
│     ↓                                                      │
│  2. Browser downloads .pkpass file from our server        │
│     GET /api/passes/apple/HB-A3K9M2.pkpass                │
│     ↓                                                      │
│  3. Our server generates signed .pkpass bundle:           │
│     • pass.json (pass data + barcode)                     │
│     • logo.png, icon.png (HatchBridge branding)           │
│     • manifest.json (file checksums)                      │
│     • signature (PKCS7, signed with Apple cert)           │
│     ↓                                                      │
│  4. Visitor's Wallet app validates signature & adds pass  │
│     ↓                                                      │
│  5. When visitor arrives, pass shows QR code on lock      │
│     screen (geofence trigger: 100m from HatchBridge)      │
│     ↓                                                      │
│  6. Visitor scans QR at kiosk → check-in happens          │
│     ↓                                                      │
│  7. Our server sends push update to pass:                 │
│     "Checked in at 2:15 PM – Floor 2, Conf Room B"        │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

#### pass.json Structure (EventTicket Style)
```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.hatchbridge.visitor",
  "serialNumber": "HB-A3K9M2-1735689600",
  "teamIdentifier": "YOUR_APPLE_TEAM_ID",
  "organizationName": "HatchBridge",
  "description": "HatchBridge Visitor Pass",

  "backgroundColor": "rgb(0, 8, 36)",
  "foregroundColor": "rgb(255, 249, 233)",
  "labelColor": "rgb(255, 196, 33)",
  "logoText": "HatchBridge",

  "eventTicket": {
    "primaryFields": [
      {
        "key": "visitor",
        "label": "VISITOR",
        "value": "Jane Doe"
      }
    ],
    "secondaryFields": [
      {
        "key": "date",
        "label": "DATE",
        "value": "January 15, 2025"
      },
      {
        "key": "time",
        "label": "TIME",
        "value": "2:00 PM"
      }
    ],
    "auxiliaryFields": [
      {
        "key": "host",
        "label": "MEETING WITH",
        "value": "John Smith"
      },
      {
        "key": "location",
        "label": "LOCATION",
        "value": "Floor 2, Conf Room B"
      }
    ],
    "backFields": [
      {
        "key": "instructions",
        "label": "CHECK-IN INSTRUCTIONS",
        "value": "1. Walk to the main lobby\n2. Scan this QR code at the kiosk\n3. You'll be checked in automatically!"
      },
      {
        "key": "contact",
        "label": "QUESTIONS?",
        "value": "reception@hatchbridge.com\n(555) 123-4567"
      }
    ]
  },

  "barcode": {
    "message": "{\"v\":1,\"pid\":\"HB-A3K9M2\",\"exp\":1735689600,\"sig\":\"...\"}",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1"
  },

  "locations": [
    {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "relevantText": "You're near HatchBridge! Your pass is ready."
    }
  ],

  "relevantDate": "2025-01-15T14:00:00-08:00",

  "webServiceURL": "https://visit.hatchbridge.com/api/passes/apple",
  "authenticationToken": "unique-token-per-pass"
}
```

**Node.js Implementation (Using `passkit-generator`):**

```javascript
const { Pass } = require('passkit-generator');
const path = require('path');

async function generateApplePass(digitalPass) {
  const pass = new Pass({
    model: path.resolve(__dirname, '../passkit-templates/visitor.pass'),
    certificates: {
      wwdr: path.resolve(__dirname, '../certs/wwdr.pem'),
      signerCert: path.resolve(__dirname, '../certs/signerCert.pem'),
      signerKey: path.resolve(__dirname, '../certs/signerKey.pem'),
      signerKeyPassphrase: process.env.PASSKIT_KEY_PASSPHRASE
    },
    overrides: {
      serialNumber: `${digitalPass.pass_code}-${Date.now()}`,
      barcodes: {
        message: JSON.stringify({
          v: 1,
          pid: digitalPass.pass_code,
          exp: Math.floor(digitalPass.expires_at.getTime() / 1000),
          sig: generateHMAC(digitalPass.pass_code)
        }),
        format: 'PKBarcodeFormatQR'
      },
      eventTicket: {
        primaryFields: [{ key: 'visitor', value: digitalPass.visitor_name }],
        secondaryFields: [
          { key: 'date', value: formatDate(digitalPass.scheduled_date) },
          { key: 'time', value: digitalPass.scheduled_time }
        ],
        auxiliaryFields: [
          { key: 'host', value: digitalPass.host_name },
          { key: 'location', value: 'Main Lobby' }
        ]
      }
    }
  });

  return pass.getAsBuffer(); // Returns .pkpass ZIP file
}
```

**Web Service Endpoints (Required by Apple):**

1. **Device Registration**: `POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}`
   - Apple Wallet calls this when user adds pass
   - Store device token for push notifications

2. **Get Updated Pass**: `GET /v1/passes/{passTypeIdentifier}/{serialNumber}`
   - Return latest .pkpass if pass was updated
   - Used when Wallet checks for updates

3. **Get Updatable Passes**: `GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}`
   - Return list of passes that have updates
   - Called periodically by Wallet

4. **Unregister Device**: `DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}`
   - User deleted pass from Wallet

**Push Notification Flow (Update Pass After Check-In):**

```javascript
// After visitor checks in at kiosk
async function sendPassUpdate(digitalPass) {
  const apn = require('apn');
  const provider = new apn.Provider({
    token: {
      key: path.resolve(__dirname, '../certs/AuthKey_XXXXX.p8'),
      keyId: process.env.APPLE_KEY_ID,
      teamId: process.env.APPLE_TEAM_ID
    },
    production: true
  });

  // Update pass data in database (e.g., add "Checked in at 2:15 PM")
  await updatePassJSON(digitalPass.apple_pass_serial, {
    backFields: [
      {
        key: 'checkin_status',
        label: 'CHECK-IN STATUS',
        value: `✅ Checked in at ${new Date().toLocaleTimeString()}\nFloor 2, Conference Room B`
      }
    ]
  });

  // Send silent push to Wallet (triggers pass refresh)
  const notification = new apn.Notification();
  notification.topic = 'pass.com.hatchbridge.visitor';
  notification.payload = {}; // Empty payload = silent update

  const devices = await getDeviceTokensForPass(digitalPass.apple_pass_serial);
  await provider.send(notification, devices);
}
```

**Development Requirements:**
- **Apple Developer Account** ($99/year)
- **Pass Type ID** (created in Apple Developer portal)
- **Certificates**: Signing certificate + WWDR intermediate cert
- **Testing**: Install passes on physical iOS device (Simulator doesn't support full Wallet features)

---

### 3.2 Google Pay Pass Integration

**Why Google Pay?**
- **Android coverage**: Remaining 30% of visitors
- **Feature parity**: Visitors shouldn't be disadvantaged based on phone OS
- **Simpler than Apple**: No certificate signing required (JWT-based)

**Technical Implementation:**

#### Google Pay API Flow
```
┌──────────────────────────────────────────────────────────┐
│                  Google Pay Passes Flow                   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  1. Visitor clicks "Add to Google Pay" in email           │
│     ↓                                                      │
│  2. Browser redirects to Google Pay save link:            │
│     https://pay.google.com/save/{JWT}                     │
│     ↓                                                      │
│  3. Our server generates signed JWT containing:           │
│     • Pass object (visitor name, date, time, QR code)     │
│     • Signature (using Google service account key)        │
│     ↓                                                      │
│  4. Google validates JWT, adds pass to user's wallet      │
│     ↓                                                      │
│  5. When visitor arrives, pass shows in Google Pay app    │
│     ↓                                                      │
│  6. Visitor scans QR at kiosk → check-in happens          │
│     ↓                                                      │
│  7. Our server updates pass via Google Pay API:           │
│     PATCH /v1/eventTicketObject/{objectId}                │
│     (Updates status text, e.g., "Checked in at 2:15 PM")  │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

#### Pass Object Definition (EventTicket Class)
```json
{
  "id": "HB-A3K9M2-1735689600",
  "classId": "com.hatchbridge.visitor.event",
  "state": "ACTIVE",

  "eventName": {
    "defaultValue": {
      "language": "en-US",
      "value": "HatchBridge Visitor Pass"
    }
  },

  "logo": {
    "sourceUri": {
      "uri": "https://visit.hatchbridge.com/assets/google-pass-logo.png"
    },
    "contentDescription": {
      "defaultValue": {
        "language": "en-US",
        "value": "HatchBridge Logo"
      }
    }
  },

  "cardTitle": {
    "defaultValue": {
      "language": "en-US",
      "value": "Visitor Pass"
    }
  },

  "header": {
    "defaultValue": {
      "language": "en-US",
      "value": "Jane Doe"
    }
  },

  "subheader": {
    "defaultValue": {
      "language": "en-US",
      "value": "Meeting with John Smith"
    }
  },

  "eventDateTime": {
    "start": "2025-01-15T14:00:00-08:00"
  },

  "venue": {
    "name": {
      "defaultValue": {
        "language": "en-US",
        "value": "HatchBridge – Main Lobby"
      }
    },
    "address": {
      "defaultValue": {
        "language": "en-US",
        "value": "123 Innovation Way, San Francisco, CA 94103"
      }
    }
  },

  "barcode": {
    "type": "QR_CODE",
    "value": "{\"v\":1,\"pid\":\"HB-A3K9M2\",\"exp\":1735689600,\"sig\":\"...\"}",
    "alternateText": "HB-A3K9M2"
  },

  "hexBackgroundColor": "#000824",
  "heroImage": {
    "sourceUri": {
      "uri": "https://visit.hatchbridge.com/assets/google-pass-hero.png"
    }
  }
}
```

**Node.js Implementation (Using Google Auth Library):**

```javascript
const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');

async function generateGooglePassSaveUrl(digitalPass) {
  const credentials = require('../certs/google-service-account.json');

  // Create pass object
  const passObject = {
    id: `${credentials.client_email.split('@')[0]}.${digitalPass.pass_code}`,
    classId: `${credentials.client_email.split('@')[0]}.visitor_event`,
    state: 'ACTIVE',
    eventName: {
      defaultValue: { language: 'en-US', value: 'HatchBridge Visitor Pass' }
    },
    header: {
      defaultValue: { language: 'en-US', value: digitalPass.visitor_name }
    },
    subheader: {
      defaultValue: { language: 'en-US', value: `Meeting with ${digitalPass.host_name}` }
    },
    eventDateTime: {
      start: new Date(digitalPass.scheduled_date + 'T' + digitalPass.scheduled_time).toISOString()
    },
    barcode: {
      type: 'QR_CODE',
      value: JSON.stringify({
        v: 1,
        pid: digitalPass.pass_code,
        exp: Math.floor(digitalPass.expires_at.getTime() / 1000),
        sig: generateHMAC(digitalPass.pass_code)
      })
    },
    hexBackgroundColor: '#000824',
    logo: {
      sourceUri: { uri: 'https://visit.hatchbridge.com/assets/google-pass-logo.png' }
    }
  };

  // Create JWT payload
  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    origins: ['https://visit.hatchbridge.com'],
    typ: 'savetowallet',
    payload: {
      eventTicketObjects: [passObject]
    }
  };

  // Sign JWT with service account private key
  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' });

  // Return Google Pay save URL
  return `https://pay.google.com/gp/v/save/${token}`;
}
```

**Updating Pass After Check-In:**

```javascript
const { google } = require('googleapis');

async function updateGooglePass(digitalPass, checkInData) {
  const auth = new GoogleAuth({
    keyFile: path.resolve(__dirname, '../certs/google-service-account.json'),
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
  });

  const client = await auth.getClient();
  const walletobjects = google.walletobjects({ version: 'v1', auth: client });

  const objectId = `${credentials.client_email.split('@')[0]}.${digitalPass.pass_code}`;

  // Update pass object via API
  await walletobjects.eventticketobject.patch({
    resourceId: objectId,
    requestBody: {
      textModulesData: [
        {
          header: 'CHECK-IN STATUS',
          body: `✅ Checked in at ${checkInData.check_in_time.toLocaleTimeString()}\n${checkInData.check_in_gate}`
        }
      ],
      state: 'COMPLETED' // Changes visual appearance (grayed out)
    }
  });
}
```

**Development Requirements:**
- **Google Cloud Project** (free tier sufficient)
- **Enable Google Wallet API** in Cloud Console
- **Service Account** with Wallet Object Issuer role
- **Issuer Account** (register in Google Pay & Wallet Console)
- **Testing**: Install Google Wallet app on Android device

---

## Phase 4: NFC Hardware Integration

### 4.1 NFC Reader API Design

**Why NFC?**
- **Speed**: Sub-second check-in (tap and go, no camera needed)
- **Reliability**: Works in bright sunlight, damaged phones, no focus required
- **Premium Experience**: Feels like modern transit/hotel systems
- **Accessibility**: Easier for elderly/visually impaired visitors

**Hardware Selection:**

| Option | Device | Price | Pros | Cons |
|--------|--------|-------|------|------|
| **Recommended** | **ACR122U USB NFC Reader** | $40 | Industry standard, PC/SC compatible, well-documented | USB only (requires dedicated PC/Pi) |
| Budget | PN532 NFC Module | $15 | Cheap, Arduino/Pi compatible | Requires custom firmware, less reliable |
| Premium | HID Signo Reader 20 | $200 | Enterprise-grade, tamper-resistant, PoE | Overkill for Phase 1, complex setup |

**Phase 4 Architecture:**

```
┌────────────────────────────────────────────────────────────┐
│                    NFC Check-In Flow                        │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Visitor receives digital pass with NFC tag ID           │
│     (Generated during pass creation, written to phone)      │
│     ↓                                                        │
│  2. Visitor taps phone on NFC reader at entrance            │
│     ↓                                                        │
│  3. Reader hardware sends NFC tag UID to our API:           │
│     POST /api/nfc/check-in                                  │
│     { "tag_uid": "04:A1:B2:C3:D4:E5:F6", "reader_id": "lobby-1" } │
│     ↓                                                        │
│  4. Our server looks up tag_uid → digital_pass              │
│     (tag_uid stored in digital_passes.nfc_tag_uid field)    │
│     ↓                                                        │
│  5. Validate pass (not expired, not already used)           │
│     ↓                                                        │
│  6. Create check_in record, notify host                     │
│     ↓                                                        │
│  7. Send response to reader:                                │
│     { "status": "success", "visitor_name": "Jane Doe" }     │
│     ↓                                                        │
│  8. Reader shows green LED + "Welcome Jane!" on display     │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**NFC Tag UID Storage Strategy:**

**Option A: Use Phone's Native NFC UID (Simpler)**
- Pro: No writing needed, just read phone's existing UID
- Pro: Works with Apple/Google Wallet passes (UID embedded in pass barcode)
- Con: UID changes if user changes phones
- Con: Privacy concern (UID is trackable across apps)

**Option B: Write NDEF Record to Phone (Better UX)**
- Pro: Pass data embedded in NFC tag (works offline)
- Pro: User can tap phone even if wallet app isn't open
- Con: Requires NFC write step during pass creation (extra user friction)
- Con: Not all phones support writing to emulated cards

**Recommendation for Phase 4: Option A (Read-Only)**
- Simpler implementation (no NFC writing required)
- Include phone UID in Apple/Google Wallet barcode payload
- NFC reader extracts UID, sends to API for lookup

---

### 4.2 NFC Reader Hardware Setup

**Bill of Materials (Per Reader):**
- ACR122U NFC Reader: $40
- Raspberry Pi 4 (2GB): $45
- 32GB microSD card: $10
- 5V/3A USB-C power supply: $10
- Optional: Small LCD display (status feedback): $20
- Optional: RGB LED status light: $5
- **Total: ~$130/reader (without display) or ~$155 (with display)**

**Software Stack (Raspberry Pi):**
```bash
# Install libnfc (NFC reader driver)
sudo apt-get install libnfc-bin libnfc-dev

# Install pcscd (PC/SC daemon for smart cards)
sudo apt-get install pcscd

# Test reader
nfc-list
# Should output: "NFC device: ACS ACR122U opened"

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create NFC reader service
npm install nfc-pcsc
```

**Node.js NFC Reader Service:**

```javascript
// nfc-reader-daemon.js
const { NFC } = require('nfc-pcsc');
const axios = require('axios');

const READER_ID = process.env.READER_ID || 'lobby-1';
const API_URL = process.env.API_URL || 'https://visit.hatchbridge.com/api';
const API_KEY = process.env.API_KEY; // Auth token for reader

const nfc = new NFC();

nfc.on('reader', reader => {
  console.log(`${reader.reader.name} detected`);

  reader.on('card', async card => {
    console.log(`Card detected: ${card.uid}`);

    try {
      // Send check-in request to API
      const response = await axios.post(
        `${API_URL}/nfc/check-in`,
        {
          tag_uid: card.uid,
          reader_id: READER_ID
        },
        {
          headers: { Authorization: `Bearer ${API_KEY}` }
        }
      );

      if (response.data.status === 'success') {
        console.log(`✅ Welcome ${response.data.visitor_name}!`);
        // Show green LED / play success sound
        showSuccessFeedback(response.data);
      } else {
        console.log(`❌ Check-in failed: ${response.data.message}`);
        showErrorFeedback(response.data.message);
      }
    } catch (error) {
      console.error('API error:', error.message);
      showErrorFeedback('Connection error');
    }
  });

  reader.on('error', err => {
    console.error('Reader error:', err);
  });

  reader.on('end', () => {
    console.log('Reader removed');
  });
});

// Heartbeat (every 60s, report reader is online)
setInterval(async () => {
  try {
    await axios.post(`${API_URL}/nfc/heartbeat`, {
      reader_id: READER_ID,
      status: 'online'
    }, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
  } catch (error) {
    console.error('Heartbeat failed:', error.message);
  }
}, 60000);

function showSuccessFeedback(data) {
  // GPIO control for LED (green)
  // LCD display update: "Welcome [name]!"
  // Optional: Play success sound via speaker
}

function showErrorFeedback(message) {
  // GPIO control for LED (red)
  // LCD display update: [message]
  // Optional: Play error sound
}
```

**Systemd Service (Auto-start on boot):**

```ini
# /etc/systemd/system/nfc-reader.service
[Unit]
Description=HatchBridge NFC Reader Daemon
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/nfc-reader
Environment="READER_ID=lobby-1"
Environment="API_URL=https://visit.hatchbridge.com/api"
Environment="API_KEY=your-reader-api-key"
ExecStart=/usr/bin/node /home/pi/nfc-reader/nfc-reader-daemon.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable service
sudo systemctl enable nfc-reader
sudo systemctl start nfc-reader

# Check status
sudo systemctl status nfc-reader
```

---

### 4.3 Backend API Endpoints for NFC

**New API Routes:**

```javascript
// POST /api/nfc/check-in
// Handles NFC tap check-in from hardware reader
router.post('/nfc/check-in', authenticateReader, async (req, res) => {
  const { tag_uid, reader_id } = req.body;

  try {
    // Look up digital pass by NFC tag UID
    const digitalPass = await DigitalPass.findOne({
      nfc_tag_uid: tag_uid,
      status: 'active'
    }).populate('visitor_id host_id');

    if (!digitalPass) {
      return res.status(404).json({
        status: 'error',
        message: 'Unknown NFC tag. Please register at the kiosk.'
      });
    }

    // Check if pass is expired
    if (new Date() > digitalPass.expires_at) {
      return res.status(400).json({
        status: 'error',
        message: 'Pass expired. Please contact your host.'
      });
    }

    // Check if already checked in (allow checkout)
    const existingCheckIn = await CheckIn.findOne({
      digital_pass_id: digitalPass._id,
      check_out_time: null
    });

    if (existingCheckIn) {
      // This is a checkout tap
      existingCheckIn.check_out_time = new Date();
      existingCheckIn.check_out_method = 'nfc_tap';
      existingCheckIn.check_out_gate = reader_id;
      existingCheckIn.duration_minutes = Math.round(
        (existingCheckIn.check_out_time - existingCheckIn.check_in_time) / 60000
      );
      existingCheckIn.status = 'checked_out';
      await existingCheckIn.save();

      return res.json({
        status: 'success',
        action: 'checkout',
        visitor_name: digitalPass.visitor_name,
        duration_minutes: existingCheckIn.duration_minutes
      });
    }

    // Create new check-in
    const checkIn = new CheckIn({
      visitor_id: digitalPass.visitor_id,
      digital_pass_id: digitalPass._id,
      check_in_time: new Date(),
      check_in_method: 'nfc_tap',
      check_in_gate: reader_id,
      party_size: 1,
      host_id: digitalPass.host_id,
      status: 'checked_in'
    });
    await checkIn.save();

    // Mark pass as used
    digitalPass.status = 'used';
    digitalPass.used_at = new Date();
    digitalPass.check_in_id = checkIn._id;
    await digitalPass.save();

    // Send notification to host (async, don't wait)
    notifyHost(digitalPass.host_id, {
      visitor_name: digitalPass.visitor_name,
      check_in_time: checkIn.check_in_time,
      gate: reader_id
    });

    // Update Apple/Google Wallet pass (async)
    updateDigitalWalletPass(digitalPass, checkIn);

    res.json({
      status: 'success',
      action: 'checkin',
      visitor_name: digitalPass.visitor_name,
      host_name: digitalPass.host_name,
      instructions: 'Floor 2, Conference Room B'
    });

  } catch (error) {
    console.error('NFC check-in error:', error);
    res.status(500).json({
      status: 'error',
      message: 'System error. Please use kiosk.'
    });
  }
});

// POST /api/nfc/heartbeat
// NFC reader health monitoring
router.post('/nfc/heartbeat', authenticateReader, async (req, res) => {
  const { reader_id, status } = req.body;

  await NFCReader.findOneAndUpdate(
    { reader_id },
    {
      last_heartbeat: new Date(),
      status: status,
      online: status === 'online'
    },
    { upsert: true }
  );

  res.json({ status: 'ok' });
});

// Middleware to authenticate NFC reader devices
function authenticateReader(req, res, next) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');

  if (!apiKey || !process.env.NFC_READER_API_KEYS.includes(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized reader' });
  }

  next();
}
```

**Admin Dashboard – Reader Management:**

Add new page: `/admin/nfc-readers`

Features:
- List all registered NFC readers
- Show online/offline status (based on heartbeat)
- View recent check-ins per reader
- Deactivate/reactivate readers
- Generate new API keys for readers

---

## Implementation Roadmap: Founding Team Perspective

### Sprint 1-2: Foundation & Security (Week 1-2)

**Engineering Focus:**
1. **CRITICAL: Fix Security Issues** ⚠️
   - Hash all passwords with bcrypt (visitors, guards, admins)
   - Add rate limiting to auth endpoints (express-rate-limit)
   - Implement refresh tokens (extend session without re-login)
   - Add CSRF protection for state-changing operations
   - Audit all API endpoints for authorization checks

2. **Database Migration Planning**
   - Create `check_ins` and `digital_passes` schemas
   - Write migration script for existing `visits` → `check_ins`
   - Set up dual-write mode (write to both old and new schemas)

3. **Development Environment**
   - Set up React + Vite project for new kiosk UI
   - Install TailwindCSS, Framer Motion, react-qr-scanner
   - Create component library (Button, Card, Input matching HatchBridge theme)

**UX Focus:**
1. **Kiosk UI Mockups**
   - Design all 5 screens (Attract, Scan, Processing, Success, Error)
   - Create micro-interaction specs (animations, transitions, timings)
   - Design email templates for digital passes

2. **User Research** (if possible)
   - Interview 5 visitors about current check-in experience
   - Identify pain points and delight opportunities
   - Validate kiosk flow with paper prototypes

**Deliverables:**
- ✅ All passwords hashed, rate limiting enabled
- ✅ New database schemas deployed (dual-write mode active)
- ✅ React kiosk UI skeleton running locally
- ✅ Figma designs for kiosk screens approved

---

### Sprint 3-4: Kiosk MVP (Week 3-4)

**Engineering Focus:**
1. **QR Code Generation**
   - Build `POST /api/digital-passes/create` endpoint
   - Implement HMAC signature for QR payloads
   - Generate QR code images (PNG data URLs)
   - Create email service (Nodemailer or SendGrid)

2. **Kiosk Check-In Flow**
   - Build React kiosk UI (all 5 screens)
   - Integrate react-qr-scanner (camera access)
   - Implement `POST /api/kiosk/scan` endpoint
   - Add success/error animations (Framer Motion)

3. **Host Notifications**
   - Email notification when visitor arrives
   - Optional: SMS via Twilio (if budget allows)

**UX Focus:**
1. **Visual Polish**
   - Implement HatchBridge theme (colors, fonts, spacing)
   - Add confetti animation on successful check-in
   - Create ambient "attract mode" animation
   - Test on actual tablet (iPad or Android)

2. **Email Template Design**
   - HTML email with embedded QR code
   - Clear CTA ("Add to Wallet" buttons for Phase 3)
   - Mobile-responsive layout

**Deliverables:**
- ✅ Visitors can pre-register and receive QR code via email
- ✅ Kiosk UI scans QR codes and checks visitors in
- ✅ Hosts receive email when visitor arrives
- ✅ Kiosk deployed on test iPad in office

---

### Sprint 5-6: Apple Wallet + Google Pay (Week 5-6)

**Engineering Focus:**
1. **Apple Wallet**
   - Set up Apple Developer account, create Pass Type ID
   - Generate signing certificates
   - Build .pkpass generation (passkit-generator)
   - Implement PassKit web service endpoints
   - Test push notifications (update pass after check-in)

2. **Google Pay**
   - Set up Google Cloud project, enable Wallet API
   - Create service account, register issuer
   - Build JWT-based save URL generation
   - Implement pass update via API (after check-in)

3. **Integration**
   - Add "Add to Apple Wallet" / "Add to Google Pay" buttons to email
   - Update kiosk to handle wallet-based QR codes
   - Test full flow (email → add to wallet → tap at kiosk → pass updates)

**UX Focus:**
1. **Pass Design**
   - Design Apple Wallet pass layout (colors, fields, logo)
   - Design Google Pay pass layout (hero image, card title)
   - Ensure branding consistency with kiosk/email

2. **User Testing**
   - Test with 5 iPhone users, 5 Android users
   - Measure time-to-add-pass, check-in duration
   - Collect feedback on pass clarity and UX

**Deliverables:**
- ✅ Visitors can add pass to Apple Wallet
- ✅ Visitors can add pass to Google Pay
- ✅ Passes auto-update after check-in
- ✅ End-to-end flow tested on iOS and Android

---

### Sprint 7-8: NFC Hardware (Week 7-8)

**Engineering Focus:**
1. **NFC Reader Setup**
   - Purchase ACR122U readers, Raspberry Pi kits
   - Install libnfc, configure pcscd
   - Build Node.js NFC reader daemon
   - Set up systemd service (auto-start on boot)

2. **Backend API**
   - Build `POST /api/nfc/check-in` endpoint
   - Implement reader authentication (API keys)
   - Add NFC UID lookup in `digital_passes`
   - Build `POST /api/nfc/heartbeat` for monitoring

3. **Admin Dashboard**
   - Create `/admin/nfc-readers` page
   - Show reader status (online/offline)
   - Display recent check-ins per reader
   - Generate/revoke reader API keys

**UX Focus:**
1. **Physical Installation**
   - Mount NFC reader near entrance (accessible height)
   - Add signage: "Tap your phone here to check in"
   - Optional: Add LCD display for feedback ("Welcome Jane!")

2. **User Testing**
   - Test NFC tap-to-check-in with iPhone and Android
   - Measure check-in speed (target: <2 seconds)
   - Verify reliability (100 taps, measure success rate)

**Deliverables:**
- ✅ NFC reader deployed at main entrance
- ✅ Visitors can check in via NFC tap
- ✅ Admin dashboard shows reader health
- ✅ NFC check-in success rate >95%

---

### Ongoing: Iteration & Optimization

**Post-Launch Monitoring:**
- Track check-in times (median, p95, p99)
- Monitor QR scan failure rate (kiosk)
- Monitor NFC tap failure rate
- Collect visitor feedback (optional survey after checkout)

**Future Enhancements (Phase 5+):**
- **Recurring Visitor Recognition**: Auto-fill registration for returning visitors
- **Badge Printing**: Integrate with Zebra/Dymo printer (physical badges)
- **Analytics Dashboard**: Visitor trends, peak hours, average visit duration
- **Multi-Location Support**: Different kiosks, different offices
- **Integration with Calendar**: Auto-create passes from Outlook/Google Calendar invites
- **Facial Recognition**: Optional for high-security areas (ethical considerations)

---

## Summary: The Transformation

### Before (Current State)
```
Visitor arrives → Guard greets → Visitor registers on phone →
Visitor logs in → Shows QR to guard → Guard manually scans →
Guard enters details → Visitor enters
Time: 2-5 minutes | Friction: High | Delight: Low
```

### After (Phase 2-4 Complete)
```
Visitor receives email at home → Adds pass to wallet →
Walks to entrance → Taps phone on NFC reader → Auto-checked in
Time: 3 seconds | Friction: Zero | Delight: High
```

---

## Key Design Principles for Execution

1. **Ship Incrementally**: Phase 2 delivers value alone (don't wait for NFC)
2. **Preserve What Works**: Don't rewrite Express API, don't migrate MongoDB unnecessarily
3. **Prioritize Visitor Experience**: Every decision optimizes for <10 second check-in
4. **Maintain Brand**: HatchBridge warmth (cream/yellow/blue) in every pixel
5. **Build for Scale**: Database schema supports multi-location from day 1 (even if UI doesn't)
6. **Security First**: Bcrypt passwords before shipping kiosk (non-negotiable)
7. **Test on Real Hardware**: Kiosk feels different on iPad vs laptop (test early)
8. **Delight > Features**: Confetti animation > analytics dashboard (Phase 1)

---

## Questions for Product Decisions

Before implementation, clarify:

1. **Pre-Arrival Flow**: Can visitors self-register, or must hosts invite them?
   - *Self-registration*: Open to anyone, spam risk
   - *Host-invited only*: Gated, requires host to send invite

2. **Check-Out Required?**: Must visitors check out, or auto-expire after 12 hours?
   - *Required*: Ensures accurate "who's in building" for emergencies
   - *Auto-expire*: Simpler UX, less accurate

3. **Photo Capture**: Mandatory during registration for security?
   - *Yes*: Guards can verify identity visually
   - *No*: Faster registration, less privacy concern

4. **Badge Printing**: Physical badge required, or digital pass sufficient?
   - *Physical*: Visible to all employees, traditional
   - *Digital*: Modern, eco-friendly, lower cost

5. **Multi-Location**: Single office or plan for multiple HatchBridge sites?
   - *Single*: Simpler schema, faster to ship
   - *Multi*: Add `location_id` to all tables now (prevents migration later)

---

**Next Steps**: Review this plan, answer product questions, then prioritize Sprint 1 tasks. Engineering and UX should pair on kiosk UI from day 1 (don't design in isolation).

Let's build something delightful. 🎉
