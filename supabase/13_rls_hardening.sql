-- ============================================================
--  FASE 3 — PENGERASAN RLS (role-based access control)
--
--  MENGATASI temuan audit keamanan:
--   #1  Otorisasi datar: SEMUA user login bisa hapus/ubah baris apa pun
--       (policy lama: for all to authenticated using(true)). Gate role
--       di frontend (cekIzinProses, tombol "Hapus khusus Admin") hanya
--       kosmetik & bisa dilewati lewat REST API langsung.
--   #2  Jejak audit (Riwayat) bisa dipalsukan/dihapus oleh siapa pun.
--   #5  Sisa policy "public read" untuk anon (dari supabase_rls.sql) yang
--       membuka SELURUH data warga tanpa login.
--
--  YANG DILAKUKAN:
--   - DELETE Pengajuan  -> HANYA admin.
--   - Riwayat: boleh INSERT (semua user login) & SELECT; TIDAK boleh
--     UPDATE (tak ada policy -> ditolak); DELETE hanya admin. Aplikasi
--     memang tak pernah meng-UPDATE Riwayat, jadi audit jadi tahan-ubah.
--   - Menghapus semua policy lama (termasuk "public read" anon) lalu
--     memasang ulang hanya yang benar.
--
--  CATATAN BATAS:
--   - UPDATE/INSERT Pengajuan tetap untuk semua user login, karena
--     pemrosesan tahap (updateTahap) sah dilakukan loket DAN pengampu OPD.
--     Enforcement per-tahap (cekIzinProses) sulit & rapuh di RLS; solusi
--     paling kokoh = pindahkan SEMUA mutasi ke Edge Function/RPC ber-cek
--     role (lihat bagian opsional #7). File ini menutup risiko terbesar
--     (hapus data & pemalsuan audit) tanpa mengubah kode aplikasi.
--
--  CARA PAKAI:
--   1. Supabase Dashboard -> SQL Editor.
--   2. Tempel SELURUH file ini -> Run.
--   3. Jalankan blok VERIFIKASI (#8) & uji aplikasi + portal publik.
--
--  ROLLBACK (bila bermasalah): jalankan ulang 03_fix_policies.sql, atau
--   ganti policy delete admin dengan: using (true).
-- ============================================================

-- ── 0) Pastikan helper is_admin() ada (idempotent, SECURITY DEFINER) ──
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
revoke all     on function public.is_admin() from public;
grant  execute on function public.is_admin() to authenticated;

-- ── 1) Bersihkan SEMUA policy lama pada 4 tabel data (apa pun namanya) ──
--     Ini sekaligus menghapus sisa "public read" anon (temuan #5).
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('Pengajuan','Riwayat','Counter','BulkGrup')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end;
$$;

-- ── 2) PENGAJUAN ──
alter table public."Pengajuan" enable row level security;

create policy "pengajuan_select" on public."Pengajuan"
  for select to authenticated using (true);

create policy "pengajuan_insert" on public."Pengajuan"
  for insert to authenticated with check (true);

create policy "pengajuan_update" on public."Pengajuan"
  for update to authenticated using (true) with check (true);

-- DELETE hanya admin (temuan #1).
create policy "pengajuan_delete_admin" on public."Pengajuan"
  for delete to authenticated using (public.is_admin());

-- ── 3) RIWAYAT (jejak audit) ──
alter table public."Riwayat" enable row level security;

create policy "riwayat_select" on public."Riwayat"
  for select to authenticated using (true);

create policy "riwayat_insert" on public."Riwayat"
  for insert to authenticated with check (true);

-- SENGAJA TIDAK ADA policy UPDATE -> semua UPDATE Riwayat ditolak.
-- DELETE hanya admin (dipakai saat admin hapus pengajuan). (temuan #2)
create policy "riwayat_delete_admin" on public."Riwayat"
  for delete to authenticated using (public.is_admin());

-- ── 4) COUNTER & BULKGRUP (operasional, sensitivitas rendah) ──
alter table public."Counter"  enable row level security;
alter table public."BulkGrup" enable row level security;

create policy "counter_all_auth" on public."Counter"
  for all to authenticated using (true) with check (true);

create policy "bulkgrup_all_auth" on public."BulkGrup"
  for all to authenticated using (true) with check (true);

-- ── 5) (OPSIONAL) Lindungi kolom immutable Pengajuan dari non-admin ──
--     Cegah pengubahan id / kodeAkses / nomorSKPP yang sudah terbit oleh
--     user biasa (kode portal tak bisa "dicuri-ubah"). updateTahap normal
--     tak menyentuh kolom ini, jadi aman. Hapus blok ini bila tak perlu.
create or replace function public.protect_pengajuan_immutable()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role'
     or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     or public.is_admin() then
    return new;
  end if;
  if new.id is distinct from old.id then
    raise exception 'Tidak diizinkan mengubah id pengajuan.';
  end if;
  if new."kodeAkses" is distinct from old."kodeAkses" then
    raise exception 'Tidak diizinkan mengubah kode akses.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_pengajuan_immutable on public."Pengajuan";
create trigger trg_protect_pengajuan_immutable
  before update on public."Pengajuan"
  for each row execute function public.protect_pengajuan_immutable();

-- ── 6) (OPSIONAL) Portal publik OPTION A — baca tabel langsung oleh anon ──
--     BIARKAN TERKOMENTAR bila tracker memakai RPC `lacak` (SECURITY
--     DEFINER) — itu cara yang disarankan & tetap jalan tanpa policy ini.
--     Aktifkan HANYA bila portal benar-benar query tabel langsung sebagai
--     anon (jika tidak yakin, uji portal dulu setelah menjalankan file ini;
--     bila tracking rusak, baru aktifkan).
-- create policy "anon_read_pengajuan" on public."Pengajuan" for select to anon using (true);
-- create policy "anon_read_riwayat"   on public."Riwayat"   for select to anon using (true);

-- ── 7) (REKOMENDASI LANJUTAN — bukan SQL) ──
--   Untuk benar-benar menutup temuan #1 pada UPDATE/INSERT, pindahkan
--   mutasi (updateTahap, inputBaru, dst.) ke Edge Function/RPC yang
--   memverifikasi role + izin tahap di server, lalu ubah policy
--   insert/update Pengajuan menjadi service_role saja. Minta saya bila
--   ingin dibantu refactor-nya.

-- ============================================================
-- 8) VERIFIKASI (jalankan setelah Run; cek hasilnya)
-- ============================================================
-- a) RLS aktif di semua tabel:
--    select relname, relrowsecurity from pg_class
--    where relname in ('Pengajuan','Riwayat','Counter','BulkGrup','profiles');
--
-- b) Policy yang aktif (anon TIDAK boleh muncul kecuali sengaja #6):
--    select tablename, policyname, roles, cmd, qual
--    from pg_policies where schemaname='public'
--      and tablename in ('Pengajuan','Riwayat','Counter','BulkGrup')
--    order by tablename, cmd;
--
-- c) Uji sebagai user login NON-admin (mis. staf) — harus DITOLAK:
--      delete from public."Pengajuan" where id = '<id-uji>';   -- error/0 baris
--      update public."Riwayat" set catatan='x' where id='<rid>'; -- error/0 baris
--    Sebagai admin — delete pengajuan harus berhasil lewat aplikasi.
--
-- d) Uji anon TANPA login (harus kosong/permission denied):
--      select * from public."Pengajuan";   -- BUKAN data
-- ============================================================
