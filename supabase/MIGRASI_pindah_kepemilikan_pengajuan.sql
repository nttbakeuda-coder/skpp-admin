-- ============================================================================
--  PINDAH KEPEMILIKAN PENGAJUAN
--  SKPP-2026-0006 & SKPP-2026-0008  ->  gumaydika50@gmail.com
--
--  ⚠️ Kolom "submittedBy" dijaga pemicu trg_protect_pengajuan_immutable (inilah
--  sumber galat "P0001: submittedBy tak boleh diubah" yang pernah muncul).
--  Pemicu punya tiga syarat lolos; dipakai penanda request.jwt.claim.role
--  sebatas satu transaksi -- peran tetap 'postgres' sehingga auth.users tetap
--  terbaca, dan pemicunya TIDAK dimatikan.
--
--  Jalankan di: Supabase -> SQL Editor, satu blok setiap kali "Run".
-- ============================================================================


-- ── BLOK 1 — PERIKSA DULU (aman, hanya membaca) ─────────────────────────────

-- 1a) Apakah akun tujuan masih ada? (akun ini pernah direncanakan dihapus)
select u.id, u.email, p.nama, p.role, p.akun_status, p.opd
  from auth.users u
  left join public.profiles p on p.id = u.id
 where u.email = 'gumaydika50@gmail.com';
--  Bila KOSONG -> akun sudah terhapus. HENTIKAN; akunnya perlu dibuat dulu.

-- 1b) Keadaan kedua pengajuan sekarang
select
  g.id,
  g.nama            as nama_pegawai,
  g.opd,
  g.status,
  g.sumber,
  g."submittedBy"   as pemilik_sekarang,
  pu.email          as email_pemilik_sekarang,
  (select count(*) from public."BerkasPengajuan" b where b."pengajuanId" = g.id) as jml_berkas
from public."Pengajuan" g
left join auth.users pu on pu.id = g."submittedBy"
where g.id in ('SKPP-2026-0006', 'SKPP-2026-0008');


-- ── BLOK 2 — PINDAHKAN KEPEMILIKAN ──────────────────────────────────────────
--  Jalankan hanya bila BLOK 1a menghasilkan satu baris (akun tujuan ada).

begin;

  -- Berlaku HANYA di transaksi ini; hilang sendiri setelah commit.
  set local request.jwt.claim.role = 'service_role';

  update public."Pengajuan"
     set "submittedBy" = (select id from auth.users where email = 'gumaydika50@gmail.com')
   where id in ('SKPP-2026-0006', 'SKPP-2026-0008');

commit;


-- ── BLOK 3 — VERIFIKASI ─────────────────────────────────────────────────────
select g.id, g.nama, g.status, pu.email as pemilik_baru
  from public."Pengajuan" g
  left join auth.users pu on pu.id = g."submittedBy"
 where g.id in ('SKPP-2026-0006', 'SKPP-2026-0008');


-- ============================================================================
--  CATATAN — AKSES BERKAS SETELAH PINDAH
--
--  Berkas persyaratan tersimpan dengan pola:
--      {ID pengunggah}/{nomor pengajuan}/{nama berkas}
--
--  Izin baca bucket 'berkas-pengajuan' mensyaratkan folder ber-nama ID
--  pemanggil. Karena folder masih memakai ID pemilik LAMA, pemilik baru TIDAK
--  akan bisa membuka/mengunduh berkas pengajuannya sendiri.
--
--  Perbaikannya ada di berkas terpisah:
--      20_berkas_ikut_kepemilikan.sql
--  Jalankan setelah BLOK 3 selesai.
-- ============================================================================
