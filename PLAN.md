# Magician Helper — Plan technique (v1, à valider)

> Ce document est le plan de l'étape 1. Rien n'est codé tant qu'il n'est pas validé.
> Les sections marquées **[DÉCISION]** sont des choix que j'ai faits ; tu peux les contester.
> Les sections marquées **[QUESTION]** attendent ta réponse.

---

## 1. Décisions d'architecture

### 1.1 Routage SPA sur GitHub Pages — **[DÉCISION] BrowserRouter + `404.html`**

| Option | Pour | Contre |
|---|---|---|
| `HashRouter` (`/#/tricks`) | Zéro config | URLs moches ; **conflit avec Supabase Auth** : les liens magiques / reset password renvoient des tokens dans le `#` de l'URL, ce qui casse le routeur. |
| `BrowserRouter` + `404.html` | URLs propres (`/tricks/123`), compatible Auth | GitHub Pages renvoie un statut HTTP 404 sur les liens profonds (invisible pour l'utilisateur, sans impact : seule la landing `/` a besoin d'être indexée). |

Mise en œuvre :
- Au build, `dist/index.html` est copié en `dist/404.html`. Quand GitHub Pages ne trouve pas `/magician-helper/tricks/123`, il sert `404.html` = l'app, qui lit l'URL et affiche la bonne page.
- Supabase Auth configuré en **flux PKCE** : les liens magiques reviennent avec `?code=...` (query string) au lieu de `#access_token=...` → aucun conflit, plus sûr.
- Vite `base` = variable `VITE_BASE_PATH` (`/magician-helper/` pour `https://<user>.github.io/magician-helper/`, `/` si domaine personnalisé). React Router reçoit `basename={import.meta.env.BASE_URL}`.

### 1.2 Lecture seule appliquée **côté base de données**, pas seulement dans l'UI — **[DÉCISION]**
Masquer les boutons ne suffit pas (n'importe qui peut appeler l'API Supabase avec la clé anon). Une fonction SQL `has_write_access()` est ajoutée dans **toutes** les policies `INSERT / UPDATE / DELETE`. Après l'essai sans abonnement : `SELECT` reste autorisé (lecture + export), tout le reste est refusé par Postgres. L'UI affiche la bannière et désactive les actions.

Accès en écriture si : `trial_ends_at > now()` **ou** `subscription_status IN ('trialing','active','past_due')`.
- `past_due` garde l'accès pendant que Stripe retente le paiement (environ 1 à 3 semaines selon ta config Stripe). Ensuite Stripe passe en `canceled` → lecture seule.

### 1.3 Champs d'abonnement protégés dans `profiles` — **[DÉCISION]**
`trial_ends_at` et les champs Stripe sont dans `profiles` comme demandé, mais l'utilisateur n'a le droit de modifier que certaines colonnes (`GRANT UPDATE (display_name, currency, theme, …)`). Impossible de prolonger son essai via l'API. Seul le webhook (clé service role, côté serveur) écrit les champs Stripe.

### 1.4 Isolation entre utilisateurs dans les relations — **[DÉCISION]**
RLS empêche de *lire* les données d'autrui, mais sans précaution on pourrait *lier* son tour à l'UUID d'un objet d'un autre utilisateur. Toutes les clés étrangères sont **composites** `(objet_id, user_id) → parent(id, user_id)` : Postgres garantit que les deux côtés d'une relation appartiennent au même utilisateur.

### 1.5 Champs calculés
- **Colonne générée** pour `inventory_items.stock_status` (simple, toujours à jour).
- **Vues `security_invoker`** (respectent la RLS) pour les agrégats : `last_practiced`, durée totale de routine, difficulté moyenne, props consolidés, etc.
- **Fonctions RPC** pour les opérations multi-lignes : réordonner une routine, synchroniser la checklist d'un gig, dashboard, recherche globale.

### 1.6 Checklist de préparation des gigs — **[DÉCISION]**
Table persistante `gig_checklist_items` (sinon impossible de cocher). Une fonction `sync_gig_checklist(gig_id)` :
- ajoute les props manquants (inventaire + lignes du champ texte libre des tours),
- met à jour les quantités, supprime les items auto qui ne sont plus nécessaires,
- **conserve l'état coché** et les items ajoutés à la main.
Appelée automatiquement par trigger quand on lie/délie une routine à un gig, et via un bouton « Refresh checklist » sur la fiche gig (si les routines ont changé entre-temps).

