-- =====================================================================
-- 0018 — Connexion Google (OAuth)
-- Le trigger handle_new_user crée le profil à l'inscription. Google ne
-- fournit pas `nom_complet` mais `full_name` / `name` : on récupère le
-- nom depuis ces champs en repli. `on conflict` pour l'idempotence.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nom_complet)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'nom_complet',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
