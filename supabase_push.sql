-- ============================================================
--  WEB PUSH NOTIFICATION — DASBOR INTERNAL SI-PASTI
--  Menyimpan langganan (subscription) Web Push milik tiap staf, agar Edge
--  Function "kirim-push" bisa mengirim notifikasi ke taskbar/Action Center
--  komputer staf walau tab dashboard sedang ditutup.
--
--  Jalankan SELURUH isi file ini di Supabase -> SQL Editor.
--  (Langkah deploy Edge Function & Database Webhook ada di PUSH_SETUP.md.)
-- ============================================================

create table if not exists public."PushSubscription" (
  id          bigint generated always as identity primary key,
  "userId"    uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  ua          text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_pushsub_user on public."PushSubscription"("userId");

alter table public."PushSubscription" enable row level security;

-- Staf hanya boleh mengelola langganannya sendiri (opsional; penulisan utama
-- lewat RPC di bawah). Edge Function memakai service role -> menembus RLS.
drop policy if exists pushsub_sel_own on public."PushSubscription";
drop policy if exists pushsub_del_own on public."PushSubscription";
create policy pushsub_sel_own on public."PushSubscription"
  for select to authenticated using ("userId" = auth.uid());
create policy pushsub_del_own on public."PushSubscription"
  for delete to authenticated using ("userId" = auth.uid());

-- ── RPC: simpan_langganan_push() ────────────────────────────
--  Upsert langganan milik pemanggil (auth.uid()). Endpoint unik -> bila
--  browser yang sama mendaftar ulang, datanya diperbarui, bukan dobel.
create or replace function public.simpan_langganan_push(
  p_endpoint text, p_p256dh text, p_auth text, p_ua text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Harus login.');
  end if;
  insert into public."PushSubscription"("userId", endpoint, p256dh, auth, ua)
  values (v_uid, p_endpoint, p_p256dh, p_auth, p_ua)
  on conflict (endpoint) do update
    set "userId" = excluded."userId",
        p256dh   = excluded.p256dh,
        auth     = excluded.auth,
        ua       = excluded.ua;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all     on function public.simpan_langganan_push(text,text,text,text) from public;
grant  execute on function public.simpan_langganan_push(text,text,text,text) to authenticated;

-- ── RPC: hapus_langganan_push() ─────────────────────────────
create or replace function public.hapus_langganan_push(p_endpoint text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  delete from public."PushSubscription"
  where endpoint = p_endpoint and "userId" = auth.uid();
  select jsonb_build_object('ok', true);
$$;
revoke all     on function public.hapus_langganan_push(text) from public;
grant  execute on function public.hapus_langganan_push(text) to authenticated;
