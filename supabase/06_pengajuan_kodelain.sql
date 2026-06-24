-- ============================================================
--  FITUR — Keperluan "Lainnya" dengan kode penomoran manual
--
--  Saat keperluan SKPP = "Lainnya", petugas mengetik sendiri deskripsi
--  keperluan (disimpan langsung pada kolom `alasan`) dan KODE penomoran
--  manual (disimpan di kolom baru `kodeLain`). Kode itu dipakai pada
--  penomoran SKPP menggantikan kode tetap.
--
--  Kolom opsional (nullable) — keperluan lain & data lama tetap valid
--  dengan kodeLain kosong/null.
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

alter table public."Pengajuan"
  add column if not exists "kodeLain" text;
