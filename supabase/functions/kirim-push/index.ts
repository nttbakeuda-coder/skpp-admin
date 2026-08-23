// ============================================================
//  Edge Function: kirim-push
//  Menerima payload Database Webhook Supabase (INSERT/UPDATE) lalu mengirim
//  Web Push ke staf yang relevan berdasarkan role. Deploy:
//    supabase functions deploy kirim-push --no-verify-jwt
//  Secret yang wajib diset (lihat PUSH_SETUP.md):
//    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_HOOK_SECRET
//  SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY tersedia otomatis.
// ============================================================
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:badankeuanganprovntt@gmail.com";
const HOOK_SECRET   = Deno.env.get("PUSH_HOOK_SECRET") || "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const STAF_ROLES = new Set(["admin", "operator", "staf"]);

// Tentukan notifikasi dari payload webhook. Kembalikan {roles,title,body,url,tag}
// atau null (tak ada notifikasi utk kejadian ini).
async function bangunNotif(p: any) {
  const type = p?.type, table = p?.table, rec = p?.record || {}, old = p?.old_record || {};

  // 1) Pengajuan online baru -> Staf Loket + Admin
  if (table === "Pengajuan" && type === "INSERT" && rec.sumber === "online") {
    return { roles: ["operator", "admin"], title: "Pengajuan online baru",
      body: `${rec.nama || "Pemohon"} · ${rec.id}`, url: "/", tag: `aju-${rec.id}` };
  }

  // 2) Berkas diteruskan Loket -> Staf Pengampu OPD (tahap aktif jadi A2/B2)
  if (table === "Pengajuan" && type === "UPDATE") {
    const now = rec.tahapAktif, before = old.tahapAktif;
    if ((now === "A2" || now === "B2") && before !== now) {
      return { roles: ["staf", "admin"], title: "Berkas menunggu verifikasi",
        body: `${rec.nama || "Pemohon"} · ${rec.id}`, url: "/", tag: `ver-${rec.id}`, opd: rec.opd || null };
    }
    return null;
  }

  // 3) Pendaftaran akun baru menunggu persetujuan -> Admin
  if (table === "profiles" && (type === "INSERT" || type === "UPDATE")
      && rec.akun_status === "pending" && old.akun_status !== "pending") {
    return { roles: ["admin"], title: "Pendaftaran akun baru",
      body: `${rec.nama || rec.username || "Akun"} menunggu persetujuan`, url: "/", tag: `akun-${rec.id}` };
  }

  // 4) Dokumen PENGEMBALIAN diunggah pemohon -> Staf Pengampu OPD + Admin.
  //    Hanya untuk unggahan REVISI (berkas dikembalikan ke pemohon), BUKAN
  //    unggahan awal saat pengajuan baru dibuat (itu sudah dinotif "Pengajuan
  //    online baru"). Abaikan pula bila yang mengunggah adalah staf internal.
  if (table === "BerkasPengajuan" && type === "INSERT") {
    const { data: uploader } = await sb.from("profiles").select("role").eq("id", rec.uploadedBy).maybeSingle();
    if (uploader && STAF_ROLES.has(uploader.role)) return null; // unggahan staf -> lewati
    const { data: pj } = await sb.from("Pengajuan")
      .select("id,nama,status,catatan,opd").eq("id", rec.pengajuanId).maybeSingle();
    // "Pengembalian" = pengajuan sedang dikembalikan ke pemohon untuk dilengkapi:
    //   - status 'kembali'   -> dikembalikan saat proses (mis. bukti pelunasan), atau
    //   - masih di antrean loket ('diajukan') tapi 'catatan' pengembalian terisi
    //     (lewat kembalikanPengajuanOnline).
    // Unggahan awal pengajuan baru: status 'diajukan' & catatan kosong -> dilewati.
    const dikembalikan = !!pj && (pj.status === "kembali"
      || (typeof pj.catatan === "string" && pj.catatan.trim() !== ""));
    if (!dikembalikan) return null;
    return { roles: ["staf", "admin"], title: "Dokumen pengembalian diunggah",
      body: `${pj?.nama || "Pemohon"} · ${rec.pengajuanId}${rec.jenis ? " — " + rec.jenis : ""}`,
      url: "/", tag: `dok-${rec.pengajuanId}`, opd: pj?.opd || null };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (HOOK_SECRET && req.headers.get("x-webhook-secret") !== HOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response("VAPID belum dikonfigurasi", { status: 500 });
  }

  let payload: any;
  try { payload = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  const notif = await bangunNotif(payload);
  if (!notif) return new Response(JSON.stringify({ ok: true, skip: true }), { headers: { "Content-Type": "application/json" } });

  // Ambil id staf sesuai role (+ opd_ampu utk penyaringan pengampu), lalu langganan.
  const { data: users } = await sb.from("profiles").select("id, role, opd_ampu").in("role", notif.roles);
  // Staf Pengampu OPD ('staf') HANYA menerima notifikasi untuk OPD yang diampunya
  // (bisa beberapa OPD). Admin/operator tanpa filter. Staf tanpa OPD ATAU notif
  // tanpa OPD -> tetap diterima (catch-all, kompatibilitas mundur).
  const eligible = (users || []).filter((u: any) => {
    if (u.role !== "staf") return true;
    const list = Array.isArray(u.opd_ampu) ? u.opd_ampu : [];
    if (list.length === 0 || !notif.opd) return true;
    return list.includes(notif.opd);
  });
  const ids = eligible.map((u: any) => u.id);
  if (ids.length === 0) return new Response(JSON.stringify({ ok: true, terkirim: 0 }), { headers: { "Content-Type": "application/json" } });

  const { data: subs } = await sb.from("PushSubscription").select("*").in("userId", ids);
  const pesan = JSON.stringify({ title: notif.title, body: notif.body, url: notif.url, tag: notif.tag });

  let terkirim = 0;
  const errors: any[] = [];
  await Promise.all((subs || []).map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        pesan,
      );
      terkirim++;
    } catch (e: any) {
      errors.push({ code: e?.statusCode ?? null, msg: String(e?.body ?? e?.message ?? e).slice(0, 180) });
      // 404/410 = langganan kedaluwarsa -> hapus agar tak menumpuk.
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await sb.from("PushSubscription").delete().eq("endpoint", s.endpoint);
      }
    }
  }));

  return new Response(JSON.stringify({ ok: true, terkirim, langganan: subs?.length ?? 0, errors }), { headers: { "Content-Type": "application/json" } });
});
