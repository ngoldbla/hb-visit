# HatchBridge Visitor Check-in

A modern visitor check-in system with NFC tap-to-check-in, passkey authentication, and Apple/Google Wallet pass support.

**Live at:** https://visit.hatchbridge.com

## Features

- **Instant NFC Check-in**: Returning visitors tap any NFC sticker and are checked in instantly (~1 second, zero interaction)
- **Passkey Authentication**: Secure WebAuthn/Face ID backup when device token is cleared
- **Wallet Passes**: Apple Wallet and Google Wallet pass generation
- **Real-time Kiosk Updates**: Kiosk celebrates when visitors check in from anywhere in the building
- **QR Code Fallback**: Traditional QR scanning for visitors with passes

## User Flows

### First Visit (Registration)

```
[Tap NFC Sticker]
       ↓
[Phone opens /tap?loc=lobby]
       ↓
[No token found → redirect to registration]
       ↓
[Enter: name, email, phone (optional)]
       ↓
[Create passkey (Face ID prompt)]
       ↓
[Store localStorage token]
       ↓
[Checked in! Offer wallet pass]
```

### Return Visit (Instant)

```
[Tap NFC Sticker]
       ↓
[Phone opens /tap?loc=elevator]
       ↓
[Token found in localStorage]
       ↓
[Auto-send to server → validate → check in]
       ↓
[Show: "Welcome back, Jane!"]

Total time: ~1 second, ZERO user interaction
```

### Fallback (Token Lost)

```
[Tap NFC Sticker]
       ↓
[No token found]
       ↓
[Trigger passkey authentication]
       ↓
[Face ID prompt → authenticated]
       ↓
[Re-store token for next time]
       ↓
[Checked in!]
```

## Architecture

### Authentication Strategy

| Method | Role | When Used | Biometric? |
|--------|------|-----------|------------|
| localStorage token | Primary | 95% of check-ins | Never |
| Passkey (WebAuthn) | Backup | When token cleared | Once to restore |
| Email lookup | Fallback | No token, no passkey | Never |

### Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Auth**: WebAuthn via @simplewebauthn
- **Wallet Passes**: passkit-generator (Apple), JWT (Google)
- **Hosting**: Railway

## Pages

| Route | Description |
|-------|-------------|
| `/` | Kiosk attract mode with NFC instructions and QR scanner |
| `/tap` | NFC tap entry point - auto check-in or redirect to register |
| `/tap/register` | First-time visitor registration form |
| `/passes/lookup` | Look up existing passes by email |
| `/admin` | Admin dashboard |
| `/admin/passes` | Manage visitor passes |
| `/admin/checkins` | View check-in history |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tap/checkin` | POST | Check in with device token |
| `/api/tap/register` | POST | Register new visitor and get token |
| `/api/auth/passkey/register` | GET/POST | Passkey registration |
| `/api/auth/passkey/authenticate` | GET/POST | Passkey authentication |
| `/api/wallet/apple/[passId]` | GET | Generate Apple Wallet pass |
| `/api/wallet/google/[passId]` | GET | Generate Google Wallet pass |

## Database Tables

| Table | Purpose |
|-------|---------|
| `device_tokens` | localStorage tokens for instant check-in |
| `passkey_credentials` | WebAuthn credentials for backup auth |
| `passes` | Visitor passes with QR codes |
| `check_ins` | Check-in records with location |
| `members` | Registered members |
| `host_preferences` | Notification preferences (email/SMS/Slack) |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- NFC stickers (NTAG215 recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/ngoldbla/hb-visit.git
cd hb-visit

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://visit.hatchbridge.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WebAuthn / Passkeys
WEBAUTHN_RP_ID=visit.hatchbridge.com
WEBAUTHN_RP_NAME=HatchBridge Visitor
WEBAUTHN_ORIGIN=https://visit.hatchbridge.com

# Apple Wallet
APPLE_PASS_TYPE_ID=pass.com.hatchbridge.visitor
APPLE_TEAM_ID=your-apple-team-id
APPLE_WWDR_CERT=base64-encoded-wwdr-certificate
APPLE_SIGNER_CERT=base64-encoded-signer-certificate
APPLE_SIGNER_KEY=base64-encoded-signer-private-key
APPLE_SIGNER_KEY_PASSPHRASE=optional-passphrase

# QR Code Signing
QR_SIGNING_SECRET=your-qr-signing-secret

# Notifications (Optional)
RESEND_API_KEY=your-resend-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
```

## NFC Sticker Setup

### Recommended Stickers

- **Type**: NTAG215 or NTAG216
- **Size**: 25mm round or 30x15mm rectangular
- **Cost**: $0.30-1.00 each in bulk
- **Vendors**: Amazon, AliExpress, GoToTags

### Programming Stickers

Use the NFC Tools app (iOS/Android) to write URLs:

```
https://visit.hatchbridge.com/tap?loc=lobby-main
https://visit.hatchbridge.com/tap?loc=elevator-1
https://visit.hatchbridge.com/tap?loc=conf-room-a
https://visit.hatchbridge.com/tap?loc=parking-entrance
```

### Placement Recommendations

- Main lobby entrance (prominent, with signage)
- Elevator banks
- Conference room doors
- Reception desk
- Parking garage entrance

## Deployment

### Railway (Current)

The app is deployed on Railway with automatic deployments from the `master` branch.

```bash
# Link to Railway project
railway link

# Check status
railway status

# View logs
railway logs

# Set environment variables
railway variables --set "KEY=value"
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Development

### Project Structure

```
src/
├── app/
│   ├── (kiosk)/          # Kiosk pages (attract mode, scanner)
│   ├── admin/            # Admin dashboard
│   ├── api/              # API routes
│   │   ├── auth/         # Passkey authentication
│   │   ├── tap/          # NFC check-in endpoints
│   │   └── wallet/       # Wallet pass generation
│   ├── passes/           # Public pass lookup
│   └── tap/              # NFC tap entry and registration
├── components/
│   ├── kiosk/            # Kiosk UI components
│   └── ui/               # Shared UI components
└── lib/
    ├── auth/             # Token and passkey utilities
    ├── supabase/         # Supabase client and types
    └── wallet/           # Wallet pass generation
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth/tokens.ts` | Device token generation and validation |
| `src/lib/auth/passkey.ts` | WebAuthn passkey utilities |
| `src/app/tap/page.tsx` | NFC tap entry point |
| `src/app/tap/register/page.tsx` | Visitor registration form |
| `src/app/(kiosk)/page.tsx` | Kiosk with Realtime subscription |
| `src/components/kiosk/attract-mode.tsx` | Kiosk attract screen |

## Testing

### Manual Testing Checklist

- [ ] First-time registration: tap → form → passkey → token stored
- [ ] Return check-in: tap → instant check-in (no interaction)
- [ ] Token fallback: clear localStorage → passkey auth → token restored
- [ ] Email fallback: no token, no passkey → email entry works
- [ ] Kiosk updates: check-in from elevator → kiosk shows welcome
- [ ] QR scanning still works as backup
- [ ] Multiple locations: different stickers tracked correctly

### Test Scenarios

1. Program NFC sticker with `/tap?loc=test`
2. Tap with phone → should show registration
3. Register → should create passkey + store token
4. Tap again → should instantly check in (no prompts)
5. Check kiosk → should show welcome message

## License

Private - HatchBridge
