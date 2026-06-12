# Checklist Perbaikan — SI-PASTI / Dashboard SKPP Bakeuda NTT

Dokumen ini berisi daftar perbaikan berdasarkan review kode (React + Vite frontend,
Google Apps Script + Google Sheets backend). Urutkan dari **P0 (kritis)** ke bawah.
Centang `[x]` setiap item yang selesai.

> **Cara pakai di Claude Code (VS Code):**
> 1. Taruh file ini di root repo (`skpp-admin/CHECKLIST-PERBAIKAN-SKPP.md`).
> 2. Buat branch dulu: `git checkout -b perbaikan-keamanan`.
> 3. Kerjakan **satu item per percakapan**, dari P0. Di setiap item ada *prompt siap pakai*
>    yang bisa Anda berikan ke Claude Code.
> 4. Uji setelah tiap perubahan sebelum lanjut ke item berikutnya.

---

## 0. Persiapan (lakukan sekali)

- [ ] Buat branch kerja: `git checkout -b perbaikan-keamanan`
- [ ] Pastikan ada backup Spreadsheet (File → Buat salinan) sebelum mengubah skema sheet `Akun`.
- [ ] Catat: semua perubahan backend dilakukan di editor Apps Script (script.google.com),
      bukan di file `.gs` dalam repo (file itu hanya contoh/dokumentasi).

---

## P0 — KRITIS (KEAMANAN). Kerjakan paling dulu.

### P0.1 — Backend tidak memverifikasi pemanggil (otorisasi palsu)
**Masalah:** `apiPost`/`apiGet` (App.jsx, sekitar baris 130–138) tidak mengirim token apa pun,
dan `doPost` langsung men-dispatch `action` tanpa memeriksa siapa pemanggilnya. Siapa pun yang
punya `API_URL` (terlihat di bundle publik) bisa memanggil `daftarSemua`, `hapusAkun`,
`resetPassword`, dll. langsung tanpa login. Semua pengecekan role di frontend
(`cekIzinProses` baris ~110–122; gating `user.role==="admin"` baris 1703/1717/3470) hanya kosmetik.

- [ ] **Backend:** terbitkan **token sesi** saat login dan verifikasi token + role pada **setiap** action.
- [ ] **Frontend:** simpan token setelah login dan sertakan di setiap request.

**Contoh kode Apps Script (sesi via CacheService):**
```javascript
// === Sesi & Otorisasi ===
function createSession(username, role) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(
    'sesi_' + token,
    JSON.stringify({ username: username, role: role }),
    21600 // 6 jam (TTL maksimum CacheService). Untuk sesi lebih lama, pakai sheet "Sesi".
  );
  return token;
}

function requireAuth(payload, allowedRoles) {
  const token = payload && payload.token;
  if (!token) throw new Error('Tidak terautentikasi');
  const raw = CacheService.getScriptCache().get('sesi_' + token);
  if (!raw) throw new Error('Sesi tidak valid atau kadaluarsa');
  const sesi = JSON.parse(raw);
  if (allowedRoles && allowedRoles.indexOf(sesi.role) === -1) {
    throw new Error('Akses ditolak untuk role: ' + sesi.role);
  }
  return sesi; // { username, role }
}
```

**Pasang penjaga di setiap action di `doPost`:**
```javascript
if (action === 'daftarSemua')  { requireAuth(payload);                 return jsonResponse({ ok:true, data:getAllData() }); }
if (action === 'tambahAkun')   { requireAuth(payload, ['admin']);       return handleTambahAkun(payload); }
if (action === 'hapusAkun')    { requireAuth(payload, ['admin']);       return handleHapusAkun(payload); }
if (action === 'resetPassword'){ requireAuth(payload, ['admin']);       return handleResetPassword(payload); }
if (action === 'updateTahap')  { requireAuth(payload, ['admin','staf','operator']); return handleUpdateTahap(payload); }
// 'login' TIDAK pakai requireAuth.
```

**Frontend — kirim token di tiap request (App.jsx, fungsi apiPost/apiGet):**
```javascript
let SESSION_TOKEN = null; // di-set saat login & dipulihkan dari localStorage

async function apiPost(body) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ ...body, token: SESSION_TOKEN }),
  });
  return res.json();
}
async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries({ ...params, token: SESSION_TOKEN }).forEach(([k,v]) => url.searchParams.set(k, v));
  return (await fetch(url.toString())).json();
}
```

> **Prompt Claude Code:** "Di App.jsx, ubah apiPost dan apiGet agar menyertakan field `token`
> dari variabel SESSION_TOKEN. Set SESSION_TOKEN dari `res.token` di handler login (sekitar baris 1552),
> dan kosongkan saat logout."

