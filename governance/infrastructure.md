# Infrastructure

## Hosting

| Component | Provider | Details |
|-----------|----------|---------|
| Application | Railway | NIXPACKS builder, auto-deploy from `master` |
| Database | Supabase | Managed PostgreSQL with Realtime |
| DNS | External | `visit.hatchbridge.com` → Railway |
| TLS | Railway | Automatic certificate management |

## Railway Configuration

**File**: `railway.json`

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

| Setting | Value | Notes |
|---------|-------|-------|
| Builder | NIXPACKS | Auto-detects Node.js, installs deps, builds |
| Start command | `npm run start` | Runs `next start` |
| Health check | `GET /` | Railway pings root path |
| Restart policy | ON_FAILURE | Auto-restart on crash |
| Max retries | 10 | Stops restarting after 10 consecutive failures |

## Environment Variables

### Required

| Variable | Description | Example | Sensitive? |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_SITE_URL` | Public URL of the application | `https://visit.hatchbridge.com` | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xsqceqlrdermlwtlfkng.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-side, RLS-constrained) | `eyJ...` | Low |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | `eyJ...` | **Yes** |
| `WEBAUTHN_RP_ID` | WebAuthn Relying Party ID (domain) | `visit.hatchbridge.com` | No |
| `WEBAUTHN_RP_NAME` | WebAuthn Relying Party display name | `HatchBridge Visitor` | No |
| `WEBAUTHN_ORIGIN` | WebAuthn origin URL (must match browser origin) | `https://visit.hatchbridge.com` | No |

### Required (with insecure default)

| Variable | Description | Default | Sensitive? |
|----------|-------------|---------|------------|
| `ADMIN_PASSWORD` | Password for admin dashboard login | `ovpr-1963` | **Yes** |

**Warning**: If `ADMIN_PASSWORD` is not set in the environment, the hardcoded default is used. Always set this in production.

### Optional (Notifications)

| Variable | Description | Sensitive? |
|----------|-------------|------------|
| `RESEND_API_KEY` | Resend API key for email notifications | **Yes** |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS | **Yes** |
| `TWILIO_AUTH_TOKEN` | Twilio auth token for SMS | **Yes** |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number | No |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | **Yes** |

### Optional (Wallet Passes — not currently active)

| Variable | Description |
|----------|-------------|
| `APPLE_PASS_TYPE_ID` | Apple pass type identifier |
| `APPLE_TEAM_ID` | Apple developer team ID |
| `APPLE_WWDR_CERT` | Base64-encoded WWDR certificate |
| `APPLE_SIGNER_CERT` | Base64-encoded signer certificate |
| `APPLE_SIGNER_KEY` | Base64-encoded signer private key |
| `APPLE_SIGNER_KEY_PASSPHRASE` | Passphrase for signer key |
| `QR_SIGNING_SECRET` | Secret for signing QR code payloads |

## Where Variables Are Set

- **Production**: Railway dashboard → project → Variables tab
- **Local development**: `.env.local` file (copy from `.env.example`)
- **CI/CD**: Not configured (Railway handles builds)

## Supabase Configuration

| Property | Value |
|----------|-------|
| Project URL | `https://xsqceqlrdermlwtlfkng.supabase.co` |
| Region | (set during project creation) |
| Database | PostgreSQL 15+ |
| Realtime | Enabled (used for kiosk live updates) |
| RLS | Enabled on `locations` table; other tables rely on service role |

### Access Patterns

| Context | Key Used | Capabilities |
|---------|----------|-------------|
| Browser client (`src/lib/supabase/client.ts`) | Anon key | Read active locations only (RLS-constrained) |
| Server API routes (`src/lib/supabase/server.ts`) | Service role key | Full read/write access, bypasses RLS |
| Supabase Realtime (kiosk) | Anon key | Subscribe to `check_ins` INSERT events |

### Backups

- Supabase provides automatic daily backups on Pro plan
- Point-in-time recovery available on Pro plan
- **No manual backup verification process is documented**
- **Recommendation**: Periodically test backup restoration

## Build Process

```bash
# Install dependencies
npm install

# Build for production (Next.js)
npm run build
# Outputs to .next/ directory

# Start production server
npm start
# Runs: next start (default port 3000)
```

**Node.js requirement**: >=20.9.0 (specified in `package.json` engines)

## Network Architecture

```
[Visitor Phone]
      │
      │ HTTPS (TLS)
      ▼
[Railway Load Balancer]
      │
      ▼
[Next.js Application Server]
      │
      ├── HTTPS → [Supabase API] (database queries)
      ├── WSS  → [Supabase Realtime] (kiosk subscriptions)
      ├── HTTPS → [Resend API] (optional email)
      ├── HTTPS → [Twilio API] (optional SMS)
      └── HTTPS → [Slack Webhook] (optional notifications)
```

| Connection | Protocol | Encryption |
|------------|----------|------------|
| Client → Railway | HTTPS | TLS (Railway-managed cert) |
| App → Supabase | HTTPS | TLS (Supabase-managed) |
| App → Supabase Realtime | WSS | TLS |
| App → Resend | HTTPS | TLS |
| App → Twilio | HTTPS | TLS |
| App → Slack | HTTPS | TLS |

## Scaling Considerations

| Concern | Current State | Notes |
|---------|--------------|-------|
| Horizontal scaling | Single instance | Railway supports scaling; WebAuthn in-memory challenges prevent multi-instance |
| Database connections | Supabase connection pooling | PgBouncer managed by Supabase |
| Realtime connections | Supabase-managed | One connection per kiosk tab |
| Static assets | Next.js built-in | Served by same process |
| CDN | Not configured | Railway does not include CDN; consider Cloudflare |

**Blocker for horizontal scaling**: WebAuthn challenges are stored in an in-memory `Map`. Multiple instances would not share challenge state. Must migrate to database or Redis before scaling beyond one instance.

## Monitoring

**Current state**: No application-level monitoring.

| What | Status |
|------|--------|
| Error tracking (Sentry, etc.) | Not configured |
| APM (performance monitoring) | Not configured |
| Uptime monitoring | Not configured |
| Log aggregation | Railway dashboard only |
| Alerting | Not configured |

**Recommendation**: At minimum, add uptime monitoring (e.g., UptimeRobot) and error tracking (e.g., Sentry free tier).
