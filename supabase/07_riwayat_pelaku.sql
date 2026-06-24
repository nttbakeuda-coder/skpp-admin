-- ============================================================
--  FITUR — Jejak pelaku tiap tahap (audit) pada tabel Riwayat
--
--  Mencatat AKUN yang menjalankan/menginput tiap tahap proses, agar
--  admin bisa melihat siapa yang melakukan tahapan tersebut.
--    - oleh     : username (NIP) pelaku
--    - olehNama : nama pelaku
--
--  Kolom opsional (nullable) — riwayat lama tetap valid dengan nilai
--  kosong/null (ditampilkan tanpa info pelaku).
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

alter table public."Riwayat"
  add column if not exists oleh text,
  add column if not exists "olehNama" text;
