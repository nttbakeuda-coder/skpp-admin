-- ============================================================================
--  DIAGNOSA — akun tampil "Menunggu Persetujuan" padahal sudah disetujui
--
--  Portal menampilkan pesan itu pada DUA kondisi berbeda:
--    (a) profiles.akun_status memang bukan 'approved', ATAU
--    (b) baris profil tidak terbaca sama sekali (hilang / tertahan RLS)
--        -> status jadi "tidak diketahui", dan UI memperlakukannya sbg pending.
--
--  Jalankan BLOK 1 untuk mengetahui yang mana.
-- ============================================================================


-- ── BLOK 1 — Lihat semua akun beserta profilnya ─────────────────────────────
select
  u.email,
  u.email_confirmed_at is not null           as email_terverifikasi,
  (p.id is not null)                         as profil_ada,
  p.nama,
  p.role,
  p.akun_status,
  p.opd,
  u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;

--  Cara membaca hasil:
--    • profil_ada = false        -> baris profil HILANG (lihat BLOK 3)
--    • akun_status <> 'approved' -> tinggal disetujui   (lihat BLOK 2)
--    • akun_status  = 'approved' -> data benar; masalah ada di sisi pembacaan,
--                                   bukan di basis data.


-- ── BLOK 2 — Setujui akun (bila akun_status masih pending/rejected) ─────────
--  Ganti alamat email sesuai hasil BLOK 1.

-- update public.profiles
--    set akun_status = 'approved'
--  where id = (select id from auth.users where email = 'ganti@email.anda');


-- ── BLOK 3 — Buat ulang profil (HANYA bila profil_ada = false) ──────────────
--  Profil normalnya dibuat otomatis oleh trigger saat pendaftaran. Bila baris
--  itu hilang, akun tidak bisa dipakai sama sekali. Isi nama/role/opd sesuai
--  data akun yang bersangkutan.

-- insert into public.profiles (id, username, nama, role, email, opd, akun_status)
-- select u.id, u.email, 'NAMA LENGKAP', 'bendahara', u.email, 'NAMA OPD', 'approved'
--   from auth.users u
--  where u.email = 'ganti@email.anda'
--    on conflict (id) do update
--       set akun_status = 'approved';


-- ── BLOK 4 — Verifikasi setelah perbaikan ───────────────────────────────────
-- select u.email, p.nama, p.role, p.akun_status
--   from auth.users u join public.profiles p on p.id = u.id
--  where u.email = 'ganti@email.anda';
