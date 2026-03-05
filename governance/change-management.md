# Change Management

This document describes how to safely make changes to the HatchBridge Visitor Check-in system.

## Git Branching Strategy

| Branch | Purpose | Deploys to |
|--------|---------|-----------|
| `master` | Production branch | Railway (automatic) |
| `feature/*` | Feature development | Local only |
| `fix/*` | Bug fixes | Local only |

**Workflow**:
1. Create a feature/fix branch from `master`
2. Develop and test locally
3. Merge to `master` (or open a PR for review)
4. Railway auto-deploys on push to `master`

**There is no staging environment.** All testing must be done locally before merging to `master`.

---

## Making Code Changes

### Pre-Development Checklist

- [ ] Read the relevant source files to understand current behavior
- [ ] Check the [data model](data-model.md) if your change touches the database
- [ ] Check the [API reference](api-reference.md) if your change affects endpoints
- [ ] Check the [security doc](security.md) for relevant security controls

### Development

```bash
# Create a branch
git checkout -b feature/my-change master

# Start dev server
npm run dev

# Make changes and test locally
# ...

# Lint
npm run lint

# Build to verify no build errors
npm run build
```

### Pre-Deployment Checklist

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] Tested the change locally (see [manual testing checklist](../README.md#testing))
- [ ] If changing API endpoints: verified request/response shapes
- [ ] If changing database schema: migration file created and tested
- [ ] If changing auth: verified admin login, visitor check-in, and passkey flows
- [ ] If changing kiosk: verified Supabase Realtime subscription works
- [ ] No sensitive data (passwords, keys) committed to code
- [ ] Environment variables documented if new ones are required

### Deployment

```bash
# Merge to master
git checkout master
git merge feature/my-change

# Push (triggers Railway auto-deploy)
git push origin master
```

### Post-Deployment Verification

1. Wait for Railway build to complete (~2 minutes)
2. Check Railway dashboard for successful deployment
3. Visit `https://visit.hatchbridge.com` — verify kiosk loads
4. Test a check-in flow
5. Verify admin dashboard loads at `/admin`
6. Check Railway logs for any errors

---

## Database Changes

### Adding a New Table

1. Create a migration file: `supabase/migrations/YYYYMMDD_description.sql`
2. Write idempotent SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS my_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     -- columns...
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- Add indexes
   CREATE INDEX IF NOT EXISTS idx_my_table_field ON my_table(field);

   -- Enable RLS if needed
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
   ```
3. Update `src/lib/supabase/types.ts` with the new table types
4. Test the migration on a development Supabase project
5. Apply to production via Supabase dashboard SQL editor or CLI

### Modifying an Existing Table

1. Create a migration file with `ALTER TABLE` statements
2. Use `IF NOT EXISTS` / `IF EXISTS` for idempotency:
   ```sql
   ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_field TEXT;
   ```
3. Update `src/lib/supabase/types.ts`
4. Update any API routes that read/write the modified table
5. Test thoroughly — schema mismatches will cause runtime errors

### Dropping a Table or Column

**Warning**: Destructive operation. Follow these steps:

1. First, remove all code references to the table/column
2. Deploy the code change and verify no errors in production
3. Wait at least one deployment cycle to confirm
4. Then apply the migration to drop the table/column
5. This two-step process prevents runtime errors from code referencing a dropped table

---

## Environment Variable Changes

### Adding a New Variable

1. Add the variable to `.env.example` with a descriptive comment
2. Update [infrastructure.md](infrastructure.md) documentation
3. Set the variable in Railway dashboard → Variables
4. Railway will automatically redeploy

### Changing a Variable

1. Update the value in Railway dashboard → Variables
2. Railway will automatically redeploy
3. No code change needed unless the variable name changes

### Removing a Variable

1. Remove all code references to the variable
2. Deploy the code change
3. Remove the variable from Railway dashboard
4. Remove from `.env.example`

---

## Dependency Updates

### Routine Updates

```bash
# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Update a specific package
npm install package-name@latest

# Update all packages (minor/patch)
npm update
```

### Major Version Updates

Major version updates (e.g., Next.js 16 → 17) require careful testing:

1. Read the migration guide for the new major version
2. Create a feature branch
3. Update the package
4. Fix any breaking changes
5. Run `npm run build` to verify
6. Test all critical flows locally
7. Merge only after thorough testing

### Critical Security Patches

If `npm audit` reports a critical vulnerability:

1. Determine if the vulnerability is exploitable in this application's context
2. If exploitable: update immediately, test, and deploy
3. If not directly exploitable: plan update within one week
4. Document the vulnerability and resolution in the commit message

---

## Rollback Procedures

### Code Rollback

**Via Railway dashboard**:
1. Go to Railway → project → Deployments
2. Find the last known-good deployment
3. Click "Redeploy"

**Via git**:
```bash
# Revert the problematic commit
git revert HEAD
git push origin master
# Railway auto-deploys the revert
```

### Database Rollback

**No automated rollback mechanism exists.** Options:

1. **Write a reversal migration**: Create a new SQL file that undoes the changes (e.g., `ALTER TABLE DROP COLUMN`)
2. **Restore from backup**: Contact Supabase support or use point-in-time recovery (Pro plan)

**Best practice**: Always write reversible migrations. If adding a column, have a plan for removing it. If migrating data, keep the original data until the migration is verified.

### Environment Variable Rollback

1. Go to Railway dashboard → Variables
2. Change the variable back to its previous value
3. Railway will redeploy automatically

---

## Breaking Changes

A "breaking change" is any change that could disrupt existing functionality:

- Changing API request/response shapes
- Changing database column names or types
- Changing the device token format or storage key
- Changing the admin auth mechanism
- Removing features or endpoints

### Handling Breaking Changes

1. **Client-side token storage**: Any change to the localStorage key (`hb_visitor_token`) or token format will invalidate all existing visitor tokens. Visitors will need to re-register or re-authenticate via passkey.

2. **API changes**: Since the API is consumed by the same Next.js app, API changes can be deployed atomically with the client code. No API versioning is needed.

3. **Database schema changes**: Deploy code changes before (or simultaneously with) schema changes. Never change the schema without updating the code.

4. **Kiosk impact**: Kiosk iPads cache the page. After a significant change, manually refresh the kiosk browser tab.

---

## Communication

There is no formal change communication process. For significant changes:

1. Notify the admin/operator about the change and its effects
2. If the change affects visitors (e.g., token invalidation), plan for re-registration
3. Test on the kiosk after deployment
4. Monitor Railway logs for 30 minutes after deployment for errors
