# Privacy

This document inventories all personal data collected by the system, explains how it is used and stored, and identifies gaps in privacy compliance.

## PII Inventory

### Data Collected from Visitors

| Data Element | Required? | Where Stored | Purpose | Retention |
|-------------|-----------|-------------|---------|-----------|
| Full name | Yes | `members.name`, `device_tokens.visitor_name`, `check_ins.visitor_name` | Display identity, kiosk greeting | Indefinite |
| Email address | Yes | `members.email`, `device_tokens.visitor_email`, `passkey_credentials.visitor_email` | Unique identifier, passkey association | Indefinite |
| Phone number | No | `members.phone` | Optional contact info | Indefinite |
| Company name | No | `members.company` | Optional affiliation | Indefinite |
| Avatar emoji | No | `members.avatar_emoji` | Visual identifier on kiosk | Indefinite |
| Browser user-agent | Auto | `device_tokens.user_agent` | Device identification | Indefinite |
| WebAuthn public key | Auto | `passkey_credentials.public_key` | Passkey authentication | Indefinite |
| WebAuthn credential ID | Auto | `passkey_credentials.credential_id` | Passkey lookup | Indefinite |
| Check-in timestamp | Auto | `check_ins.check_in_time` | Visit tracking | Indefinite |
| Check-in location | Auto | `check_ins.location` | Location-based tracking | Indefinite |

### Data Collected from Hosts

| Data Element | Required? | Where Stored | Purpose | Retention |
|-------------|-----------|-------------|---------|-----------|
| Name | Yes | `host_preferences.name` | Notification addressing | Indefinite |
| Email | Yes | `host_preferences.email` | Email notifications | Indefinite |
| Phone | No | `host_preferences.phone` | SMS notifications | Indefinite |
| Slack user ID | No | `host_preferences.slack_user_id` | Slack mentions | Indefinite |

### Derived Data

| Data Element | Where Stored | How Calculated |
|-------------|-------------|----------------|
| Current streak | `members.current_streak` | Consecutive calendar days with check-ins |
| Longest streak | `members.longest_streak` | Historical max of current_streak |
| Total check-ins | `members.total_check_ins` | Count of non-overtap check-ins |
| Personality nickname | `members.personality_nickname` | Generated from visit patterns |
| Badges/achievements | `achievements` table | Awarded based on milestones |
| Visit duration | `check_ins.duration_minutes` | check_out_time - check_in_time |
| Arrival position | `check_ins.arrival_position` | Nth visitor that calendar day |

## Data Minimization Assessment

| Category | Assessment |
|----------|-----------|
| **Required fields** | Name and email are necessary for identification. Phone and company are optional. |
| **User-agent capture** | Stored for device tracking. Could be omitted or hashed for privacy. |
| **visitor_name duplication** | Name is duplicated in `members`, `device_tokens`, and `check_ins`. This is a denormalization trade-off for query performance. Check-in records cache the name at time of check-in, which is reasonable for historical accuracy. |
| **Email as identifier** | Used across three tables as the linking key. Appropriate for the use case. |

## Data Retention

**Current policy**: All data is retained indefinitely. There is no automated data expiration or purge process.

**Recommended improvements**:

| Action | Recommendation |
|--------|---------------|
| Device tokens | Auto-expire tokens not used in 365 days |
| Check-in records | Consider anonymizing records older than 2 years |
| Deactivated members | Hard-delete after 90-day grace period |
| User-agent strings | Hash or truncate after 30 days |
| WebAuthn challenges | Already ephemeral (in-memory, lost on restart) |

## Data Subject Rights

### Right to Access

- **Mechanism**: Admin can export member data via `GET /api/admin/export/members` (CSV) and check-in data via `GET /api/admin/export/checkins` (CSV).
- **Self-service**: Not available. Visitors cannot access their own data without contacting an admin.
- **Gap**: No self-service data access portal.

### Right to Deletion

- **Mechanism**: Admin can deactivate a member via `DELETE /api/admin/members`, which sets `is_active=false` and deactivates all device tokens.
- **Scope**: Soft delete only. Historical check-in records are preserved.
- **Full erasure**: Admin can use the reset endpoint (`POST /api/admin/reset`) but this is all-or-nothing — it cannot target a single member.
- **Gap**: No per-member hard deletion capability. A targeted SQL delete would be required.

### Right to Portability

- **Mechanism**: CSV exports include all member and check-in data.
- **Format**: CSV with proper escaping.
- **Gap**: No machine-readable format (JSON API) for individual member data export.

### Right to Rectification

- **Mechanism**: Admin can update member profiles via `PATCH /api/admin/members` (name, email, company, phone, streaks).
- **Self-service**: Not available.

## Cookie Usage

| Cookie | Purpose | HttpOnly | Secure | SameSite | Expiry | Contains PII? |
|--------|---------|----------|--------|----------|--------|---------------|
| `hb-admin-auth` | Admin session flag | Yes | Yes (production) | Lax | 7 days | No (value is "authenticated") |

**No tracking cookies, analytics cookies, or third-party cookies are used.**

## localStorage Usage

| Key | Purpose | Contains PII? | Expiry |
|-----|---------|---------------|--------|
| `hb_visitor_token` | Device token UUID for instant check-in | No (UUID only — PII is server-side) | Never (manual clear or deactivation) |

## Consent

**Current state**: No explicit consent mechanism exists.

- Visitors implicitly consent by entering their information and tapping the NFC sticker.
- No consent checkbox, privacy policy link, or terms of service acceptance is presented during registration.
- No cookie consent banner (only one functional cookie used, no tracking).

**Gaps**:
- No privacy policy page exists in the application.
- No terms of service page exists.
- No opt-out mechanism for data collection beyond not using the system.
- Registration form (`src/app/tap/register/page.tsx`) does not link to a privacy policy.

**Recommendations**:
1. Add a privacy policy page explaining data collection, use, retention, and rights.
2. Add a brief consent notice on the registration form with a link to the privacy policy.
3. Implement a self-service data deletion request mechanism.

## Third-Party Data Sharing

Data is shared with the following third parties during normal operation:

| Third Party | Data Shared | Purpose | When |
|------------|-------------|---------|------|
| **Supabase** (database host) | All stored data | Database hosting and real-time subscriptions | Always |
| **Railway** (app host) | Request logs, IP addresses | Application hosting | Always |
| **Resend** (optional) | Visitor name, check-in location | Email notifications to hosts | When email notifications enabled |
| **Twilio** (optional) | Visitor name | SMS notifications to hosts | When SMS notifications enabled |
| **Slack** (optional) | Visitor name, check-in location | Slack notifications | When Slack notifications enabled |

**No data is sold or shared for advertising or profiling purposes.**

## Data Breach Considerations

In the event of a database breach, the following data would be exposed:

- **High sensitivity**: Email addresses, phone numbers, WebAuthn public keys
- **Medium sensitivity**: Names, companies, visit history with timestamps and locations
- **Low sensitivity**: Streaks, badges, avatar emojis, quotes

**Mitigations in place**:
- Supabase uses TLS encryption in transit
- Supabase encrypts data at rest
- Service role key is stored as an environment variable (not in code)
- Device tokens are random UUIDs (not guessable)

**Mitigations NOT in place**:
- No application-level encryption of PII fields
- No field-level access logging
- No breach detection or alerting system
