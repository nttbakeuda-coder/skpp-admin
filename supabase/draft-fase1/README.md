# DRAFT — Fase 1: Portal Pengajuan SKPP Online

Status: **rancangan untuk review. Uji WAJIB di Supabase _staging_ dulu**
(menyentuh peran, data, constraint, storage). Jangan ke produksi sampai
go-live disepakati. Prasyarat: Fase 0 (`draft-fase0/up.sql`) sudah aktif.

## 1. Tujuan
Pemohon eksternal — **Bendahara OPD** (mengajukan untuk banyak pegawai) dan
**Pegawai perorangan** (mengajukan miliknya) — bisa:
1. **Daftar** (email + verifikasi), lalu **menunggu ACC admin**.
2. Setelah disetujui: **mengisi form pengajuan** + **unggah berkas** secara online.
3. Pengajuan masuk **antrean `diajukan`** → loket verifikasi → masuk alur normal.
Portal digabung ke modul pelacakan publik (login + ajukan + lacak).

## 2. Peran & akun
| Peran | Asal | Hak |
|---|---|---|
| admin/operator/staf | dibuat admin (Edge Fn) | internal, `is_staff()`=true |
| **pemohon** | daftar mandiri | ajukan & kelola pengajuan **miliknya** |
| **bendahara** | daftar mandiri | ajukan (termasuk **bulk**) untuk OPD-nya |

- Relaksasi CHECK `profiles.role` → tambah `pemohon`, `bendahara`.
- Kolom baru `profiles.akun_status` = `pending|approved|rejected`
  (staf lama default `approved`; pendaftar baru `pending`).
- Kolom `profiles.email` (agar admin bisa lihat saat ACC). `opd` sudah ada.

## 3. Pendaftaran + verifikasi email
- Portal: `supabase.auth.signUp({ email, password, options:{ data:{ role, nama, username:NIP, opd } } })`.
- **Trigger** `handle_new_external_user` (SECURITY DEFINER) membuat baris
  `profiles` (akun_status `pending`) **hanya** untuk role pemohon/bendahara —
  akun staf (dibuat Edge Function) tak tersentuh.
- Supabase kirim email konfirmasi → **SMTP: Resend** (terpilih), kirim dari
  `noreply@sipasti.my.id` (SPF/DKIM). Aktifkan "Confirm email". Skala besar →
  bisa pindah ke Amazon SES.
- **CAPTCHA signup: Cloudflare Turnstile** (terpilih; native Supabase, sering
  tanpa puzzle).

## 4. ACC admin (gerbang kedua anti-spam)
- Menu admin **"Persetujuan Akun"**: daftar `profiles` `akun_status='pending'`.
- Approve/Reject via **Edge Function `admin-akun`** (service_role) — tambah aksi
  `listPending`, `setAkunStatus`. (Bukan lewat RLS, agar tetap admin-only server-side.)
- Hanya akun `approved` yang boleh mengajukan (dicek `is_approved_pemohon()`).

## 5. Alur pengajuan (status)
`diajukan` → (loket) **Terima** → `proses` (masuk alur A/B seperti input loket)
`diajukan` → (loket) **Kembalikan/Revisi** → tetap `diajukan` + catatan (pemohon
perbaiki & kirim ulang)
`diajukan` → (loket) **Tolak** → `ditolak` (dengan alasan)

- Pengajuan online: `sumber='online'`, `submittedBy=<uid pemohon>`, `kodeAkses`
  dibuat server (8 char CSPRNG) → pemohon/pegawai bisa lacak di portal publik.
- Saat **Terima**, loket menjalankan transisi normal (A1/B1 selesai, A2/B2 aktif)
  & tulis Riwayat — persis seperti `inputBaru` sekarang.
- **Jalur A/B ditentukan LOKET** saat verifikasi. Form online tidak menanyakan
  jalur; RPC menyimpan `jalur` kosong dulu, loket menetapkannya saat Terima.

## 6. Berkas (Storage)
- Bucket **privat** `berkas-pengajuan`. Path: `{uid}/{pengajuanId}/{namafile}`.
- Policy: pemohon **insert/select** miliknya (folder[1]=uid); **staf select semua**;
  hapus hanya pemilik saat draft / admin.
- Metadata di tabel **`BerkasPengajuan`** (pengajuanId, jenis, path, uploadedBy).
- Batas berkas (terpilih): tipe **PDF/JPG/PNG**, maks **5 MB/file**, maks **15
  file/pengajuan** (diatur di setelan bucket + validasi UI).
- Staf lihat berkas via signed URL (pola sama `buktiSerahUrl`).

## 7. RLS (menambah Fase 0)
- Helper `is_approved_pemohon()`.
- **Pengajuan INSERT**: `is_staff()` **atau** (approved pemohon & `submittedBy`=diri
  & `sumber='online'` & `status='diajukan'`). *Rekomendasi:* pemasukan lewat
  **RPC `ajukan_pengajuan_online`** (SECURITY DEFINER) agar server yang mengatur
  id/kodeAkses/status — policy tetap sebagai backstop.
- **Pengajuan UPDATE**: `is_staff()` **atau** (`submittedBy`=diri & `status='diajukan'`).
- **Pengajuan DELETE**: `is_admin()` **atau** (`submittedBy`=diri & `status='diajukan'`).
- **Immutable** utk non-staf: `id`, `kodeAkses`, `submittedBy`, `sumber` (perluas
  trigger `protect_pengajuan_immutable`).
- **BerkasPengajuan** & **storage.objects**: policy per-pemilik + staf-baca-semua.
- Riwayat tetap **staf-only** (audit) — aksi pemohon tidak menulis Riwayat.

## 8. Perubahan aplikasi (garis besar, kode menyusul)
**Portal publik (digabung):** halaman Login/Daftar, "Ajukan SKPP" (tunggal
pemohon / bulk bendahara — pakai ulang logika form yang ada), unggah berkas,
"Pengajuan Saya" (status + lacak).
**Dashboard admin:** menu "Persetujuan Akun" & "Antrean Pengajuan Online"
(Terima/Kembalikan/Tolak); detail menampilkan berkas (signed URL).

## 9. Keamanan & anti-penyalahgunaan (ringkas)
- Dua gerbang: **verifikasi email** + **ACC admin**.
- CAPTCHA signup, rate-limit pengajuan per akun.
- Batas tipe/ukuran/jumlah berkas; bucket privat + signed URL + kebijakan retensi.
- Semua mutasi sensitif lewat RPC SECURITY DEFINER bila memungkinkan.
- **Uji di staging**; siapkan `down.sql`.

## 10. Sub-tahap Fase 1 (disarankan berurutan)
1a. **DB** (`up.sql`): roles, akun_status, trigger, helper, RLS, BerkasPengajuan,
    storage, RPC — di **staging**.
1b. **Admin**: Persetujuan Akun + Antrean Online.
1c. **Portal**: signup + form ajukan + upload + "Pengajuan Saya".
1d. **SMTP + CAPTCHA** + checklist go-live (Fase 0 up.sql diaktifkan di prod
    bersamaan saat merge ke `main`).

## 11. Rollback
`down.sql` membalik penuh (drop RPC, trigger, policy eksternal, BerkasPengajuan,
bucket, kolom, kembalikan CHECK role & policy insert/update ke Fase 0). Urutan &
peringatan ada di dalamnya. Karena diuji di staging, produksi tak terdampak.
