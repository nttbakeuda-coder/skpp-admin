-- ============================================================================
--  18 — Izinkan pemohon MENGGANTI berkasnya sendiri saat berkas dikembalikan
--
--  MASALAH
--  Saat staf mengembalikan berkas dengan permintaan "perbaiki dokumen yang
--  tidak sesuai", status pengajuan menjadi 'kembali'. Pemohon boleh MENGUNGGAH
--  saat status itu (policy berkas_insert sudah mengizinkan 'diajukan' &
--  'kembali'), tetapi TIDAK boleh MENGHAPUS berkas lamanya -- policy
--  berkas_delete hanya mengizinkan status 'diajukan'.
--
--  Akibatnya berkas pengganti menumpuk di atas berkas lama: satu jenis dokumen
--  tampil dua kali di dasbor dan petugas tidak tahu mana yang terbaru.
--
--  PERBAIKAN
--  Samakan daftar status pada policy DELETE dengan policy INSERT yang sudah
--  ada, yaitu ('diajukan','kembali').
--
--  BATASAN YANG TETAP DIPERTAHANKAN (tidak dilonggarkan):
--    • "uploadedBy" = auth.uid()  -> hanya berkas yang IA SENDIRI unggah.
--    • "submittedBy" = auth.uid() -> hanya pada pengajuan miliknya sendiri.
--    • status terbatas            -> hanya selama berkas ada di tangan pemohon;
--                                    begitu masuk 'proses'/'selesai', terkunci.
--    • Staf non-admin TETAP tidak mendapat hak hapus umum -- penolakan bukti
--      oleh staf tetap lewat RPC public.tolak_bukti_hutang (SECURITY DEFINER).
--
--  Jalankan di: Supabase -> SQL Editor.
-- ============================================================================

drop policy if exists "berkas_delete" on public."BerkasPengajuan";

create policy "berkas_delete" on public."BerkasPengajuan"
  for delete to authenticated
  using (
    public.is_admin()
    or ( "uploadedBy" = auth.uid()
         and "pengajuanId" in (
               select id from public."Pengajuan"
               where "submittedBy" = auth.uid()
                 and status in ('diajukan','kembali')
             ) )
  );


-- ── VERIFIKASI ──
-- Policy DELETE harus memuat 'kembali' pada daftar statusnya:
select policyname, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename  = 'BerkasPengajuan'
  and cmd = 'DELETE';