Quantité consolidée d'un prop utilisé par plusieurs tours : **le maximum** (un jeu de cartes servant à 3 tours = 1 jeu), pas la somme.

### 1.7 Tags et catégories — **[DÉCISION]**
Stockés en `text[]` sur la ligne (index GIN). Les tags prédéfinis sont des suggestions dans l'UI ; les tags personnels sont créés en tapant, et l'autocomplétion propose tous les tags déjà utilisés. Pas de table `tags` séparée → plus simple, aucune donnée pré-remplie. Les catégories/statuts sont stockés en `snake_case` (`close_up`, `needs_polish`) avec des libellés anglais dans le frontend.

### 1.8 Annulation après suppression — **[DÉCISION]**
L'élément disparaît immédiatement de l'UI, un toast « Deleted — Undo » s'affiche 6 s, la vraie suppression n'est envoyée qu'à l'expiration (ou à la fermeture de l'onglet). Plus simple et plus fiable qu'un soft-delete avec restauration des relations.

### 1.9 Bibliothèques complémentaires
| Besoin | Choix |
|---|---|
| Glisser-déposer (kanban, ordre des routines) | `@dnd-kit` |
| Texte riche simple (Ideas) | `Tiptap` (gras, italique, listes, titres, liens), stocké en HTML, nettoyé par `DOMPurify` à l'affichage |
| Calendrier | Grille maison avec `date-fns` (léger, stylable avec Tailwind) |
| Recherche Cmd+K | `cmdk` (composant `Command` de shadcn) |
| CSV | `papaparse` ; export zip de tous les CSV : `jszip` |
| PWA | `vite-plugin-pwa` |
| Routing | `react-router` v7 (mode library) |
| Tailwind | v4 (version actuelle supportée par shadcn) |

### 1.10 Abonnement pendant l'essai — **[VALIDÉ]**
Recommandation : si l'utilisateur s'abonne au jour 5, Stripe crée l'abonnement avec `trial_end = trial_ends_at` → **premier prélèvement à la fin de ses 14 jours**, statut `trialing` jusque-là. Il ne perd pas ses jours gratuits (c'est ce qui rend le statut `trialing` utile).

---

## 2. Arborescence du projet

```
magician-helper/
├── .github/workflows/deploy.yml        # build + déploiement GitHub Pages sur push main
├── public/
│   ├── favicon.svg
│   ├── icons/ (icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png)
│   └── landing/ (screenshots), og-image.jpg  # robots.txt + sitemap.xml are generated by scripts/prerender.mjs
├── supabase/
│   ├── config.toml                     # config CLI locale + verify_jwt=false pour le webhook
│   ├── migrations/
│   │   ├── 20261102000100_core.sql               # Phase 1 : helpers, profiles, accès
│   │   ├── 20261102000200_tricks_inventory_ideas.sql  # Phase 2 (+ bucket Storage)
│   │   ├── 20261102000300_routines_practice.sql  # Phase 3
│   │   ├── 20261102000400_clients_gigs.sql       # Phase 4
│   │   ├── 20261102000500_search_dashboard.sql   # Phase 5
│   │   └── 20261102000600_billing.sql            # Phase 6 (table stripe_events)
│   └── functions/
│       ├── _shared/ (cors.ts, stripe.ts, supabase-admin.ts, auth.ts)
│       ├── create-checkout-session/index.ts
│       ├── create-portal-session/index.ts
│       ├── stripe-webhook/index.ts
│       └── delete-account/index.ts
├── src/
│   ├── main.tsx · App.tsx · router.tsx
│   ├── styles/globals.css              # tokens de thème (CSS variables), Tailwind
│   ├── lib/
│   │   ├── supabase.ts                 # client (PKCE)
│   │   ├── query-client.ts
│   │   ├── constants.ts                # enums + libellés (categories, statuses, tags…)
│   │   ├── format.ts                   # dates, devises, durées
│   │   ├── csv.ts · export.ts
│   │   └── utils.ts                    # cn() de shadcn
│   ├── types/database.ts               # généré par `supabase gen types`
│   ├── hooks/ (use-access.ts, use-theme.ts, use-media-query.ts, use-undoable-delete.ts)
│   ├── components/
│   │   ├── ui/                         # composants shadcn (générés)
│   │   ├── layout/ (AppShell, Sidebar, BottomTabs, MoreSheet, PageHeader, DetailPanel)
│   │   └── common/ (EmptyState, StarRating, TagInput, MultiSelect, Skeletons,
│   │               ReadOnlyBanner, TrialBadge, ViewSwitcher, FilterBar, ConfirmDialog)
│   └── features/
│       ├── auth/       (LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, AuthCallback, RequireAuth)
│       ├── tricks/     (api.ts, schemas.ts, TricksPage, TrickTable, TrickCards, TrickKanban, TrickForm, TrickDetail, CsvImport)
│       ├── inventory/  (… + FileUploader, gallery)
│       ├── ideas/      (… + RichTextEditor, ConvertToTrick)
│       ├── routines/   (… + SortableTrickList, RoutineStats)
│       ├── practice/   (… + PracticeTimer)
│       ├── clients/
│       ├── gigs/       (… + GigCalendar, GigChecklist)
│       ├── dashboard/
│       ├── search/     (CommandPalette)
│       ├── billing/
│       ├── settings/   (profil, devise, thème, export, suppression compte)
│       ├── landing/    (LandingPage + mockups React de l'app)
│       └── legal/      (PrivacyPage, TermsPage)
├── .env.example
├── CLAUDE.md · README.md · PLAN.md
├── index.html · vite.config.ts · tsconfig*.json · components.json · eslint.config.js
└── package.json
```

