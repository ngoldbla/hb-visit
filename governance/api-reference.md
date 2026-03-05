# API Reference

All endpoints return JSON (`Content-Type: application/json`) unless noted otherwise. All request bodies are JSON.

**Base URL**: `https://visit.hatchbridge.com`

**Common error format**:
```json
{ "success": false, "error": "Error description" }
```

---

## Public Endpoints

### POST /api/tap/register

Register a new visitor and create a device token.

**Source**: `src/app/api/tap/register/route.ts`

**Auth**: None

**Request**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "avatarEmoji": "🚀"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | Yes | 2-100 chars, validated against profanity/injection filter |
| email | string | Yes | Lowercased and trimmed |
| phone | string | No | Free-form |
| company | string | No | Free-form |
| avatarEmoji | string | No | Defaults to "😊" |

**Response (200)**:
```json
{
  "success": true,
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Welcome, Jane!"
}
```

**Errors**: 400 (missing/invalid name or email), 500

---

### POST /api/tap/checkin

Check in (or check out) with a device token.

**Source**: `src/app/api/tap/checkin/route.ts`

**Auth**: Device token via `X-Visitor-Token` header or request body

**Request**:
- Header: `X-Visitor-Token: <uuid>`
- Query: `?loc=lobby-main&activity=workshop-2026`
- Body (optional): `{ "token": "<uuid>" }`

| Parameter | Location | Required | Notes |
|-----------|----------|----------|-------|
| token | Header or body | Yes | UUID format |
| loc | Query | No | Location slug, defaults to "unknown" |
| activity | Query | No | Activity slug for event-specific check-ins |

**Response — Check-in (200)**:
```json
{
  "success": true,
  "action": "checkin",
  "check_in_id": "uuid",
  "visitor_name": "Jane Doe",
  "visitor_email": "jane@example.com",
  "avatar_emoji": "🚀",
  "location": "lobby-main",
  "streak": 5,
  "arrival_position": 3,
  "monthly_count": 12,
  "is_overtap": false,
  "new_badges": [
    {
      "id": "streak-5",
      "name": "Five Alive",
      "emoji": "🖐️",
      "description": "5-day streak",
      "earnedAt": "2026-03-04T10:00:00Z"
    }
  ],
  "activity_name": "Workshop 2026",
  "message": "Welcome back, Jane!"
}
```

**Response — Checkout (200)**:
```json
{
  "success": true,
  "action": "checkout",
  "check_in_id": "uuid",
  "visitor_name": "Jane Doe",
  "visitor_email": "jane@example.com",
  "avatar_emoji": "🚀",
  "location": "lobby-main",
  "duration_minutes": 180,
  "duration_title": "3 hours",
  "duration_message": "Great session!",
  "message": "Peace out, Jane!"
}
```

**Errors**: 400 (no token), 401 (invalid/inactive token), 404 (activity not found), 500

---

### GET /api/auth/passkey/register

Generate WebAuthn registration options.

**Source**: `src/app/api/auth/passkey/register/route.ts`

**Auth**: None

**Query parameters**: `?email=jane@example.com&name=Jane%20Doe`

**Response (200)**:
```json
{
  "success": true,
  "options": { /* WebAuthn PublicKeyCredentialCreationOptions */ }
}
```

**Errors**: 400 (missing email/name), 500

---

### POST /api/auth/passkey/register

Verify and store a passkey registration.

**Source**: `src/app/api/auth/passkey/register/route.ts`

**Auth**: None

**Request**:
```json
{
  "email": "jane@example.com",
  "response": { /* WebAuthn RegistrationResponseJSON */ }
}
```

**Response (200)**:
```json
{ "success": true }
```

**Errors**: 400 (missing fields or verification failed), 500

---

### GET /api/auth/passkey/authenticate

Generate WebAuthn authentication options.

**Source**: `src/app/api/auth/passkey/authenticate/route.ts`

**Auth**: None

**Query parameters**: `?email=jane@example.com` (optional — omit for discoverable credentials)

**Response (200)**:
```json
{
  "success": true,
  "options": { /* WebAuthn PublicKeyCredentialRequestOptions */ }
}
```

**Errors**: 404 (no passkeys found), 500

---

### POST /api/auth/passkey/authenticate

Verify passkey authentication and issue a new device token.

**Source**: `src/app/api/auth/passkey/authenticate/route.ts`

**Auth**: None

**Request**:
```json
{
  "email": "jane@example.com",
  "response": { /* WebAuthn AuthenticationResponseJSON */ }
}
```

**Response (200)**:
```json
{
  "success": true,
  "visitorEmail": "jane@example.com",
  "visitorName": "Jane Doe",
  "token": "new-uuid-token"
}
```

**Errors**: 400 (missing response), 401 (verification failed), 500

---

### GET /api/stats

Get personal statistics for a visitor.

**Source**: `src/app/api/stats/route.ts`

**Auth**: Device token via `X-Visitor-Token` header

**Response (200)**:
```json
{
  "success": true,
  "stats": {
    "member": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatarEmoji": "🚀",
      "personalityNickname": "The Regular",
      "currentStreak": 5,
      "longestStreak": 12,
      "totalCheckIns": 42,
      "totalHours": 210,
      "memberSince": "2025-06-15T00:00:00Z"
    },
    "weeklyActivity": [true, true, true, true, true, false, false],
    "monthlyHeatmap": [
      { "date": "2026-03-01", "count": 1 },
      { "date": "2026-03-03", "count": 2 }
    ],
    "earnedBadges": [ /* badge objects */ ],
    "allBadges": [ /* all badges with earned status */ ]
  }
}
```

