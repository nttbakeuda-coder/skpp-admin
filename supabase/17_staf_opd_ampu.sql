-- ============================================================
--  17_staf_opd_ampu.sql
--  Staf Pengampu OPD dapat mengampu BEBERAPA OPD. Disimpan sebagai array
--  (nama OPD boleh mengandung koma, jadi tidak dipisah koma).
--  Dipakai kirim-push untuk menyaring notifikasi per-OPD.
--
--  Jalankan di: Supabase (project PRODUCTION) -> SQL Editor.
-- ============================================================
alter table public.profiles add column if not exists opd_ampu text[];
