# Risk Register

Risks are categorized by domain and rated by likelihood (L), impact (I), and overall severity. Ratings use a 1-3 scale: 1 = Low, 2 = Medium, 3 = High. Severity = L x I.

## Risk Matrix

| Severity Score | Rating | Action |
|---------------|--------|--------|
| 7-9 | CRITICAL | Immediate remediation required |
| 4-6 | HIGH | Remediate within next sprint/quarter |
| 2-3 | MEDIUM | Plan remediation, accept with documentation |
| 1 | LOW | Accept, monitor |

---

## Security Risks

| ID | Risk | L | I | Sev | Current Mitigation | Recommended Action |
|----|------|---|---|-----|-------------------|-------------------|
| SEC-01 | **Hardcoded default admin password** exposed in source code (`ovpr-1963` in `src/app/api/admin/auth/route.ts`) | 2 | 3 | **6 HIGH** | Can be overridden via `ADMIN_PASSWORD` env var | Remove hardcoded default; require env var; fail startup if unset |
| SEC-02 | **No rate limiting** on any endpoint — vulnerable to brute force, token guessing, and denial-of-service | 2 | 3 | **6 HIGH** | None | Add rate limiting middleware (e.g., Upstash Ratelimit or custom IP-based limiter) |
| SEC-03 | **In-memory WebAuthn challenges** lost on server restart — active passkey flows fail; cannot scale to multiple instances | 3 | 2 | **6 HIGH** | Self-healing (visitor retries) | Move challenge storage to database or Redis with 5-minute TTL |
| SEC-04 | **Admin API routes lack independent auth checks** — middleware redirects browser requests but direct API calls may bypass | 2 | 3 | **6 HIGH** | Middleware protects browser navigation | Add cookie/session validation inside each admin API route handler |
| SEC-05 | **No CSP headers** — increases XSS attack surface if a vulnerability is found | 2 | 2 | **4 HIGH** | React auto-escaping, name input validation | Add Content-Security-Policy via `next.config.ts` headers |
| SEC-06 | **No CSRF protection** beyond SameSite=Lax cookie | 1 | 2 | **2 MED** | SameSite=Lax partially mitigates | Consider SameSite=Strict or add CSRF tokens |
| SEC-07 | **Device tokens never expire** — stale tokens remain valid indefinitely | 2 | 1 | **2 MED** | Tokens can be manually deactivated | Add TTL (e.g., 365 days) and auto-expire unused tokens |
| SEC-08 | **Single shared admin password** — no individual accountability | 2 | 2 | **4 HIGH** | N/A | Implement per-user admin accounts |
| SEC-09 | **Admin cookie value is static string** (`"authenticated"`) — no session ID, cannot selectively revoke | 2 | 2 | **4 HIGH** | 7-day expiry | Use unique session IDs with server-side store |
| SEC-10 | **localStorage token vulnerable to XSS** — if XSS is exploited, tokens can be stolen | 1 | 2 | **2 MED** | Strong input validation prevents most XSS | Accept risk (standard trade-off) or move to httpOnly cookie |

## Data Risks

| ID | Risk | L | I | Sev | Current Mitigation | Recommended Action |
|----|------|---|---|-----|-------------------|-------------------|
| DAT-01 | **No automated backup verification** — backups may fail silently | 2 | 3 | **6 HIGH** | Supabase automatic daily backups (Pro plan) | Schedule quarterly backup restoration tests |
| DAT-02 | **PII retained indefinitely** — no automated data expiration | 2 | 2 | **4 HIGH** | Admin can manually export and delete | Implement data retention policy with auto-purge |
| DAT-03 | **No per-member hard deletion** — admin reset is all-or-nothing | 1 | 2 | **2 MED** | Soft delete (deactivation) available | Add targeted hard-delete endpoint for individual members |
| DAT-04 | **CSV exports not independently authenticated** — rely on middleware redirect only | 2 | 2 | **4 HIGH** | Admin middleware protects browser access | Add auth check inside export route handlers |
| DAT-05 | **Email as primary identifier across tables** — changing a visitor's email requires updates in multiple tables | 1 | 2 | **2 MED** | Admin can update member email | Use member UUID as FK instead of email in `device_tokens` and `passkey_credentials` |

