-- ============================================================================
--  22 — Kuesioner Kepuasan Pengguna Aplikasi KATONG SKPP
--
--  Melengkapi SurveiSKM yang sudah ada, BUKAN menggantikannya:
--    • SurveiSKM        -> menilai LAYANAN, terikat satu pengajuan selesai,
--                          diisi pemohon lewat portal.
--    • KuesionerAplikasi -> menilai APLIKASI, berdiri sendiri, dapat diisi
--                          petugas internal maupun pengguna luar tanpa login.
--
--  Diakses dari halaman mandiri /survei.html -- terpisah dari aplikasi React,
--  sehingga tidak ada tampilan aplikasi yang berubah.
--
--  Tabel TIDAK diberi policy apa pun: seluruh akses lewat dua fungsi
--  SECURITY DEFINER di bawah, yang memeriksa sendiri kesahihan masukan.
--
--  Jalankan di: Supabase -> SQL Editor.
-- ============================================================================

create table if not exists public."KuesionerAplikasi" (
  id         bigint generated always as identity primary key,
  kategori   text not null check (kategori in ('pemohon','bendahara','internal')),
  nama       text,
  opd        text,
  u1 smallint not null check (u1 between 1 and 4),
  u2 smallint not null check (u2 between 1 and 4),
  u3 smallint not null check (u3 between 1 and 4),
  u4 smallint not null check (u4 between 1 and 4),
  u5 smallint not null check (u5 between 1 and 4),
  u6 smallint not null check (u6 between 1 and 4),
  u7 smallint not null check (u7 between 1 and 4),
  u8 smallint not null check (u8 between 1 and 4),
  u9 smallint not null check (u9 between 1 and 4),
  saran      text,
  created_at timestamptz not null default now()
);

create index if not exists "KuesionerAplikasi_created_idx"
  on public."KuesionerAplikasi" (created_at desc);

alter table public."KuesionerAplikasi" enable row level security;
-- Sengaja TANPA policy -> akses langsung (anon maupun authenticated) ditolak.
-- Satu-satunya pintu adalah kedua fungsi di bawah.


-- ── Kirim jawaban (terbuka, tanpa login) ────────────────────────────────────
create or replace function public.kirim_kuesioner(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_kategori text := p->>'kategori';
  v_skor     int;
  i          int;
begin
  if v_kategori not in ('pemohon','bendahara','internal') then
    raise exception 'Kategori responden tidak sah.';
  end if;

  for i in 1..9 loop
    v_skor := nullif(p->>('u'||i), '')::int;
    if v_skor is null or v_skor < 1 or v_skor > 4 then
      raise exception 'Penilaian nomor % belum diisi.', i;
    end if;
  end loop;

  insert into public."KuesionerAplikasi"
    (kategori, nama, opd, u1,u2,u3,u4,u5,u6,u7,u8,u9, saran)
  values (
    v_kategori,
    nullif(btrim(coalesce(p->>'nama','')), ''),
    nullif(btrim(coalesce(p->>'opd','')), ''),
    (p->>'u1')::int, (p->>'u2')::int, (p->>'u3')::int,
    (p->>'u4')::int, (p->>'u5')::int, (p->>'u6')::int,
    (p->>'u7')::int, (p->>'u8')::int, (p->>'u9')::int,
    nullif(btrim(coalesce(p->>'saran','')), '')
  );

  return jsonb_build_object('ok', true);
end;
$$;
revoke all     on function public.kirim_kuesioner(jsonb) from public;
grant  execute on function public.kirim_kuesioner(jsonb) to anon, authenticated;


-- ── Rekap hasil (dilindungi kode akses) ─────────────────────────────────────
--  Kode diperiksa DI SISI SERVER, sehingga tidak ikut terbaca pada kode sumber
--  halaman. GANTI nilai di bawah dengan kode Anda sendiri.
create or replace function public.rekap_kuesioner(p_kode text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  KODE_REKAP constant text := 'bakeuda2026';   -- <<< GANTI KODE INI
  v_n        int;
  v_nrr      numeric[];
  v_dist     jsonb := '[]'::jsonb;
  v_ikm      numeric;
  v_mutu     text;
  i          int;
begin
  if p_kode is distinct from KODE_REKAP then
    raise exception 'Kode akses rekap salah.';
  end if;

  select count(*) into v_n from public."KuesionerAplikasi";
  if v_n = 0 then
    return jsonb_build_object('ok', true, 'responden', 0);
  end if;

  -- Nilai rata-rata tiap unsur
  select array[
    avg(u1),avg(u2),avg(u3),avg(u4),avg(u5),avg(u6),avg(u7),avg(u8),avg(u9)
  ] into v_nrr from public."KuesionerAplikasi";

  -- Sebaran jawaban 1..4 per unsur
  for i in 1..9 loop
    v_dist := v_dist || jsonb_build_array((
      select jsonb_build_array(
        count(*) filter (where s = 1), count(*) filter (where s = 2),
        count(*) filter (where s = 3), count(*) filter (where s = 4))
      from (
        select case i when 1 then u1 when 2 then u2 when 3 then u3
                      when 4 then u4 when 5 then u5 when 6 then u6
                      when 7 then u7 when 8 then u8 else u9 end as s
        from public."KuesionerAplikasi"
      ) t
    ));
  end loop;

  -- IKM = rata-rata seluruh unsur x 25  (Permenpan-RB No. 14 Tahun 2017)
  select round((sum(x) / 9 * 25)::numeric, 2) into v_ikm
    from unnest(v_nrr) as x;

  v_mutu := case
    when v_ikm >= 88.31 then 'A'
    when v_ikm >= 76.61 then 'B'
    when v_ikm >= 65.00 then 'C'
    else 'D' end;

  return jsonb_build_object(
    'ok', true,
    'responden', v_n,
    'ikm',  v_ikm,
    'mutu', v_mutu,
    'nrr',  (select jsonb_agg(round(x::numeric, 2)) from unnest(v_nrr) as x),
    'distribusi', v_dist,
    'komposisi', (
      select coalesce(jsonb_object_agg(kategori, jml), '{}'::jsonb)
        from (select kategori, count(*) as jml
                from public."KuesionerAplikasi" group by kategori) k
    ),
    'saran', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'teks', saran, 'kategori', kategori, 'waktu', created_at)
             order by created_at desc), '[]'::jsonb)
        from public."KuesionerAplikasi" where saran is not null
    )
  );
end;
$$;
revoke all     on function public.rekap_kuesioner(text) from public;
grant  execute on function public.rekap_kuesioner(text) to anon, authenticated;


-- ── VERIFIKASI ──
-- select public.kirim_kuesioner('{"kategori":"internal","u1":4,"u2":4,"u3":4,
--   "u4":3,"u5":4,"u6":3,"u7":4,"u8":4,"u9":4,"saran":"uji"}'::jsonb);
-- select public.rekap_kuesioner('bakeuda2026');
-- delete from public."KuesionerAplikasi";   -- bersihkan data uji
