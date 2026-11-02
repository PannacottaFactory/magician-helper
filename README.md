# Magician Helper

Organize your repertoire, routines, practice, gigs and props — a web app for professional magicians.

**Live:** https://pannacottafactory.github.io/magician-helper/

Stack: React + Vite + TypeScript, Tailwind CSS + shadcn/ui, TanStack Query, Supabase (Auth, Postgres, Storage, Edge Functions), Stripe. Hosted on GitHub Pages.

---

## Setup guide

You need **Node.js 22+** and **Git**. The Supabase CLI is used through `npx` (nothing to install globally).

### 1. Create the Supabase project

Supabase hosts the database, the user accounts and the files.

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Pick a name (`magician-helper`), a strong **database password** (save it in your password manager, the CLI will ask for it) and a region close to your users (e.g. *West EU (Paris)* or *Central EU (Frankfurt)*).
3. Once created, open **Project Settings → API** (or **Connect**) and copy:
   - the **Project URL** (`https://xxxx.supabase.co`)
   - the **anon / publishable key**. This key is public by design: Row Level Security protects the data.
   - ⚠️ never copy the `service_role` / secret key into the frontend.
4. Note the **project ref**: the `xxxx` part of the URL.

### 2. Apply the database migrations

The SQL files in `supabase/migrations/` create the tables, security rules (RLS) and functions.

```bash
npx supabase login                         # opens the browser once
npx supabase link --project-ref <your-ref> # asks for the database password
npx supabase db push                       # applies every migration not yet applied
npm run db:types                           # regenerates src/types/database.ts from the real schema
```

> Alternative without CLI: open **SQL Editor** in Supabase and run each file of `supabase/migrations/` in order. The CLI is recommended because it remembers which migrations were applied.

Run `npx supabase db push` again every time a new phase adds a migration.

### 3. Configure authentication

In Supabase → **Authentication**:

1. **URL Configuration**
   - **Site URL**: `https://pannacottafactory.github.io/magician-helper/`
   - **Redirect URLs** → add both:
     - `http://localhost:5173/**`
     - `https://pannacottafactory.github.io/magician-helper/**`

   Email links (confirmation, magic link, password reset) only redirect to URLs in this list.
2. **Sign In / Providers → Email**: enabled (default). Keep **Confirm email** on for production. You can turn it off while testing to sign up instantly.
3. **Emails (SMTP)**: the built-in email sender is limited to a few emails per hour and meant for testing only. Before launch, plug in a real SMTP provider (e.g. [Resend](https://resend.com), free tier) under **Authentication → Emails → SMTP Settings**.

> The app uses the **PKCE** flow: a link sent by email must be opened **in the same browser** where it was requested.

### 4. Run locally

```bash
npm install
cp .env.example .env.local    # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev                   # http://localhost:5173
```

Useful scripts:

| Command | What it does |
|---|---|
| `npm run build` | Type-check + production build into `dist/` |
| `npm run lint` | ESLint |
| `npm run test:sql` | Runs all migrations + SQL tests (`supabase/tests`) in an in-memory Postgres (PGlite), no Docker needed |
| `npm run db:types` | Regenerates TypeScript types from your linked Supabase project |

### 5. Deploy to GitHub Pages

Every push to `main` builds and publishes the site through GitHub Actions (`.github/workflows/deploy.yml`).

1. On GitHub, open the repository → **Settings → Pages** → **Build and deployment → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables tab → New repository variable**, add:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon / publishable key |

   These are *variables* (not secrets) because they are public anyway; they end up in the browser bundle.
   Optional: `VITE_PRICE_LABEL` (defaults to `€9.99/month`) and `VITE_BASE_PATH` (only for a custom domain, set it to `/`).
3. Push to `main` (or **Actions → Deploy to GitHub Pages → Run workflow**). The **Actions** tab shows the progress; the site is live at `https://pannacottafactory.github.io/magician-helper/` after ~1 minute.

**How routing works on GitHub Pages:** GitHub Pages only serves files. Opening `/magician-helper/app/tricks` directly would normally give a 404. The build copies `index.html` to `404.html`, so GitHub serves the app for any unknown path and React Router shows the right page. URLs stay clean (`/app/tricks` rather than `/#/app/tricks`), and Supabase's email links keep working.

### 6. Stripe (phase 6)

*Coming in phase 6: test-mode product & price, webhook, Edge Functions deployment and secrets.*

---

## Project structure

See [CLAUDE.md](CLAUDE.md) for conventions and [PLAN.md](PLAN.md) for the full technical plan and database design.
