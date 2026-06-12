-- ============================================================
--  FIX — hapus policy peninggalan yang masih mengizinkan anon/public
--  pada tabel lama, lalu pasang HANYA policy yang benar.
--
--  Masalah: walau RLS sudah enable, anon masih bisa baca Akun/Pengajuan
--  karena ada policy lama (permissive) untuk anon/public. Policy permissive
--  di-OR, jadi satu saja sudah membuka akses.
--
--  Jalankan di Supabase -> SQL Editor.
-- ============================================================

-- 1) Hapus SEMUA policy pada 5 tabel ini (apa pun namanya).
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('Akun','Pengajuan','Riwayat','Counter','BulkGrup')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end;
$$;

-- 2) Pasang ulang HANYA policy untuk authenticated pada tabel data.
--    anon TIDAK diberi policy apa pun -> akses langsung anon ditolak.
do $$
declare t text;
begin
  foreach t in array array['Pengajuan','Riwayat','Counter','BulkGrup'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_authenticated', t);
  end loop;
end;
$$;

-- 3) Tabel "Akun" SENGAJA dibiarkan TANPA policy -> terkunci total
--    (hanya service_role/Edge Function yang bisa akses). Tidak dipakai lagi
--    oleh dashboard; nanti bisa di-drop.

-- ── VERIFIKASI: lihat policy yang tersisa (anon TIDAK boleh muncul) ──
-- select tablename, policyname, roles, cmd
-- from pg_policies where schemaname='public'
-- order by tablename, policyname;
