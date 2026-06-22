-- ============================================================================
-- SI-PASTI / SKPP-ADMIN — Fitur "Lupa Kata Sandi" (permintaan reset ke admin)
-- ----------------------------------------------------------------------------
-- Karena login memakai email sintetis (username@skpp.local) tanpa email asli,
-- reset kata sandi dilakukan melalui ADMIN. Pegawai yang lupa sandi mengisi
-- form di halaman login → permintaan tersimpan di tabel "ResetRequest" →
-- admin melihat daftarnya di menu "Manajemen Staf" dan mereset sandinya.
--
-- Cara pakai:
--   1. Supabase Dashboard → project SKPP → "SQL Editor".
--   2. Tempel SELURUH isi file ini → "Run".
-- ============================================================================

create table if not exists public."ResetRequest" (
  id         uuid primary key default gen_random_uuid(),
  username   text not null,
  alasan     text,
  status     text not null default 'pending',   -- 'pending' | 'selesai'
  waktu      text,                               -- waktu tampil (format id-ID)
  created_at timestamptz not null default now()
);

create index if not exists "ResetRequest_status_idx" on public."ResetRequest" (status);

-- Aktifkan Row Level Security
alter table public."ResetRequest" enable row level security;

-- Pengunjung TANPA login (anon) hanya boleh MENGAJUKAN permintaan baru
-- (status wajib 'pending'). Mereka TIDAK bisa membaca/mengubah permintaan lain.
drop policy if exists "anon ajukan reset" on public."ResetRequest";
create policy "anon ajukan reset" on public."ResetRequest"
  for insert to anon with check (status = 'pending');

-- Pengguna login boleh insert juga (mis. admin menambah manual) — opsional.
drop policy if exists "auth insert reset" on public."ResetRequest";
create policy "auth insert reset" on public."ResetRequest"
  for insert to authenticated with check (true);

-- Hanya pengguna login (admin) yang boleh melihat/mengubah/menghapus permintaan.
drop policy if exists "auth select reset" on public."ResetRequest";
create policy "auth select reset" on public."ResetRequest"
  for select to authenticated using (true);

drop policy if exists "auth update reset" on public."ResetRequest";
create policy "auth update reset" on public."ResetRequest"
  for update to authenticated using (true) with check (true);

drop policy if exists "auth delete reset" on public."ResetRequest";
create policy "auth delete reset" on public."ResetRequest"
  for delete to authenticated using (true);
