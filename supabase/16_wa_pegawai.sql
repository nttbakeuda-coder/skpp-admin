-- ============================================================
--  16_wa_pegawai.sql
--  Notifikasi WhatsApp "tepat sasaran": simpan nomor WA pegawai PER PENGAJUAN
--  (diisi saat input). Edge Function notif-pemohon mengirim WA ke nomor ini
--  (pegawai ybs) + nomor akun pengaju sesuai preferensinya.
--
--  Jalankan di: Supabase (project PRODUCTION) -> SQL Editor.
-- ============================================================

-- 1) Kolom nomor WA pegawai pada pengajuan (disimpan hanya digit, mis. 62812...).
alter table public."Pengajuan" add column if not exists "waPegawai" text;

-- 2) RPC pengajuan tunggal — simpan waPegawai (digit saja).
create or replace function public.ajukan_pengajuan_online(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid     uuid := auth.uid();
  v_tahun int  := extract(year from now());
  v_nilai int;
  new_id  text;
  kode    text;
begin
  if not public.is_approved_pemohon() then
    raise exception 'Akun belum disetujui admin / bukan pemohon.';
  end if;

  insert into public."Counter"(tahun, nilai) values (v_tahun, 1)
    on conflict (tahun) do update set nilai = public."Counter".nilai + 1
    returning nilai into v_nilai;

  new_id := 'SKPP-' || v_tahun || '-' || lpad(v_nilai::text, 4, '0');
  kode   := public.gen_kode_akses(8);

  insert into public."Pengajuan"
    (id, nama, nip, opd, jabatan, pangkat, alasan, jalur, kasubid,
     "kodeAkses", "submittedBy", sumber, status, "tanggalMasuk", "waPegawai")
  values
    (new_id, p->>'nama', p->>'nip', p->>'opd', p->>'jabatan', p->>'pangkat',
     coalesce(p->>'alasan','Pensiun'),
     null,                                    -- jalur A/B DITENTUKAN LOKET saat verifikasi
     p->>'kasubid',
     kode, uid, 'online', 'diajukan', to_char(now(),'DD Mon YYYY'),
     nullif(regexp_replace(coalesce(p->>'waPegawai',''), '[^0-9]', '', 'g'), ''));

  return jsonb_build_object('id', new_id, 'kodeAkses', kode);
end;
$$;
grant execute on function public.ajukan_pengajuan_online(jsonb) to authenticated;

-- 3) RPC pengajuan bulk — simpan waPegawai per pegawai.
create or replace function public.ajukan_pengajuan_online_bulk(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid      uuid := auth.uid();
  v_tahun  int  := extract(year from now());
  v_nilai  int;
  new_id   text;
  kode     text;
  v_opd    text := nullif(p->>'opd','');
  it       jsonb;
  rows     jsonb := '[]'::jsonb;
begin
  if not public.is_approved_pemohon() then
    raise exception 'Akun belum disetujui admin / bukan pemohon.';
  end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then
    raise exception 'Daftar pegawai kosong.';
  end if;

  kode := public.gen_kode_akses(8);   -- SATU kode akses untuk seluruh grup

  for it in select * from jsonb_array_elements(p->'items')
  loop
    insert into public."Counter"(tahun, nilai) values (v_tahun, 1)
      on conflict (tahun) do update set nilai = public."Counter".nilai + 1
      returning nilai into v_nilai;

    new_id := 'SKPP-' || v_tahun || '-' || lpad(v_nilai::text, 4, '0');

    insert into public."Pengajuan"
      (id, nama, nip, opd, jabatan, pangkat, alasan, jalur, kasubid,
       "kodeAkses", "submittedBy", sumber, status, "tanggalMasuk", "waPegawai")
    values
      (new_id, it->>'nama', it->>'nip', coalesce(nullif(it->>'opd',''), v_opd),
       it->>'jabatan', it->>'pangkat', coalesce(it->>'alasan','Pensiun'),
       null, it->>'kasubid',
       kode, uid, 'online', 'diajukan', to_char(now(),'DD Mon YYYY'),
       nullif(regexp_replace(coalesce(it->>'waPegawai',''), '[^0-9]', '', 'g'), ''));

    rows := rows || jsonb_build_object('id', new_id, 'nama', it->>'nama');
  end loop;

  return jsonb_build_object('kodeAkses', kode, 'rows', rows);
end;
$$;
grant execute on function public.ajukan_pengajuan_online_bulk(jsonb) to authenticated;
