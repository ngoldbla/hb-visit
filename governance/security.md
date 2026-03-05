# Security

This document describes all authentication, authorization, and security mechanisms in the system, along with known gaps and recommended mitigations.

## Authentication Mechanisms

### 1. Device Tokens (Visitor Check-in)

**Source**: `src/lib/auth/tokens.ts`

| Property | Value |
|----------|-------|
| Token format | UUID v4 (`crypto.randomUUID()`) |
| Storage | Browser `localStorage` key: `hb_visitor_token` |
| Transmission | HTTP header: `X-Visitor-Token` |
| Validation | UUID regex check + database lookup (`device_tokens` table) |
| Expiration | None (tokens never expire) |
| Revocation | Set `is_active=false` in database |

**Flow**: Token is generated at registration, stored client-side, and sent with every check-in request. Server validates the token exists in the database and is active.

### 2. WebAuthn Passkeys (Visitor Backup Auth)

**Source**: `src/lib/auth/passkey.ts`

| Property | Value |
|----------|-------|
| Library | `@simplewebauthn/server` v13.2.2 (server), `@simplewebauthn/browser` v13.2.2 (client) |
| Attestation type | `"none"` (no authenticator verification) |
| User verification | `"preferred"` (not required) |
| Authenticator attachment | `"platform"` (native authenticators only: Face ID, Touch ID) |
| Resident key | `"preferred"` (allows discoverable credentials) |
| Challenge storage | In-memory `Map` (lost on server restart) |
| RP ID | `WEBAUTHN_RP_ID` env var (e.g., `visit.hatchbridge.com`) |
| RP Origin | `WEBAUTHN_ORIGIN` env var |

**Flow**: When a visitor's device token is lost, they authenticate via Face ID/Touch ID. On success, a new device token is generated and stored.

### 3. Admin Password Authentication

**Source**: `src/app/api/admin/auth/route.ts`, `src/middleware.ts`

| Property | Value |
|----------|-------|
| Password source | `ADMIN_PASSWORD` env var |
| Default password | `"ovpr-1963"` (hardcoded fallback) |
| Session mechanism | Cookie: `hb-admin-auth` = `"authenticated"` |
| Cookie flags | `httpOnly: true`, `secure: true` (prod), `sameSite: "lax"` |
| Session duration | 7 days (`maxAge: 60 * 60 * 24 * 7`) |
| Route protection | Middleware checks cookie on all `/admin/*` routes except `/admin/login` |

## Authorization Model

| Role | Mechanism | Access |
|------|-----------|--------|
| Visitor | Device token or passkey | Check-in, view own success screen |
| Public | None | View `/stats` page, scan QR codes |
| Admin | Password cookie | Full CRUD on all resources, data export, data reset |

**There is no granular RBAC**. Admin access is all-or-nothing. All admins share a single password.

### Supabase Row-Level Security (RLS)

| Table | Policy | Effect |
|-------|--------|--------|
| `locations` | `SELECT` for `anon` role WHERE `is_active=true` | Public can read active locations |
| `locations` | Full access for `authenticated` role | Admins can CRUD |
| Other tables | No RLS policies defined | Access controlled by API routes using service role key |

**Important**: API routes use the Supabase **service role key**, which bypasses all RLS policies. Security is enforced at the application layer (middleware + route handlers), not at the database layer.

## Input Validation

### Name Moderation

**Source**: `src/lib/validation/name-moderation.ts`

Comprehensive validation applied during registration:

