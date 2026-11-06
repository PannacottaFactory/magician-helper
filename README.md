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
npx supabase db push --remote              # applies every migration not yet applied (--remote = your online project, not a local one)
npm run db:types                           # regenerates src/types/database.ts from the real schema
```

> Alternative without CLI: open **SQL Editor** in Supabase and run each file of `supabase/migrations/` in order. The CLI is recommended because it remembers which migrations were applied.

Run `npx supabase db push --remote` again every time a new phase adds a migration.

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
   Optional: `VITE_PRICE_LABEL` (defaults to `€9.99/month`), `VITE_BASE_PATH` (only for a custom domain, set it to `/`), `VITE_SITE_URL` (public address, for a custom domain) and `VITE_GOOGLE_SITE_VERIFICATION` (see *Google search* below).
3. Push to `main` (or **Actions → Deploy to GitHub Pages → Run workflow**). The **Actions** tab shows the progress; the site is live at `https://pannacottafactory.github.io/magician-helper/` after ~1 minute.

**How routing works on GitHub Pages:** GitHub Pages only serves files. Opening `/magician-helper/app/tricks` directly would normally give a 404. The build copies `index.html` to `404.html`, so GitHub serves the app for any unknown path and React Router shows the right page. URLs stay clean (`/app/tricks` rather than `/#/app/tricks`), and Supabase's email links keep working.

**Public pages are prerendered:** after the build, `scripts/prerender.mjs` renders the landing and legal pages to real HTML (`index.html`, `privacy.html`, `terms.html`) with their title, description, canonical link and structured data, and writes `sitemap.xml` and `robots.txt`. Search engines read the text without running JavaScript. Page metadata lives in `src/features/public/seo.ts`.

### 6. Payments with Stripe

How it works: the 14-day trial starts at sign-up (no card). The **Subscribe** button calls the Edge Function `create-checkout-session`, which opens Stripe Checkout. If trial days remain, the Stripe subscription starts in `trialing` and the first payment happens when the 14 days are over. Stripe then notifies the `stripe-webhook` function, which updates `profiles.subscription_status`. Without an active subscription after the trial, the database refuses every write: the app becomes read-only (view + export still work).

The secret keys live **only** in Supabase Edge Function secrets — never in the frontend or in Git.

1. **Create a Stripe account** at [dashboard.stripe.com](https://dashboard.stripe.com) and switch on **Test mode** (toggle at the top).
2. **Copy the test secret key**: Developers → API keys → *Secret key* (`sk_test_…`). Paste it in `.env.stripe.local` at the project root (git-ignored):
   ```
   STRIPE_SECRET_KEY=sk_test_…
   ```
3. **Create the product, price, portal and webhook automatically**:
   ```bash
   node scripts/stripe-setup.mjs
   ```
   It creates (or reuses) a *Magician Helper* product with a €9.99/month price (lookup key `magician_helper_monthly`), a Customer Portal configuration (update card, invoices, cancel at period end) and a webhook endpoint pointing to `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`. It writes every secret to `.env.functions.local` (git-ignored).
   > To change the price later without touching the code: `PRICE_CENTS=1299 node scripts/stripe-setup.mjs`, upload the secrets again, and update the `VITE_PRICE_LABEL` repository variable. Existing subscribers keep their old price.
4. **Upload the secrets to Supabase**:
   ```bash
   npx supabase secrets set --env-file .env.functions.local
   ```
5. **Deploy the Edge Functions** (no Docker needed):
   ```bash
   npx supabase functions deploy create-checkout-session --use-api
   npx supabase functions deploy create-portal-session --use-api
   npx supabase functions deploy delete-account --use-api
   npx supabase functions deploy stripe-webhook --use-api --no-verify-jwt
   npx supabase functions deploy calendar-feed --use-api --no-verify-jwt
   ```
   `--no-verify-jwt` is only for the webhook and the calendar feed: Stripe and calendar apps have no Supabase token. The webhook checks the Stripe signature; the calendar feed checks the secret token in its URL.
6. **Test a payment**: in the app → Billing → Subscribe, use the card `4242 4242 4242 4242`, any future date, any CVC. Back in the app, the status becomes *Subscribed*. Then try **Manage subscription** (Customer Portal) and cancel.
   Other test cards: `4000 0000 0000 0341` (payment fails later → `past_due`), `4000 0025 0000 3155` (3-D Secure).

**Going live**: repeat steps 2–5 with the live secret key (`sk_live_…`) once your Stripe account is activated. VAT (Stripe Tax) is not configured yet.

### 7. Before launch

- **Legal pages**: `/privacy` and `/terms` are **templates** (`src/features/public/legal-pages.tsx`). Replace every highlighted `[FIELD]` and have them reviewed by a professional.
- **Emails**: plug a real SMTP provider into Supabase (see step 3).
- **Stripe live mode**: activate your Stripe account, then redo step 6 with the `sk_live_…` key.
- **Landing screenshots**: after a visible UI change, refresh the pictures of the landing page and the share image: run `npm run build`, then `npx vite preview --port 4173` in another terminal, then `node scripts/screenshots.mjs` (needs `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in the environment; it creates and deletes a temporary demo account) and `node scripts/og-image.mjs`.
- **Google search**:
  1. Open [Google Search Console](https://search.google.com/search-console) → *Add property* → **URL prefix** → `https://pannacottafactory.github.io/magician-helper/` → method **HTML tag**. Copy the `content="…"` value into the repository variable `VITE_GOOGLE_SITE_VERIFICATION`, redeploy, then click *Verify*.
  2. *Sitemaps* → submit `sitemap.xml`. *URL inspection* → the home page → *Request indexing*.
  3. Once the legal pages are completed, set `indexable: true` for them in `src/features/public/seo.ts`.
  4. A custom domain (e.g. `magicianhelper.com`) ranks and looks better than a `github.io` address, and makes `robots.txt` effective (Google only reads it at the root of a domain): add it under **Settings → Pages → Custom domain**, then set the variables `VITE_BASE_PATH=/` and `VITE_SITE_URL=https://your-domain/`.
- **Install as an app (PWA)**: on Android/Chrome, use *Install app* in the browser menu; on iPhone/Safari, *Share → Add to Home Screen*. The app shell works offline; data needs a connection.

---

## Project structure

See [CLAUDE.md](CLAUDE.md) for conventions and [PLAN.md](PLAN.md) for the full technical plan and database design.