**Errors**: 400 (no token), 401 (invalid token), 404 (member not found), 500

---

## Admin Endpoints

All admin endpoints are served under `/api/admin/*`. Admin routes (except `/admin/login`) are protected by middleware that checks for the `hb-admin-auth` cookie. However, the API routes themselves do **not** independently verify the cookie — they rely on the middleware redirect. A direct API call without the cookie will still execute.

### POST /api/admin/auth

Admin login.

**Source**: `src/app/api/admin/auth/route.ts`

**Request**: `{ "password": "..." }`

**Response (200)**: `{ "success": true }` — sets `hb-admin-auth` cookie

**Errors**: 400, 401 (invalid password)

---

### DELETE /api/admin/auth

Admin logout.

**Source**: `src/app/api/admin/auth/route.ts`

**Response (200)**: `{ "success": true }` — clears `hb-admin-auth` cookie

---

### GET /api/admin/activities

List all activities with check-in counts, locations, and series.

**Source**: `src/app/api/admin/activities/route.ts`

**Response (200)**:
```json
{
  "success": true,
  "activities": [ /* activity objects with check_in_count, location_name, series_name */ ],
  "locations": [ /* { id, name, slug } */ ],
  "series": [ /* series objects */ ],
  "baseUrl": "https://visit.hatchbridge.com"
}
```

---

### POST /api/admin/activities

Create a new activity.

**Request**:
```json
{
  "name": "Workshop",
  "slug": "workshop-2026",
  "description": "Optional description",
  "location_id": "uuid",
  "series_id": "uuid",
  "event_date": "2026-03-15",
  "start_time": "10:00",
  "end_time": "12:00"
}
```

**Errors**: 400 (missing fields, invalid slug, duplicate slug), 500

---

### PATCH /api/admin/activities

Update an activity. Body: `{ "id": "uuid", ...fields to update }`.

### DELETE /api/admin/activities

Delete an activity. Body: `{ "id": "uuid" }`.

---

### GET /api/admin/activities/series

List all activity series.

### POST /api/admin/activities/series

Create a series. Body: `{ "name": "...", "slug": "...", "description": "..." }`.

### PATCH /api/admin/activities/series

Update a series. Body: `{ "id": "uuid", ...fields }`.

### DELETE /api/admin/activities/series

Delete a series. Body: `{ "id": "uuid" }`.

---

### GET /api/admin/activities/checkins

Get check-ins for specific activities.

**Source**: `src/app/api/admin/activities/checkins/route.ts`

**Query**: `?activity_id=uuid1&activity_id=uuid2`

**Response (200)**:
```json
{
  "success": true,
  "checkIns": [
    {
      "activity_id": "uuid",
      "member_id": "uuid",
      "visitor_name": "Jane Doe",
      "check_in_time": "2026-03-04T10:00:00Z"
    }
  ]
}
```

---

### GET /api/admin/locations

List all locations with check-in counts.

### POST /api/admin/locations

Create a location. Body: `{ "name": "...", "slug": "...", "description": "..." }`.

### PATCH /api/admin/locations

Update a location. Body: `{ "id": "uuid", ...fields }`.

### DELETE /api/admin/locations

Delete a location. Body: `{ "id": "uuid" }`.

---

### POST /api/admin/locations/discover

**Source**: `src/app/api/admin/locations/discover/route.ts`

Auto-discover locations from check-in history. Creates location records for any location slugs found in `check_ins.location` that don't have a corresponding `locations` entry.

**Response (200)**:
```json
{
  "success": true,
  "message": "Discovered 3 new locations",
  "added": 3,
  "locations": [ /* newly created location objects */ ]
}
```

---

### PATCH /api/admin/members

Update a member profile. Body: `{ "id": "uuid", "name": "...", "email": "...", ... }`.

### DELETE /api/admin/members

Deactivate a member (soft delete). Body: `{ "id": "uuid" }`. Also deactivates all their device tokens.

### POST /api/admin/members

Reactivate a deactivated member. Body: `{ "id": "uuid", "action": "reactivate" }`.

---

### GET /api/admin/export/checkins

**Source**: `src/app/api/admin/export/checkins/route.ts`

Export check-in data as CSV.

**Query**: `?includeOvertaps=true` (optional, defaults to false)

**Response**: CSV file download (`Content-Type: text/csv`)

---

### GET /api/admin/export/members

**Source**: `src/app/api/admin/export/members/route.ts`

Export active member data as CSV.

**Response**: CSV file download (`Content-Type: text/csv`)

---

### GET/POST/PATCH/DELETE /api/admin/quotes

CRUD for kiosk display quotes.

- **GET**: List all quotes
- **POST**: Create — `{ "text": "...", "author": "...", "category": "...", "source": "..." }`
- **PATCH**: Update — `{ "id": "uuid", ...fields }`
- **DELETE**: Delete — `{ "id": "uuid" }`

---

### GET /api/admin/settings

Get all settings as key-value pairs.

### POST /api/admin/settings

Upsert a setting. Body: `{ "key": "setting_name", "value": { ... } }`.

---

### POST /api/admin/reset

**Source**: `src/app/api/admin/reset/route.ts`

Permanently delete data. **This is destructive and irreversible.**

**Request**:
```json
{
  "resetType": "check_ins",
  "confirmationText": "DELETE ALL DATA"
}
```

| resetType | Effect |
|-----------|--------|
| `check_ins` | Delete all check-in records |
| `streaks` | Reset all member streaks to 0 |
| `members` | Delete all members, device tokens, passkey credentials, achievements |
| `all` | All of the above |

**Errors**: 400 (wrong confirmation text or invalid reset type), 500
