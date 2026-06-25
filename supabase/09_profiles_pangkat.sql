-- ============================================================
--  FITUR — Pangkat/Golongan pada profil user (tersimpan di server)
--
--  Agar pangkat/golongan yang diisi user muncul di hasil cetak tanda
--  tangan secara LINTAS PERANGKAT (tidak lagi hanya di localStorage),
--  pangkat disimpan di kolom baru pada tabel profiles.
--
--  Kolom opsional (nullable). Profil lama tetap valid (pangkat kosong ->
--  tidak ada baris pangkat pada cetakan).
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

alter table public.profiles
  add column if not exists pangkat text;
