-- =====================================================================
-- 0019 — Tutoriel d'intro (vu une seule fois par utilisateur)
-- =====================================================================

alter table public.profiles
  add column if not exists tutoriel_vu boolean not null default false;

-- Chaque utilisateur peut marquer son propre tutoriel comme vu.
create or replace function public.mark_tutorial_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  update public.profiles set tutoriel_vu = true where id = auth.uid();
end;
$$;

grant execute on function public.mark_tutorial_seen() to authenticated;
