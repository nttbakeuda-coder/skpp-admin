-- ============================================================================
--  SETEL TANGGAL PENGAJUAN 0001–0008
--
--  Yang dituju:
--    SKPP-2026-0001  -> tanggal masuk = HARI INI
--    SKPP-2026-0002  -> tanggal masuk = HARI INI   (stop the clock; SP2D
--                       kekurangan pangkat baru terbit hari ini)
--    SKPP-2026-0004  -> TIDAK DISENTUH (sudah sesuai)
--    SKPP-2026-0005  -> tanggal masuk = HARI INI   (stop the clock; SP2D
--                       kekurangan pangkat baru terbit hari ini)
--    SKPP-2026-0006  -> SKPP terbit 31 Agustus 2026
--    SKPP-2026-0007  -> SKPP terbit 31 Agustus 2026
--    SKPP-2026-0008  -> SKPP terbit 31 Agustus 2026
--
--  ⚠️ PENULISAN BULAN
--  Bulan HARUS ditulis dengan singkatan Indonesia -- 'Agu', bukan 'Aug'.
--  Pembaca tanggal di dasbor hanya mengenal singkatan Indonesia, sehingga
--  'Aug' tidak akan terbaca dan aging akan tampil "—".
--  ('Sep' sama pada kedua bahasa, jadi tanggal hari ini aman.)
--
--  Jalankan di: Supabase -> SQL Editor, satu blok setiap kali "Run".
-- ============================================================================


-- ── BLOK 1 — PERIKSA KEADAAN SEKARANG ───────────────────────────────────────
select id, nama, status, jalur,
       "tanggalMasuk", "estimasiSelesai", "tanggalSelesai"
  from public."Pengajuan"
 where id in ('SKPP-2026-0001','SKPP-2026-0002','SKPP-2026-0004',
              'SKPP-2026-0005','SKPP-2026-0006','SKPP-2026-0007','SKPP-2026-0008')
 order by id;


-- ── BLOK 2 — Tanggal masuk = hari ini (0001, 0002, 0005) ────────────────────
update public."Pengajuan"
   set "tanggalMasuk" = to_char(now(), 'DD Mon YYYY')
 where id in ('SKPP-2026-0001','SKPP-2026-0002','SKPP-2026-0005');


-- ── BLOK 3 — SKPP terbit 31 Agustus 2026 (0006, 0007, 0008) ─────────────────
update public."Pengajuan"
   set "tanggalSelesai" = '31 Agu 2026'
 where id in ('SKPP-2026-0006','SKPP-2026-0007','SKPP-2026-0008');


-- ── BLOK 4 — VERIFIKASI ─────────────────────────────────────────────────────
select id, nama, status,
       "tanggalMasuk", "tanggalSelesai"
  from public."Pengajuan"
 where id in ('SKPP-2026-0001','SKPP-2026-0002','SKPP-2026-0004',
              'SKPP-2026-0005','SKPP-2026-0006','SKPP-2026-0007','SKPP-2026-0008')
 order by id;


-- ============================================================================
--  CATATAN
--
--  • Aging pengajuan SELESAI dihitung tanggal masuk -> tanggal selesai.
--    Untuk 0006/0007/0008, periksa hasil BLOK 1: bila "tanggalMasuk"-nya
--    memakai bulan Inggris (mis. '20 Aug 2026'), tanggal itu tidak terbaca dan
--    aging tetap "—" meski tanggal selesai sudah diisi. Perbaiki sekalian:
--
--    -- update public."Pengajuan"
--    --    set "tanggalMasuk" = '20 Agu 2026'      -- sesuaikan tanggalnya
--    --  where id = 'SKPP-2026-0006';
--
--  • "estimasiSelesai" tidak ikut diubah. Bila tanggal estimasi sudah lewat,
--    sel aging pengajuan BERJALAN akan berwarna merah (tanda melewati batas).
-- ============================================================================
