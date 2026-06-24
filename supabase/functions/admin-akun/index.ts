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
    const { action, username, password, nama, role, passwordBaru } = await req.json();

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

      default:
        return json({ ok: false, pesan: "Aksi tidak dikenal." }, 400);
    }
  } catch (e) {
    return json({ ok: false, pesan: String((e as Error)?.message ?? e) }, 500);
  }
});
