-- =====================================================================
-- 0010 — Gestion des membres (changer le rôle / retirer du cabinet)
-- RPC SECURITY DEFINER : un admin agit sur les autres profils de SON cabinet,
-- ce que la policy "profile_update_self" n'autorise pas en direct.
-- =====================================================================

-- Changer le rôle d'un membre (admin du même cabinet uniquement).
create or replace function public.set_member_role(
  p_member uuid,
  p_role   public.role_cabinet
)
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
  target_role public.role_cabinet;
  admin_count int;
begin
  if caller is null then
    raise exception 'Authentification requise';
  end if;

  select cabinet_id, role into caller_cab, caller_role
  from public.profiles where id = caller;
  if caller_cab is null or caller_role <> 'admin' then
    raise exception 'Action réservée aux administrateurs';
  end if;

  select cabinet_id, role into target_cab, target_role
  from public.profiles where id = p_member;
  if target_cab is null or target_cab <> caller_cab then
    raise exception 'Membre introuvable';
  end if;

  -- Empêcher de retirer le dernier administrateur.
  if target_role = 'admin' and p_role <> 'admin' then
    select count(*) into admin_count
    from public.profiles where cabinet_id = caller_cab and role = 'admin';
    if admin_count <= 1 then
      raise exception 'Le cabinet doit conserver au moins un administrateur';
    end if;
  end if;

  update public.profiles set role = p_role where id = p_member;
end;
$$;

grant execute on function public.set_member_role(uuid, public.role_cabinet) to authenticated;

-- Retirer un membre du cabinet (le profil est détaché, le compte reste).
create or replace function public.remove_member(p_member uuid)
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
  target_role public.role_cabinet;
  admin_count int;
begin
  if caller is null then
    raise exception 'Authentification requise';
  end if;
  if p_member = caller then
    raise exception 'Vous ne pouvez pas vous retirer vous-même';
  end if;

  select cabinet_id, role into caller_cab, caller_role
  from public.profiles where id = caller;
  if caller_cab is null or caller_role <> 'admin' then
    raise exception 'Action réservée aux administrateurs';
  end if;

  select cabinet_id, role into target_cab, target_role
  from public.profiles where id = p_member;
  if target_cab is null or target_cab <> caller_cab then
    raise exception 'Membre introuvable';
  end if;

  if target_role = 'admin' then
    select count(*) into admin_count
    from public.profiles where cabinet_id = caller_cab and role = 'admin';
    if admin_count <= 1 then
      raise exception 'Le cabinet doit conserver au moins un administrateur';
    end if;
  end if;

  update public.profiles
    set cabinet_id = null, role = 'avocat'
    where id = p_member;
end;
$$;

grant execute on function public.remove_member(uuid) to authenticated;
