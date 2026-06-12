# Runbook Pengamanan SKPP — Supabase Auth + RLS

Tujuan: mengunci akses database (password & data tak lagi bisa dibaca/ditulis publik)
tanpa mematikan dashboard. Login staf tetap pakai NIP + kata sandi yang sama.

> Urutan ini disusun agar **RLS diaktifkan paling akhir**, sehingga jika ada
> masalah, cukup matikan RLS untuk rollback instan.

---

## Prasyarat
- Punya **service_role key**: Supabase → Settings → API → `service_role`.
  ⚠️ Jangan commit / taruh di kode / browser.
- Supabase CLI terpasang (untuk deploy Edge Function): `npm i -g supabase`.

---

## Langkah

### 1. Buat tabel `profiles` + fungsi/policy (belum mengunci tabel data)
Supabase → SQL Editor → jalankan **`01_auth_rls.sql`**.
- Membuat `profiles` (+RLS-nya), `is_admin()`, trigger proteksi role, dan
  **policy** untuk tabel data — tapi RLS tabel data BELUM diaktifkan, jadi
  dashboard lama tetap hidup. Penguncian dilakukan di langkah 5.

### 2. Migrasi 27 akun ke Supabase Auth
Dari folder `skpp-admin-main`:
```powershell
$env:SUPABASE_SERVICE_ROLE = "eyJ...service_role..."
node supabase/migrate-accounts.mjs
```
Pastikan output "Berhasil: 27". Tutup terminal setelah selesai (hapus env).

### 3. Deploy Edge Function `admin-akun`
```powershell
supabase functions deploy admin-akun --project-ref phxyrferpnylgbbghgsn
```
(SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY otomatis tersedia di runtime Edge Function.)

### 4. Deploy dashboard versi baru
Commit & push `skpp-admin-main` (Vercel auto-deploy), atau `vercel --prod`.
**Uji saat RLS masih non-aktif:**
- Login pakai 1 akun (mis. `adminbakeuda`) → berhasil masuk.
- Buka daftar pengajuan, input, update tahap → semua jalan.
- Menu Manajemen Staf (admin) → list/tambah/reset/hapus akun jalan (lewat Edge Function).

### 5. CUTOVER — aktifkan RLS
Jika langkah 4 lolos, jalankan **`02_enable_rls.sql`** di SQL Editor.
Lalu **uji ulang dashboard + tracker**.

**Verifikasi keamanan** (harus GAGAL/empty sekarang, dengan anon key):
```bash
curl "https://phxyrferpnylgbbghgsn.supabase.co/rest/v1/Akun?select=*" \
  -H "apikey: sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy"
# → harus error permission / kosong, BUKAN data password
```
Tracker (`lacak`) harus tetap menemukan data — RPC menembus RLS.

**Rollback bila bermasalah:** `alter table ... disable row level security;`

### 6. Bersih-bersih (setelah yakin, beberapa hari kemudian)
- `drop table public."Akun";`  (password teks polos lama)
- Minta semua user **ganti kata sandi**, karena password lama sempat bocor.

---

## Catatan keamanan
- anon/publishable key memang publik (ada di kedua situs). Setelah RLS aktif,
  key itu **hanya** bisa memanggil RPC `lacak` — tidak bisa baca/tulis tabel.
- Manajemen akun butuh login admin; Edge Function memverifikasi role admin
  sebelum memakai service_role.
