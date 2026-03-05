# Data Flow

This document traces how data moves through the system for every major user flow.

## 1. First-Time Registration

**Trigger**: Visitor taps an NFC sticker for the first time (no existing token in localStorage).

```
Visitor taps NFC sticker
    │
    ▼
Phone opens: /tap?loc=lobby-main
    │
    ▼
src/app/tap/page.tsx
    │  Checks localStorage for "hb_visitor_token"
    │  Token NOT found
    │
    ▼
Redirect to /tap/register?loc=lobby-main
    │
    ▼
src/app/tap/register/page.tsx
    │  Visitor enters: name, email, phone (optional), company (optional)
    │  Selects avatar emoji
    │  Client-side validation (required fields, format)
    │
    ▼
POST /api/tap/register
    │  src/app/api/tap/register/route.ts
    │
    │  1. Validate name via name-moderation.ts
    │     - Profanity check (123+ terms)
    │     - Leetspeak normalization
    │     - SQL injection pattern detection
    │     - XSS character blocking
    │     - Length check (2-100 chars)
    │
    │  2. Normalize email to lowercase
    │
    │  3. Check if member already exists (by email)
    │     - If exists: reactivate if deactivated
    │     - If new: INSERT into members table
    │
    │  4. Generate UUID device token
    │     - INSERT into device_tokens table
    │     - Stores: token, email, name, user_agent
    │
    │  5. Create initial check-in record
    │     - INSERT into check_ins table
    │     - Sets: member_id, location, check_in_method="nfc_token"
    │
    │  6. Return: { success, token, message }
    │
    ▼
Client stores token in localStorage ("hb_visitor_token")
    │
    ▼
Passkey registration prompt (optional)
    │  GET /api/auth/passkey/register?email=X&name=Y
    │  → generates WebAuthn options + challenge (stored in memory)
    │  → browser prompts Face ID / Touch ID
    │  POST /api/auth/passkey/register
    │  → verifies attestation
    │  → INSERT into passkey_credentials
    │
    ▼
Success screen shown to visitor
```

**Data written**:
- `members` — 1 new row (or reactivated existing)
- `device_tokens` — 1 new row
- `check_ins` — 1 new row
- `passkey_credentials` — 1 new row (if passkey created)

---

## 2. Return Check-in (Instant)

**Trigger**: Returning visitor taps NFC sticker. Token exists in localStorage.

```
Visitor taps NFC sticker
    │
    ▼
Phone opens: /tap?loc=elevator-1
    │
    ▼
src/app/tap/page.tsx
    │  Reads "hb_visitor_token" from localStorage
    │  Token FOUND
    │
    ▼
POST /api/tap/checkin
    │  src/app/api/tap/checkin/route.ts
    │  Header: X-Visitor-Token: <uuid>
    │  Query: ?loc=elevator-1
    │
    │  1. Validate token format (UUID regex)
    │  2. Look up token in device_tokens (WHERE token=X AND is_active=true)
    │  3. Resolve member from visitor_email
    │  4. Check for overtap (checked in within last 2 hours)
    │     - If overtap: return success with is_overtap=true, no new record
    │  5. Check for existing checked-in status
    │     - If checked_in: toggle to checkout (update status, calc duration)
    │  6. INSERT into check_ins
    │  7. Update member stats:
    │     - Increment total_check_ins
    │     - Update last_check_in
    │     - Calculate streak (consecutive calendar days)
    │     - Update current_streak, longest_streak
    │  8. Calculate arrival_position (nth check-in today)
    │  9. Award badges (streak milestones, visit counts, time-based)
    │     - INSERT into achievements for each new badge
    │  10. Update community_goals current_count
    │  11. Update device_tokens.last_used_at
    │  12. Return: { success, action, visitor_name, streak, arrival_position,
    │               monthly_count, new_badges, message }
    │
    ▼
Success screen shown to visitor (with streak, badge info)
```

**Data written**:
- `check_ins` — 1 new row
- `members` — updated (streak, total_check_ins, last_check_in)
- `achievements` — 0-N new rows (if badges earned)
- `community_goals` — updated (current_count)
- `device_tokens` — updated (last_used_at)

**Total time**: ~1 second, zero user interaction.

---

## 3. Passkey Fallback (Token Lost)

**Trigger**: Visitor taps NFC sticker but token has been cleared from localStorage.

```
Visitor taps NFC sticker
    │
    ▼
Phone opens: /tap?loc=lobby-main
    │
    ▼
src/app/tap/page.tsx
    │  No token in localStorage
    │  Checks for passkey option
    │
    ▼
GET /api/auth/passkey/authenticate?email=visitor@example.com
    │  src/app/api/auth/passkey/authenticate/route.ts
    │  src/lib/auth/passkey.ts → generateAuthenticationOptions()
    │
    │  1. Look up existing credentials for email in passkey_credentials
    │  2. Generate WebAuthn authentication options
    │  3. Store challenge in in-memory Map (key: "auth:email")
    │  4. Return: { success, options, challenge }
    │
    ▼
Browser triggers Face ID / Touch ID prompt
    │  @simplewebauthn/browser → startAuthentication()
    │
    ▼
POST /api/auth/passkey/authenticate
    │  src/app/api/auth/passkey/authenticate/route.ts
    │  src/lib/auth/passkey.ts → verifyAuthentication()
    │
    │  1. Retrieve stored challenge from memory
    │  2. Verify authentication response against stored public key
    │  3. Update counter in passkey_credentials (replay detection)
    │  4. Generate new device token (UUID)
    │  5. INSERT into device_tokens
    │  6. Return: { success, token }
    │
    ▼
Client stores new token in localStorage
    │
    ▼
Automatic check-in via POST /api/tap/checkin (same as flow #2)
```

