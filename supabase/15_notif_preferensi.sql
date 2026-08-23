-- ============================================================
--  15_notif_preferensi.sql
--  Preferensi notifikasi PROGRES SKPP untuk pemohon (email / WhatsApp).
--  Dibaca oleh Edge Function `notif-pemohon` saat status Pengajuan berubah.
--
--  Jalankan di: Supabase (project PRODUCTION) -> SQL Editor.
-- ============================================================

-- 1) Kolom preferensi pada profil (default: email).
--    notif_channel: 'email' | 'whatsapp' | 'both' | 'off'
--    wa_number    : nomor WhatsApp (disimpan hanya digit, mis. 6281234567890)
alter table public.profiles
  add column if not exists notif_channel text not null default 'email',
  add column if not exists wa_number text;

-- Batasi nilai kanal yang sah (drop dulu bila ada agar idempotent).
alter table public.profiles drop constraint if exists profiles_notif_channel_chk;
alter table public.profiles
  add constraint profiles_notif_channel_chk
  check (notif_channel in ('email','whatsapp','both','off'));

-- 2) RPC: pemohon menyimpan preferensinya SENDIRI (hanya baris auth.uid()).
--    SECURITY DEFINER + validasi di dalam fungsi -> tak perlu melonggarkan RLS
--    update umum pada profiles. Nomor WA dinormalisasi jadi hanya digit.
create or replace function public.simpan_preferensi_notif(p_channel text, p_wa text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid    uuid := auth.uid();
  v_list text;
begin
  if uid is null then raise exception 'Tidak ada sesi.'; end if;
  if p_channel not in ('email','whatsapp','both','off') then
    raise exception 'Kanal notifikasi tidak valid.';
  end if;
  -- BOLEH BANYAK NOMOR (dipisah koma) — mis. bendahara menambahkan nomor pegawai
  -- ybs. Ambil hanya digit tiap nomor, buang kosong & duplikat, gabung koma.
  select string_agg(d, ',') into v_list
  from (
    select distinct regexp_replace(x, '[^0-9]', '', 'g') as d
    from unnest(regexp_split_to_array(coalesce(p_wa,''), '[,;\n]+')) as x
  ) t
  where d <> '';
  if p_channel in ('whatsapp','both') and coalesce(v_list,'') = '' then
    raise exception 'Minimal satu nomor WhatsApp wajib diisi untuk notifikasi WhatsApp.';
  end if;

  update public.profiles
     set notif_channel = p_channel,
         wa_number     = nullif(v_list, '')
   where id = uid;

  return jsonb_build_object('ok', true, 'notif_channel', p_channel, 'wa_number', nullif(v_list, ''));
end;
$$;
revoke all     on function public.simpan_preferensi_notif(text, text) from public;
grant  execute on function public.simpan_preferensi_notif(text, text) to authenticated;

-- ── VERIFIKASI ──
-- select id, email, notif_channel, wa_number from public.profiles where role in ('pemohon','bendahara');
