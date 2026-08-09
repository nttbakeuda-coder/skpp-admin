// ============================================================
//  Edge Function: notif-pemohon
//  Memberi tahu PEMOHON saat status pengajuannya berubah, lewat kanal pilihannya
//  (email via Resend sekarang; WhatsApp menyusul). Dipicu Database Webhook pada
//  Pengajuan UPDATE. Keamanan: header x-webhook-secret = PUSH_HOOK_SECRET.
//
//  Deploy: supabase functions deploy notif-pemohon --no-verify-jwt
//  Secret : RESEND_API_KEY, PUSH_HOOK_SECRET (sudah ada). EMAIL_FROM & PORTAL_URL
//           punya default. SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY otomatis.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "KATONG SKPP <noreply@katongskpp.my.id>";
const PORTAL_URL = Deno.env.get("PORTAL_URL") || "https://katongskpp.my.id";
const HOOK_SECRET = Deno.env.get("PUSH_HOOK_SECRET") || "";
const WA_TOKEN = Deno.env.get("WA_TOKEN") || ""; // token perangkat Fonnte

const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const esc = (s: unknown) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

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

// Pesan berdasar transisi status. null = tak perlu notif.
function pesanStatus(rec: any, old: any): { judul: string; teks: string } | null {
  const s = rec?.status, prev = old?.status;
  if (!s || s === prev) return null;
  const id = rec.id;
  switch (s) {
    case "proses":
      return { judul: "Pengajuan Diterima & Diproses", teks: `Pengajuan SKPP ${id} telah diverifikasi Loket dan kini sedang diproses.` };
    case "kembali":
      return { judul: "Berkas Perlu Dilengkapi", teks: `Pengajuan SKPP ${id} dikembalikan. Silakan buka portal untuk melengkapi berkas/bukti yang diminta.` };
    case "selesai":
      return { judul: "SKPP Anda Telah Selesai", teks: `SKPP ${id} telah selesai dan dapat Anda unduh di portal (menu Pengajuan Saya).` };
    case "ditolak":
      return { judul: "Pengajuan Ditolak", teks: `Mohon maaf, pengajuan SKPP ${id} ditolak. Untuk informasi lebih lanjut, silakan menghubungi Bidang Perbendaharaan.` };
    default:
      return null;
  }
}

async function kirimEmail(to: string | null, nama: string | null, m: { judul: string; teks: string }) {
  if (!RESEND_API_KEY || !to) return "skip-no-email";
  const html = emailShell(
    m.judul,
    `<p style="font-size:14px;line-height:1.65;color:#475569;margin:0 0 8px">Halo${nama ? " <strong>" + esc(nama) + "</strong>" : ""},</p>
     <p style="font-size:14px;line-height:1.65;color:#475569;margin:0 0 22px">${esc(m.teks)}</p>
     <div style="text-align:center"><a href="${PORTAL_URL}" style="display:inline-block;background:#0f2f5e;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px">Buka Portal</a></div>`,
  );
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject: `${m.judul} — KATONG SKPP`, html }),
    });
    return r.ok ? "sent" : "fail-" + r.status;
  } catch {
    return "error";
  }
}

// Normalisasi nomor ke format internasional 62xxxxxxxxxx.
function normalWa(wa: string | null): string {
  let n = String(wa ?? "").replace(/[^0-9]/g, "");
  if (!n) return "";
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (!n.startsWith("62")) n = "62" + n;
  return n;
}

// WhatsApp via gateway Fonnte (api.fonnte.com). Butuh secret WA_TOKEN (token
// perangkat). Kosong = belum aktif -> fungsi jatuh ke email cadangan.
async function kirimWA(wa: string | null, m: { judul: string; teks: string }) {
  if (!WA_TOKEN) return "wa-belum-aktif";
  const target = normalWa(wa);
  if (!target) return "skip-no-wa";
  const pesan = `*${m.judul}*\n\n${m.teks}\n\n${PORTAL_URL}`;
  try {
    const r = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: WA_TOKEN, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ target, message: pesan }).toString(),
    });
    return r.ok ? "sent" : "fail-" + r.status;
  } catch {
    return "error";
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (HOOK_SECRET && req.headers.get("x-webhook-secret") !== HOOK_SECRET)
    return new Response("Unauthorized", { status: 401 });

  let p: any;
  try { p = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  if (p?.table !== "Pengajuan" || p?.type !== "UPDATE") return json({ ok: true, skip: "bukan-update-pengajuan" });
  const rec = p.record || {}, old = p.old_record || {};
  const m = pesanStatus(rec, old);
  if (!m) return json({ ok: true, skip: "status-tak-berubah" });

  const uid = rec.submittedBy;
  if (!uid) return json({ ok: true, skip: "tanpa-pemilik" }); // pengajuan loket (offline)

  const { data: prof } = await sb
    .from("profiles").select("email, nama, notif_channel, wa_number").eq("id", uid).maybeSingle();
  if (!prof) return json({ ok: true, skip: "profil-tak-ada" });

  const ch = prof.notif_channel || "email";
  const hasil: Record<string, string> = { channel: ch };
  if (ch === "email" || ch === "both") hasil.email = await kirimEmail(prof.email, prof.nama, m);
  if (ch === "whatsapp" || ch === "both") hasil.wa = await kirimWA(prof.wa_number, m);
  // WhatsApp belum aktif -> jangan biarkan pemohon 'whatsapp'-only tak terinfo:
  // kirim email sebagai cadangan sampai gateway WA disiapkan.
  if (ch === "whatsapp" && hasil.wa === "wa-belum-aktif" && prof.email)
    hasil.emailCadangan = await kirimEmail(prof.email, prof.nama, m);

  return json({ ok: true, ...hasil });
});
