-- ============================================================
--  FITUR — Subjenis untuk keperluan "Meninggal Dunia"
--
--  Saat keperluan SKPP = "Meninggal Dunia", penomoran TIDAK memakai
--  kode "MD" melainkan jenis pensiun turunannya: Pensiun Janda (PJ)
--  atau Pensiun Duda (PD). Pilihan itu disimpan di kolom baru `subjenis`.
--
--  Kolom bersifat opsional (nullable) — pengajuan lama & keperluan lain
--  tetap valid dengan subjenis kosong/null.
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

alter table public."Pengajuan"
  add column if not exists subjenis text;
