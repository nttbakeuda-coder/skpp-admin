-- ============================================================================
--  PERBAIKAN NAMA OPD PADA PENGAJUAN
--  "Dinas Lingkungan Hidup dan Kehutanan Provinsi NTT"
--       ->  "Badan Pendapatan dan Aset Daerah Provinsi NTT"
--
--  Kolom "opd" TIDAK dijaga pemicu (yang dijaga hanya id, kodeAkses,
--  submittedBy, sumber), jadi UPDATE biasa cukup -- tanpa penanda peran.
--
--  Nama OPD ditulis PERSIS seperti daftar resmi di aplikasi (refdata.js),
--  sebab pencocokan di dasbor dan penyaringan notifikasi per-OPD memakai
--  perbandingan teks apa adanya. Salah satu huruf saja membuat pengajuan
--  tidak terjaring.
--
--  Jalankan di: Supabase -> SQL Editor, satu blok setiap kali "Run".
-- ============================================================================


-- ── BLOK 1 — PERIKSA DULU: pengajuan mana saja yang ber-OPD DLHK ────────────
select
  g.id,
  g.nama          as nama_pegawai,
  g.nip,
  g.opd,
  g.status,
  g.jalur,
  g."tanggalMasuk",
  pu.email        as email_pengaju
from public."Pengajuan" g
left join auth.users pu on pu.id = g."submittedBy"
where g.opd = 'Dinas Lingkungan Hidup dan Kehutanan Provinsi NTT'
order by g.id;

--  ⚠️ COCOKKAN dengan daftar yang ingin Anda ubah sebelum menjalankan BLOK 2.
--     Permintaan awal menyebut SKPP-2026-0006 & 0008, sementara layar dasbor
--     menampilkan SKPP-2026-0007 & 0008. Pastikan nomor yang benar, lalu
--     sesuaikan daftar di BLOK 2.


-- ── BLOK 2 — UBAH NAMA OPD ──────────────────────────────────────────────────
--  Sesuaikan daftar nomor di klausa IN bila perlu.

update public."Pengajuan"
   set opd = 'Badan Pendapatan dan Aset Daerah Provinsi NTT'
 where id in ('SKPP-2026-0007', 'SKPP-2026-0008');


-- ── BLOK 3 — VERIFIKASI ─────────────────────────────────────────────────────
select id, nama, nip, opd, status
  from public."Pengajuan"
 where id in ('SKPP-2026-0007', 'SKPP-2026-0008');


-- ============================================================================
--  CATATAN
--
--  1. Kolom "opd" pada PENGAJUAN berbeda dengan kolom "opd" pada PROFIL akun
--     pengaju. Skrip ini hanya mengubah pengajuan. Bila akun pengajunya juga
--     salah OPD, perbaiki terpisah:
--
--     -- update public.profiles
--     --    set opd = 'Badan Pendapatan dan Aset Daerah Provinsi NTT'
--     --  where id = (select id from auth.users where email = 'ganti@email');
--
--  2. Perubahan OPD memengaruhi penyaringan notifikasi: Staf Pengampu OPD
--     hanya menerima pemberitahuan untuk OPD yang tercantum pada opd_ampu
--     miliknya. Pastikan ada petugas yang mengampu OPD tujuan, jika tidak
--     pengajuan ini tidak memicu notifikasi ke siapa pun:
--
--     -- select nama, opd_ampu from public.profiles
--     --  where role = 'staf'
--     --    and 'Badan Pendapatan dan Aset Daerah Provinsi NTT' = any(opd_ampu);
-- ============================================================================
