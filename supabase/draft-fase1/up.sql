-- ============================================================
--  DRAFT — FASE 1: Portal Pengajuan SKPP Online (DB layer)
--  Prasyarat: draft-fase0/up.sql sudah aktif (submittedBy, sumber, is_staff()).
--  ⚠️ UJI DI SUPABASE STAGING DULU. Jangan langsung ke produksi.
--  Rollback: draft-fase1/down.sql
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_bytes

-- 1) PROFILES: peran & status akun eksternal ----------------------------------
alter table public.profiles
  add column if not exists akun_status text not null default 'approved',  -- pending|approved|rejected
  add column if not exists email text;

-- relaksasi CHECK role (tambah pemohon & bendahara)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('staf','operator','admin','pemohon','bendahara'));

-- 2) Trigger: buat profil saat pemohon/bendahara mendaftar mandiri ------------
--    Hanya untuk role eksternal; akun staf (dibuat Edge Function) diabaikan.
create or replace function public.handle_new_external_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','');
begin
  if r in ('pemohon','bendahara') then
    insert into public.profiles (id, username, nama, role, email, opd, akun_status)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'username',''), new.email),
      coalesce(new.raw_user_meta_data->>'nama',''),
      r,
      new.email,
      nullif(new.raw_user_meta_data->>'opd',''),
      'pending'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_handle_new_external_user on auth.users;
create trigger trg_handle_new_external_user
  after insert on auth.users
  for each row execute function public.handle_new_external_user();

-- 3) Helper: pemohon/bendahara yang SUDAH disetujui admin ---------------------
create or replace function public.is_approved_pemohon()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('pemohon','bendahara') and akun_status = 'approved'
  );
$$;
revoke all on function public.is_approved_pemohon() from public;
grant execute on function public.is_approved_pemohon() to authenticated;

-- 4) Helper: kode akses 8 char CSPRNG (alfabet tanpa 0 O 1 I L) ---------------
create or replace function public.gen_kode_akses(n int default 8)
returns text language plpgsql as $$
declare alf text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; out text := ''; i int; b bytea;
begin
  b := gen_random_bytes(n);
  for i in 1..n loop
    out := out || substr(alf, (get_byte(b, i-1) % length(alf)) + 1, 1);
  end loop;
  return out;
end;
$$;

-- 5) Perluas proteksi kolom immutable Pengajuan utk non-staf -----------------
create or replace function public.protect_pengajuan_immutable()
returns trigger language plpgsql as $$
begin
  if current_user = 'service_role'
     or coalesce(current_setting('request.jwt.claim.role', true),'') = 'service_role'
     or public.is_staff() then
    return new;
  end if;
  if new.id           is distinct from old.id           then raise exception 'id tak boleh diubah'; end if;
  if new."kodeAkses"  is distinct from old."kodeAkses"  then raise exception 'kodeAkses tak boleh diubah'; end if;
  if new."submittedBy" is distinct from old."submittedBy" then raise exception 'submittedBy tak boleh diubah'; end if;
  if new.sumber       is distinct from old.sumber       then raise exception 'sumber tak boleh diubah'; end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_pengajuan_immutable on public."Pengajuan";
create trigger trg_protect_pengajuan_immutable
  before update on public."Pengajuan"
  for each row execute function public.protect_pengajuan_immutable();

-- 6) PENGAJUAN — buka insert/update/delete terbatas utk pemohon --------------
drop policy if exists "pengajuan_insert"       on public."Pengajuan";
drop policy if exists "pengajuan_update"       on public."Pengajuan";
drop policy if exists "pengajuan_delete_admin" on public."Pengajuan";

create policy "pengajuan_insert" on public."Pengajuan"
  for insert to authenticated
  with check (
    public.is_staff()
    or ( public.is_approved_pemohon()
         and "submittedBy" = auth.uid()
         and sumber = 'online'
         and status = 'diajukan' )
  );

create policy "pengajuan_update" on public."Pengajuan"
  for update to authenticated
  using ( public.is_staff() or ("submittedBy" = auth.uid() and status = 'diajukan') )
  with check ( public.is_staff() or ("submittedBy" = auth.uid() and status = 'diajukan') );

create policy "pengajuan_delete" on public."Pengajuan"
  for delete to authenticated
  using ( public.is_admin() or ("submittedBy" = auth.uid() and status = 'diajukan') );
-- (SELECT tetap dari Fase 0: is_staff() OR submittedBy = auth.uid())

