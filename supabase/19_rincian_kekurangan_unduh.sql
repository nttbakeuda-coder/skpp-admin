-- ============================================================================
--  19 — Izinkan pemohon mengunduh "Rincian Perhitungan Kekurangan"
--
--  MASALAH
--  Pada tahap B5, Staf Pengampu OPD mengunggah Rincian Perhitungan Kekurangan
--  Pembayaran Pangkat Pengabdian. Berkas ini MEMANG ditujukan untuk diunduh
--  Bendahara OPD lewat portal -- dokumen inilah yang ditunggu untuk menerbitkan
--  SPP-SPM.
--
--  Namun berkas tersimpan di folder ber-nama ID PETUGAS yang mengunggah,
--  sedangkan policy baca bucket 'berkas-pengajuan' hanya mengizinkan pemohon
--  membaca folder ber-nama ID DIRINYA SENDIRI. Akibatnya pembuatan signed URL
--  ditolak dan berkas gagal diunduh dari portal.
--
--  PERBAIKAN
--  Tambah satu jalur baca: berkas boleh dibaca bila TERTAUT ke pengajuan milik
--  pemanggil. Pola ini sama dengan policy 'skppfinal_obj_select' pada bucket
--  'skpp-final' yang sudah berjalan.
--
--  DIBATASI DENGAN DAFTAR IZIN (allowlist), BUKAN daftar larangan:
--  hanya jenis yang memang ditujukan untuk pemohon. Berkas kerja internal staf
--  -- "Draft SKPP" dan "SKPP (Foto Ditempel)" -- tetap TIDAK dapat diunduh
--  pemohon meski tersimpan di bucket yang sama. Menyembunyikannya di tampilan
--  saja tidak cukup; pembatasan harus di lapisan basis data.
--
--  Jalankan di: Supabase -> SQL Editor.
-- ============================================================================

drop policy if exists "berkas_obj_select" on storage.objects;

create policy "berkas_obj_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'berkas-pengajuan'
    and (
      public.is_staff()
      -- berkas yang diunggah pemohon sendiri (folder = ID dirinya)
      or (storage.foldername(name))[1] = auth.uid()::text
      -- berkas dari petugas yang memang ditujukan untuk pemohon
      or exists (
           select 1
             from public."BerkasPengajuan" b
             join public."Pengajuan" p on p.id = b."pengajuanId"
            where b.path = name
              and p."submittedBy" = auth.uid()
              and b.jenis in (
                    'Rincian Perhitungan Kekurangan Pembayaran Pangkat Pengabdian'
                  )
         )
    )
  );


-- ── VERIFIKASI ──
-- 1) Policy terpasang:
select policyname, cmd
  from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
   and policyname = 'berkas_obj_select';

-- 2) Berkas rincian yang sudah terunggah beserta pemilik pengajuannya:
select b."pengajuanId", b.jenis, b.path, p."submittedBy"
  from public."BerkasPengajuan" b
  join public."Pengajuan" p on p.id = b."pengajuanId"
 where b.jenis = 'Rincian Perhitungan Kekurangan Pembayaran Pangkat Pengabdian';
