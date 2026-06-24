-- ============================================================
--  FITUR — Catatan proses internal (tidak tampil di portal publik)
--
--  Catatan proses biasa (textarea "Catatan Proses" pada Update Proses)
--  kini disimpan di kolom `catatanInternal`, BUKAN di `catatan`. Portal
--  pelacakan publik hanya membaca kolom `catatan`, sehingga catatan proses
--  internal tidak muncul di publik.
--
--  Catatan yang TETAP publik (tetap di kolom `catatan`): alasan/formulir
--  pengembalian berkas, hasil verifikasi, & status sistem — agar pemohon
--  tahu perkembangan berkasnya.
--
--  Kolom opsional (nullable). Riwayat lama tidak terpengaruh.
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

alter table public."Riwayat"
  add column if not exists "catatanInternal" text;
