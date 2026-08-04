// ============================================================
//  Bootstrap SATU akun admin di STAGING, untuk uji coba dashboard
//  (menu Antrean Pengajuan Online, Persetujuan Akun, dst).
//
//  Beda dengan migrate-accounts.mjs: script itu memigrasi tabel "Akun"
//  produksi (kosong di staging). Script ini membuat akun baru langsung
//  lewat Supabase Auth Admin API, target STAGING.
//
//  CARA PAKAI (di komputer Anda, dari folder skpp-admin-main):
//    1) Ambil service_role key STAGING: Supabase (project sfcsmdzyqizqesomyxih)
//       -> Settings -> API -> service_role. JANGAN commit / taruh di kode/chat.
//    2) PowerShell:
//         $env:SUPABASE_SERVICE_ROLE = "eyJ...service_role staging..."
//         node supabase/bootstrap-staging-admin.mjs <username> <password> "<Nama Lengkap>"
//       Contoh:
//         node supabase/bootstrap-staging-admin.mjs adminuji Rahasia123! "Admin Uji Coba"
//    3) Setelah selesai, tutup terminal (variabel env hilang).
//    4) Login di dashboard admin (arahkan .env.local ke staging) pakai
//       username & password di atas.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const URL = "https://sfcsmdzyqizqesomyxih.supabase.co"; // STAGING — jangan ganti ke produksi
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const [username, password, nama] = process.argv.slice(2);

if (!SERVICE_ROLE) {
  console.error("✗ Set dulu env SUPABASE_SERVICE_ROLE (service_role key STAGING). Batal.");
  process.exit(1);
}
if (!username || !password || !nama) {
  console.error('Pakai: node supabase/bootstrap-staging-admin.mjs <username> <password> "<Nama Lengkap>"');
  process.exit(1);
}

const EMAIL = (u) => `${u}@skpp.local`;

const admin = createClient(URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error: e1 } = await admin.auth.admin.createUser({
  email: EMAIL(username),
  password,
  email_confirm: true,
  user_metadata: { username, nama, role: "admin" },
});

if (e1) {
  console.error(`✗ Gagal membuat user: ${e1.message}`);
  process.exit(1);
}

const { error: e2 } = await admin
  .from("profiles")
  .upsert({ id: created.user.id, username, nama, role: "admin" });

if (e2) {
  console.error(`✗ User dibuat tapi profil GAGAL: ${e2.message}`);
  process.exit(1);
}

console.log(`✓ Akun admin "${username}" berhasil dibuat di STAGING. Silakan login di dashboard.`);
