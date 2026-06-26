-- ============================================================
--  FITUR — Status ASN (PNS/PPPK) & Jabatan pada profil user
--
--  - status_asn : "PNS" atau "PPPK". Menentukan daftar pilihan
--    pangkat/golongan di halaman Profil (PNS = pangkat lama;
--    PPPK = Golongan I–XV Perpres 11/2024).
--  - jabatan    : jabatan pelaksana user.
--
--  Kolom opsional (nullable). User tanpa status_asn dianggap "PNS".
--
--  Jalankan di Supabase -> SQL Editor SEBELUM deploy frontend baru.
-- ============================================================

alter table public.profiles
  add column if not exists status_asn text,
  add column if not exists jabatan text;

-- ── SEED data sesuai lampiran ──────────────────────────────────────────────
--  CATATAN: NIP (username) di bawah ditranskrip dari gambar -> MOHON VERIFIKASI
--  ketepatan setiap NIP. Hanya akun dengan username yang cocok yang ter-update.
update public.profiles p set
  jabatan    = v.jabatan,
  status_asn = v.status_asn
from (values
  -- NIP (username),                jabatan,                                          status ASN
  ('199508292025061002','Analis Keuangan Pusat dan Daerah Ahli Pertama','PNS'),
  ('198107222025212013','Penata Layanan Operasional','PPPK'),
  ('199110122025211037','Penata Layanan Operasional','PPPK'),
  ('199502132025212030','Penata Layanan Operasional','PPPK'),
  ('199803162025211031','Penata Layanan Operasional','PPPK'),
  ('199512132025212026','Penata Layanan Operasional','PPPK'),
  ('198004302025211017','Penata Layanan Operasional','PPPK'),
  ('198107262025212012','Penata Layanan Operasional','PPPK'),
  ('198206222025211022','Penata Layanan Operasional','PPPK'),
  ('198007312025211017','Penata Layanan Operasional','PPPK'),
  ('198203102025212019','Penata Layanan Operasional','PPPK'),
  ('199803162025211016','Penata Layanan Operasional','PPPK'),
  ('199309192025211026','Pranata Komputer Ahli Pertama','PPPK'),
  ('200201142025212006','Pengadministrasi Perkantoran','PPPK'),
  ('200201092025062001','Analis Keuangan Pusat dan Daerah Ahli Pertama','PPPK'),
  ('197507072003121015','Kepala Bidang Perbendaharaan','PNS'),
  ('198407032011011005','Penelaah Teknis Kebijakan','PNS'),
  ('198912172014022002','Penelaah Teknis Kebijakan','PNS'),
  ('198506112015022003','Penelaah Teknis Kebijakan','PNS'),
  ('198307212015022001','Penelaah Teknis Kebijakan','PNS'),
  ('197009261993032003','Pengolah Data dan Informasi','PNS'),
  ('198308122010011024','Penelaah Teknis Kebijakan','PNS'),
  ('197612112010012008','Penelaah Teknis Kebijakan','PNS'),
  ('198402152015021001','Penelaah Teknis Kebijakan','PNS'),
  ('198405122010012032','Penelaah Teknis Kebijakan','PNS'),
  ('196906251994032007','Penelaah Teknis Kebijakan','PNS'),
  ('198605222011012006','Pengolah Data dan Informasi','PNS')
) as v(username, jabatan, status_asn)
where p.username = v.username;

-- ── VERIFIKASI hasil seed (opsional) ──
-- select username, nama, jabatan, status_asn from public.profiles
-- where status_asn is not null order by status_asn, nama;
