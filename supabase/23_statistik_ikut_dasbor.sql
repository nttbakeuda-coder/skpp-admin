-- ============================================================================
--  23 — Samakan statistik beranda publik dengan angka di dasbor
--
--  MASALAH
--  Angka pada beranda publik dan dasbor berbeda karena dihitung dari sumber
--  yang berbeda sama sekali:
--
--                  | Dasbor                        | Beranda publik (lama)
--    total         | TIDAK menghitung antrean      | seluruh baris Pengajuan
--                  | online yang belum diverifikasi|
--    rata-rata     | tanggalMasuk -> tanggalSelesai| rentang waktu di Riwayat
--
--  Akibatnya beranda menampilkan 13 berkas & 4 hari, sementara dasbor 12
--  berkas & 2 hari untuk data yang sama.
--
--  PERBAIKAN
--  Rumus beranda dibuat mengikuti dasbor:
--
--  1. Pengajuan online berstatus 'diajukan'/'ditolak' TIDAK dihitung. Berkas
--     itu belum diverifikasi loket sehingga belum masuk alur normal -- di
--     dasbor pun hanya tampil pada menu "Antrean Pengajuan Online".
--
--  2. Rata-rata dihitung dari selisih tanggalMasuk -> tanggalSelesai, sama
--     seperti kartu "Rata-rata Selesai" di dasbor. Satuannya HARI KALENDER,
--     bukan hari kerja -- karena itu label di beranda ikut disesuaikan.
--
--  Jalankan di: Supabase -> SQL Editor.
-- ============================================================================


-- ── Pembaca tanggal "DD Mon YYYY" ───────────────────────────────────────────
--  Kolom tanggal disimpan sebagai TEKS. Singkatan bulannya bercampur: aplikasi
--  menulis versi Indonesia ('Agu'), Postgres menulis versi Inggris ('Aug').
--  Keduanya harus dikenali, jika tidak sepertiga tahun gagal dibaca.
create or replace function public.parse_tgl_id(s text)
returns date
language plpgsql
immutable
as $$
declare
  bagian text[];
  bln    int;
begin
  if s is null or btrim(s) = '' then return null; end if;

  bagian := regexp_match(btrim(s), '^([0-9]{1,2})\s+([A-Za-z]+)\s+([0-9]{4})$');
  if bagian is null then
    begin return s::date; exception when others then return null; end;
  end if;

  bln := case lower(left(bagian[2], 3))
           when 'jan' then 1
           when 'feb' then 2
           when 'mar' then 3
           when 'apr' then 4
           when 'mei' then 5  when 'may' then 5
           when 'jun' then 6
           when 'jul' then 7
           when 'agu' then 8  when 'agt' then 8
           when 'ags' then 8  when 'aug' then 8
           when 'sep' then 9
           when 'okt' then 10 when 'oct' then 10
           when 'nov' then 11
           when 'des' then 12 when 'dec' then 12
           else null
         end;
  if bln is null then return null; end if;

  return make_date(bagian[3]::int, bln, bagian[1]::int);
exception when others then
  return null;
end;
$$;


-- ── Statistik beranda ───────────────────────────────────────────────────────
create or replace function public.statistik()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  -- Cakupan sama dengan daftar utama dasbor.
  with dipakai as (
    select *
      from public."Pengajuan" p
     where not (p.sumber = 'online' and p.status in ('diajukan', 'ditolak'))
  ),
  -- "Selesai" = status selesai, ATAU seluruh tahap sudah dilalui. Jumlah tahap
  -- mengikuti jalur: seri B 10 tahap, selain itu (termasuk jalur belum
  -- ditetapkan) memakai seri A yang 6 tahap.
  selesai_p as (
    select p.*
      from dipakai p
     where p.status = 'selesai'
        or coalesce(
             cardinality(string_to_array(nullif(btrim(p."tahapSelesai"), ''), ',')), 0
           ) >= case when p.jalur = 'B' then 10 else 6 end
  ),
  durasi as (
    select (public.parse_tgl_id(p."tanggalSelesai")
          - public.parse_tgl_id(p."tanggalMasuk")) as hari
      from selesai_p p
     where public.parse_tgl_id(p."tanggalMasuk")   is not null
       and public.parse_tgl_id(p."tanggalSelesai") is not null
  )
  select jsonb_build_object(
    'total',    (select count(*) from dipakai),
    'terbit',   (select count(*) from selesai_p),
    'rataHari', coalesce((select round(avg(hari))::int from durasi where hari >= 0), 0)
  );
$$;

revoke all     on function public.statistik() from public;
grant  execute on function public.statistik() to anon, authenticated;


-- ── VERIFIKASI ──
-- 1) Hasil akhir -- harus sama dengan kartu di dasbor:
select public.statistik();

-- 2) Rincian pembanding bila angkanya masih berbeda:
select p.id, p.sumber, p.status, p.jalur,
       p."tanggalMasuk", p."tanggalSelesai",
       public.parse_tgl_id(p."tanggalMasuk")   as masuk_terbaca,
       public.parse_tgl_id(p."tanggalSelesai") as selesai_terbaca,
       (public.parse_tgl_id(p."tanggalSelesai")
      - public.parse_tgl_id(p."tanggalMasuk"))  as hari
  from public."Pengajuan" p
 order by p.id;
--  Baris dengan masuk_terbaca / selesai_terbaca KOSONG berarti tanggalnya tidak
--  terbaca dan tidak ikut dirata-ratakan -- perbaiki penulisan tanggalnya.
