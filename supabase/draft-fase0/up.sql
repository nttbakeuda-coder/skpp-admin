-- ============================================================
--  DRAFT — FASE 0: Fondasi RLS per-pemilik
--  (prasyarat sebelum portal pengajuan publik / login eksternal aktif)
--
--  SIFAT: ADITIF & AMAN untuk kondisi SEKARANG (hanya staf yang login).
--   - is_staff() bernilai TRUE untuk semua akun saat ini (admin/operator/
--     staf) -> perilaku dashboard TIDAK berubah.
--   - Saat nanti ada akun eksternal (pemohon/bendahara), mereka OTOMATIS
--     terkunci hanya ke baris miliknya (submittedBy = dirinya).
--
--  BELUM termasuk: insert/update oleh eksternal, persetujuan akun, upload
--  berkas, status 'diajukan' aktif -> itu Fase 1.
--
--  ROLLBACK: jalankan down.sql (kembali persis ke kondisi 13_rls_hardening).
--  JANGAN dijalankan di produksi sampai desain disepakati.
-- ============================================================

-- 0) Helper: apakah pemanggil = staf internal?
--    SECURITY DEFINER -> menembus RLS (hindari rekursi saat dipakai di
--    policy tabel profiles), sama pola dengan is_admin().
create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','operator','staf')
  );
$$;
revoke all     on function public.is_staff() from public;
grant  execute on function public.is_staff() to authenticated;

-- 1) Kolom kepemilikan & sumber pada Pengajuan (aditif; nullable/default,
--    sehingga app versi sekarang mengabaikannya).
alter table public."Pengajuan"
  add column if not exists "submittedBy" uuid references auth.users(id) on delete set null,
  add column if not exists sumber text not null default 'loket';   -- 'loket' | 'online'
-- Catatan: status pra-loket 'diajukan' baru dipakai di Fase 1; kolom status
-- yang ada tetap ('proses'|'kembali'|'selesai') hingga portal diaktifkan.
create index if not exists "Pengajuan_submittedBy_idx" on public."Pengajuan" ("submittedBy");

-- 2) PENGAJUAN — SELECT/UPDATE jadi (staf ATAU pemilik). INSERT tetap
--    staf-only di Fase 0 (insert eksternal ditambah di Fase 1). DELETE admin.
drop policy if exists "pengajuan_select"       on public."Pengajuan";
drop policy if exists "pengajuan_insert"       on public."Pengajuan";
drop policy if exists "pengajuan_update"       on public."Pengajuan";
drop policy if exists "pengajuan_delete_admin" on public."Pengajuan";

create policy "pengajuan_select" on public."Pengajuan"
  for select to authenticated
  using ( public.is_staff() or "submittedBy" = auth.uid() );

create policy "pengajuan_insert" on public."Pengajuan"
  for insert to authenticated
  with check ( public.is_staff() );

create policy "pengajuan_update" on public."Pengajuan"
  for update to authenticated
  using ( public.is_staff() )
  with check ( public.is_staff() );

create policy "pengajuan_delete_admin" on public."Pengajuan"
  for delete to authenticated
  using ( public.is_admin() );

-- 3) RIWAYAT — staf lihat semua; pemohon hanya riwayat pengajuan miliknya.
--    INSERT staf-only; tanpa UPDATE (audit tahan-ubah); DELETE admin.
drop policy if exists "riwayat_select"       on public."Riwayat";
drop policy if exists "riwayat_insert"       on public."Riwayat";
drop policy if exists "riwayat_delete_admin" on public."Riwayat";

create policy "riwayat_select" on public."Riwayat"
  for select to authenticated
  using (
    public.is_staff()
    or "pengajuanId" in (select id from public."Pengajuan" where "submittedBy" = auth.uid())
  );

create policy "riwayat_insert" on public."Riwayat"
  for insert to authenticated
  with check ( public.is_staff() );

create policy "riwayat_delete_admin" on public."Riwayat"
  for delete to authenticated
  using ( public.is_admin() );

-- 4) PROFILES — direktori dibatasi: staf baca semua (dibutuhkan dropdown
--    verifikasi), pemohon hanya baca profilnya sendiri.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using ( public.is_staff() or id = auth.uid() );

-- ── VERIFIKASI ──
-- a) Staf (login skrg) HARUS tetap melihat semua pengajuan:
--    select count(*) from public."Pengajuan";
-- b) Cek policy terpasang:
--    select tablename, policyname, cmd, qual from pg_policies
--    where schemaname='public' and tablename in ('Pengajuan','Riwayat','profiles')
--    order by tablename, cmd;
