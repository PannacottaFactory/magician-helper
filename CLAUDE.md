# Magician Helper

SaaS web app for professional magicians: repertoire (tricks), routines/setlists, practice log, clients, gigs (calendar + prep checklist), inventory of props/gimmicks, ideas notebook. **All UI text is in English.** The project owner speaks French (explanations to them in French).

Full plan, SQL design and decisions: [PLAN.md](PLAN.md). Setup guide: [README.md](README.md).

## Stack

- React 19 + Vite 7 + TypeScript (strict), Tailwind CSS v4, shadcn/ui (`src/components/ui`, generated — edit sparingly), lucide-react icons
- TanStack Query v5 for server data; React Hook Form + Zod v4 for forms
- React Router v7 (library mode, `createBrowserRouter`), `basename` = Vite `base`
- Supabase: Auth (password + magic link, **PKCE flow**), Postgres with RLS, Storage
- Stripe Checkout + Customer Portal via Supabase Edge Functions (Deno) — phase 6
- Hosted on GitHub Pages: https://pannacottafactory.github.io/magician-helper/ (deployed by `.github/workflows/deploy.yml` on push to `main`)

## Commands

```bash
npm run dev        # local dev server (needs .env.local)
npm run build      # typecheck + production build + 404.html SPA fallback
npm run lint       # ESLint
npm run test:sql   # run all migrations + supabase/tests/*.sql in PGlite (no Docker)
npm run db:types   # regenerate src/types/database.ts from the linked project
npx supabase db push --remote   # apply new migrations to the linked Supabase project
```

Before every commit: `npm run build`, `npm run lint`, `npm run test:sql` must pass.

End-to-end API tests against the real project live in `scripts/e2e/` (create a temporary user, then delete it). They need `SUPABASE_SERVICE_ROLE_KEY` in the environment — read it with `npx supabase projects api-keys -o json` (use the legacy `service_role` key; the new `sb_secret_` key returned by the CLI is rejected) and never write it to a file.

## Project layout

- `src/features/<domain>/` — one folder per domain (auth, tricks, inventory, ideas, routines, practice, clients, gigs, dashboard, search, billing, settings, public…). Typical files: `api.ts` (Supabase calls + TanStack Query hooks), `schemas.ts` (Zod), page and component files.
- `src/components/layout/` — AppShell, Sidebar (desktop), BottomTabs (mobile), PageHeader, nav config
- `src/components/common/` — shared app components (EmptyState, Logo, loaders…)
- `src/lib/` — supabase client, env, query client, utils
- `src/hooks/` — theme, etc.
- `supabase/migrations/` — SQL migrations (apply with `npx supabase db push --remote`; CLI v3 targets local by default), one per phase, named `YYYYMMDDHHMMSS_name.sql`
- `supabase/tests/` — SQL tests (RLS, triggers, functions) run by `npm run test:sql`
- `supabase/functions/` — Edge Functions (Deno): `create-checkout-session`, `create-portal-session`, `stripe-webhook` (deployed with `--no-verify-jwt`, checks the Stripe signature), `delete-account`; shared code in `_shared/`. Deploy with `npx supabase functions deploy <name> --use-api`. Stripe setup: `scripts/stripe-setup.mjs` (reads `.env.stripe.local`, writes `.env.functions.local`, both git-ignored).

## Conventions

### Database
- Every user table has `id uuid`, `user_id uuid not null default auth.uid()`, `created_at`, `updated_at`.
- After creating a table, call `select public.apply_owner_policies('public.<table>');` — it enables RLS, adds owner-only policies (writes also require `has_write_access()`), the `updated_at` trigger and revokes `anon`.
- Relations use **composite foreign keys** `(x_id, user_id) → parent(id, user_id)` so links can never cross users. Parents need `unique (id, user_id)`. For nullable links use `on delete set null (x_id)`.
- Enum-like values: `text` + `CHECK`, stored in `snake_case` (`needs_polish`); English labels live in the frontend.
- Computed fields: generated columns or `security_invoker` views; multi-row operations as SQL functions (`security invoker`, `set search_path = ''`).
- `profiles` billing columns are only writable by the service role (column-level grants).
- Never put seed/sample data in migrations — users start with an empty app. Classic props are offered through the built-in catalog (`src/features/inventory/catalog/`: data + SVG illustrations); added items keep `catalog_key` to show the illustration when there is no photo.
- Bulk inserts with supabase-js: every row must have the same keys — a missing key becomes NULL (not the column default).
- Views expand `t.*` at creation: after adding a column to a table, drop and recreate views that select `*` from it.
- After a migration, regenerate types (`npm run db:types`) and add tests in `supabase/tests/`.