-- 7) Tabel metadata berkas + RLS ---------------------------------------------
create table if not exists public."BerkasPengajuan" (
  id           uuid primary key default gen_random_uuid(),
  "pengajuanId" text references public."Pengajuan"(id) on delete cascade,
  jenis        text,
  path         text not null,
  "uploadedBy" uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists "BerkasPengajuan_peng_idx" on public."BerkasPengajuan" ("pengajuanId");
alter table public."BerkasPengajuan" enable row level security;

drop policy if exists "berkas_select" on public."BerkasPengajuan";
create policy "berkas_select" on public."BerkasPengajuan"
  for select to authenticated
  using (
    public.is_staff()
    or "pengajuanId" in (select id from public."Pengajuan" where "submittedBy" = auth.uid())
  );

drop policy if exists "berkas_insert" on public."BerkasPengajuan";
create policy "berkas_insert" on public."BerkasPengajuan"
  for insert to authenticated
  with check (
    public.is_staff()
    or ( public.is_approved_pemohon()
         and "uploadedBy" = auth.uid()
         and "pengajuanId" in (select id from public."Pengajuan"
                               where "submittedBy" = auth.uid() and status = 'diajukan') )
  );

drop policy if exists "berkas_delete" on public."BerkasPengajuan";
create policy "berkas_delete" on public."BerkasPengajuan"
  for delete to authenticated
  using (
    public.is_admin()
    or ( "uploadedBy" = auth.uid()
         and "pengajuanId" in (select id from public."Pengajuan"
                               where "submittedBy" = auth.uid() and status = 'diajukan') )
  );

-- 8) Storage: bucket privat + policy per-pemilik -----------------------------
insert into storage.buckets (id, name, public)
values ('berkas-pengajuan','berkas-pengajuan', false)
on conflict (id) do nothing;

drop policy if exists "berkas_obj_insert" on storage.objects;
create policy "berkas_obj_insert" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'berkas-pengajuan'
               and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "berkas_obj_select" on storage.objects;
create policy "berkas_obj_select" on storage.objects
  for select to authenticated
  using ( bucket_id = 'berkas-pengajuan'
          and ( public.is_staff() or (storage.foldername(name))[1] = auth.uid()::text ) );

drop policy if exists "berkas_obj_delete" on storage.objects;
create policy "berkas_obj_delete" on storage.objects
  for delete to authenticated
  using ( bucket_id = 'berkas-pengajuan'
          and ( public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text ) );
-- Catatan: batas tipe/ukuran file diatur di setelan bucket (Dashboard Storage).

-- 9) RPC pengajuan online (server yang atur id/kodeAkses/status) --------------
create or replace function public.ajukan_pengajuan_online(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid   uuid := auth.uid();
  tahun int  := extract(year from now());
  nilai int;
  new_id text;
  kode  text;
begin
  if not public.is_approved_pemohon() then
    raise exception 'Akun belum disetujui admin / bukan pemohon.';
  end if;

  insert into public."Counter"(tahun, nilai) values (tahun, 1)
    on conflict (tahun) do update set nilai = public."Counter".nilai + 1
    returning nilai into nilai;

  new_id := 'SKPP-' || tahun || '-' || lpad(nilai::text, 4, '0');
  kode   := public.gen_kode_akses(8);

  insert into public."Pengajuan"
    (id, nama, nip, opd, jabatan, pangkat, alasan, jalur, kasubid,
     "kodeAkses", "submittedBy", sumber, status, "tanggalMasuk")
  values
    (new_id, p->>'nama', p->>'nip', p->>'opd', p->>'jabatan', p->>'pangkat',
     coalesce(p->>'alasan','Pensiun'),
     null,                                    -- jalur A/B DITENTUKAN LOKET saat verifikasi
     p->>'kasubid',
     kode, uid, 'online', 'diajukan', to_char(now(),'DD Mon YYYY'));

  return jsonb_build_object('id', new_id, 'kodeAkses', kode);
end;
$$;
grant execute on function public.ajukan_pengajuan_online(jsonb) to authenticated;

-- ── VERIFIKASI (staging) ──
-- 1) daftar akun pending:  select username,nama,role,akun_status from profiles where akun_status='pending';
-- 2) approve manual:       update profiles set akun_status='approved' where id='<uid>';
-- 3) uji RPC sbg pemohon approved: select public.ajukan_pengajuan_online('{"nama":"Uji","nip":"1","jalur":"A","kasubid":"X"}'::jsonb);
