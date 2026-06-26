-- ============================================================
--  FITUR — Simpan TMT Pindah untuk peringatan kelebihan gaji
--
--  Pegawai dengan keperluan "Pindah" yang TMT-nya sudah terlewati saat
--  input memunculkan peringatan kemungkinan kelebihan pembayaran gaji.
--  Agar peringatan itu juga muncul kembali pada tahap Verifikasi Berkas,
--  Pembuatan Draft SKPP, dan Verifikasi/Proses TTD Pimpinan, tanggal TMT
--  Pindah disimpan di kolom baru `tmtPindah`.
--
--  Kolom opsional (nullable). Data lama / non-Pindah tetap valid (kosong
--  -> tidak ada peringatan).
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

alter table public."Pengajuan"
  add column if not exists "tmtPindah" text;