Convention par feature : `api.ts` (requêtes Supabase + hooks TanStack Query), `schemas.ts` (Zod, partagé formulaire ↔ API), composants à côté.

---

## 3. Schéma SQL complet

Conventions : `uuid` partout, `user_id uuid not null default auth.uid()`, `created_at`/`updated_at timestamptz` avec trigger, valeurs d'énumération en `text` + `CHECK` (plus simple à faire évoluer qu'un `enum` Postgres).

### 3.1 Phase 1 — socle (`..._core.sql`)

```sql
create extension if not exists pg_trgm with schema extensions;

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- PROFILES (1 ligne par utilisateur, id = auth.users.id) ----------
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  user_id                uuid generated always as (id) stored,   -- convention commune
  display_name           text check (char_length(display_name) <= 100),
  currency               char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  theme                  text not null default 'dark' check (theme in ('dark','light','system')),
  stale_trick_days       int  not null default 14 check (stale_trick_days between 1 and 365),
  trial_ends_at          timestamptz not null default (now() + interval '14 days'),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text check (subscription_status in ('trialing','active','past_due','canceled')),
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- L'utilisateur ne peut modifier QUE ces colonnes (pas trial_ends_at ni les champs Stripe)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, currency, theme, stale_trick_days) on public.profiles to authenticated;

-- Création automatique du profil à l'inscription (démarre l'essai de 14 jours)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Droit d'écriture : essai en cours OU abonnement valide
create or replace function public.has_write_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (p.trial_ends_at > now()
           or p.subscription_status in ('trialing','active','past_due'))
  );
$$;
grant execute on function public.has_write_access() to authenticated;

-- Générateur de policies standard (utilisé par toutes les migrations suivantes)
create or replace function public.apply_owner_policies(tbl regclass)
returns void language plpgsql as $$
declare t text := tbl::text;
begin
  execute format('alter table %s enable row level security', t);
  execute format('create policy owner_select on %s for select to authenticated
                  using (user_id = (select auth.uid()))', t);
  execute format('create policy owner_insert on %s for insert to authenticated
                  with check (user_id = (select auth.uid()) and public.has_write_access())', t);
  execute format('create policy owner_update on %s for update to authenticated
                  using (user_id = (select auth.uid()))
                  with check (user_id = (select auth.uid()) and public.has_write_access())', t);
  execute format('create policy owner_delete on %s for delete to authenticated
                  using (user_id = (select auth.uid()) and public.has_write_access())', t);
  execute format('create trigger set_updated_at before update on %s
                  for each row execute function public.set_updated_at()', t);
end $$;
revoke execute on function public.apply_owner_policies(regclass) from public, anon, authenticated;
```

### 3.2 Phase 2 — Tricks, Inventory, Ideas

