-- =====================================================================
-- LexFlow — Module Documents (GED via Supabase Storage)
-- =====================================================================

-- Métadonnées des documents (le fichier est dans Storage)
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null default public.current_cabinet_id()
                references public.cabinets (id) on delete cascade,
  dossier_id  uuid not null references public.dossiers (id) on delete cascade,
  nom         text not null,
  chemin      text not null,
  taille      bigint,
  type_mime   text,
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid() references auth.users (id) on delete set null
);

create index if not exists documents_cabinet_idx on public.documents (cabinet_id);
create index if not exists documents_dossier_idx on public.documents (dossier_id);

alter table public.documents enable row level security;

drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select using (cabinet_id = public.current_cabinet_id());

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert with check (cabinet_id = public.current_cabinet_id());

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete using (cabinet_id = public.current_cabinet_id());

-- =====================================================================
-- Storage : bucket privé "documents"
-- Convention de chemin : <cabinet_id>/<dossier_id>/<fichier>
-- => la RLS vérifie que le 1er dossier du chemin = cabinet de l'utilisateur
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "doc_storage_select" on storage.objects;
create policy "doc_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_cabinet_id()::text
  );

drop policy if exists "doc_storage_insert" on storage.objects;
create policy "doc_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_cabinet_id()::text
  );

drop policy if exists "doc_storage_delete" on storage.objects;
create policy "doc_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_cabinet_id()::text
  );
