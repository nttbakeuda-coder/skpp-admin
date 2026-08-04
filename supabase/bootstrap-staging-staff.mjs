// ============================================================
//  Bootstrap 2 akun staf UJI COBA di STAGING:
//    - Staf Loket   (role "operator")
//    - Pengampu OPD (role "staf")
//  Dipakai supaya dropdown "Penandatanganan Formulir" (Formulir Kembali /
//  Daftar Periksa) punya pilihan -- keduanya wajib dipilih & sebelumnya
//  kosong karena belum ada akun dengan role tsb di staging.
//
//  CARA PAKAI (di komputer Anda, dari folder skpp-admin-main):
//    1) Ambil service_role key STAGING: Supabase (project sfcsmdzyqizqesomyxih)
//       -> Settings -> API -> service_role. JANGAN commit / taruh di kode/chat.
//    2) PowerShell:
//         $env:SUPABASE_SERVICE_ROLE = "eyJ...service_role staging..."
//         node supabase/bootstrap-staging-staff.mjs
//    3) Setelah selesai, tutup terminal (variabel env hilang).
// ============================================================

import { createClient } from "@supabase/supabase-js";

const URL = "https://sfcsmdzyqizqesomyxih.supabase.co"; // STAGING — jangan ganti ke produksi
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SERVICE_ROLE) {
  console.error("✗ Set dulu env SUPABASE_SERVICE_ROLE (service_role key STAGING). Batal.");
  process.exit(1);
}

const EMAIL = (u) => `${u}@skpp.local`;

const admin = createClient(URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const AKUN = [
  { username: "stafloket1", password: "Loket123!", nama: "Staf Loket Uji", role: "operator" },
  { username: "pengampu1", password: "Pengampu123!", nama: "Staf Pengampu OPD Uji", role: "staf" },
];

for (const a of AKUN) {
  const { data: created, error: e1 } = await admin.auth.admin.createUser({
    email: EMAIL(a.username),
    password: a.password,
    email_confirm: true,
    user_metadata: { username: a.username, nama: a.nama, role: a.role },
  });
  if (e1) {
    if (/already|registered|exists/i.test(e1.message || "")) {
      console.log(`- ${a.username}: sudah ada, lewati.`);
      continue;
    }
    console.error(`✗ ${a.username}: gagal membuat user -> ${e1.message}`);
    continue;
  }
  const { error: e2 } = await admin
    .from("profiles")
    .upsert({ id: created.user.id, username: a.username, nama: a.nama, role: a.role });
  if (e2) {
    console.error(`✗ ${a.username}: user dibuat tapi profil GAGAL -> ${e2.message}`);
    continue;
  }
  console.log(`✓ ${a.username} (${a.role}) berhasil dibuat.`);
}

console.log("\nSelesai. Kedua akun ini sekarang seharusnya muncul di dropdown Staf Loket / Pengampu OPD.");
