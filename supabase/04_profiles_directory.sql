-- ============================================================
--  FIX — dropdown "Staf Loket" kosong untuk role Staf Pengampu OPD
--
--  Masalah: form Daftar Periksa perlu menampilkan daftar nama
--  (staf loket & pengampu OPD), tetapi policy lama hanya mengizinkan
--  user membaca profil DIRINYA SENDIRI (atau admin membaca semua).
--  Akibatnya user non-admin tidak melihat nama siapa pun di dropdown.
--
--  Perbaikan: izinkan SEMUA user yang login (authenticated) membaca
--  tabel profiles. Data di sini tidak sensitif (username, nama, role,
--  opd) — TIDAK ada password (password tersimpan di auth.users).
--  Aksi INSERT/UPDATE/DELETE tetap terkunci seperti semula.
--
--  Jalankan di Supabase -> SQL Editor.
-- ============================================================

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

-- ── VERIFIKASI (opsional) — lihat policy yang aktif di tabel profiles ──
-- select policyname, roles, cmd, qual
-- from pg_policies
-- where schemaname = 'public' and tablename = 'profiles'
-- order by policyname;
