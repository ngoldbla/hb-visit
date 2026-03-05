# HatchBridge Visitor Check-in — Governance Documentation

This directory contains all governance, operational, and compliance documentation for the HatchBridge Visitor Check-in system ([visit.hatchbridge.com](https://visit.hatchbridge.com)).

These documents serve two audiences:

1. **Governance & compliance reviewers** — understand what data the system collects, how it is protected, and what risks exist.
2. **SREs & developers** — understand how to operate, maintain, troubleshoot, and safely change the system.

## Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| [Architecture](architecture.md) | Tech stack, directory structure, component map, third-party integrations | Dev / SRE |
| [Data Model](data-model.md) | Database schema, table definitions, relationships, indexes, RLS policies | Dev / SRE |
| [Data Flow](data-flow.md) | How data moves through the system for every major user flow | Both |
| [Privacy](privacy.md) | PII inventory, data retention, data subject rights, cookies, third-party sharing | Governance |
| [Security](security.md) | Authentication, authorization, input validation, known gaps and mitigations | Both |
| [API Reference](api-reference.md) | Every endpoint with method, auth, request/response contracts | Dev |
| [Infrastructure](infrastructure.md) | Hosting, environment variables, secrets management, DNS, backups | SRE |
| [Operations Runbook](operations-runbook.md) | Deployment, migrations, troubleshooting, emergency procedures | SRE |
| [Risk Register](risk-register.md) | Categorized risks with severity ratings and recommended actions | Both |
| [Change Management](change-management.md) | How to safely ship changes: branching, migrations, rollbacks | Dev / SRE |

## Ownership

- **Maintainer**: Project lead or designated SRE
- **Review cadence**: These documents should be reviewed and updated quarterly, or whenever a significant architectural change is made.
- **Last full review**: 2026-03-04 (initial creation)

## How to Update

1. Edit the relevant markdown file in this directory.
2. Update the "Last full review" date above.
3. If adding a new document, add it to the table above.
4. Commit changes through the normal change management process documented in [change-management.md](change-management.md).
