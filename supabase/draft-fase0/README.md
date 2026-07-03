# DRAFT — Fase 0: Fondasi RLS per-pemilik

Status: **rancangan untuk review, belum dijalankan, belum di-commit.**

Tujuan: menyiapkan keamanan baris (row-level) SEBELUM portal pengajuan
publik / login eksternal diaktifkan. Ini menutup temuan audit #1 (otorisasi
datar) dan menjadi prasyarat wajib.

## Prinsip
- **Aditif & aman sekarang.** Karena semua akun saat ini staf, `is_staff()`
  selalu `true` → dashboard tidak berubah perilaku sama sekali.
- **Forward-compatible.** Begitu ada akun eksternal, mereka otomatis terkunci
  ke baris miliknya (`submittedBy = auth.uid()`).
- **Reversibel.** `down.sql` mengembalikan persis ke kondisi sekarang
  (hasil `13_rls_hardening.sql` + `04_profiles_directory.sql`).

## Perubahan
| Objek | Sebelum | Sesudah (Fase 0) |
|---|---|---|
| `is_staff()` | — | helper baru (SECURITY DEFINER) |
| `Pengajuan.submittedBy`, `.sumber` | — | kolom baru (nullable/default 'loket') |
| Pengajuan SELECT/UPDATE | `using(true)` | `is_staff() OR pemilik` |
| Pengajuan INSERT | `check(true)` | `is_staff()` (eksternal ditambah Fase 1) |
| Riwayat SELECT | `using(true)` | staf semua / pemohon hanya miliknya |
| profiles SELECT | `using(true)` | `is_staff() OR dirinya` |

## Cara pakai (saat sudah disepakati)
1. Uji di project Supabase **staging** dulu.
2. Jalankan `up.sql` di SQL Editor. Login staf → pastikan semua data tetap
   tampil & proses tahap tetap jalan (blok VERIFIKASI di akhir `up.sql`).
3. Rollback kapan pun: `down.sql` (baca peringatan urutan di dalamnya).

## Perubahan kode aplikasi di Fase 0
Praktis **tidak ada** yang wajib. Opsional: `inputBaru`/`inputBulk` di
`src/api.js` bisa mulai mengisi `submittedBy = <uid staf>` dan `sumber:'loket'`
agar data konsisten sejak awal — tapi bukan keharusan.

## Belum termasuk (Fase 1+)
- Peran `pemohon`/`bendahara` + relaksasi CHECK `role` di profiles.
- Kolom `akun_status` (pending/approved) + alur ACC admin.
- Policy INSERT/UPDATE untuk eksternal (hanya miliknya, hanya saat draft,
  hanya bila approved) + status `diajukan`.
- Bucket Storage `berkas-pengajuan` + policy per-pemilik.
- Verifikasi email saat daftar (butuh SMTP).