### Read-only mode
Trial (14 days, `profiles.trial_ends_at`) or subscription `trialing|active|past_due` ⇒ write access. Otherwise the database refuses writes (RLS) and the UI disables create/edit actions and shows a subscribe banner. Use `useAccess()` from `src/features/profile/api.ts` in the UI.

### Frontend
- Feature pages are lazy-loaded in `src/router.tsx` (`lazy: async () => ({ Component })`). List pages render an `<Outlet />` for their `:id` child route, which shows the `DetailPanel` (side sheet on desktop, full screen on mobile).
- Shared building blocks: `EmptyState`, `DetailPanel`/`DetailSection`, `WriteButton` (auto-disabled in read-only mode), `SearchInput`/`ViewSwitcher`/`Toolbar`, `TagInput`, `ChipSelect`, `StarInput`/`StarRating`, `NumberInput` (`number | null`), `RichTextEditor`/`RichTextView` (sanitized), status badges.
- Deletions go through `useUndoableDelete()` (6 s Undo toast, then the real DELETE); lists filter pending ones with `useWithoutPending()`.
- Supabase calls are wrapped with `unwrap()` (`src/lib/db.ts`), errors shown with `toast.error(dbErrorMessage(e))`. External links must go through `safeUrl()`.
- shadcn CLI quirk: it may import `cn` from a bogus `"cn"` npm package and add `next-themes`. After `npx shadcn add`, replace `from "cn"` with `from "@/lib/utils"`, `npm uninstall cn next-themes`, and never overwrite existing ui files (answer "n").
- Import with the `@/` alias. Components in PascalCase, files in kebab-case.
- Server data only through TanStack Query hooks in `features/*/api.ts`; throw Supabase errors, show them with `sonner` toasts.
- Forms: `useForm<Values>({ resolver: zodResolver(schema) })` + shadcn `Form*` components (they handle labels/ARIA).
- Tags get a stable color from `tagColor()` (`src/lib/colors.ts`); use `TagBadge`/`TagList`, `CategoryBadge`, `AudienceBadge`.
- Global search: `search_all(q)` RPC + `CommandPalette` (Cmd/Ctrl+K, open with `setSearchOpen`). Export: `src/lib/export.ts` (paginated reads, JSON or zipped CSVs). Tricks CSV import: `features/tricks/import-csv.ts` (header aliases, per-row errors/warnings, batches of 200).
- Never call `Date.now()` / `new Date()` for "now" during render (React compiler lint error): use `useNow()` from `src/hooks/use-now.ts`.
- Gig checklist: a DB trigger on `gig_routines` calls `sync_gig_checklist()`; the UI also offers a Refresh button (routines may change after linking). Floating widgets must carry `data-floating-widget` so clicking them does not close sheets/dialogs.
- The practice timer lives in `features/practice/timer-store.ts` (localStorage, survives navigation/reload); the floating widget is rendered by `AppShell`.
- Colors only through theme tokens (`bg-background`, `text-muted-foreground`, `text-gold`, `border-gold/30`…) defined in `src/styles/globals.css`. Design = **matte black with light gold touches**; gold is an accent, not a fill (use it for active states, icons, highlights, primary buttons).
- Headings use `font-display` (Cormorant Garamond); body uses Inter.
- Accessibility: AA contrast, every interactive element keyboard-reachable with visible focus ring, icon-only buttons need `aria-label`, decorative icons `aria-hidden`.
- Empty states: `EmptyState` component with icon + text + action. Loading: `Skeleton`.
- Auth redirect URLs must be built with `appUrl()` (includes the GitHub Pages base path).

### Security
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are public. Stripe secret keys and the service role key live only in Supabase Edge Function secrets. Never commit `.env*` files (except `.env.example`).

## Phase status

- [x] Phase 1 — setup, auth, responsive layout, GitHub Pages deploy
- [x] Phase 2 — Tricks + Inventory + Ideas
- [x] Phase 3 — Routines + Practice Log (+ built-in prop catalog, colored tags)
- [x] Phase 4 — Clients + Gigs + calendar + prep checklist
- [x] Phase 5 — Dashboard, global search, export/import
- [x] Phase 6 — Trial, Stripe, read-only mode, Billing page
- [ ] Phase 7 — Landing page, PWA, polish, accessibility
