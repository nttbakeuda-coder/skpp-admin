// ============================================================
//  Migrasi sekali jalan: tabel "Akun" (username/password teks polos)
//  -> Supabase Auth + tabel "profiles".
//
//  Email sintetis: <username>@skpp.local. Password lama dipertahankan
//  (di-hash oleh Supabase Auth). Idempotent: akun yang sudah ada dilewati.
//
//  CARA PAKAI (di komputer Anda, dari folder skpp-admin-main):
//    1) Ambil service_role key: Supabase -> Settings -> API -> service_role.
//       JANGAN commit / taруh di kode / browser.
//    2) PowerShell:
//         $env:SUPABASE_SERVICE_ROLE = "eyJ...service_role..."
//         node supabase/migrate-accounts.mjs
//    3) Setelah selesai, tutup terminal (variabel env hilang).
// ============================================================

import { createClient } from "@supabase/supabase-js";

const URL = "https://phxyrferpnylgbbghgsn.supabase.co";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SERVICE_ROLE) {
  console.error("✗ Set dulu env SUPABASE_SERVICE_ROLE (service_role key). Batal.");
  process.exit(1);
}

const EMAIL = (username) => `${username}@skpp.local`;

const admin = createClient(URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: akun, error } = await admin.from("Akun").select("*");
if (error) {
  console.error("✗ Gagal membaca tabel Akun:", error.message);
  process.exit(1);
}

console.log(`Memigrasi ${akun.length} akun...\n`);
let okCount = 0, skip = 0, fail = 0;

for (const a of akun) {
  const { data: created, error: e1 } = await admin.auth.admin.createUser({
    email: EMAIL(a.username),
    password: a.password,
    email_confirm: true,
    user_metadata: { username: a.username, nama: a.nama, role: a.role },
  });

  if (e1) {
    if (/already|registered|exists/i.test(e1.message || "")) {
      console.log(`- ${a.username}: sudah ada di Auth, lewati`);
      skip++;
      continue;
    }
    console.error(`- ${a.username}: GAGAL buat user -> ${e1.message}`);
    fail++;
    continue;
  }

  const { error: e2 } = await admin.from("profiles").upsert({
    id: created.user.id,
    username: a.username,
    nama: a.nama,
    role: a.role,
    opd: a.opd ?? null,
  });

  if (e2) {
    console.error(`- ${a.username}: user dibuat tapi profil GAGAL -> ${e2.message}`);
    fail++;
  } else {
    console.log(`- ${a.username}: OK (${a.role})`);
    okCount++;
  }
}

console.log(`\nSelesai. Berhasil: ${okCount}, dilewati: ${skip}, gagal: ${fail}.`);
