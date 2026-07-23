# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| latest `master` | ✅ |
| tagged releases | ✅ (latest only) |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Instead, use [GitHub private vulnerability reporting](../../security/advisories/new)
or email the maintainer. Include:

- A description of the issue and its impact
- Steps to reproduce (a minimal PoC is ideal)
- Affected component (app route, API endpoint, SQL migration, widget)

You can expect an acknowledgement within a few days.

## Security model of this MVP

Things that are enforced server-side and safe to rely on:

- **Postgres RLS** on every table — users can only read/write their own rows.
- **Plan limits in the database** — bot/document/message quotas are enforced by
  triggers and `security definer` RPCs, not just the UI.
- **Widget surface** — the public widget only reaches a small set of
  `security definer` RPCs keyed by an unguessable bot `public_id`.

Known limitations (documented, not vulnerabilities):

- The widget domain allowlist trusts the origin reported by the loader script.
  It is a quota guard, not a hard security boundary.
- Signup auto-confirms email addresses — replace with real email confirmation
  before production use.
- Billing is fully simulated; there is no payment data anywhere in the system.
