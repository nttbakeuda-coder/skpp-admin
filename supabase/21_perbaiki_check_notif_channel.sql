-- ============================================================================
--  21 — Selaraskan CHECK notif_channel dengan nilai yang dipakai aplikasi
--
--  MASALAH (ditemukan saat mencocokkan DDL basis data dengan kode)
--  Basis data yang berjalan membatasi notif_channel ke:
--      'email' | 'whatsapp' | 'both' | 'none'
--
--  Sementara SELURUH kode memakai 'off' untuk menonaktifkan notifikasi:
--    • Portal, pilihan "Nonaktif"        -> AppHeader.jsx  : ["off", "Nonaktif", ...]
--    • RPC simpan_preferensi_notif       -> 15_notif_preferensi.sql : in (...,'off')
--    • Edge Function notif-pemohon       -> if (ch === "off") ... skip
--
--  Akibatnya pemohon yang memilih "Nonaktif" GAGAL menyimpan preferensi:
--  RPC meloloskan 'off', lalu UPDATE ditolak CHECK constraint.
--  Sebaliknya, andai ada baris bernilai 'none', Edge Function tidak
--  mengenalinya sebagai nonaktif sehingga notifikasi tetap terkirim.
--
--  Tampaknya migrasi 15 belum pernah diterapkan di basis data ini, atau
--  kolom & constraint-nya dibuat terpisah lewat konsol dengan nilai berbeda.
--
--  PERBAIKAN
--  Basis data diselaraskan ke kode ('off'), bukan sebaliknya -- mengubah kode
--  berarti menyentuh tiga tempat sekaligus termasuk Edge Function yang harus
--  dideploy ulang, sedangkan di sini cukup satu constraint.
--  Baris lama bernilai 'none' ikut dinormalkan.
--
--  Jalankan di: Supabase -> SQL Editor.
-- ============================================================================


-- ── BLOK 1 — PERIKSA DULU ───────────────────────────────────────────────────

-- 1a) Constraint yang sedang berlaku pada kolom notif_channel
select conname, pg_get_constraintdef(oid) as definisi
  from pg_constraint
 where conrelid = 'public.profiles'::regclass
   and contype  = 'c'
   and pg_get_constraintdef(oid) ilike '%notif_channel%';

-- 1b) Sebaran nilai yang tersimpan sekarang
select notif_channel, count(*) as jumlah
  from public.profiles
 group by notif_channel
 order by jumlah desc;


-- ── BLOK 2 — PERBAIKI ───────────────────────────────────────────────────────

begin;

  -- Lepas SEMUA check constraint pada kolom ini, apa pun namanya. Nama
  -- constraint bisa berbeda bila dibuat lewat konsol, jadi jangan berpatokan
  -- pada satu nama tertentu.
  do $$
  declare c record;
  begin
    for c in
      select conname
        from pg_constraint
       where conrelid = 'public.profiles'::regclass
         and contype  = 'c'
         and pg_get_constraintdef(oid) ilike '%notif_channel%'
    loop
      execute format('alter table public.profiles drop constraint %I', c.conname);
    end loop;
  end $$;

  -- Normalkan data lama: 'none' adalah maksud yang sama dengan 'off'.
  update public.profiles
     set notif_channel = 'off'
   where notif_channel = 'none';

  -- Pasang constraint yang selaras dengan kode.
  alter table public.profiles
    add constraint profiles_notif_channel_chk
    check (notif_channel in ('email','whatsapp','both','off'));

commit;


-- ── BLOK 3 — VERIFIKASI ─────────────────────────────────────────────────────

select conname, pg_get_constraintdef(oid) as definisi
  from pg_constraint
 where conrelid = 'public.profiles'::regclass
   and contype  = 'c'
   and pg_get_constraintdef(oid) ilike '%notif_channel%';
--  Harus tepat SATU baris, memuat 'off' dan TIDAK memuat 'none'.

select notif_channel, count(*) as jumlah
  from public.profiles
 group by notif_channel;
--  Tidak boleh ada lagi nilai 'none'.


-- ── UJI FUNGSIONAL (setelah blok di atas) ───────────────────────────────────
--  Di portal: buka Pengaturan Notifikasi -> pilih "Nonaktif" -> Simpan.
--  Sebelum perbaikan langkah ini gagal; sesudahnya harus tersimpan.