---

### P0.2 — Password kemungkinan tersimpan plaintext
**Masalah:** tidak ada hashing di seluruh repo. Login & reset mengirim password apa adanya,
dan tidak ada tanda password di-hash sebelum masuk sheet `Akun` → sangat mungkin plaintext.

- [ ] **Backend:** hash password dengan **salt per-akun** sebelum disimpan; bandingkan hash saat login.
- [ ] Migrasikan password lama (reset paksa semua akun, atau hash saat login pertama berikutnya).
- [ ] Tambahkan kolom `salt` dan `passwordHash` di sheet `Akun` (hapus kolom password plaintext).

**Contoh hashing (SHA-256 + salt) di Apps Script:**
```javascript
function makeSalt() { return Utilities.getUuid(); }

function hashPassword(password, salt) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, salt + password, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}
// Simpan: salt = makeSalt(); passwordHash = hashPassword(pwd, salt);
// Cek:   hashPassword(input, salt) === passwordHash
```
> Catatan: SHA-256 adalah peningkatan besar dari plaintext, tapi bukan yang terbaik untuk password.
> Jika data ASN ini penting, pertimbangkan memindahkan autentikasi ke backend sungguhan
> (Node/Supabase/Firebase) yang mendukung **bcrypt/Argon2** + rate-limit bawaan.

---

### P0.3 — Kebijakan password terlalu lemah
**Masalah:** aturan "6+ karakter, 1 huruf kapital" (App.jsx baris 2910, 2942, 3134).

- [ ] Naikkan jadi **minimal 8 karakter + huruf besar + angka** (idealnya + simbol). Terapkan di frontend **dan** backend.
- [ ] Wajibkan ganti password saat login pertama untuk akun yang dibuat admin.
- [ ] (Opsional tapi disarankan) Tambah **2FA** untuk role `admin`.

> **Prompt Claude Code:** "Ganti semua validasi password di App.jsx (baris 2910, 2942, 3134)
> menjadi minimal 8 karakter, mengandung huruf besar dan angka, dan perbarui teks placeholder/peringatannya."

---

### P0.4 — Tidak ada proteksi brute force di login
- [ ] Tambah penghitung gagal-login per-username dengan penguncian sementara.

```javascript
function handleLogin(payload) {
  const u = String(payload.username || '').trim();
  const cache = CacheService.getScriptCache();
  const key = 'gagal_' + u;
  const gagal = Number(cache.get(key) || 0);
  if (gagal >= 5) return jsonResponse({ ok:false, pesan:'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' });

  // ... ambil akun, cek hashPassword(input, akun.salt) === akun.passwordHash ...
  if (!cocok) {
    cache.put(key, String(gagal + 1), 900); // kunci 15 menit
    return jsonResponse({ ok:false, pesan:'Username atau password salah.' });
  }
  cache.remove(key);
  const token = createSession(u, akun.role);
  return jsonResponse({ ok:true, nama: akun.nama, role: akun.role, token: token });
}
```

---

### P0.5 — Redeploy backend dengan URL baru
**Masalah:** URL `/exec` saat ini sudah lama terbuka tanpa otorisasi.

- [ ] Setelah P0.1–P0.4 selesai, **buat Deployment baru** di Apps Script (URL `/exec` baru).
- [ ] Perbarui `API_URL` (lihat P1.2) ke URL baru, agar URL lama yang terlanjur terbuka tak bisa dipakai lagi.

> Setting "Who has access: **Anyone**" memang diperlukan karena dipanggil dari browser tanpa login Google.
> Itulah sebabnya keamanan **harus** dijaga oleh token aplikasi (P0.1), bukan oleh setelan akses Google.

---

## P1 — PENTING (Struktur & Kebersihan Kode)

### P1.1 — Hapus file cadangan dari `src/`
**Masalah:** `App - Copy.jsx`, `App - Copy 2.jsx` (520 KB!), `App_lama(6).jsx`–`(9).jsx`
masih ada di `src/` dan ikut masuk git history; semuanya memuat `API_URL`.

- [ ] Hapus:
```bash
git rm "src/App - Copy.jsx" "src/App - Copy 2.jsx" \
       "src/App_lama(6).jsx" "src/App_lama(7).jsx" \
       "src/App_lama(8).jsx" "src/App_lama(9).jsx"
git commit -m "chore: hapus file cadangan lama dari src/"
```
- [ ] Andalkan Git untuk versi lama, bukan file copy.

---