```sql
-- ---------- TRICKS ----------
create table public.tricks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 200),
  effect           text,
  secret_and_setup text,
  categories       text[] not null default '{}'
                   check (categories <@ array['card','coin','mentalism','stage','close_up','other']),
  difficulty       smallint check (difficulty between 1 and 4),
  duration_min     int check (duration_min between 0 and 600),
  status           text not null default 'to_learn'
                   check (status in ('to_learn','learning','needs_polish','performance_ready')),
  tags             text[] not null default '{}',
  video_url        text,
  references_text  text,           -- livres, DVD, crédits…
  other_props      text,           -- accessoires courants hors inventaire (1 par ligne)
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, user_id)            -- cible des FK composites
);
select public.apply_owner_policies('public.tricks');
create index tricks_user_idx   on public.tricks (user_id, status);
create index tricks_tags_idx   on public.tricks using gin (tags);
create index tricks_name_trgm  on public.tricks using gin (name extensions.gin_trgm_ops);

-- ---------- INVENTORY ----------
create table public.inventory_items (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_name           text not null check (char_length(item_name) between 1 and 200),
  quantity            int not null default 1 check (quantity >= 0),
  low_stock_threshold int not null default 0 check (low_stock_threshold >= 0),
  stock_status        text generated always as (
                        case when quantity = 0 then 'out_of_stock'
                             when quantity <= low_stock_threshold then 'running_low'
                             else 'in_stock' end) stored,
  buy_link            text,
  cost                numeric(10,2) check (cost >= 0),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, user_id)
);
select public.apply_owner_policies('public.inventory_items');
create index inventory_user_idx  on public.inventory_items (user_id, stock_status);
create index inventory_name_trgm on public.inventory_items using gin (item_name extensions.gin_trgm_ops);

-- Fichiers / photos (métadonnées ; le binaire est dans Storage)
create table public.inventory_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id      uuid not null,
  storage_path text not null unique,       -- "{user_id}/{item_id}/{uuid}-{filename}"
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  kind         text not null check (kind in ('photo','file')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  foreign key (item_id, user_id) references public.inventory_items (id, user_id) on delete cascade
);
select public.apply_owner_policies('public.inventory_files');
create index inventory_files_item_idx on public.inventory_files (item_id);

-- Props liés à un tour (N–N)
create table public.trick_props (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trick_id        uuid not null,
  item_id         uuid not null,
  quantity_needed int not null default 1 check (quantity_needed > 0),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (trick_id, item_id),
  foreign key (trick_id, user_id) references public.tricks (id, user_id) on delete cascade,
  foreign key (item_id,  user_id) references public.inventory_items (id, user_id) on delete cascade
);
select public.apply_owner_policies('public.trick_props');
create index trick_props_item_idx on public.trick_props (item_id);

-- ---------- IDEAS ----------
create table public.ideas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  content    text,                          -- HTML Tiptap
  tags       text[] not null default '{}',
  trick_id   uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (trick_id, user_id) references public.tricks (id, user_id)
    on delete set null (trick_id)           -- PG15+ : ne met à NULL que trick_id
);
select public.apply_owner_policies('public.ideas');
create index ideas_user_idx    on public.ideas (user_id, created_at desc);
create index ideas_trick_idx   on public.ideas (trick_id);
create index ideas_tags_idx    on public.ideas using gin (tags);
create index ideas_title_trgm  on public.ideas using gin (title extensions.gin_trgm_ops);

-- ---------- STORAGE : bucket privé, un dossier par utilisateur ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('inventory', 'inventory', false, 10485760)   -- 10 Mo / fichier
on conflict (id) do nothing;

create policy inventory_read_own on storage.objects for select to authenticated
  using (bucket_id = 'inventory' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy inventory_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'inventory' and (storage.foldername(name))[1] = (select auth.uid())::text
              and public.has_write_access());
create policy inventory_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'inventory' and (storage.foldername(name))[1] = (select auth.uid())::text
         and public.has_write_access());
```
Affichage des photos via **URLs signées** (bucket privé).

### 3.3 Phase 3 — Routines, Practice Log

