-- ============================================================================
--  20 — Akses berkas mengikuti KEPEMILIKAN pengajuan, bukan folder penyimpanan
--
--  MASALAH
--  Izin baca bucket 'berkas-pengajuan' bertumpu pada nama folder:
--      {ID pengunggah}/{nomor pengajuan}/{nama berkas}
--  Pemohon hanya boleh membaca folder ber-nama ID dirinya. Aturan ini runtuh
--  begitu kepemilikan pengajuan berpindah: folder tetap memakai ID pemilik
--  LAMA, sehingga pemilik BARU tak bisa membuka berkas pengajuannya sendiri.
--
--  PERBAIKAN
--  Tambah jalur baca: berkas boleh dibaca bila tertaut ke pengajuan milik
--  pemanggil DAN diunggah oleh pihak NON-INTERNAL (pemohon/bendahara).
--
--  Kenapa disaring lewat peran pengunggah, bukan daftar nama dokumen:
--  bucket yang sama menyimpan berkas kerja internal staf ("Draft SKPP",
--  "SKPP (Foto Ditempel)") yang belum resmi dan tidak boleh diunduh pemohon.
--  Menyaring lewat peran pengunggah membuat berkas internal tertutup dengan
--  sendirinya -- termasuk jenis internal baru yang ditambahkan kelak, tanpa
--  perlu memperbarui daftar nama apa pun.
--
--  Jalur khusus untuk dokumen yang MEMANG dikirim staf kepada pemohon
--  (Rincian Perhitungan Kekurangan, lihat migrasi 19) tetap dipertahankan.
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

      -- (a) berkas di folder milik pemanggil sendiri
      or (storage.foldername(name))[1] = auth.uid()::text

      -- (b) berkas non-internal pada pengajuan milik pemanggil, di folder mana
      --     pun tersimpan -- menutupi kasus kepemilikan yang berpindah
      or exists (
           select 1
             from public."BerkasPengajuan" b
             join public."Pengajuan" p  on p.id = b."pengajuanId"
             left join public.profiles pr on pr.id = b."uploadedBy"
            where b.path = name
              and p."submittedBy" = auth.uid()
              and coalesce(pr.role, '') not in ('admin', 'operator', 'staf')
         )

      -- (c) dokumen dari staf yang memang ditujukan untuk pemohon (migrasi 19)
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

-- 2) Berkas internal HARUS tetap tertutup bagi pemohon -- daftar berikut
--    memperlihatkan berkas yang diunggah staf (selain rincian):
select b."pengajuanId", b.jenis, pr.role as peran_pengunggah
  from public."BerkasPengajuan" b
  left join public.profiles pr on pr.id = b."uploadedBy"
 where coalesce(pr.role,'') in ('admin','operator','staf')
 order by b."pengajuanId";
