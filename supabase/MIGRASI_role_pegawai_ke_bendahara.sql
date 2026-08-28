-- ============================================================================
--  MIGRASI ROLE — thaocalvin0@gmail.com : pemohon (Pegawai) -> bendahara (OPD)
--
--  Dasbor Manajemen Akun hanya mengelola role INTERNAL (Staf Pengampu OPD,
--  Staf Loket, Admin); untuk akun portal ia hanya menyetujui/menolak. Jadi
--  perubahan role akun portal dilakukan lewat skrip ini.
--
--  ⚠️ PENTING — pemicu trg_protect_profile_fields MENOLAK perubahan kolom role
--  kecuali pemanggilnya service_role. Di SQL Editor pemanggilnya 'postgres',
--  sehingga UPDATE biasa akan gagal dengan "Tidak diizinkan mengubah role.".
--  BLOK 2 menyiasatinya dengan SET LOCAL ROLE service_role di dalam transaksi
--  -- pemicunya TIDAK dimatikan, jadi perlindungan tetap utuh bagi pengguna
--  biasa.
--
--  Jalankan di: Supabase -> SQL Editor, satu blok setiap kali "Run".
-- ============================================================================


-- ── BLOK 1 — Periksa keadaan sekarang ───────────────────────────────────────
select
  u.email,
  p.nama,
  p.role                     as role_sekarang,
  p.akun_status,
  p.opd,
  coalesce(p.opd, '') <> ''  as opd_terisi,
  (select count(*) from public."Pengajuan" g where g."submittedBy" = u.id) as jml_pengajuan
from auth.users u
join public.profiles p on p.id = u.id
where u.email = 'thaocalvin0@gmail.com';

--  Yang perlu diperhatikan sebelum lanjut:
--    • role_sekarang harus 'pemohon'
--    • opd_terisi sebaiknya true -- Bendahara OPD mengajukan ATAS NAMA pegawai
--      di instansinya, jadi kolom OPD dipakai sebagai instansi yang ditangani.
--      Bila kosong, isi lewat BLOK 3.


-- ── BLOK 2 — Ubah role menjadi bendahara ────────────────────────────────────
begin;

  set local role service_role;   -- melewati pemicu penjaga kolom role

  update public.profiles
     set role = 'bendahara'
   where id = (select id from auth.users where email = 'thaocalvin0@gmail.com');

commit;


-- ── BLOK 3 — (Bila perlu) isi OPD yang ditangani ────────────────────────────
--  Hapus tanda komentar dan ganti nama OPD sesuai instansi yang bersangkutan.
--  Nama harus PERSIS sama dengan daftar OPD di aplikasi.

-- begin;
--   set local role service_role;
--   update public.profiles
--      set opd = 'Dinas Kesehatan Provinsi NTT'
--    where id = (select id from auth.users where email = 'thaocalvin0@gmail.com');
-- commit;


-- ── BLOK 4 — Verifikasi ─────────────────────────────────────────────────────
select u.email, p.nama, p.role, p.akun_status, p.opd
  from auth.users u
  join public.profiles p on p.id = u.id
 where u.email = 'thaocalvin0@gmail.com';

--  role harus sudah 'bendahara'.


-- ============================================================================
--  DAMPAK SETELAH MIGRASI
--
--  Yang BERUBAH bagi pengguna ini:
--    • Boleh mengajukan LEBIH DARI SATU pengajuan (Pegawai dibatasi satu).
--    • Formulir meminta nama & NIP pegawai yang bersangkutan, bukan memakai
--      identitas dirinya sendiri.
--    • Tersedia pengajuan kolektif (bulk) untuk banyak pegawai sekaligus.
--    • Label isian OPD menjadi "OPD / Instansi (yang Anda tangani)".
--    • Unduhan panduan mengarah ke buku panduan Bendahara OPD.
--
--  Yang TIDAK berubah:
--    • Alamat email, kata sandi, dan sesi login tetap sama.
--    • Pengajuan yang sudah ada tetap miliknya dan tetap dapat dipantau.
--    • Status persetujuan akun tidak ikut ter-reset.
--
--  Pengguna perlu MUAT ULANG halaman (atau keluar lalu masuk lagi) agar
--  tampilan portal mengikuti role barunya.
-- ============================================================================
