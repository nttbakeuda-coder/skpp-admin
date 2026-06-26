-- ============================================================
--  FITUR — Serah Terima SKPP ke Pemohon (bukti + tanda tangan + foto)
--
--  Mencatat KAPAN SKPP diserahkan, SIAPA penerimanya, beserta bukti:
--  tanda tangan digital (PNG) dan/atau foto/scan tanda terima.
--  File bukti disimpan di Supabase Storage (bucket privat), tabel hanya
--  menyimpan PATH-nya.
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

-- 1) Kolom data serah terima pada Pengajuan
alter table public."Pengajuan"
  add column if not exists "tanggalSerahTerima" text,
  add column if not exists "penerimaNama" text,
  add column if not exists "penerimaNIP" text,
  add column if not exists "penerimaStatus" text,
  add column if not exists "ttdSerahPath" text,
  add column if not exists "buktiSerahPath" text;

-- 2) Bucket privat untuk berkas bukti
insert into storage.buckets (id, name, public)
values ('bukti-serah-terima', 'bukti-serah-terima', false)
on conflict (id) do nothing;

-- 3) Akses Storage: HANYA user login (authenticated) yang boleh unggah & baca.
--    anon (portal publik) TIDAK diberi policy -> tidak bisa mengakses bukti.
drop policy if exists "serah_upload" on storage.objects;
drop policy if exists "serah_read"   on storage.objects;
drop policy if exists "serah_update" on storage.objects;

create policy "serah_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bukti-serah-terima');

create policy "serah_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'bukti-serah-terima');

create policy "serah_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'bukti-serah-terima')
  with check (bucket_id = 'bukti-serah-terima');
