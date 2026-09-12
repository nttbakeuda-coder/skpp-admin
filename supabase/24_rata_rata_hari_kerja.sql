-- ============================================================================
--  24 — Rata-rata penyelesaian dihitung dalam HARI KERJA
--
--  Menggantikan bagian rata-rata pada migrasi 23, yang memakai hari kalender.
--  Jalankan SETELAH migrasi 23 (fungsi parse_tgl_id dari sana tetap dipakai).
--
--  Sabtu, Minggu, dan hari libur nasional tidak dihitung -- sama dengan kolom
--  aging dan kartu "Rata-rata Selesai" di dasbor.
--
--  ⚠️ DAFTAR HARI LIBUR ADA DI DUA TEMPAT
--  Tabel "HariLibur" di bawah dipakai basis data (statistik beranda), sedangkan
--  dasbor memakai daftar HARI_LIBUR di dalam src/App.jsx. Keduanya HARUS berisi
--  tanggal yang sama, kalau tidak angka beranda dan dasbor akan berbeda lagi.
--
--  Jalankan di: Supabase -> SQL Editor.
-- ============================================================================


-- ── Daftar hari libur ───────────────────────────────────────────────────────
create table if not exists public."HariLibur" (
  tanggal    date primary key,
  keterangan text
);

alter table public."HariLibur" enable row level security;

-- Boleh dibaca siapa saja (dipakai fungsi statistik), ditulis hanya lewat
-- SQL Editor / service role -- tidak ada policy tulis.
drop policy if exists harilibur_select on public."HariLibur";
create policy harilibur_select on public."HariLibur"
  for select to anon, authenticated using (true);


-- ── Isi tahun 2026 ──────────────────────────────────────────────────────────
--  Tanggal tetap: pasti. Tanggal keagamaan: PERIKSA terhadap SKB 3 Menteri,
--  mengikuti penanggalan bulan/gerejawi sehingga berubah tiap tahun.
--  Cuti bersama belum diisi -- tambahkan begitu SKB terbit.
insert into public."HariLibur" (tanggal, keterangan) values
  ('2026-01-01', 'Tahun Baru Masehi'),
  ('2026-01-16', 'Isra Mikraj Nabi Muhammad SAW'),
  ('2026-02-17', 'Tahun Baru Imlek'),
  ('2026-03-19', 'Hari Suci Nyepi'),
  ('2026-03-20', 'Hari Raya Idul Fitri (hari ke-1)'),
  ('2026-03-21', 'Hari Raya Idul Fitri (hari ke-2)'),
  ('2026-04-03', 'Wafat Isa Almasih'),
  ('2026-05-01', 'Hari Buruh Internasional'),
  ('2026-05-14', 'Kenaikan Isa Almasih'),
  ('2026-05-27', 'Hari Raya Idul Adha'),
  ('2026-05-31', 'Hari Raya Waisak'),
  ('2026-06-01', 'Hari Lahir Pancasila'),
  ('2026-06-16', 'Tahun Baru Islam (1 Muharram)'),
  ('2026-08-17', 'Hari Kemerdekaan Republik Indonesia'),
  ('2026-08-25', 'Maulid Nabi Muhammad SAW'),
  ('2026-12-25', 'Hari Raya Natal')
on conflict (tanggal) do update set keterangan = excluded.keterangan;


-- ── Selisih hari kerja ──────────────────────────────────────────────────────
--  Menghitung hari kerja pada rentang (d1, d2] -- hari mulai tidak dihitung,
--  hari selesai dihitung. Sama persis dengan selisihHariKerja() di dasbor.
create or replace function public.hari_kerja_antara(d1 date, d2 date)
returns int
language sql
stable
set search_path = public
as $$
  select case
    when d1 is null or d2 is null or d2 <= d1 then 0
    else (
      select count(*)::int
        from generate_series(d1 + 1, d2, interval '1 day') g
       where extract(isodow from g) < 6          -- 6=Sabtu, 7=Minggu
         and not exists (
               select 1 from public."HariLibur" h where h.tanggal = g::date
             )
    )
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
  with dipakai as (
    select *
      from public."Pengajuan" p
     where not (p.sumber = 'online' and p.status in ('diajukan', 'ditolak'))
  ),
  selesai_p as (
    select p.*
      from dipakai p
     where p.status = 'selesai'
        or coalesce(
             cardinality(string_to_array(nullif(btrim(p."tahapSelesai"), ''), ',')), 0
           ) >= case when p.jalur = 'B' then 10 else 6 end
  ),
  durasi as (
    select public.hari_kerja_antara(
             public.parse_tgl_id(p."tanggalMasuk"),
             public.parse_tgl_id(p."tanggalSelesai")
           ) as hari
      from selesai_p p
     where public.parse_tgl_id(p."tanggalMasuk")   is not null
       and public.parse_tgl_id(p."tanggalSelesai") is not null
       and public.parse_tgl_id(p."tanggalSelesai")
           >= public.parse_tgl_id(p."tanggalMasuk")
  )
  select jsonb_build_object(
    'total',    (select count(*) from dipakai),
    'terbit',   (select count(*) from selesai_p),
    'rataHari', coalesce((select round(avg(hari))::int from durasi), 0)
  );
$$;

revoke all     on function public.statistik() from public;
grant  execute on function public.statistik() to anon, authenticated;


-- ── VERIFIKASI ──
-- 1) Hasil akhir -- harus sama dengan kartu di dasbor:
select public.statistik();

-- 2) Uji penghitung hari kerja:
select public.hari_kerja_antara('2026-09-04', '2026-09-07') as jumat_ke_senin,      -- 1
       public.hari_kerja_antara('2026-08-14', '2026-08-18') as lewat_17_agustus,    -- 1
       public.hari_kerja_antara('2026-08-24', '2026-09-07') as dua_pekan,           -- 9
       public.hari_kerja_antara('2026-09-07', '2026-09-07') as hari_sama;           -- 0

-- 3) Rincian per pengajuan bila angkanya masih berbeda:
select p.id, p.status, p.jalur, p."tanggalMasuk", p."tanggalSelesai",
       public.hari_kerja_antara(
         public.parse_tgl_id(p."tanggalMasuk"),
         public.parse_tgl_id(p."tanggalSelesai")) as hari_kerja
  from public."Pengajuan" p
 order by p.id;
