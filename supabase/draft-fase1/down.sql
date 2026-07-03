-- ============================================================
--  DRAFT — FASE 1 ROLLBACK: kembali ke kondisi Fase 0
--  ⚠️ URUTAN AMAN: matikan pendaftaran/login publik dulu bila portal aktif,
--  baru jalankan ini. Idealnya cukup dipakai di staging.
-- ============================================================

-- 9) RPC
drop function if exists public.ajukan_pengajuan_online(jsonb);

-- 8) Storage policies (bucket dibiarkan; hapus manual bila mau)
drop policy if exists "berkas_obj_insert" on storage.objects;
drop policy if exists "berkas_obj_select" on storage.objects;
drop policy if exists "berkas_obj_delete" on storage.objects;
-- delete from storage.buckets where id='berkas-pengajuan';  -- hanya bila bucket kosong

-- 7) BerkasPengajuan
drop table if exists public."BerkasPengajuan" cascade;

-- 6) Pengajuan policies -> kembali ke Fase 0 (insert/update staf-only; delete admin)
drop policy if exists "pengajuan_insert" on public."Pengajuan";
drop policy if exists "pengajuan_update" on public."Pengajuan";
drop policy if exists "pengajuan_delete" on public."Pengajuan";
drop policy if exists "pengajuan_delete_admin" on public."Pengajuan";
create policy "pengajuan_insert" on public."Pengajuan"
  for insert to authenticated with check ( public.is_staff() );
create policy "pengajuan_update" on public."Pengajuan"
  for update to authenticated using ( public.is_staff() ) with check ( public.is_staff() );
create policy "pengajuan_delete_admin" on public."Pengajuan"
  for delete to authenticated using ( public.is_admin() );

-- 5) protect_pengajuan_immutable -> versi Fase 0 (hanya id & kodeAkses)
create or replace function public.protect_pengajuan_immutable()
returns trigger language plpgsql as $$
begin
  if current_user = 'service_role'
     or coalesce(current_setting('request.jwt.claim.role', true),'') = 'service_role'
     or public.is_admin() then
    return new;
  end if;
  if new.id          is distinct from old.id          then raise exception 'id tak boleh diubah'; end if;
  if new."kodeAkses" is distinct from old."kodeAkses" then raise exception 'kodeAkses tak boleh diubah'; end if;
  return new;
end;
$$;

-- 4) & 3) helper
drop function if exists public.gen_kode_akses(int);
drop function if exists public.is_approved_pemohon();

-- 2) trigger pendaftaran eksternal
drop trigger  if exists trg_handle_new_external_user on auth.users;
drop function if exists public.handle_new_external_user();

-- 1) PROFILES -> kembalikan CHECK role ke internal saja.
--    ⚠️ Akan GAGAL bila masih ada baris role pemohon/bendahara. Bersihkan dulu:
--    delete from public.profiles where role in ('pemohon','bendahara');
--    (dan hapus akun auth-nya bila perlu). Baru:
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('staf','operator','admin'));

-- Kolom akun_status & email: DIBIARKAN (aman). Buang hanya bila yakin:
-- alter table public.profiles drop column if exists akun_status;
-- alter table public.profiles drop column if exists email;