```sql
create table public.routines (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 200),
  audience_types text[] not null default '{}'
                 check (audience_types <@ array['kids','corporate','street','private_party','wedding','stage_show']),
  status         text not null default 'drafting' check (status in ('drafting','ready')),
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, user_id)
);
select public.apply_owner_policies('public.routines');
create index routines_name_trgm on public.routines using gin (name extensions.gin_trgm_ops);

-- Tours ordonnés d'une routine (un même tour peut apparaître 2 fois, ex. callback)
create table public.routine_tricks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  routine_id       uuid not null,
  trick_id         uuid not null,
  position         int  not null check (position >= 0),
  transition_notes text,                   -- transition / patter
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (routine_id, position) deferrable initially deferred,
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade,
  foreign key (trick_id,   user_id) references public.tricks   (id, user_id) on delete cascade
);
select public.apply_owner_policies('public.routine_tricks');
create index routine_tricks_trick_idx on public.routine_tricks (trick_id);

-- Réordonner en une transaction (appelé après un glisser-déposer)
create or replace function public.reorder_routine_tricks(p_routine_id uuid, p_ids uuid[])
returns void language sql security invoker set search_path = '' as $$
  update public.routine_tricks rt
     set position = o.ord - 1
    from unnest(p_ids) with ordinality as o(id, ord)
   where rt.id = o.id and rt.routine_id = p_routine_id;
$$;

create table public.practice_logs (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users(id) on delete cascade,
  practiced_on           date not null default current_date,
  title                  text not null check (char_length(title) between 1 and 200), -- technique_or_sleight
  trick_id               uuid,
  routine_id             uuid,
  time_spent_min         int check (time_spent_min between 0 and 1440),
  status                 text not null default 'done' check (status in ('not_started','in_progress','done')),
  notes_and_flaws_to_fix text,
  self_rating            smallint check (self_rating between 1 and 5),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  foreign key (trick_id,   user_id) references public.tricks   (id, user_id) on delete set null (trick_id),
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete set null (routine_id)
);
select public.apply_owner_policies('public.practice_logs');
create index practice_user_date_idx on public.practice_logs (user_id, practiced_on desc);
create index practice_trick_idx     on public.practice_logs (trick_id);
create index practice_routine_idx   on public.practice_logs (routine_id);

-- ---------- VUES CALCULÉES (respectent la RLS de l'appelant) ----------
create view public.tricks_overview with (security_invoker = true) as
select t.*,
       pl.last_practiced, coalesce(pl.sessions, 0) as practice_sessions,
       coalesce(pl.minutes, 0) as practice_minutes,
       (select count(distinct rt.routine_id) from public.routine_tricks rt where rt.trick_id = t.id) as routine_count
from public.tricks t
left join lateral (
  select max(p.practiced_on) as last_practiced, count(*) as sessions, sum(p.time_spent_min) as minutes
  from public.practice_logs p where p.trick_id = t.id
) pl on true;

create view public.routines_overview with (security_invoker = true) as
select r.*,
       count(rt.id)                                                  as trick_count,
       coalesce(sum(t.duration_min), 0)                              as total_duration_min,
       round(avg(t.difficulty)::numeric, 1)                          as avg_difficulty,
       count(*) filter (where rt.id is not null and t.status <> 'performance_ready') as not_ready_count
from public.routines r
left join public.routine_tricks rt on rt.routine_id = r.id
left join public.tricks t          on t.id = rt.trick_id
group by r.id;

-- Props consolidés d'une routine (inventaire), quantité = max entre les tours
create view public.routine_props with (security_invoker = true) as
select rt.routine_id, i.id as item_id, i.item_name, i.quantity, i.stock_status,
       max(tp.quantity_needed) as quantity_needed,
       array_agg(distinct t.name) as used_by_tricks
from public.routine_tricks rt
join public.trick_props tp     on tp.trick_id = rt.trick_id
join public.inventory_items i  on i.id = tp.item_id
join public.tricks t           on t.id = rt.trick_id
group by rt.routine_id, i.id;

create view public.inventory_overview with (security_invoker = true) as
select i.*, (select count(*) from public.trick_props tp where tp.item_id = i.id) as trick_count
from public.inventory_items i;
```

### 3.4 Phase 4 — Clients, Gigs, checklist

