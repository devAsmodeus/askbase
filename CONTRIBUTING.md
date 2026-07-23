# Contributing

Thanks for taking a look! This project is a product MVP exercise, but PRs and
issues are welcome.

## Getting started

Follow the ["Run it locally"](README.md#run-it-locally) section of the README —
you'll need a free Supabase project and about five minutes.

## Development workflow

```bash
npm run dev        # start the dev server (Turbopack)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

All three checks run in CI on every push and pull request — please make sure
they pass locally before opening a PR.

## Guidelines

- **Keep the scope focused.** The product goal is "docs in → embeddable chatbot
  out". Features outside that (teams, analytics, crawling…) belong in an issue
  first, not a surprise PR.
- **Enforce limits in the database.** Anything a user must not be able to
  bypass (quotas, plan limits, tenant isolation) lives in Postgres —
  RLS, triggers, `security definer` RPCs — never only in the UI.
- **Match the existing style.** TypeScript, App Router server components by
  default, shadcn/ui for UI primitives, Tailwind for styling.
- **Migrations are append-only.** Never edit an existing file in
  `supabase/migrations/` — add a new one.

## Commit messages

Conventional-commit style prefixes are used loosely: `feat:`, `fix:`,
`docs:`, `chore:`. Keep the subject line under ~70 characters.
