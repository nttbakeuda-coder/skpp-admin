# Notifikasi Desktop (Web Push) — Dasbor SI-PASTI

Notifikasi muncul di taskbar/Action Center komputer staf walau tab dasbor ditutup
(selama browser masih berjalan di latar). Ikuti langkah berikut **berurutan**.

Kejadian yang memicu notifikasi & penerimanya:

| Kejadian | Penerima |
|---|---|
| Pengajuan online baru masuk | Staf Loket + Admin |
| Pendaftaran akun baru (menunggu persetujuan) | Admin |
| Dokumen/bukti baru diunggah pemohon | Staf Pengampu OPD + Admin |
| Berkas berpindah Loket → Staf Pengampu OPD | Staf Pengampu OPD + Admin |

---

## 1. Generate kunci VAPID (sekali saja)
```bash
npx web-push generate-vapid-keys
```
Simpan **Public Key** dan **Private Key** yang muncul.

## 2. Frontend: pasang kunci publik
Di `.env.local` (dev) dan di environment host produksi (Vercel/dsb.):
```
VITE_VAPID_PUBLIC_KEY=<PUBLIC KEY dari langkah 1>
```
Lalu build ulang / redeploy dasbor. (Kunci publik aman di frontend.)

## 3. Database: buat tabel & RPC
Jalankan **`supabase_push.sql`** di Supabase → SQL Editor.

## 4. Edge Function: deploy
Dari root project (butuh Supabase CLI & sudah `supabase link`):
```bash
supabase functions deploy kirim-push --no-verify-jwt
```

## 5. Secret Edge Function
Buat satu nilai acak untuk `PUSH_HOOK_SECRET` (mis. dari `openssl rand -hex 16`), lalu:
```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="<PUBLIC KEY>" \
  VAPID_PRIVATE_KEY="<PRIVATE KEY>" \
  VAPID_SUBJECT="mailto:badankeuanganprovntt@gmail.com" \
  PUSH_HOOK_SECRET="<nilai acak>"
```
(`SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` sudah tersedia otomatis.)

## 6. Database Webhooks
Supabase Dashboard → **Database → Webhooks → Create**. Buat webhook berikut,
semuanya mengarah ke URL Edge Function:
`https://<PROJECT_REF>.functions.supabase.co/kirim-push`
dengan **HTTP Header** tambahan:
`x-webhook-secret: <PUSH_HOOK_SECRET dari langkah 5>`

| Nama | Tabel | Event |
|---|---|---|
| push_pengajuan_baru | `Pengajuan` | Insert |
| push_handoff        | `Pengajuan` | Update |
| push_akun_insert    | `profiles`  | Insert |
| push_akun_update    | `profiles`  | Update |
| push_dokumen        | `BerkasPengajuan` | Insert |

(Boleh juga menggabung Insert+Update dalam satu webhook per tabel bila UI
mengizinkan. Fungsi sudah menyaring sendiri kondisi yang relevan.)

## 7. Aktifkan di tiap komputer staf
Login dasbor → klik lambang profil (kanan atas) → **"Aktifkan Notifikasi Desktop"**
→ izinkan saat browser bertanya. Ulangi di tiap perangkat/browser yang dipakai.
> Disarankan **Install** dasbor sebagai aplikasi (Chrome/Edge: ikon install di
> address bar) agar notifikasi paling andal & bisa jalan saat Windows menyala.

---

## Uji cepat
- Buka dasbor di `http://localhost:5174` (localhost dianggap secure context → push jalan).
- Aktifkan notifikasi (langkah 7).
- Dari portal tracker, buat **pengajuan online baru** → Staf Loket/Admin yang sudah
  mengaktifkan akan menerima notifikasi walau tab dasbor ditutup.

## Catatan
- **Wajib HTTPS** di produksi (`https://dashboard.sipasti.my.id`). Localhost dikecualikan.
- Jika browser di-*quit* total / laptop mati, notifikasi **mengantre** dan muncul saat browser hidup lagi — batasan umum semua web app.
- Langganan bersifat **per browser per perangkat**; staf yang ganti perangkat perlu mengaktifkan lagi.
