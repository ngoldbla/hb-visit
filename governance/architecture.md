# Architecture

## System Overview

HatchBridge Visitor Check-in is a full-stack web application that enables frictionless visitor check-ins at the HatchBridge Incubator using NFC tap technology. Returning visitors tap an NFC sticker and are checked in instantly (~1 second, zero interaction). The system tracks streaks, awards badges, and displays real-time celebrations on a lobby kiosk.

**Production URL**: https://visit.hatchbridge.com

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4 |
| Database | Supabase (PostgreSQL) | — |
| Real-time | Supabase Realtime | — |
| Auth (visitors) | WebAuthn via @simplewebauthn | 13.2.2 |
| Auth (admin) | Cookie-based password auth | — |
| Animations | Framer Motion | 12.25.0 |
| UI Components | Radix UI | various |
| Hosting | Railway | — |
| Email (optional) | Resend | 6.7.0 |
| SMS (optional) | Twilio | — |
| Notifications (optional) | Slack Webhooks | — |

## Directory Structure

```
src/
├── app/                           # Next.js App Router pages and API routes
│   ├── (kiosk)/                   # Lobby kiosk display (attract mode, celebrations)
│   │   ├── page.tsx               # Main kiosk with Supabase Realtime subscription
│   │   └── layout.tsx
│   ├── admin/                     # Protected admin dashboard
│   │   ├── page.tsx               # Dashboard with stats and charts
│   │   ├── activities/            # Activity management
│   │   ├── activity-reports/      # Activity analytics
│   │   ├── checkins/              # Check-in history
│   │   ├── community/             # Community goals
│   │   ├── locations/             # Location management
│   │   ├── members/               # Member management
│   │   ├── quotes/                # Kiosk quote management
│   │   ├── settings/              # Admin settings
│   │   └── login/                 # Admin login page
│   ├── tap/                       # NFC tap entry point
│   │   ├── page.tsx               # Auto check-in or redirect to register
│   │   └── register/              # First-time visitor registration form
│   ├── stats/                     # Public statistics page
│   ├── passes/lookup/             # Look up visitor passes by email
│   └── api/                       # API route handlers
│       ├── tap/                   # Check-in and registration endpoints
│       ├── auth/passkey/          # WebAuthn passkey registration and authentication
│       ├── admin/                 # Protected admin CRUD endpoints
│       └── stats/                 # Public stats endpoint
├── components/
│   ├── kiosk/                     # Kiosk-specific UI (attract mode, success screen, particles)
│   └── ui/                        # Shared Radix-based UI components
├── lib/
│   ├── supabase/                  # Supabase client (browser + server) and type definitions
│   ├── auth/                      # Device token and passkey utilities
│   ├── validation/                # Name moderation and input filtering
│   ├── audio/                     # Sound effects and haptic feedback
│   ├── holidays/                  # Holiday calendar and seasonal theming
│   ├── badges.ts                  # Badge definitions and earning logic
│   ├── nicknames.ts               # Personality nickname generator
│   └── utils.ts                   # General utilities (cn, classnames)
├── hooks/
│   └── use-mobile.ts              # Mobile device detection
└── middleware.ts                   # Admin route protection
```

## Client / Server Boundary

| Concern | Runs on | How |
|---------|---------|-----|
| Kiosk UI, animations, attract mode | Client | React components with Framer Motion |
| NFC tap detection, token storage | Client | Browser localStorage + URL params |
| Passkey creation / authentication prompts | Client | `@simplewebauthn/browser` |
| Real-time check-in feed | Client | Supabase Realtime subscription |
| Check-in validation, streak calculation | Server | API routes with Supabase service role |
| Passkey challenge generation / verification | Server | `@simplewebauthn/server` |
| Admin auth, CRUD operations | Server | API routes with cookie validation |
| Badge awarding, community goal updates | Server | Check-in API route |
| CSV exports | Server | API routes generating download responses |

**Supabase access**:
- **Client-side**: Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` — read-only access constrained by Row-Level Security (RLS).
- **Server-side**: Uses `SUPABASE_SERVICE_ROLE_KEY` — full access, bypasses RLS. Used in all API routes.

## Third-Party Integrations

| Service | Purpose | Required? | Config |
|---------|---------|-----------|--------|
| **Supabase** | PostgreSQL database + Realtime subscriptions | Yes | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **SimpleWebAuthn** | WebAuthn/passkey registration and authentication | Yes | `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN` |
| **Resend** | Email notifications to hosts when visitors arrive | No | `RESEND_API_KEY` |
| **Twilio** | SMS notifications to hosts | No | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| **Slack** | Webhook notifications to a Slack channel | No | `SLACK_WEBHOOK_URL` |
| **Hebcal** | Jewish/secular holiday calendar for kiosk theming | No (bundled) | None |
| **QRCode.react** | Client-side QR code generation for kiosk display | No (bundled) | None |

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/tap/checkin/route.ts` | Core check-in logic: token validation, streak calc, badge awards, overtap detection |
| `src/app/api/tap/register/route.ts` | New visitor registration: creates member + device token |
| `src/lib/auth/tokens.ts` | Device token creation, validation, UUID generation |
| `src/lib/auth/passkey.ts` | WebAuthn challenge generation, credential verification |
| `src/lib/validation/name-moderation.ts` | Profanity filter, injection detection, XSS prevention |
| `src/lib/supabase/types.ts` | TypeScript types for all database tables |
| `src/lib/supabase/server.ts` | Server-side Supabase client (service role) |
| `src/lib/supabase/client.ts` | Browser-side Supabase client (anon key) |
| `src/middleware.ts` | Admin route protection via cookie check |
| `src/app/(kiosk)/page.tsx` | Kiosk page with Realtime subscription for live check-in feed |
| `src/lib/badges.ts` | Badge definitions (streak, milestone, time-based) |
| `railway.json` | Railway deployment configuration |
| `.env.example` | Environment variable template |
