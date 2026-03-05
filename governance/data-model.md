# Data Model

All data is stored in a Supabase-managed PostgreSQL database. Type definitions live in `src/lib/supabase/types.ts`. Migrations live in `supabase/migrations/`.

## Entity Relationship Overview

```
members ──< check_ins >── activities ──> locations
   │              │              │
   │              │              └──> activity_series
   │              │
   ├──< device_tokens
   ├──< passkey_credentials
   └──< achievements

host_preferences (standalone)
community_goals (standalone)
kiosk_settings (standalone, key-value)
quotes (standalone)
```

## Table Definitions

### members

The core user table. Every registered visitor becomes a member.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| name | text | No | — | Visitor display name |
| email | text | No | — | Email address (unique identifier, lowercase) |
| phone | text | Yes | — | Phone number |
| company | text | Yes | — | Company or organization |
| avatar_emoji | text | Yes | — | Emoji avatar for kiosk display |
| photo_url | text | Yes | — | Profile photo URL (unused) |
| current_streak | integer | Yes | 0 | Consecutive days checked in |
| longest_streak | integer | Yes | 0 | All-time longest streak |
| total_check_ins | integer | Yes | 0 | Lifetime check-in count |
| last_check_in | timestamptz | Yes | — | Most recent check-in time |
| personality_nickname | text | Yes | — | Generated nickname based on patterns |
| is_active | boolean | Yes | true | Soft-delete flag |
| deactivated_at | timestamptz | Yes | — | When member was deactivated |
| created_at | timestamptz | Yes | now() | Registration time |

---

### device_tokens

UUID tokens stored in the visitor's browser localStorage for instant check-in.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| token | text | No | — | UUID token string |
| visitor_email | text | No | — | Associated member email |
| visitor_name | text | No | — | Cached visitor name |
| user_agent | text | Yes | — | Browser user-agent at creation |
| is_active | boolean | Yes | true | Whether token is valid |
| last_used_at | timestamptz | Yes | — | Last successful check-in |
| created_at | timestamptz | Yes | now() | Token creation time |

---

### passkey_credentials

WebAuthn credentials for backup authentication when device tokens are lost.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| visitor_email | text | No | — | Associated member email |
| credential_id | text | No | — | WebAuthn credential identifier |
| public_key | text | No | — | Base64-encoded public key |
| counter | integer | Yes | 0 | Signature counter for replay detection |
| transports | text[] | Yes | — | Allowed transport methods |
| last_used_at | timestamptz | Yes | — | Last successful authentication |
| created_at | timestamptz | Yes | now() | Credential creation time |

---

### check_ins

Every visitor check-in and check-out event.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| member_id | UUID | Yes | — | FK to `members.id` |
| visitor_name | text | Yes | — | Cached name at check-in time |
| location | text | Yes | — | Location slug (e.g., "lobby") |
| check_in_time | timestamptz | No | — | When visitor checked in |
| check_in_method | text | No | — | Method: "nfc_token", "passkey", "email" |
| status | text | Yes | "checked_in" | Current status: "checked_in" or "checked_out" |
| check_out_time | timestamptz | Yes | — | When visitor checked out |
| check_out_method | text | Yes | — | Checkout method |
| duration_minutes | integer | Yes | — | Calculated visit duration |
| arrival_position | integer | Yes | — | Nth visitor today |
| is_overtap | boolean | Yes | false | Whether this was a duplicate tap |
| activity_id | UUID | Yes | — | FK to `activities.id` |
| kiosk_id | text | Yes | — | Which kiosk processed this |
| host_notified_at | timestamptz | Yes | — | When host was notified |
| song_added | text | Yes | — | Song selection (unused feature) |
| welcome_message | text | Yes | — | Custom welcome message |
| created_at | timestamptz | Yes | now() | Record creation time |

**Foreign keys**: `member_id` → `members.id`, `activity_id` → `activities.id`

---

### locations

Physical NFC tap points in the building.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| name | text | No | — | Display name (e.g., "Main Lobby") |
| slug | text | No | — | URL slug, unique (e.g., "lobby-main") |
| description | text | Yes | — | Optional description |
| is_active | boolean | No | true | Whether location accepts check-ins |
| created_at | timestamptz | Yes | now() | Creation time |

