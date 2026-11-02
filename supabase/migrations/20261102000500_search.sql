-- =============================================================================
-- Magician Helper — Phase 5: global search (Cmd/Ctrl+K)
-- One call searches every object type of the current user (RLS applies).
-- The trigram indexes created in earlier migrations speed up these ILIKEs.
-- =============================================================================

create or replace function public.search_all(q text, per_kind int default 6)
returns table (kind text, id uuid, title text, subtitle text)
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    -- escape LIKE wildcards typed by the user
    select '%' || replace(replace(replace(btrim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pat,
           least(greatest(per_kind, 1), 20) as lim
  )
  (select 'trick', t.id, t.name, t.status
     from public.tricks t, params p
    where t.name ilike p.pat or t.effect ilike p.pat or array_to_string(t.tags, ' ') ilike p.pat
    order by (t.name ilike p.pat) desc, t.name
    limit (select lim from params))
  union all
  (select 'routine', r.id, r.name, r.status
     from public.routines r, params p
    where r.name ilike p.pat or r.description ilike p.pat
    order by r.name
    limit (select lim from params))
  union all
  (select 'gig', g.id, g.title, to_char(g.starts_at, 'YYYY-MM-DD')
     from public.gigs g, params p
    where g.title ilike p.pat or g.location ilike p.pat or g.event_type ilike p.pat
    order by g.starts_at desc
    limit (select lim from params))
  union all
  (select 'client', c.id, c.name, coalesce(c.company, c.email)
     from public.clients c, params p
    where c.name ilike p.pat or c.company ilike p.pat or c.email ilike p.pat or c.phone ilike p.pat
    order by c.name
    limit (select lim from params))
  union all
  (select 'inventory', i.id, i.item_name, i.stock_status
     from public.inventory_items i, params p
    where i.item_name ilike p.pat or i.notes ilike p.pat
    order by i.item_name
    limit (select lim from params))
  union all
  (select 'idea', d.id, d.title, array_to_string(d.tags, ', ')
     from public.ideas d, params p
    where d.title ilike p.pat or d.content ilike p.pat or array_to_string(d.tags, ' ') ilike p.pat
    order by d.updated_at desc
    limit (select lim from params))
  union all
  (select 'practice', l.id, l.title, l.practiced_on::text
     from public.practice_logs l, params p
    where l.title ilike p.pat or l.notes_and_flaws_to_fix ilike p.pat
    order by l.practiced_on desc
    limit (select lim from params));
$$;

revoke execute on function public.search_all(text, int) from public, anon;
grant execute on function public.search_all(text, int) to authenticated;
