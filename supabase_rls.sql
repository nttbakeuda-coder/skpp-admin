-- ============================================================================
-- SI-PASTI / SKPP-ADMIN — Keamanan akses database (Row Level Security)
-- ----------------------------------------------------------------------------
-- Tujuan:
--   * Semua perubahan data (tambah / ubah / hapus) HARUS lewat sesi login
--     (Supabase Auth). Tanpa login, database menolak menulis/menghapus.
--   * Portal pelacakan PUBLIK (sipasti.my.id) tetap bisa MEMBACA status SKPP
--     tanpa login.
--
-- Cara pakai:
--   1. Supabase Dashboard → project SKPP → "SQL Editor".
--   2. Tempel SELURUH isi file ini → "Run".
--   3. Uji: (a) admin app login & input/edit/hapus tetap jalan;
--           (b) portal publik tetap bisa cek status;
--           (c) tanpa login, tidak bisa menulis/menghapus data.
--
-- Catatan:
--   - Manajemen akun lewat Edge Function "admin-akun" (service_role) otomatis
--     melewati RLS, jadi tidak terpengaruh.
-- ============================================================================

-- 1) Aktifkan RLS pada semua tabel
alter table public."Pengajuan" enable row level security;
alter table public."Riwayat"   enable row level security;
alter table public."Counter"   enable row level security;
alter table public."BulkGrup"  enable row level security;
alter table public."profiles"  enable row level security;

-- ----------------------------------------------------------------------------
-- 2) TABEL OPERASIONAL — tulis/ubah/hapus hanya untuk pengguna login.
--    Dipecah per-operasi agar SELECT publik (poin 3) tetap bisa ditambahkan.
-- ----------------------------------------------------------------------------

-- Pengajuan: pengguna login boleh insert/update/delete + select
drop policy if exists "auth select" on public."Pengajuan";
drop policy if exists "auth insert" on public."Pengajuan";
drop policy if exists "auth update" on public."Pengajuan";
drop policy if exists "auth delete" on public."Pengajuan";
create policy "auth select" on public."Pengajuan" for select to authenticated using (true);
create policy "auth insert" on public."Pengajuan" for insert to authenticated with check (true);
create policy "auth update" on public."Pengajuan" for update to authenticated using (true) with check (true);
create policy "auth delete" on public."Pengajuan" for delete to authenticated using (true);

-- Riwayat
drop policy if exists "auth select" on public."Riwayat";
drop policy if exists "auth insert" on public."Riwayat";
drop policy if exists "auth update" on public."Riwayat";
drop policy if exists "auth delete" on public."Riwayat";
create policy "auth select" on public."Riwayat" for select to authenticated using (true);
create policy "auth insert" on public."Riwayat" for insert to authenticated with check (true);
create policy "auth update" on public."Riwayat" for update to authenticated using (true) with check (true);
create policy "auth delete" on public."Riwayat" for delete to authenticated using (true);

-- Counter & BulkGrup: sepenuhnya hanya untuk pengguna login (tidak dibaca publik)
drop policy if exists "authenticated full access" on public."Counter";
create policy "authenticated full access" on public."Counter"
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on public."BulkGrup";
create policy "authenticated full access" on public."BulkGrup"
  for all to authenticated using (true) with check (true);

-- profiles: tiap pengguna hanya baca & ubah profilnya sendiri
drop policy if exists "read own profile" on public."profiles";
create policy "read own profile" on public."profiles"
  for select to authenticated using (auth.uid() = id);
drop policy if exists "update own profile" on public."profiles";
create policy "update own profile" on public."profiles"
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================================
-- 3) PORTAL PELACAKAN PUBLIK (sipasti.my.id)
--    Pilih SALAH SATU opsi di bawah.
-- ============================================================================

-- ── OPSI A (paling cepat, tanpa ubah kode portal) ──────────────────────────
-- Izinkan pengunjung TANPA login untuk MEMBACA (select) Pengajuan & Riwayat.
-- Tulis/ubah/hapus tetap terlindungi (hanya pengguna login).
-- KEKURANGAN: pembaca anonim secara teknis bisa membaca SEMUA baris (bukan
-- hanya yang dia punya kodenya). Cocok bila data status memang dianggap publik.
create policy "public read" on public."Pengajuan" for select to anon using (true);
create policy "public read" on public."Riwayat"   for select to anon using (true);

-- ── OPSI B (LEBIH AMAN — disarankan) ───────────────────────────────────────
-- JANGAN pakai policy "public read" di Opsi A. Sebagai gantinya, portal publik
-- memanggil fungsi RPC ini yang HANYA mengembalikan 1 pengajuan bila Nomor +
-- Kode Akses cocok. Dengan begitu pengunjung tak bisa "menarik" semua data.
-- (Perlu sedikit perubahan di kode portal: ganti query select menjadi
--  supabase.rpc('lacak_status', { p_id, p_kode }) — kirim kode portal-nya bila
--  ingin saya bantu sesuaikan.)
--
-- create or replace function public.lacak_status(p_id text, p_kode text)
-- returns jsonb language sql security definer set search_path = public as $$
--   select case when exists (
--     select 1 from public."Pengajuan" p
--     where p.id = p_id and p."kodeAkses" = p_kode
--   ) then jsonb_build_object(
--     'pengajuan', (select to_jsonb(p) from public."Pengajuan" p
--                   where p.id = p_id and p."kodeAkses" = p_kode),
--     'riwayat', coalesce((select jsonb_agg(to_jsonb(r) order by r.waktu)
--                          from public."Riwayat" r where r."pengajuanId" = p_id),
--                         '[]'::jsonb)
--   ) else null end;
-- $$;
-- grant execute on function public.lacak_status(text, text) to anon, authenticated;

-- ============================================================================
-- (Opsional) Verifikasi RLS aktif:
--   select relname, relrowsecurity from pg_class
--   where relname in ('Pengajuan','Riwayat','Counter','BulkGrup','profiles');
-- ============================================================================
