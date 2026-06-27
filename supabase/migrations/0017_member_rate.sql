-- =====================================================================
-- 0017 — Taux horaire facturé par membre (réglé par l'admin, en amont)
-- Le taux facturé (profiles.taux_horaire) existe déjà ; on ajoute le
-- setter sécurisé, à l'image de set_member_cost.
-- =====================================================================

create or replace function public.set_member_rate(p_member uuid, p_rate numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller      uuid := auth.uid();
  caller_cab  uuid;
  caller_role public.role_cabinet;
  target_cab  uuid;
begin
  if caller is null then
    raise exception 'Authentification requise';
  end if;

  select cabinet_id, role into caller_cab, caller_role
  from public.profiles where id = caller;
  if caller_cab is null or caller_role <> 'admin' then
    raise exception 'Action réservée aux administrateurs';
  end if;

  select cabinet_id into target_cab from public.profiles where id = p_member;
  if target_cab is null or target_cab <> caller_cab then
    raise exception 'Membre introuvable';
  end if;

  update public.profiles set taux_horaire = p_rate where id = p_member;
end;
$$;

grant execute on function public.set_member_rate(uuid, numeric) to authenticated;
