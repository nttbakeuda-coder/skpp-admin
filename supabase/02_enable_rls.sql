-- ============================================================
--  FASE 2 — CUTOVER: aktifkan RLS pada tabel data lama.
--
--  JALANKAN HANYA SETELAH dashboard versi baru (Supabase Auth) sudah
--  dideploy & diuji bekerja (lihat RUNBOOK.md langkah 5).
--
--  Setelah ini, anon key TIDAK bisa lagi membaca/menulis tabel langsung.
--  Tracker publik tetap jalan (RPC lacak = SECURITY DEFINER).
--
--  ROLLBACK instan bila bermasalah:
--    alter table public."Pengajuan" disable row level security;  -- dst.
-- ============================================================

alter table public."Pengajuan" enable row level security;
alter table public."Riwayat"   enable row level security;
alter table public."Counter"   enable row level security;
alter table public."BulkGrup"  enable row level security;

-- Tabel Akun lama (password teks polos) — kunci total, tidak dipakai lagi.
alter table public."Akun"      enable row level security;

-- ── VERIFIKASI: rowsecurity harus = true untuk semua tabel ──
-- select relname, relrowsecurity from pg_class
-- where relnamespace = 'public'::regnamespace and relkind = 'r'
-- order by relname;

-- ── UJI (harus DITOLAK / kosong, bukan data) ──
-- curl "https://phxyrferpnylgbbghgsn.supabase.co/rest/v1/Akun?select=*" \
--   -H "apikey: sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy"
