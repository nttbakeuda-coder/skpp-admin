-- ============================================================================
--  PEMBERSIHAN DATA UJI COBA — KATONG SKPP
--
--  Menghapus SELURUH pengajuan beserta data turunannya, lalu mengembalikan
--  penomoran pengajuan ke 0001.
--
--  ⚠️  TIDAK DAPAT DIBATALKAN. Jalankan BLOK 1 lebih dulu dan pastikan
--      seluruh baris yang muncul memang data uji coba — bukan pengajuan
--      pemohon sungguhan.
--
--  Akun pengguna (auth.users & profiles) TIDAK ikut dihapus.
--
--  Jalankan di: Supabase → SQL Editor. Satu blok setiap kali "Run".
-- ============================================================================


-- ── BLOK 1 — PERIKSA DULU (aman, hanya membaca) ─────────────────────────────
--  Lihat apa saja yang akan terhapus. Pastikan semuanya data uji coba.

select
  p.id,
  p.nama,
  p.opd,
  p.status,
  p.sumber,
  p."tanggalMasuk",
  pr.email  as email_pengaju,
  (select count(*) from public."BerkasPengajuan" b where b."pengajuanId" = p.id) as jml_berkas,
  (select count(*) from public."Riwayat"         r where r."pengajuanId" = p.id) as jml_riwayat
from public."Pengajuan" p
left join public.profiles pr on pr.id = p."submittedBy"
order by p.id;

-- Rekap jumlah baris per tabel:
select 'Pengajuan'       as tabel, count(*) from public."Pengajuan"
union all select 'BerkasPengajuan', count(*) from public."BerkasPengajuan"
union all select 'Riwayat',         count(*) from public."Riwayat"
union all select 'SurveiSKM',       count(*) from public."SurveiSKM"
union all select 'Counter',         count(*) from public."Counter";


-- ── BLOK 2 — HAPUS SEMUA & RESET NOMOR ──────────────────────────────────────
--  Dibungkus transaksi: bila salah satu perintah gagal, SEMUA dibatalkan
--  sehingga data tidak terhapus separuh.
--
--  Urutan penting:
--    • Riwayat  -> dihapus manual (tidak punya relasi cascade)
--    • Berkas & Survei -> sebenarnya ikut terhapus otomatis bersama Pengajuan,
--      tetapi dihapus eksplisit agar tidak ada sisa bila relasinya berbeda.
--    • Counter  -> dikosongkan; pengajuan berikutnya otomatis mulai dari 0001.

begin;

  delete from public."Riwayat";
  delete from public."SurveiSKM";
  delete from public."BerkasPengajuan";
  delete from public."Pengajuan";

  -- Kosongkan penomoran. Baris Counter dibuat ulang otomatis saat pengajuan
  -- pertama masuk, dengan nilai 1 -> SKPP-<tahun>-0001.
  delete from public."Counter";

  -- Grup pengajuan kolektif (bila dipakai). Aman bila tabelnya sudah kosong.
  delete from public."BulkGrup";

commit;


-- ── BLOK 3 — VERIFIKASI ─────────────────────────────────────────────────────
--  Seluruh angka harus 0.

select 'Pengajuan'       as tabel, count(*) from public."Pengajuan"
union all select 'BerkasPengajuan', count(*) from public."BerkasPengajuan"
union all select 'Riwayat',         count(*) from public."Riwayat"
union all select 'SurveiSKM',       count(*) from public."SurveiSKM"
union all select 'Counter',         count(*) from public."Counter";


-- ============================================================================
--  CATATAN — BERKAS DI STORAGE
--
--  Perintah SQL di atas menghapus METADATA berkas, bukan file fisiknya.
--  Supabase tidak mengizinkan penghapusan storage.objects lewat SQL.
--
--  Bersihkan file lewat: Supabase → Storage → pilih bucket → pilih folder →
--  Delete. Bucket yang perlu dibersihkan:
--      • berkas-pengajuan   (dokumen persyaratan pemohon)
--      • skpp               (draft & pindaian SKPP)
--
--  JANGAN hapus bucket "panduan" — berisi buku panduan yang dipakai portal.
-- ============================================================================