**Indexes**: `idx_locations_slug` (slug), `idx_locations_is_active` (is_active)

**RLS policies**: Public read access for active locations. Authenticated users have full CRUD.

---

### activities

Events or sessions that visitors can check into specifically.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| name | text | No | — | Activity name |
| slug | text | No | — | URL slug, unique |
| description | text | Yes | — | Optional description |
| location_id | UUID | No | — | FK to `locations.id` |
| series_id | UUID | Yes | — | FK to `activity_series.id` |
| event_date | date | Yes | — | Date of the event |
| start_time | time | Yes | — | Start time |
| end_time | time | Yes | — | End time |
| is_active | boolean | No | true | Whether activity is active |
| created_at | timestamptz | Yes | now() | Creation time |

**Foreign keys**: `location_id` → `locations.id`, `series_id` → `activity_series.id`

**Indexes**: `idx_activities_slug`, `idx_activities_event_date`, `idx_activities_location_id`, `idx_activities_series_id`

---

### activity_series

Groups related recurring activities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| name | text | No | — | Series name |
| slug | text | No | — | URL slug, unique |
| description | text | Yes | — | Optional description |
| is_active | boolean | No | true | Whether series is active |
| created_at | timestamptz | Yes | now() | Creation time |

---

### achievements

Badges earned by members based on check-in milestones, streaks, and special events.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| member_id | UUID | No | — | FK to `members.id` |
| badge_name | text | No | — | Badge identifier |
| badge_type | text | No | — | Category: "streak", "milestone", "time", etc. |
| earned_at | timestamptz | Yes | now() | When badge was earned |

**Foreign keys**: `member_id` → `members.id`

---

### community_goals

Shared goals tracked across the entire community (e.g., monthly check-in targets).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| goal_type | text | No | "monthly_checkins" | Goal category |
| start_date | date | No | — | Goal period start |
| end_date | date | No | — | Goal period end |
| target_count | integer | No | — | Target number to reach |
| current_count | integer | Yes | 0 | Current progress |
| is_active | boolean | Yes | true | Whether goal is active |
| created_at | timestamptz | Yes | now() | Creation time |

---

### host_preferences

Notification preferences for hosts who want to be alerted when visitors arrive.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| email | text | No | — | Host email |
| name | text | No | — | Host name |
| phone | text | Yes | — | Host phone for SMS |
| slack_user_id | text | Yes | — | Slack user ID for mentions |
| notify_email | boolean | Yes | false | Email notifications enabled |
| notify_sms | boolean | Yes | false | SMS notifications enabled |
| notify_slack | boolean | Yes | false | Slack notifications enabled |
| created_at | timestamptz | Yes | now() | Creation time |
| updated_at | timestamptz | Yes | now() | Last update time |

---

### kiosk_settings

Key-value configuration store for kiosk display settings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| setting_key | text | No | — | Setting identifier |
| setting_value | jsonb | No | — | JSON configuration value |
| updated_at | timestamptz | Yes | now() | Last update time |

**Known keys**: `attract_cycle_config`, `holiday_config`, `base_url`

---

### quotes

Inspirational quotes displayed on the kiosk attract screen.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| text | text | No | — | Quote text |
| author | text | Yes | — | Attribution |
| category | text | Yes | — | Category for filtering |
| source | text | Yes | — | Original source |
| is_active | boolean | Yes | true | Whether quote is displayed |
| created_at | timestamptz | Yes | now() | Creation time |

## Migration Files

| File | Date | Description |
|------|------|-------------|
| `supabase/migrations/20250112_create_locations_table.sql` | 2025-01-12 | Creates `locations` table with RLS policies |
| `supabase/migrations/20260303_create_activities_tables.sql` | 2026-03-03 | Creates `activities`, `activity_series` tables; adds `activity_id` FK to `check_ins` |

**Note**: The `members`, `device_tokens`, `passkey_credentials`, `check_ins`, `achievements`, `community_goals`, `host_preferences`, `kiosk_settings`, and `quotes` tables were created directly in Supabase prior to migration-based management. Their schemas are defined in `src/lib/supabase/types.ts`.
