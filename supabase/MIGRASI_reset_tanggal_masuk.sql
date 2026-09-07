-- ============================================================================
--  SETEL ULANG TANGGAL MASUK — aging seluruh pengajuan menjadi 1 hari
--
--  ⚠️ TEMUAN PENTING SEBELUM DIJALANKAN
--  Meski keterangan SLA di dasbor menyebut "hari kerja", perhitungan aging
--  sebenarnya memakai HARI KALENDER:
--      Math.round((hari_ini - tanggal_masuk) / 86400000)
--  Sabtu dan Minggu TIDAK dilewati. Jadi agar angka aging menampilkan 1,
--  tanggal masuk harus diisi H-1 kalender, bukan hari kerja sebelumnya.
--
--  BLOK 2 memakai H-1 kalender -> aging tampil tepat 1.
--  Bila yang Anda maksud "hari kerja sebelumnya" (mis. Jumat, saat ini Senin),
--  pakai BLOK 2B -> aging akan tampil 3, bukan 1.
--
--  Format kolom "tanggalMasuk" adalah TEKS "DD Mon YYYY" (mis. 06 Sep 2026),
--  sama dengan yang dihasilkan aplikasi. Jangan diisi format lain.
--
--  Jalankan di: Supabase -> SQL Editor, satu blok setiap kali "Run".
-- ============================================================================


-- ── BLOK 1 — PERIKSA DULU ───────────────────────────────────────────────────
select
  id, nama, status,
  "tanggalMasuk",
  "estimasiSelesai",
  "tanggalSelesai"
from public."Pengajuan"
order by id;

select to_char(now(), 'DD Mon YYYY')                      as hari_ini,
       to_char(now() - interval '1 day',  'DD Mon YYYY')  as h_min_1_kalender,
       to_char(now() - interval '3 day',  'DD Mon YYYY')  as h_min_3_kalender;


-- ── BLOK 2 — SETEL AGING = 1 (H-1 kalender) ─────────────────────────────────
--  Estimasi selesai ikut digeser 7 hari dari tanggal masuk yang baru, agar
--  tetap selaras dengan cara aplikasi menghitungnya saat pengajuan dibuat.

update public."Pengajuan"
   set "tanggalMasuk"    = to_char(now() - interval '1 day', 'DD Mon YYYY'),
       "estimasiSelesai" = to_char(now() + interval '6 day', 'DD Mon YYYY');


-- ── BLOK 2B — ALTERNATIF: hari kerja sebelumnya ─────────────────────────────
--  Pakai HANYA bila yang dimaksud benar-benar "hari kerja sebelumnya".
--  Saat ini Senin, sehingga hari kerja sebelumnya = Jumat (H-3).
--  Catatan: aging akan tampil 3, bukan 1.

-- update public."Pengajuan"
--    set "tanggalMasuk"    = to_char(now() - interval '3 day', 'DD Mon YYYY'),
--        "estimasiSelesai" = to_char(now() + interval '4 day', 'DD Mon YYYY');


-- ── BLOK 3 — VERIFIKASI ─────────────────────────────────────────────────────
select id, nama, status, "tanggalMasuk", "estimasiSelesai", "tanggalSelesai"
  from public."Pengajuan"
 order by id;


-- ============================================================================
--  DUA HAL YANG PERLU DIKETAHUI
--
--  1. PENGAJUAN YANG SUDAH SELESAI
--     Untuk pengajuan berstatus selesai, aging dihitung masuk -> selesai,
--     bukan sampai hari ini. Bila "tanggalSelesai" ternyata LEBIH AWAL dari
--     tanggal masuk yang baru, aging-nya akan tampil 0.
--     Bila hanya pengajuan berjalan yang ingin diubah, tambahkan penyaring:
--         where status <> 'selesai'
--
--  2. RIWAYAT TIDAK IKUT BERUBAH
--     Tabel "Riwayat" menyimpan waktu sebenarnya tiap tahap dan TIDAK disentuh
--     skrip ini. Setelah tanggal masuk digeser, tab Riwayat Lengkap masih
--     menampilkan waktu asli -- sehingga bisa terlihat lebih awal daripada
--     tanggal masuk. Ini konsekuensi yang wajar diketahui bila dokumen dipakai
--     sebagai bukti pelaksanaan.
-- ============================================================================