## Operational Risks

| ID | Risk | L | I | Sev | Current Mitigation | Recommended Action |
|----|------|---|---|-----|-------------------|-------------------|
| OPS-01 | **No error tracking or monitoring** — production errors invisible | 3 | 2 | **6 HIGH** | Console.error in Railway logs | Add Sentry (free tier) for error tracking |
| OPS-02 | **No automated test suite** — regressions go undetected | 3 | 2 | **6 HIGH** | Manual testing checklist in README | Add E2E tests for critical flows (registration, check-in) |
| OPS-03 | **No uptime monitoring** — outages detected only by users | 2 | 2 | **4 HIGH** | Railway auto-restart (10 retries) | Add uptime monitoring (e.g., UptimeRobot free tier) |
| OPS-04 | **No structured logging** — debugging production issues is difficult | 2 | 2 | **4 HIGH** | Console.error calls | Add structured logging with request IDs |
| OPS-05 | **No audit trail** — cannot determine who made admin changes or when | 2 | 2 | **4 HIGH** | None | Add audit log table for admin actions |
| OPS-06 | **Single point of failure** — one Railway instance, one Supabase database | 2 | 2 | **4 HIGH** | Railway auto-restart | Accept (appropriate for app scale); monitor uptime |

## Compliance Risks

| ID | Risk | L | I | Sev | Current Mitigation | Recommended Action |
|----|------|---|---|-----|-------------------|-------------------|
| CMP-01 | **No privacy policy** — visitors are not informed about data collection | 2 | 2 | **4 HIGH** | Implicit consent via registration | Add privacy policy page; link from registration form |
| CMP-02 | **No explicit consent mechanism** — registration collects PII without consent checkbox | 2 | 2 | **4 HIGH** | None | Add consent notice on registration form |
| CMP-03 | **No self-service data access** — visitors cannot view or download their own data | 1 | 1 | **1 LOW** | Admin can export on request | Consider adding visitor stats page (partially exists at `/stats`) |
| CMP-04 | **No terms of service** | 1 | 1 | **1 LOW** | None | Add ToS page |

## Infrastructure Risks

| ID | Risk | L | I | Sev | Current Mitigation | Recommended Action |
|----|------|---|---|-----|-------------------|-------------------|
| INF-01 | **No CDN** — all traffic served directly from Railway instance | 1 | 1 | **1 LOW** | Railway global network | Add Cloudflare or similar CDN if traffic grows |
| INF-02 | **Horizontal scaling blocked** by in-memory challenge storage | 1 | 2 | **2 MED** | Single instance sufficient for current scale | Fix SEC-03 before scaling |
| INF-03 | **No CI/CD pipeline** — no automated linting, testing, or security scanning before deploy | 2 | 2 | **4 HIGH** | Manual `npm run lint` | Add GitHub Actions for lint, test, audit |
| INF-04 | **Dependency vulnerabilities unmonitored** | 2 | 2 | **4 HIGH** | Manual npm audit | Enable Dependabot or Renovate for automated PRs |

---

## Priority Summary

### Immediate (CRITICAL/HIGH — fix now)

1. **SEC-01**: Remove hardcoded default admin password
2. **SEC-02**: Add rate limiting
3. **SEC-04**: Add auth checks inside admin API routes
4. **OPS-01**: Add error tracking (Sentry)
5. **OPS-02**: Add basic automated tests

### Next Quarter (HIGH — plan remediation)

6. **SEC-03**: Move WebAuthn challenges to persistent storage
7. **SEC-05**: Add CSP headers
8. **SEC-08**: Implement per-user admin accounts
9. **SEC-09**: Use session IDs instead of static cookie
10. **DAT-01**: Test backup restoration
11. **DAT-02**: Define and implement data retention policy
12. **CMP-01**: Add privacy policy
13. **OPS-03**: Add uptime monitoring
14. **INF-03**: Add CI/CD pipeline

### Accept / Monitor (MEDIUM/LOW)

15. All MEDIUM and LOW items — document acceptance and review quarterly
