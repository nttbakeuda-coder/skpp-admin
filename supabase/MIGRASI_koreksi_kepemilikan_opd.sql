-- ============================================================================
--  KOREKSI KEPEMILIKAN & OPD PENGAJUAN
--
--  KEADAAN YANG DITUJU (bukan langkah demi langkah, melainkan hasil akhir):
--
--    SKPP-2026-0006  ->  pemilik: gumaydika50@gmail.com
--                        OPD    : Badan Pendapatan dan Aset Daerah Provinsi NTT
--
--    SKPP-2026-0007  ->  pemilik: TETAP seperti semula (tidak disentuh)
--                        OPD    : Dinas Lingkungan Hidup dan Kehutanan Provinsi NTT
--                                 (dikembalikan; sempat terubah keliru)
--
--    SKPP-2026-0008  ->  pemilik: gumaydika50@gmail.com
--                        OPD    : Badan Pendapatan dan Aset Daerah Provinsi NTT
--
--  Skrip ini AMAN DIJALANKAN ULANG: setiap blok menetapkan nilai akhir, bukan
--  menggeser dari nilai sebelumnya. Jadi tidak masalah blok mana yang sudah
--  atau belum sempat dijalankan sebelumnya.
--
--  Jalankan di: Supabase -> SQL Editor, satu blok setiap kali "Run".
-- ============================================================================


-- ── BLOK 1 — PERIKSA KEADAAN SEKARANG ───────────────────────────────────────
select
  g.id,
  g.nama          as nama_pegawai,
  g.opd,
  g.status,
  g."submittedBy" as pemilik,
  pu.email        as email_pemilik
from public."Pengajuan" g
left join auth.users pu on pu.id = g."submittedBy"
where g.id in ('SKPP-2026-0006', 'SKPP-2026-0007', 'SKPP-2026-0008')
order by g.id;

-- Akun tujuan masih ada?  (akun ini pernah direncanakan dihapus)
select u.id, u.email, p.nama, p.role, p.akun_status, p.opd
  from auth.users u
  left join public.profiles p on p.id = u.id
 where u.email = 'gumaydika50@gmail.com';
--  Bila KOSONG -> akun sudah terhapus. Jalankan BLOK 2 saja (pengembalian
--  0007), lalu HENTIKAN dan beri tahu; akun tujuan perlu dibuat lebih dulu.


-- ── BLOK 2 — KEMBALIKAN SKPP-2026-0007 ke DLHK ──────────────────────────────
--  Hanya kolom OPD. Kepemilikan 0007 tidak pernah diubah, jadi tidak disentuh.

update public."Pengajuan"
   set opd = 'Dinas Lingkungan Hidup dan Kehutanan Provinsi NTT'
 where id = 'SKPP-2026-0007';


-- ── BLOK 3 — TETAPKAN OPD untuk 0006 & 0008 ─────────────────────────────────

update public."Pengajuan"
   set opd = 'Badan Pendapatan dan Aset Daerah Provinsi NTT'
 where id in ('SKPP-2026-0006', 'SKPP-2026-0008');


-- ── BLOK 4 — PINDAHKAN KEPEMILIKAN 0006 & 0008 ──────────────────────────────
--  Jalankan hanya bila kueri kedua BLOK 1 menghasilkan satu baris.
--  Kolom "submittedBy" dijaga pemicu trg_protect_pengajuan_immutable -- inilah
--  sumber galat "P0001: submittedBy tak boleh diubah". Penanda di bawah berlaku
--  sebatas transaksi ini; pemicunya TIDAK dimatikan.

begin;

  set local request.jwt.claim.role = 'service_role';

  update public."Pengajuan"
     set "submittedBy" = (select id from auth.users where email = 'gumaydika50@gmail.com')
   where id in ('SKPP-2026-0006', 'SKPP-2026-0008');

commit;


-- ── BLOK 5 — VERIFIKASI HASIL AKHIR ─────────────────────────────────────────
select
  g.id,
  g.nama     as nama_pegawai,
  g.opd,
  pu.email   as email_pemilik
from public."Pengajuan" g
left join auth.users pu on pu.id = g."submittedBy"
where g.id in ('SKPP-2026-0006', 'SKPP-2026-0007', 'SKPP-2026-0008')
order by g.id;

--  Yang diharapkan:
--    0006 -> Badan Pendapatan dan Aset Daerah  | gumaydika50@gmail.com
--    0007 -> Dinas Lingkungan Hidup dan Kehutanan | pemilik semula
--    0008 -> Badan Pendapatan dan Aset Daerah  | gumaydika50@gmail.com


-- ============================================================================
--  LANGKAH LANJUTAN
--
--  Setelah BLOK 4 berhasil, jalankan 20_berkas_ikut_kepemilikan.sql agar
--  pemilik baru dapat membuka berkas pengajuannya. Tanpa itu berkas tetap
--  tersimpan di folder ber-nama ID pemilik lama dan tidak akan terbaca.
--
--  Periksa juga apakah OPD tujuan sudah ada yang mengampu -- bila tidak,
--  pengajuan ini tidak memicu notifikasi ke petugas mana pun:
--
--  -- select nama, opd_ampu from public.profiles
--  --  where role = 'staf'
--  --    and 'Badan Pendapatan dan Aset Daerah Provinsi NTT' = any(opd_ampu);
-- ============================================================================
