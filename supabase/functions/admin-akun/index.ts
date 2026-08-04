// ============================================================
//  Edge Function: admin-akun
//  Manajemen akun (list / create / edit / hapus / resetPassword)
//  yang butuh hak admin (service_role) — TIDAK boleh ada di browser.
//
//  Keamanan: memverifikasi JWT pemanggil lalu memastikan rolenya 'admin'
//  di tabel profiles SEBELUM menjalankan aksi apa pun.
//
//  Deploy:  supabase functions deploy admin-akun
//  Secret:  SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY otomatis tersedia
//           di lingkungan Edge Function Supabase.
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL = (username: string) => `${username}@skpp.local`;

// Resend — email notifikasi status akun (disetujui/ditolak) ke pemohon.
// Set secret RESEND_API_KEY di Edge Function. EMAIL_FROM & PORTAL_URL punya default.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "KATONG SKPP <noreply@katongskpp.my.id>";
const PORTAL_URL = Deno.env.get("PORTAL_URL") || "https://katongskpp.my.id";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

// Kop + footer email seragam KATONG SKPP (senada dgn email verifikasi Supabase).
function emailShell(judul: string, isiHtml: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:24px;font-weight:800;letter-spacing:.5px"><span style="color:#0f2f5e">KATONG</span> <span style="color:#c8892a">SKPP</span></div>
    <div style="font-size:12px;color:#64748b;margin-top:2px">Badan Keuangan Daerah Provinsi Nusa Tenggara Timur</div>
  </div>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:28px">
    <h1 style="font-size:18px;font-weight:700;margin:0 0 12px;color:#0f2f5e">${judul}</h1>
    ${isiHtml}
  </div>
  <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:16px;line-height:1.5">Email otomatis, mohon tidak dibalas.<br>&copy; Badan Keuangan Daerah Provinsi Nusa Tenggara Timur</p>
</div>`;
}

// Kirim email status akun ke pemohon lewat Resend. Best-effort: kegagalan email
// TIDAK menggagalkan aksi persetujuan (dibungkus try/catch, dikembalikan senyap).
async function kirimEmailStatus(to: string, nama: string | null, disetujui: boolean) {
  if (!RESEND_API_KEY || !to) return;
  const sapaan = nama ? `<strong>${esc(nama)}</strong>, ` : "";
  const subject = disetujui
    ? "Akun Anda Telah Disetujui — KATONG SKPP"
    : "Status Pendaftaran Akun — KATONG SKPP";
  const html = disetujui
    ? emailShell(
        "Akun Anda Telah Disetujui",
        `<p style="font-size:14px;line-height:1.65;color:#475569;margin:0 0 22px">Kabar baik, ${sapaan}akun Anda di Portal Pengajuan SKPP telah <strong>disetujui</strong> oleh Administrator. Anda kini dapat masuk dan mulai mengajukan SKPP.</p>
         <div style="text-align:center"><a href="${PORTAL_URL}" style="display:inline-block;background:#0f2f5e;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:8px">Masuk ke Portal</a></div>`,
      )
    : emailShell(
        "Pendaftaran Belum Dapat Disetujui",
        `<p style="font-size:14px;line-height:1.65;color:#475569;margin:0 0 12px">Mohon maaf, ${sapaan}pendaftaran akun Anda belum dapat kami setujui saat ini.</p>
         <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0">Untuk informasi lebih lanjut, silakan menghubungi Bidang Perbendaharaan Badan Keuangan Daerah Provinsi Nusa Tenggara Timur.</p>`,
      );
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
    });
  } catch (_) {
    // diabaikan — persetujuan tetap berhasil walau email gagal terkirim
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const admin = createClient(URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1) Verifikasi pemanggil
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u?.user) return json({ ok: false, pesan: "Sesi tidak valid." }, 401);

    const { data: prof } = await admin
      .from("profiles").select("role").eq("id", u.user.id).maybeSingle();
    const isAdmin = prof?.role === "admin";

    // 2) Jalankan aksi
    const { action, username, password, nama, role, passwordBaru, userId, akunStatus } = await req.json();

    // Aksi "list" (baca daftar nama) diizinkan untuk semua user yang login —
    // dibutuhkan form verifikasi untuk memilih nama staf loket / pengampu OPD.
    // Aksi yang MENGUBAH data tetap khusus admin.
    if (action !== "list" && !isAdmin)
      return json({ ok: false, pesan: "Hanya admin yang diizinkan." }, 403);

    const findId = async (un: string) => {
      const { data } = await admin
        .from("profiles").select("id").eq("username", un).maybeSingle();
      return data?.id as string | undefined;
    };

    switch (action) {
      case "list": {
        const { data, error } = await admin
          .from("profiles").select("username, nama, role").order("nama");
        if (error) return json({ ok: false, pesan: error.message });
        return json({ ok: true, data });
      }

      case "create": {
        const { data: created, error } = await admin.auth.admin.createUser({
          email: EMAIL(username),
          password,
          email_confirm: true,
          user_metadata: { username, nama, role },
        });
        if (error)
          return json({
            ok: false,
            pesan: /already|registered|exists/i.test(error.message)
              ? `Username "${username}" sudah digunakan.`
              : error.message,
          });
        const { error: pe } = await admin
          .from("profiles").insert({ id: created.user.id, username, nama, role });
        if (pe) {
          // rollback auth user agar tidak yatim
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ ok: false, pesan: pe.message });
        }
        return json({ ok: true, pesan: `Akun "${username}" berhasil ditambahkan.` });
      }

      case "edit": {
        const { error } = await admin
          .from("profiles").update({ nama, role }).eq("username", username);
        if (error) return json({ ok: false, pesan: error.message });
        const id = await findId(username);
        if (id) await admin.auth.admin.updateUserById(id, {
          user_metadata: { username, nama, role },
        });
        return json({ ok: true, pesan: `Akun "${username}" berhasil diperbarui.` });
      }

      case "hapus": {
        const id = await findId(username);
        if (!id) return json({ ok: false, pesan: "Akun tidak ditemukan." });
        const { error } = await admin.auth.admin.deleteUser(id); // profil cascade
        if (error) return json({ ok: false, pesan: error.message });
        return json({ ok: true, pesan: `Akun "${username}" berhasil dihapus.` });
      }

      case "resetPassword": {
        const id = await findId(username);
        if (!id) return json({ ok: false, pesan: "Akun tidak ditemukan." });
        const { error } = await admin.auth.admin.updateUserById(id, { password: passwordBaru });
        if (error) return json({ ok: false, pesan: error.message });
        return json({ ok: true, pesan: "Kata sandi berhasil direset." });
      }

      // Akun pemohon/bendahara yang mendaftar mandiri via portal (akun_status='pending').
      case "listPending": {
        const { data, error } = await admin
          .from("profiles")
          .select("id, username, nama, email, role, opd, akun_status, created_at")
          .eq("akun_status", "pending")
          .order("created_at", { ascending: true });
        if (error) return json({ ok: false, pesan: error.message });
        return json({ ok: true, data });
      }

      // ACC / tolak akun pemohon-bendahara. akunStatus: "approved" | "rejected".
      case "setAkunStatus": {
        if (!userId) return json({ ok: false, pesan: "userId wajib diisi." });
        if (!["approved", "rejected"].includes(akunStatus))
          return json({ ok: false, pesan: "Status akun tidak valid." });
        // Ambil email & nama pemohon untuk notifikasi.
        const { data: prof } = await admin
          .from("profiles").select("email, nama").eq("id", userId).maybeSingle();
        const { error } = await admin
          .from("profiles").update({ akun_status: akunStatus }).eq("id", userId);
        if (error) return json({ ok: false, pesan: error.message });
        // Beri tahu pemohon lewat email (best-effort; tak menggagalkan aksi).
        if (prof?.email) await kirimEmailStatus(prof.email, prof.nama, akunStatus === "approved");
        return json({
          ok: true,
          pesan: akunStatus === "approved" ? "Akun berhasil disetujui." : "Akun ditolak.",
        });
      }

      default:
        return json({ ok: false, pesan: "Aksi tidak dikenal." }, 400);
    }
  } catch (e) {
    return json({ ok: false, pesan: String((e as Error)?.message ?? e) }, 500);
  }
});
