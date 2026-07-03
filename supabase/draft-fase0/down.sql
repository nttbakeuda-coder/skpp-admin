-- ============================================================
--  DRAFT — FASE 0 ROLLBACK: kembali ke kondisi SEKARANG
--  (persis seperti hasil 13_rls_hardening.sql + 04_profiles_directory.sql)
--
--  ⚠️ URUTAN AMAN: jalankan ini HANYA setelah pendaftaran/login publik
--  DIMATIKAN (bila portal sudah sempat aktif). Mengembalikan SELECT ke
--  using(true) selagi akun eksternal masih bisa login = mereka bisa
--  membaca SEMUA data. Matikan akses eksternal dulu, baru rollback ini.
-- ============================================================

-- PENGAJUAN -> kembali ke policy 13_rls_hardening
drop policy if exists "pengajuan_select"       on public."Pengajuan";
drop policy if exists "pengajuan_insert"       on public."Pengajuan";
drop policy if exists "pengajuan_update"       on public."Pengajuan";
drop policy if exists "pengajuan_delete_admin" on public."Pengajuan";
create policy "pengajuan_select"       on public."Pengajuan" for select to authenticated using (true);
create policy "pengajuan_insert"       on public."Pengajuan" for insert to authenticated with check (true);
create policy "pengajuan_update"       on public."Pengajuan" for update to authenticated using (true) with check (true);
create policy "pengajuan_delete_admin" on public."Pengajuan" for delete to authenticated using (public.is_admin());

-- RIWAYAT -> kembali ke policy 13_rls_hardening
drop policy if exists "riwayat_select"       on public."Riwayat";
drop policy if exists "riwayat_insert"       on public."Riwayat";
drop policy if exists "riwayat_delete_admin" on public."Riwayat";
create policy "riwayat_select"       on public."Riwayat" for select to authenticated using (true);
create policy "riwayat_insert"       on public."Riwayat" for insert to authenticated with check (true);
create policy "riwayat_delete_admin" on public."Riwayat" for delete to authenticated using (public.is_admin());

-- PROFILES -> kembali ke 04_profiles_directory (semua login baca semua)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);

-- ── Kolom & helper baru: DIBIARKAN (aman, tak dipakai app lama). Buang
--    hanya bila benar-benar yakin tak akan dilanjutkan:
-- alter table public."Pengajuan" drop column if exists "submittedBy";
-- alter table public."Pengajuan" drop column if exists sumber;
-- drop index    if exists "Pengajuan_submittedBy_idx";
-- drop function if exists public.is_staff();
