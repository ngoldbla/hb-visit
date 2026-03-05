# Operations Runbook

## Local Development Setup

### Prerequisites

- Node.js >= 20.9.0
- npm
- A Supabase project (free tier works)
- NFC stickers (optional, for end-to-end testing)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/ngoldbla/hb-visit.git
cd hb-visit

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials and other config

# 4. Start development server
npm run dev
# App is available at http://localhost:3000
```

### Verifying Local Setup

1. Open `http://localhost:3000` — should show kiosk attract screen
2. Open `http://localhost:3000/tap?loc=test` — should show registration form (no token in localStorage)
3. Register a visitor — should succeed and redirect to success screen
4. Open `http://localhost:3000/admin/login` — should show admin login
5. Log in with `ADMIN_PASSWORD` — should redirect to dashboard

---

## Deployment

### Automatic Deployment

Pushing to `master` triggers automatic deployment on Railway.

```bash
git checkout master
git merge feature-branch
git push origin master
# Railway auto-deploys within ~2 minutes
```

### Manual Deployment Commands

```bash
# Link to Railway project (first time only)
railway link

# Check deployment status
railway status

# View live logs
railway logs

# Set environment variables
railway variables --set "ADMIN_PASSWORD=new-secure-password"

# Open deployed app
railway open
```

### Deployment Verification

After deployment:
1. Check Railway dashboard for successful build
2. Visit `https://visit.hatchbridge.com` — kiosk should load
3. Test check-in flow with an NFC sticker or by visiting `/tap?loc=test`
4. Verify admin dashboard at `/admin`

---

## Database Migrations

### Applying Migrations

Migrations are SQL files in `supabase/migrations/`. Apply them via the Supabase dashboard or CLI.

**Via Supabase Dashboard**:
1. Go to Supabase dashboard → SQL Editor
2. Open the migration file
3. Copy SQL contents
4. Run in the SQL editor

**Via Supabase CLI**:
```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref xsqceqlrdermlwtlfkng

# Apply migrations
supabase db push
```

### Creating New Migrations

1. Create a new SQL file: `supabase/migrations/YYYYMMDD_description.sql`
2. Write idempotent SQL (use `IF NOT EXISTS`, `CREATE OR REPLACE`, etc.)
3. Test in a development Supabase project first
4. Apply to production
5. Update `src/lib/supabase/types.ts` to reflect schema changes

---

## Common Admin Tasks

### Resetting the Admin Password

1. Go to Railway dashboard → Variables
2. Set `ADMIN_PASSWORD` to a new value
3. Railway will redeploy automatically
4. Existing admin sessions (cookie-based) remain valid until they expire (7 days)

### Exporting Data

**Members**:
1. Log in to admin dashboard
2. Navigate to Members section
3. Click export button
4. Or directly: `GET https://visit.hatchbridge.com/api/admin/export/members` (with admin cookie)

**Check-ins**:
1. `GET https://visit.hatchbridge.com/api/admin/export/checkins`
2. Add `?includeOvertaps=true` to include overtap records

### Deactivating a Member

1. Admin dashboard → Members → find the member
2. Click deactivate
3. This sets `is_active=false` and deactivates all their device tokens
4. The member cannot check in until reactivated

### Reactivating a Member

1. Admin dashboard → Members → find the deactivated member
2. Click reactivate
3. `POST /api/admin/members` with `{ "id": "uuid", "action": "reactivate" }`

### Managing Locations

1. Admin dashboard → Locations
2. Create new locations with a name and slug
3. The slug determines the NFC sticker URL: `/tap?loc=<slug>`
4. Use "Discover" to auto-detect locations from check-in history

### Managing Activities

1. Admin dashboard → Activities
2. Create activities linked to a location and optionally a series
3. Activity check-in URL: `/tap?loc=<location-slug>&activity=<activity-slug>`

### Full Data Reset

**Warning**: This permanently deletes data and cannot be undone.

1. Admin dashboard → Settings → Danger Zone
2. Select reset type (check-ins, streaks, members, or all)
3. Type `DELETE ALL DATA` to confirm
4. This calls `POST /api/admin/reset`

---

## Troubleshooting

### Kiosk Not Updating on Check-in

**Symptoms**: Visitor checks in but kiosk doesn't show the celebration screen.

**Possible causes**:
1. **Supabase Realtime disconnected** — The WebSocket connection may have dropped.
   - **Fix**: Refresh the kiosk browser tab. The page re-establishes the Realtime subscription on load.

2. **Check-in method filter** — The kiosk only listens for `check_in_method=eq.nfc_token` events.
   - **Check**: Verify the check-in was made via NFC token (not passkey or email).

3. **Supabase Realtime disabled** — Realtime may be turned off in the Supabase dashboard.
   - **Fix**: Go to Supabase dashboard → Database → Replication → ensure `check_ins` table has Realtime enabled.

4. **Network issue** — The kiosk iPad may have lost WiFi.
   - **Fix**: Check iPad WiFi connection. See `KIOSK-SETUP.md` for WiFi configuration.

### NFC Sticker Not Working