| Check | Description |
|-------|-------------|
| Length | 2-100 characters |
| Unicode letters | Must contain at least one Unicode letter |
| Profanity filter | 123+ blocked terms with whole-word matching |
| Leetspeak normalization | Converts `1→i`, `3→e`, `0→o`, `4→a`, `5→s`, `7→t`, `8→b`, `@→a` before checking |
| SQL injection | Regex patterns for `UNION SELECT`, `DROP TABLE`, `OR '1'='1'`, etc. |
| XSS prevention | Blocks `<`, `>`, `"`, `'`, `;`, and control characters `\x00-\x1F` |
| Dangerous characters | Pre-normalization check for `< > " ' ; \` and null bytes |

### Email Validation

- Client-side: HTML5 `type="email"` input
- Server-side: Lowercase normalization
- **Gap**: No server-side email format validation (regex or library)

### Token Validation

- Strict UUID regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- Database lookup with `is_active=true` check

## Session Management

### Admin Sessions

| Property | Value |
|----------|-------|
| Cookie name | `hb-admin-auth` |
| Cookie value | `"authenticated"` (static string, no session ID) |
| HttpOnly | Yes |
| Secure | Yes (production only) |
| SameSite | Lax |
| Max age | 7 days |
| Logout | Cookie cleared via DELETE `/api/admin/auth` |

### Visitor Sessions

| Property | Value |
|----------|-------|
| Storage | `localStorage` (key: `hb_visitor_token`) |
| Value | UUID string |
| Expiration | None |
| Invalidation | Admin deactivates member → all tokens set inactive |

## Known Security Gaps

### CRITICAL

| ID | Gap | Risk | Current State | Recommended Mitigation |
|----|-----|------|--------------|----------------------|
| S-01 | Hardcoded default admin password | Unauthorized admin access if env var not set | Default `"ovpr-1963"` in source code | Remove default; require `ADMIN_PASSWORD` env var; fail startup if missing |
| S-02 | No rate limiting | Brute force attacks on admin login, token guessing, DoS | No rate limiting on any endpoint | Add rate limiting middleware (e.g., `@upstash/ratelimit` or custom) |
| S-03 | In-memory WebAuthn challenges | Challenges lost on server restart; cannot validate across instances | `Map` in passkey.ts | Store challenges in database or Redis with TTL |

### HIGH

| ID | Gap | Risk | Current State | Recommended Mitigation |
|----|-----|------|--------------|----------------------|
| S-04 | No CSP headers | Cross-site scripting if XSS vulnerability found | No Content-Security-Policy header | Add CSP via `next.config.ts` headers |
| S-05 | No CSRF tokens | Cross-site request forgery on state-changing endpoints | Only `SameSite=Lax` cookie protection | Add CSRF token validation or use `SameSite=Strict` |
| S-06 | No audit logging | Cannot detect or investigate unauthorized access | No access logs beyond Railway platform logs | Add structured audit logging for auth events and data changes |
| S-07 | No error tracking | Production errors invisible | `console.error()` only | Add Sentry or similar error tracking service |
| S-08 | Admin cookie has no session ID | Cannot revoke individual admin sessions | Cookie value is static `"authenticated"` | Use unique session IDs with server-side session store |

### MEDIUM

| ID | Gap | Risk | Current State | Recommended Mitigation |
|----|-----|------|--------------|----------------------|
| S-09 | Device tokens never expire | Stale tokens remain valid indefinitely | No TTL on tokens | Add expiration field and enforce TTL (e.g., 365 days) |
| S-10 | localStorage vulnerable to XSS | Token theft if XSS is exploited | Token stored in localStorage | Accept risk (mitigated by strong XSS prevention) or move to httpOnly cookie |
| S-11 | No server-side email validation | Malformed emails accepted | Only client-side HTML5 validation | Add Zod email validation on server |
| S-12 | User verification not required for passkeys | Passkey auth may proceed without biometric on some devices | `userVerification: "preferred"` | Change to `"required"` for stronger assurance |
| S-13 | Single shared admin password | No individual accountability for admin actions | One password for all admins | Implement per-user admin accounts with individual credentials |

## Transport Security

| Property | Value |
|----------|-------|
| HTTPS | Enforced by Railway (automatic TLS) |
| HSTS | Not explicitly configured |
| Certificate | Railway-managed (auto-renewal) |

## Dependency Security

| Property | Value |
|----------|-------|
| Vulnerability scanning | Not configured |
| Lock file | `package-lock.json` present |
| Update policy | Manual |

**Recommendation**: Add `npm audit` to CI/CD pipeline and enable Dependabot or similar automated dependency updates.