### P1.2 — Pindahkan `API_URL` ke `.env`
- [ ] Buat file `.env` (jangan di-commit — tambahkan ke `.gitignore`):
```
VITE_API_URL=https://script.google.com/macros/s/URL_BARU_ANDA/exec
```
- [ ] Tambah `.env` ke `.gitignore`, dan buat `.env.example` (tanpa nilai asli) untuk dokumentasi.
- [ ] Ganti baris 77 App.jsx: `const API_URL = import.meta.env.VITE_API_URL;`

---

### P1.3 — Pecah `App.jsx` (3.561 baris) jadi modul
**Masalah:** seluruh aplikasi (semua halaman, CSS, API, komponen) ada dalam satu file 172 KB.

- [ ] Pecah bertahap menjadi struktur seperti:
```
src/
  api.js                 // API_URL, apiGet, apiPost, helper norm()
  constants.js           // TAHAPAN_A, TAHAPAN_B, cekIzinProses
  styles.css             // pindahkan blok <style> besar ke sini
  components/            // Sidebar, Toast, Modal, dll.
  pages/                 // Dashboard, DaftarPengajuan, InputPengajuan,
                         // Riwayat, Profil, Users, Login
  App.jsx                // hanya routing antar-halaman + state user
```
- [ ] Kerjakan satu halaman per langkah agar mudah diuji.

> **Prompt Claude Code:** "Ekstrak fungsi API (API_URL, apiGet, apiPost, norm) dari App.jsx ke
> file baru src/api.js, lalu impor kembali di App.jsx. Jangan ubah logika, hanya pindahkan."

---

### P1.4 — Pulihkan sesi setelah refresh
**Masalah:** login menulis `localStorage` (baris 1554–1556) tapi tak pernah dibaca; `user` selalu
mulai `null` (baris 3248) sehingga pengguna login ulang tiap refresh.

- [ ] Simpan `{ token, nama, role, username }` di localStorage saat login.
- [ ] Saat aplikasi dimuat, pulihkan ke state dan set `SESSION_TOKEN`; validasi token ke server (action ringan, mis. `daftarAkun`/`ping`) — jika invalid, paksa login.
- [ ] Hapus penulisan localStorage yang tidak terpakai.

---

## P2 — UX, Mobile, & Integritas Data

### P2.1 — Responsif di HP (paling terlihat oleh pengguna)
- [ ] Sidebar jadi **drawer/hamburger** di layar kecil; konten utama pakai lebar penuh.
- [ ] Ubah tabel jadi **kartu** di mobile (atau tampilkan kolom prioritas + tombol "Detail").
- [ ] Perbaiki kolom yang terpotong: **PROGRESS** (Daftar Pengajuan), **STATUS/TGL** (Dashboard), **TGL MASUK** (Arsip).
- [ ] Pakai breakpoint CSS (mis. `@media (max-width: 768px)`).

### P2.2 — Aksi berbahaya & jejak audit
- [ ] Tombol **Hapus** akun: tambah **dialog konfirmasi** + gunakan **soft-delete** (nonaktifkan, bukan hapus permanen).
- [ ] Catat **audit trail** server-side (siapa, kapan, aksi) untuk perubahan status/hapus/reset.

### P2.3 — Integritas data
- [ ] Cegah pengajuan masuk **Arsip "Selesai" tanpa Nomor SKPP** (di Arsip ada baris dengan `NO. SKPP = –`).
- [ ] Validasi NIP = 18 digit angka di frontend dan backend.
- [ ] Bersihkan data uji (Dika, Angel, Agung, dll.) sebelum produksi.

### P2.4 — Privasi tampilan
- [ ] Pertimbangkan **masking NIP** di daftar (mis. `1995••••••061002`), tampilkan penuh hanya di halaman detail.

### P2.5 — Ketahanan UI
- [ ] Tambah **loading skeleton** saat fetch data.
- [ ] Tambah **error boundary** + pesan ramah saat API gagal (jangan biarkan layar blank).

### P2.6 — Validasi input di backend
- [ ] Di `doPost`, validasi tipe & panjang field sebelum diproses (jangan percaya input frontend).

---

## Ringkasan prioritas

| Prioritas | Fokus | Item |
|-----------|-------|------|
| **P0** | Keamanan (wajib sebelum produksi) | P0.1–P0.5 |
| **P1** | Struktur & kebersihan kode | P1.1–P1.4 |
| **P2** | UX, mobile, integritas data | P2.1–P2.6 |

> Saran alur: selesaikan **seluruh P0** dan uji menyeluruh dulu (ini melindungi data ASN),
> baru lanjut P1, lalu P2.