**Data written**:
- `passkey_credentials` — updated (counter, last_used_at)
- `device_tokens` — 1 new row
- Plus all writes from the check-in flow (#2)

---

## 4. Admin Authentication

```
Admin navigates to /admin
    │
    ▼
src/middleware.ts
    │  Checks for "hb-admin-auth" cookie
    │  Cookie NOT found or value != "authenticated"
    │
    ▼
Redirect to /admin/login
    │
    ▼
Admin enters password
    │
    ▼
POST /api/admin/auth
    │  src/app/api/admin/auth/route.ts
    │
    │  1. Compare password to ADMIN_PASSWORD env var
    │  2. If match: set cookie "hb-admin-auth" = "authenticated"
    │     - httpOnly: true
    │     - secure: true (production)
    │     - sameSite: "lax"
    │     - maxAge: 7 days
    │  3. Return: { success: true }
    │
    ▼
Redirect to /admin (dashboard)
```

**Data written**: None (cookie set on client).

**Logout**: DELETE `/api/admin/auth` → clears the cookie.

---

## 5. Kiosk Real-time Updates

```
Kiosk (iPad) loads /
    │
    ▼
src/app/(kiosk)/page.tsx
    │  Fetches initial data (stats, quotes)
    │  Sets up Supabase Realtime subscription
    │
    ▼
supabase.channel("check_ins")
    .on("postgres_changes", {
        event: "INSERT",
        table: "check_ins",
        filter: "check_in_method=eq.nfc_token"
    })
    │
    ▼ [On new check-in INSERT]
    │
    │  1. Receive payload with: visitor_name, member_id, location
    │  2. Fetch member details (avatar_emoji, streak, badges)
    │  3. Transition from attract mode → success screen
    │  4. Display: visitor name, streak, arrival position, badges
    │  5. Play celebration sound + animation
    │  6. After 6 seconds → return to attract mode
    │
    ▼
Attract mode cycles: stats → quotes → stats → ...
```

**Data written**: None (read-only consumer).

---

## 6. Data Export

```
Admin clicks export button
    │
    ▼
GET /api/admin/export/members  (or /checkins)
    │  src/app/api/admin/export/members/route.ts
    │
    │  1. Verify admin cookie
    │  2. Query all active members (or check-ins with date range)
    │  3. Format as CSV with escapeCSV() utility
    │     - Handles commas, quotes, newlines
    │  4. Return with Content-Type: text/csv
    │     - Content-Disposition: attachment; filename="members_export_YYYY-MM-DD.csv"
    │
    ▼
Browser downloads CSV file
```

**Data written**: None (read-only). File is never stored server-side.

---

## 7. Notification Flow (Optional)

```
Check-in completed (from flow #2)
    │
    ▼
Check host_preferences table
    │  WHERE notify_email=true OR notify_sms=true OR notify_slack=true
    │
    ├── notify_email=true
    │   └── Resend API → send email to host
    │       Body: "Visitor X has arrived at Location Y"
    │
    ├── notify_sms=true
    │   └── Twilio API → send SMS to host.phone
    │       Body: "Visitor X has arrived"
    │
    └── notify_slack=true
        └── POST to SLACK_WEBHOOK_URL
            Body: JSON payload with visitor info
```

**Data written**: `check_ins.host_notified_at` updated with timestamp.

---

## 8. Member Deactivation

```
Admin clicks deactivate on member
    │
    ▼
DELETE /api/admin/members
    │
    │  1. Set members.is_active = false
    │  2. Set members.deactivated_at = now()
    │  3. Set all device_tokens.is_active = false (WHERE visitor_email = X)
    │
    ▼
Member can no longer check in (token validation fails)
```

**Data written**: `members` updated, all related `device_tokens` deactivated. No hard deletion — historical check-in data preserved.

---

## 9. Full Data Reset (Danger Zone)

```
Admin enters confirmation phrase "DELETE ALL DATA"
    │
    ▼
POST /api/admin/reset
    │  src/app/api/admin/reset/route.ts
    │
    │  Options:
    │  - Reset check-ins only → DELETE FROM check_ins
    │  - Reset streaks only → UPDATE members SET current_streak=0, longest_streak=0
    │  - Reset all → DELETE FROM check_ins, members, device_tokens,
    │                         passkey_credentials, achievements
    │
    ▼
Data permanently deleted (hard delete, no undo)
```