```sql
create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 200),
  company      text,
  email        text,
  phone        text,
  contact_link text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id)
);
select public.apply_owner_policies('public.clients');
create index clients_name_trgm on public.clients using gin (name extensions.gin_trgm_ops);

create table public.gigs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 200),
  client_id      uuid,
  starts_at      timestamptz not null,
  ends_at        timestamptz,
  location       text,
  event_type     text,          -- texte libre avec suggestions (Birthday, Corporate, Wedding…)
  fee            numeric(10,2) check (fee >= 0),
  currency       char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  deposit_amount numeric(10,2) check (deposit_amount >= 0),
  payment_status text not null default 'pending'
                 check (payment_status in ('pending','deposit_paid','invoiced','fully_paid')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at),
  unique (id, user_id),
  foreign key (client_id, user_id) references public.clients (id, user_id) on delete set null (client_id)
);
select public.apply_owner_policies('public.gigs');
create index gigs_user_start_idx on public.gigs (user_id, starts_at);
create index gigs_client_idx     on public.gigs (client_id);
create index gigs_title_trgm     on public.gigs using gin (title extensions.gin_trgm_ops);
-- (la devise par défaut est injectée par le frontend depuis profiles.currency)

create table public.gig_routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  gig_id     uuid not null,
  routine_id uuid not null,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gig_id, routine_id),
  foreign key (gig_id,     user_id) references public.gigs     (id, user_id) on delete cascade,
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade
);
select public.apply_owner_policies('public.gig_routines');
create index gig_routines_routine_idx on public.gig_routines (routine_id);

create table public.gig_checklist_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  gig_id          uuid not null,
  item_id         uuid,                       -- null = prop texte libre ou item manuel
  label           text not null,
  quantity_needed int not null default 1,
  source          text not null default 'manual' check (source in ('auto','manual')),
  is_checked      boolean not null default false,
  position        int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  foreign key (gig_id,  user_id) references public.gigs (id, user_id) on delete cascade,
  foreign key (item_id, user_id) references public.inventory_items (id, user_id) on delete set null (item_id)
);
select public.apply_owner_policies('public.gig_checklist_items');
create index gig_checklist_gig_idx on public.gig_checklist_items (gig_id, position);
create unique index gig_checklist_auto_item_uq  on public.gig_checklist_items (gig_id, item_id)
  where source = 'auto' and item_id is not null;
create unique index gig_checklist_auto_label_uq on public.gig_checklist_items (gig_id, lower(label))
  where source = 'auto' and item_id is null;

-- Synchronise la checklist depuis les routines liées (garde l'état coché + items manuels)
create or replace function public.sync_gig_checklist(p_gig_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_user uuid;
begin
  select user_id into v_user from public.gigs where id = p_gig_id;
  if v_user is null then return; end if;   -- gig invisible (RLS) ou inexistant

  create temp table _needed on commit drop as
    select tp.item_id, null::text as label, max(tp.quantity_needed) as qty
      from public.gig_routines gr
      join public.routine_tricks rt on rt.routine_id = gr.routine_id
      join public.trick_props tp    on tp.trick_id = rt.trick_id
     where gr.gig_id = p_gig_id
     group by tp.item_id
    union all
    select null, min(trim(l)), 1
      from public.gig_routines gr
      join public.routine_tricks rt on rt.routine_id = gr.routine_id
      join public.tricks t          on t.id = rt.trick_id
      cross join lateral regexp_split_to_table(coalesce(t.other_props, ''), E'\n') as l
     where gr.gig_id = p_gig_id and trim(l) <> ''
     group by lower(trim(l));

  -- supprimer les items auto devenus inutiles
  delete from public.gig_checklist_items c
   where c.gig_id = p_gig_id and c.source = 'auto'
     and ((c.item_id is not null and c.item_id not in (select item_id from _needed where item_id is not null))
       or (c.item_id is null and lower(c.label) not in (select lower(label) from _needed where label is not null)));

  -- ajouter / mettre à jour les items d'inventaire
  insert into public.gig_checklist_items (user_id, gig_id, item_id, label, quantity_needed, source)
  select v_user, p_gig_id, n.item_id, i.item_name, n.qty, 'auto'
    from _needed n join public.inventory_items i on i.id = n.item_id
  on conflict (gig_id, item_id) where source = 'auto' and item_id is not null
  do update set quantity_needed = excluded.quantity_needed, label = excluded.label;

  -- ajouter les props texte libre
  insert into public.gig_checklist_items (user_id, gig_id, label, source)
  select v_user, p_gig_id, n.label, 'auto' from _needed n where n.label is not null
  on conflict (gig_id, lower(label)) where source = 'auto' and item_id is null do nothing;
end $$;

create or replace function public.gig_routines_sync_trigger()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform public.sync_gig_checklist(coalesce(new.gig_id, old.gig_id));
  return null;
end $$;
create trigger gig_routines_sync after insert or delete on public.gig_routines
  for each row execute function public.gig_routines_sync_trigger();

create view public.gigs_overview with (security_invoker = true) as
select g.*, c.name as client_name,
       case g.payment_status when 'fully_paid' then coalesce(g.fee, 0)
                             when 'deposit_paid' then coalesce(g.deposit_amount, 0)
                             else 0 end as amount_received,
       (select count(*) from public.gig_checklist_items ci where ci.gig_id = g.id) as checklist_total,
       (select count(*) from public.gig_checklist_items ci where ci.gig_id = g.id and ci.is_checked) as checklist_done,
       exists (select 1 from public.gig_checklist_items ci
                 join public.inventory_items i on i.id = ci.item_id
                where ci.gig_id = g.id and (i.stock_status = 'out_of_stock' or i.quantity < ci.quantity_needed))
         as has_stock_alert
from public.gigs g
left join public.clients c on c.id = g.client_id;

create view public.clients_overview with (security_invoker = true) as
select c.*, count(g.id) as gig_count, coalesce(sum(g.fee), 0) as total_fees, max(g.starts_at) as last_gig_at
from public.clients c left join public.gigs g on g.client_id = c.id
group by c.id;
```

