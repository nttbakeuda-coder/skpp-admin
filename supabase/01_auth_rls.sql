-- ============================================================
--  FASE 1 — AUTH + RLS untuk SKPP (dashboard + tracker)
--
--  Jalankan di Supabase -> SQL Editor SETELAH skrip migrasi akun
--  (migrate-accounts.mjs) berhasil, ATAU sebelum migrasi lalu jalankan
--  migrasi. Yang penting: AKTIFKAN RLS (bagian paling bawah) hanya
--  setelah dashboard versi baru (Supabase Auth) sudah dideploy & diuji.
--  Lihat RUNBOOK.md untuk urutan cutover yang aman.
-- ============================================================

-- ── 1) Tabel profiles (pengganti kolom password di Akun) ────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  nama       text,
  role       text not null default 'staf' check (role in ('staf','operator','admin')),
  opd        text,
  created_at timestamptz default now()
);

-- ── 2) Helper: apakah pemanggil saat ini admin? ─────────────
--  SECURITY DEFINER -> menembus RLS, jadi tidak terjadi rekursi
--  saat dipakai di dalam policy tabel profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
revoke all     on function public.is_admin() from public;
grant  execute on function public.is_admin() to authenticated;

-- ── 3) Cegah eskalasi role / ganti username sendiri ─────────
--  Trigger BUKAN security definer, agar current_user = role pemanggil.
--  service_role (Edge Function admin) dibebaskan; user biasa diblokir
--  mengubah kolom role / username.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role'
     or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Tidak diizinkan mengubah role.';
  end if;
  if new.username is distinct from old.username then
    raise exception 'Tidak diizinkan mengubah username.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_profile_fields on public.profiles;
create trigger trg_protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ── 4) RLS: profiles ────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- INSERT / DELETE profiles hanya lewat service_role (Edge Function).
-- Tanpa policy insert/delete -> authenticated ditolak.

-- ── 5) Policy tabel data — semua staf yang login (authenticated) ─
--  CATATAN: di sini kita HANYA MEMBUAT policy, BELUM mengaktifkan RLS
--  pada tabel data. Policy bersifat dormant sampai RLS dinyalakan
--  (lihat 02_enable_rls.sql, dijalankan saat cutover). Ini menjaga
--  dashboard LAMA tetap hidup sampai dashboard baru dideploy.
do $$
declare
  t   text;
  tbl text;
begin
  foreach t in array array['Pengajuan','Riwayat','Counter','BulkGrup'] loop
    tbl := format('public.%I', t);
    execute format('drop policy if exists %I on %s;', t || '_authenticated', tbl);
    execute format(
      'create policy %I on %s for all to authenticated using (true) with check (true);',
      t || '_authenticated', tbl);
  end loop;
end;
$$;

-- RPC public.lacak (tracker publik) memakai SECURITY DEFINER sehingga tetap
-- membaca Pengajuan/Riwayat walau RLS aktif. anon tidak punya policy di tabel
-- mana pun -> setelah RLS aktif, akses langsung anon ditolak.

-- Penguncian tabel (ENABLE ROW LEVEL SECURITY) ada di 02_enable_rls.sql.