**Symptoms**: Tapping the sticker does nothing on the visitor's phone.

**Possible causes**:
1. **NFC not enabled** — Some Android phones require NFC to be turned on manually.
2. **iPhone limitation** — iPhones require iOS 14+ and only read NFC via the background tag reader (hold phone near sticker, notification appears).
3. **Sticker not programmed** — Use NFC Tools app to verify the sticker contains a URL.
4. **URL incorrect** — The sticker URL should be `https://visit.hatchbridge.com/tap?loc=<slug>`.
5. **Sticker damaged** — NFC stickers can fail if bent, cut, or exposed to extreme heat.

### Passkey Authentication Failing

**Symptoms**: Visitor sees "No challenge found" or passkey verification fails.

**Possible causes**:
1. **Server restarted** — WebAuthn challenges are stored in-memory and lost on restart.
   - **Impact**: Any in-progress passkey flows will fail. The visitor must restart the flow.
   - **Fix**: This is self-healing — the visitor just needs to try again.

2. **Wrong domain** — `WEBAUTHN_RP_ID` must exactly match the domain the visitor is on.
   - **Check**: Ensure env vars `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` match the production domain.

3. **Mixed content** — Passkeys require HTTPS. Will not work on `http://localhost` in production mode.
   - **Fix**: Use HTTPS in production (Railway handles this).

### Admin Cannot Log In

**Symptoms**: Admin login page rejects the password.

**Possible causes**:
1. **Wrong password** — Check the `ADMIN_PASSWORD` environment variable in Railway.
2. **Environment variable not set** — If unset, the default `ovpr-1963` is used.
3. **Cookie blocked** — Third-party cookie blocking in the browser may prevent the auth cookie from being set.
   - **Fix**: Use the same browser domain (not through a proxy or iframe).

### Check-in Returns 401

**Symptoms**: Visitor's phone shows "authentication required" after tapping.

**Possible causes**:
1. **Token cleared** — The visitor cleared browser data, removing the localStorage token.
   - **Fix**: Visitor should re-authenticate via passkey or re-register.
2. **Token deactivated** — An admin deactivated the member.
   - **Fix**: Admin should reactivate the member.
3. **Different browser** — The token is stored per-browser. A different browser or device won't have it.

### High Overtap Rate

**Symptoms**: Many check-ins marked as `is_overtap=true`.

**Explanation**: Overtaps occur when a visitor taps within 2 hours of their last check-in. This is normal — it prevents duplicate check-ins when visitors accidentally tap twice or walk past the sticker multiple times.

---

## Log Access

### Railway Logs

```bash
# View recent logs
railway logs

# Follow logs in real-time
railway logs --follow
```

Or use the Railway dashboard → project → Deployments → select deployment → Logs.

### What Gets Logged

| What | Logged? | Where |
|------|---------|-------|
| HTTP requests | Yes | Railway platform logs |
| Application errors | Yes | `console.error()` in Railway logs |
| Check-in events | No | Only in database |
| Auth failures | No | Only in API response |
| Admin actions | No | Not logged |

---

## Emergency Procedures

### Service Completely Down

1. Check Railway dashboard for deployment status
2. Check Railway status page for platform outages
3. If deployment failed: check build logs for errors, rollback to previous deployment
4. If application crashing: check logs for the error, verify environment variables are set
5. Railway auto-restarts on failure up to 10 times — if all retries exhausted, redeploy manually

### Suspected Data Breach

1. **Immediately**: Change `ADMIN_PASSWORD` in Railway environment variables
2. **Immediately**: Rotate `SUPABASE_SERVICE_ROLE_KEY` in Supabase dashboard, then update in Railway
3. **Immediately**: Rotate `NEXT_PUBLIC_SUPABASE_ANON_KEY` if RLS policies are compromised
4. **Assess**: Check Supabase audit logs (if available on your plan) for unauthorized access
5. **Notify**: Inform affected users if PII was accessed
6. **Review**: Check for unauthorized member accounts or suspicious check-in patterns
7. **Harden**: Review the [security gaps](security.md) and implement priority mitigations

### Database Corruption or Data Loss

1. Contact Supabase support for backup restoration
2. Supabase Pro plan provides daily backups and point-in-time recovery
3. If on free plan: check if any recent CSV exports exist as a partial backup
4. After restoration: verify member counts and recent check-in data

### Rollback a Bad Deployment

1. Go to Railway dashboard → project → Deployments
2. Find the last known-good deployment
3. Click "Redeploy" on that deployment
4. Verify the application is working
5. Fix the issue in a new branch before merging to `master` again

---

## Scheduled Maintenance

There are no automated maintenance jobs. Consider implementing:

| Task | Frequency | Description |
|------|-----------|-------------|
| Dependency updates | Monthly | Run `npm audit` and update vulnerable packages |
| Token cleanup | Quarterly | Deactivate device tokens not used in 365+ days |
| Data review | Quarterly | Export and review member data for accuracy |
| Backup verification | Quarterly | Test Supabase backup restoration |
| Security review | Quarterly | Review [risk register](risk-register.md) and update |
| Documentation review | Quarterly | Review and update governance docs |