### 3.5 Phase 5 — Dashboard & recherche

```sql
-- Stats du dashboard ; p_today est la date locale de l'utilisateur (fuseau du navigateur)
create or replace function public.get_dashboard_stats(p_today date)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with days   as (select distinct practiced_on as d from public.practice_logs where practiced_on <= p_today),
  ranked as (select d, row_number() over (order by d desc) as rn from days),
  -- la série compte si le dernier entraînement date d'aujourd'hui ou d'hier
  anchor as (select d from ranked where rn = 1 and d >= p_today - 1),
  -- un jour fait partie de la série s'il n'y a aucun trou entre lui et l'ancre
  streak as (select count(*) as n from ranked, anchor where ranked.d = anchor.d - (ranked.rn - 1)::int)
  select jsonb_build_object(
    'streak_days', (select n from streak),
    'week_minutes', (select coalesce(sum(time_spent_min), 0) from public.practice_logs
                      where practiced_on > p_today - 7 and practiced_on <= p_today),
    'month_revenue', (select coalesce(sum(fee), 0) from public.gigs
                       where date_trunc('month', starts_at) = date_trunc('month', p_today::timestamptz)),
    'pending_amount', (select coalesce(sum(coalesce(fee,0) - amount_received), 0)
                        from public.gigs_overview where payment_status <> 'fully_paid')
  );
$$;
-- (les revenus supposent une seule devise ; si l'utilisateur mélange les devises, l'UI regroupe par devise
--  → la version finale renverra un objet par devise)

-- Recherche globale (Cmd+K)
create or replace function public.search_all(q text)
returns table (kind text, id uuid, title text, subtitle text)
language sql stable security invoker set search_path = '' as $$
  with p as (select '%' || q || '%' as pat)
  (select 'trick', id, name, status from public.tricks, p where name ilike pat or effect ilike pat or array_to_string(tags,' ') ilike pat limit 8)
  union all (select 'routine', id, name, status from public.routines, p where name ilike pat limit 8)
  union all (select 'gig', id, title, to_char(starts_at, 'YYYY-MM-DD') from public.gigs, p where title ilike pat or location ilike pat limit 8)
  union all (select 'client', id, name, company from public.clients, p where name ilike pat or company ilike pat or email ilike pat limit 8)
  union all (select 'inventory', id, item_name, stock_status from public.inventory_items, p where item_name ilike pat limit 8)
  union all (select 'idea', id, title, null from public.ideas, p where title ilike pat or content ilike pat limit 8)
  union all (select 'practice', id, title, practiced_on::text from public.practice_logs, p where title ilike pat limit 8);
$$;
```
(Les index trigram créés plus haut accélèrent ces `ILIKE`.)

### 3.6 Phase 6 — Billing

```sql
-- Idempotence du webhook : chaque event Stripe n'est traité qu'une fois
create table public.stripe_events (
  id          text primary key,         -- evt_...
  type        text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;   -- aucune policy = inaccessible sauf service role
```

### 3.7 Récapitulatif des relations navigables

| Depuis | On voit |
|---|---|
| Trick | props (inventaire + texte libre), routines, sessions d'entraînement, idées liées, last_practiced |
| Inventory item | tours qui l'utilisent, fichiers/photos, gigs dont la checklist le contient |
| Routine | tours ordonnés, props consolidés, gigs où elle est jouée, sessions d'entraînement |
| Gig | client, routines, checklist |
| Client | historique des gigs, total facturé |
| Idea | tour lié (ou « Convert to trick ») |

---

