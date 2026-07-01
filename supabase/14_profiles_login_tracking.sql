-- ============================================================
--  FITUR — Pelacakan login pengguna (untuk menu Admin "Aktivitas
--  Pengguna" -> tab "Status Login").
--
--  Menambahkan dua kolom pada profiles:
--    - last_login : waktu login terakhir (di-set saat login berhasil)
--    - last_seen  : heartbeat kehadiran (diperbarui berkala selama sesi
--                   terbuka) -> dipakai menandai "sedang aktif/online"
--
--  Keduanya nullable: pengguna yang BELUM PERNAH login bernilai NULL.
--
--  Akses:
--   - Pengguna memperbarui baris SENDIRI (policy profiles_update_self yang
--     sudah ada; trigger protect_profile_fields hanya memblokir perubahan
--     role/username, kolom lain boleh) -> tak perlu policy baru.
--   - Admin membaca semua (profiles_select using(true)) -> tab Status Login
--     bisa menampilkan seluruh staf.
--
--  Jalankan di Supabase -> SQL Editor SEBELUM/■SETELAH deploy frontend.
--  (Frontend aman berjalan walau migrasi belum dijalankan: tab akan
--   menampilkan petunjuk untuk menjalankan skrip ini.)
-- ============================================================

alter table public.profiles
  add column if not exists last_login timestamptz,
  add column if not exists last_seen  timestamptz;

-- (opsional) percepat pengurutan berdasarkan aktivitas terakhir
create index if not exists profiles_last_seen_idx on public.profiles (last_seen desc nulls last);

-- ── VERIFIKASI ──
-- select username, nama, role, last_login, last_seen from public.profiles order by nama;