## 4. Edge Functions (Deno, Supabase)

| Fonction | Auth | Rôle |
|---|---|---|
| `create-checkout-session` | JWT utilisateur | Crée/réutilise le client Stripe (stocke `stripe_customer_id`), crée une Checkout Session `mode=subscription` avec `STRIPE_PRICE_ID`, `trial_end` = fin d'essai si > 48 h restantes, `client_reference_id = user_id`. Renvoie l'URL. |
| `create-portal-session` | JWT utilisateur | Ouvre le Customer Portal (changer de carte, factures, résilier). |
| `stripe-webhook` | Signature Stripe (`verify_jwt = false`) | Vérifie la signature, ignore les events déjà traités, gère `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed` → met à jour `subscription_status`, `current_period_end`, `cancel_at_period_end`. |
| `delete-account` | JWT utilisateur | **(ajoutée, nécessaire pour le RGPD)** : supprimer un utilisateur Auth exige la clé service role. Annule l'abonnement Stripe, vide le dossier Storage, supprime l'utilisateur → toutes les tables partent en cascade. |

Secrets côté Supabase : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `APP_URL`. (`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement.)

Frontend (`.env`, public) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BASE_PATH`, `VITE_PRICE_LABEL` (texte affiché, ex. « €9.99/month » — le vrai prix vient de Stripe).

---

## 5. Design — **[VALIDÉ] noir mat + légères touches d'or**

| Token | Sombre (défaut) | Clair |
|---|---|---|
| Fond | `#0E0E0F` (noir mat) | `#FAFAF8` |
| Surfaces | `#151516` / `#18181A` | `#FFFFFF` |
| Bordures | `#262628` | `#E4E1DA` |
| Texte / secondaire | `#ECECEA` / `#A3A3A8` (≈ 7,6:1) | `#161616` / `#5C5A55` |
| Or (accent) | `#C9A24D` (≈ 8:1 ✅ AA) | `#8A6420` (≈ 5,1:1 ✅ AA) |

L'or reste une touche : état actif de la navigation, icônes, boutons principaux, détails. Titres en Cormorant Garamond (serif élégant), texte en Inter.

Navigation : sidebar desktop (repliable), barre d'onglets mobile (Dashboard, Tricks, Routines, Gigs, More → feuille avec Practice, Inventory, Ideas, Clients, Calendar, Settings, Billing).

---

## 6. Phases & points de contrôle

| Phase | Livrable | Tu testes |
|---|---|---|
| 1 | Vite/React/TS/Tailwind/shadcn, auth (password + magic link + reset), layout responsive, thèmes, migration core, workflow GitHub Pages, CLAUDE.md, README (setup Supabase + Pages) | Inscription, connexion, navigation mobile/desktop, site en ligne |
| 2 | Tricks (table/cartes/kanban), Inventory (+ uploads), Ideas (+ Convert to trick) | CRUD, filtres, DnD kanban, photos |
| 3 | Routines (DnD, stats, props consolidés), Practice Log (+ minuteur) | Ordonnancement, calculs, last_practiced |
| 4 | Clients, Gigs, calendrier mois/liste, checklist | Checklist auto, alertes stock |
| 5 | Dashboard, Cmd+K, export CSV/JSON, import CSV tours | Stats, recherche, fichiers exportés |
| 6 | Essai, Stripe (Edge Functions), lecture seule, Billing, suppression de compte | Paiement test `4242…`, passage en lecture seule |
| 7 | Landing, Privacy/Terms (modèles), PWA, polish, accessibilité | Installation PWA, Lighthouse |

Chaque phase : `npm run build` (typecheck) + lint sans erreur, commit, arrêt pour test.

---

## 7. Points d'attention à connaître dès maintenant

1. **Emails Supabase** : le SMTP intégré est limité à quelques emails/heure et réservé aux tests. Pour la production, il faudra brancher un SMTP (ex. Resend, gratuit jusqu'à 3 000 emails/mois). Le README l'expliquera.
2. **Supabase CLI** : pas installé chez toi ; on l'utilisera via `npx supabase …` (aucune installation globale).
3. **Facturation légale** : Stripe gère les reçus ; la TVA (Stripe Tax) n'est pas incluse dans ce plan. À voir avec ton statut (auto-entrepreneur, franchise de TVA…).
4. **Projet gratuit Supabase** : mis en pause après 7 jours sans activité. OK pour le développement, à surveiller en production.
