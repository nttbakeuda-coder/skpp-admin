import { supabase } from "./supabaseClient";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ok  = (extra = {}) => ({ ok: true,  ...extra });
const err = (pesan)       => ({ ok: false, pesan });

// Kode akses portal: 8 karakter acak KRIPTOGRAFIS (crypto.getRandomValues),
// bukan Math.random() yang mudah ditebak. Alfabet tanpa karakter ambigu
// (0/O, 1/I/L) agar mudah dibaca & diketik warga. 31^8 ≈ 8,5×10^11 kombinasi.
function kodeAksesRandom() {
  const ALF = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 simbol, tanpa 0 O 1 I L
  const n = 8;
  const buf = new Uint32Array(n);
  (globalThis.crypto || globalThis.msCrypto).getRandomValues(buf);
  let out = "";
  for (let i = 0; i < n; i++) out += ALF[buf[i] % ALF.length];
  return out;
}

// ── ID generator via tabel Counter ───────────────────────────────────────────
async function nextId() {
  const tahun = new Date().getFullYear();
  const { data: cur } = await supabase
    .from("Counter").select("nilai").eq("tahun", tahun).maybeSingle();
  const nilai = (cur?.nilai ?? 0) + 1;
  await supabase.from("Counter").upsert({ tahun, nilai }, { onConflict: "tahun" });
  return `SKPP-${tahun}-${String(nilai).padStart(4, "0")}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH (Supabase Auth — username NIP dipetakan ke email sintetis)
// ══════════════════════════════════════════════════════════════════════════════

const EMAIL = (username) => `${username}@skpp.local`;

async function profilSesi(userId) {
  const { data } = await supabase
    .from("profiles").select("username, nama, role, pangkat").eq("id", userId).maybeSingle();
  return data;
}

// Identitas pelaku aksi — untuk jejak audit pada Riwayat (siapa yang
// memproses/menginput tiap tahap). Diambil dari sesi login yang aktif.
async function aktorSekarang() {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return { oleh: "", olehNama: "" };
  const { data } = await supabase
    .from("profiles").select("username, nama").eq("id", uid).maybeSingle();
  return { oleh: data?.username || "", olehNama: data?.nama || "" };
}

export async function login({ username, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMAIL(username), password,
  });
  if (error || !data?.user) return err("Username atau password salah.");
  const prof = await profilSesi(data.user.id);
  if (!prof) {
    await supabase.auth.signOut();
    return err("Akun belum memiliki profil. Hubungi administrator.");
  }
  // Catat waktu login & kehadiran (best-effort; abaikan bila kolom belum ada).
  try {
    const now = new Date().toISOString();
    await supabase.from("profiles").update({ last_login: now, last_seen: now }).eq("id", data.user.id);
  } catch {}
  return ok({ username: prof.username, nama: prof.nama, role: prof.role, pangkat: prof.pangkat || "" });
}

// Heartbeat kehadiran: perbarui last_seen agar admin bisa melihat siapa yang
// sedang aktif. Dipanggil berkala oleh aplikasi selama sesi terbuka.
export async function touchPresence() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id);
  } catch {}
}

// Status login seluruh pengguna (khusus admin) — nama, role, last_login,
// last_seen. Bila kolom login belum ditambahkan (migrasi belum jalan),
// kembalikan needsMigration:true agar UI menampilkan petunjuk.
export async function statusLoginPengguna() {
  const res = await supabase
    .from("profiles").select("username, nama, role, last_login, last_seen").order("nama");
  if (res.error) {
    const base = await supabase.from("profiles").select("username, nama, role").order("nama");
    if (base.error) return err(base.error.message || "Gagal memuat data pengguna.");
    return ok({ data: (base.data || []).map(u => ({ ...u, last_login: null, last_seen: null })), needsMigration: true });
  }
  return ok({ data: res.data || [] });
}

export async function logout() {
  await supabase.auth.signOut();
  return ok();
}

// Memulihkan sesi yang tersimpan (dipanggil saat aplikasi dibuka).
export async function sesiSaatIni() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const prof = await profilSesi(session.user.id);
  return prof ? { username: prof.username, nama: prof.nama, role: prof.role, pangkat: prof.pangkat || "" } : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// MANAJEMEN AKUN (lewat Edge Function admin-akun; butuh role admin)
// ══════════════════════════════════════════════════════════════════════════════

async function adminAkun(payload) {
  const { data, error } = await supabase.functions.invoke("admin-akun", { body: payload });
  if (error) {
    let pesan = "Gagal menghubungi layanan akun.";
    try { const ctx = await error.context?.json?.(); if (ctx?.pesan) pesan = ctx.pesan; } catch {}
    return err(pesan);
  }
  return data;
}

export async function daftarAkun() {
  // Baca langsung dari tabel profiles (bukan Edge Function admin) agar daftar
  // nama bisa dimuat oleh semua user yang login — dibutuhkan form verifikasi
  // untuk memilih nama staf loket / pengampu OPD. Akses diatur oleh RLS policy
  // "profiles_select" (lihat supabase/04_profiles_directory.sql).
  const { data, error } = await supabase
    .from("profiles").select("username, nama, role, pangkat, opd").order("nama");
  if (error) return err(error.message || "Gagal memuat daftar akun.");
  return ok({ data: data || [] });
}

export async function tambahAkun({ username, password, nama, role, opd }) {
  return await adminAkun({ action: "create", username, password, nama, role, opd });
}

export async function editAkun({ username, nama, role, opd }) {
  return await adminAkun({ action: "edit", username, nama, role, opd });
}

export async function hapusAkun({ username }) {
  return await adminAkun({ action: "hapus", username });
}

export async function resetPassword({ username, passwordBaru }) {
  return await adminAkun({ action: "resetPassword", username, passwordBaru });
}

// ── Persetujuan akun pemohon/bendahara (portal pengajuan online) ──
export async function listAkunPending() {
  return await adminAkun({ action: "listPending" });
}

export async function setAkunStatus({ userId, akunStatus }) {
  return await adminAkun({ action: "setAkunStatus", userId, akunStatus });
}

// ══════════════════════════════════════════════════════════════════════════════
// LUPA KATA SANDI — permintaan reset dari halaman login (tanpa perlu login)
// ══════════════════════════════════════════════════════════════════════════════

// Dipanggil dari halaman login oleh pengunjung yang belum masuk (anon).
export async function ajukanResetPassword({ username, alasan }) {
  const u = (username || "").trim();
  if (!u) return err("NIP / Username wajib diisi.");
  const { error } = await supabase.from("ResetRequest").insert({
    username: u,
    alasan: (alasan || "").trim() || null,
    status: "pending",
    waktu: new Date().toLocaleString("id-ID"),
  });
  if (error) return err("Gagal mengirim permintaan: " + error.message);
  return ok({ pesan: "Permintaan reset kata sandi terkirim. Administrator akan menindaklanjuti." });
}

// Admin: daftar semua permintaan reset (terbaru di atas).
export async function daftarPermintaanReset() {
  const { data, error } = await supabase
    .from("ResetRequest").select("*").order("created_at", { ascending: false });
  if (error) return err("Gagal memuat permintaan reset.");
  return ok({ data: data || [] });
}

// Admin: tandai sebuah permintaan sudah ditindaklanjuti.
export async function tandaiResetSelesai({ id }) {
  const { error } = await supabase.from("ResetRequest").update({ status: "selesai" }).eq("id", id);
  if (error) return err("Gagal memperbarui status permintaan.");
  return ok();
}

// Admin: hapus sebuah permintaan reset.
export async function hapusPermintaanReset({ id }) {
  const { error } = await supabase.from("ResetRequest").delete().eq("id", id);
  if (error) return err("Gagal menghapus permintaan.");
  return ok();
}

// ── Profil & kata sandi sendiri (pakai sesi yang sedang login) ──
export async function profil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Sesi berakhir. Silakan masuk kembali.");
  const { data, error } = await supabase
    .from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error || !data) return err("Gagal memuat profil.");
  return ok({ data });
}

export async function updateProfil({ data: formData }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err("Sesi berakhir. Silakan masuk kembali.");
  const { error } = await supabase
    .from("profiles").update({
      nama: formData.nama,
      pangkat: formData.pangkat || null,
      jabatan: formData.jabatan || null,
      status_asn: formData.status_asn || null,
    }).eq("id", user.id);
  if (error) return err("Gagal memperbarui profil.");
  return ok({ pesan: "Profil berhasil diperbarui." });
}

export async function gantiPassword({ passwordLama, passwordBaru }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return err("Sesi berakhir. Silakan masuk kembali.");
  // Verifikasi kata sandi lama dengan login ulang.
  const { error: ve } = await supabase.auth.signInWithPassword({
    email: user.email, password: passwordLama,
  });
  if (ve) return err("Kata sandi lama tidak sesuai.");
  const { error } = await supabase.auth.updateUser({ password: passwordBaru });
  if (error) return err("Gagal mengubah kata sandi.");
  return ok({ pesan: "Kata sandi berhasil diubah." });
}

// ══════════════════════════════════════════════════════════════════════════════
// PENGAJUAN
// ══════════════════════════════════════════════════════════════════════════════

export async function daftarSemua() {
  const [{ data: pengajuan, error: e1 }, { data: riwayat }, { data: berkas }, { data: profils }] = await Promise.all([
    supabase.from("Pengajuan").select("*").order("id", { ascending: false }),
    supabase.from("Riwayat").select("*").order("waktu", { ascending: true }),
    supabase.from("BerkasPengajuan").select("*").order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, role"),
  ]);
  if (e1) return err("Gagal memuat data pengajuan.");
  const roleById = new Map((profils ?? []).map(pr => [pr.id, pr.role]));
  const data = (pengajuan ?? []).map(p => ({
    ...p,
    riwayat: (riwayat ?? []).filter(r => r.pengajuanId === p.id),
    // Berkas yang diunggah pemohon lewat portal (mis. bukti pelunasan hutang
    // saat berkas dikembalikan) -- dipakai utk tombol "Lihat" & notifikasi.
    berkas: (berkas ?? []).filter(b => b.pengajuanId === p.id),
    // Role akun pengaju (bendahara/pemohon) -- dipakai utk fitur yang cuma
    // relevan bila pengajuan online diajukan Bendahara OPD.
    pengajuRole: roleById.get(p.submittedBy) || null,
  }));
  return ok({ data });
}

export async function detail({ id }) {
  const [{ data: p, error: e1 }, { data: riwayat }, { data: berkas }] = await Promise.all([
    supabase.from("Pengajuan").select("*").eq("id", id).maybeSingle(),
    supabase.from("Riwayat").select("*").eq("pengajuanId", id).order("waktu", { ascending: true }),
    supabase.from("BerkasPengajuan").select("*").eq("pengajuanId", id).order("created_at", { ascending: true }),
  ]);
  if (e1 || !p) return err("Data tidak ditemukan.");
  let pengajuRole = null;
  if (p.submittedBy) {
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", p.submittedBy).maybeSingle();
    pengajuRole = prof?.role || null;
  }
  return ok({ data: { ...p, riwayat: riwayat ?? [], berkas: berkas ?? [], pengajuRole } });
}

export async function inputBaru({ data: formData }) {
  const id = await nextId();
  const kodeAkses = kodeAksesRandom();
  const tanggalMasuk = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const est = new Date(); est.setDate(est.getDate() + 7);
  const estimasiSelesai = est.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  // Saat input oleh loket, tahap "Berkas Diterima di Loket" (A1/B1) langsung selesai,
  // tahap aktif berpindah ke tahap berikutnya (A2/B2).
  const firstStep = formData.jalur === "A" ? "A1" : "B1";
  const nextStep  = formData.jalur === "A" ? "A2" : "B2";

  const { error } = await supabase.from("Pengajuan").insert({
    id, ...formData, kodeAkses, tanggalMasuk, estimasiSelesai,
    tahapAktif: nextStep, tahapSelesai: firstStep, status: "proses",
  });
  if (error) return err("Gagal menyimpan pengajuan: " + error.message);

  const aktor = await aktorSekarang();
  await supabase.from("Riwayat").insert({
    pengajuanId: id, tahap: firstStep,
    waktu: new Date().toLocaleString("id-ID"),
    catatan: "Berkas diterima di loket", isKembali: false,
    oleh: aktor.oleh, olehNama: aktor.olehNama,
  });

  return ok({ id, kodeAkses, pesan: "Pengajuan berhasil disimpan." });
}

export async function inputBulk({ data: bulkData }) {
  const { namaOPD, items } = bulkData;
  const kodeAkses = kodeAksesRandom();
  const grupId = "GRUP-" + Date.now();
  const tanggalMasuk = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const daftarId = [];
  const aktor = await aktorSekarang();

  for (const item of items) {
    const id = await nextId();
    daftarId.push(id);
    const est = new Date(); est.setDate(est.getDate() + 7);
    // Tahap "Berkas Diterima di Loket" langsung selesai saat diinput loket.
    const firstStep = item.jalur === "A" ? "A1" : "B1";
    const nextStep  = item.jalur === "A" ? "A2" : "B2";

    await supabase.from("Pengajuan").insert({
      id, ...item, opd: namaOPD, kasubid: item.kasubid,
      kodeAkses, tanggalMasuk,
      estimasiSelesai: est.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      tahapAktif: nextStep, tahapSelesai: firstStep, status: "proses",
    });
    await supabase.from("Riwayat").insert({
      pengajuanId: id, tahap: firstStep,
      waktu: new Date().toLocaleString("id-ID"),
      catatan: "Berkas diterima di loket (bulk)", isKembali: false,
      oleh: aktor.oleh, olehNama: aktor.olehNama,
    });
  }

  await supabase.from("BulkGrup").insert({
    id: grupId, kodeAkses, namaOPD, jumlah: daftarId.length, tanggal: tanggalMasuk,
  });

  return ok({ jumlah: daftarId.length, grupId, kodeAkses, daftarId });
}

export async function updateTahap({ data: updateData }) {
  const { pengajuanId, stepId, nextStepId, isKembali, isResume, catatan, catatanInternal, nomorSKPP, jalur, tahapSelesaiSet } = updateData;

  const { data: p } = await supabase
    .from("Pengajuan").select("tahapSelesai, tahapAktif").eq("id", pengajuanId).maybeSingle();
  if (!p) return err("Pengajuan tidak ditemukan.");

  const tahapSelesai = p.tahapSelesai
    ? p.tahapSelesai.split(",").filter(Boolean)
    : [];
  // Hanya tandai tahap selesai saat tahap benar-benar diselesaikan.
  // Jangan menandai selesai saat dikembalikan (isKembali) atau saat
  // melanjutkan kembali berkas yang sudah dilengkapi (isResume).
  if (!isKembali && !isResume && !tahapSelesai.includes(stepId)) tahapSelesai.push(stepId);

  const updates = {
    // tahapSelesaiSet: override eksplisit — dipakai saat Verifikasi Kelengkapan
    // Berkas menetapkan jalur, agar id tahap awal ikut dipetakan ke seri jalur
    // terpilih (A1/A2 <-> B1/B2).
    tahapSelesai: tahapSelesaiSet != null ? tahapSelesaiSet : tahapSelesai.join(","),
    // isResume: buka kembali tahap yang sama (tetap di stepId), jangan maju.
    tahapAktif:   (isKembali || isResume) ? stepId : (nextStepId || p.tahapAktif),
    status:       isKembali ? "kembali" : "proses",
  };
  if (nomorSKPP) updates.nomorSKPP = nomorSKPP;
  // Penetapan jalur proses (A/B) saat tahap Verifikasi Kelengkapan Berkas.
  if (jalur) updates.jalur = jalur;

  const { error } = await supabase.from("Pengajuan").update(updates).eq("id", pengajuanId);
  if (error) return err("Gagal update tahap: " + error.message);

  const aktor = await aktorSekarang();
  await supabase.from("Riwayat").insert({
    pengajuanId, tahap: stepId,
    waktu: new Date().toLocaleString("id-ID"),
    catatan: catatan ?? "", catatanInternal: catatanInternal ?? "",
    isKembali: isKembali ?? false,
    oleh: aktor.oleh, olehNama: aktor.olehNama,
  });

  return ok({ nextStepId });
}

// Mundurkan/undur tahap (khusus Admin) — koreksi bila proses salah maju.
// Frontend menghitung tahapSelesai & tahapAktif baru (berdasar seri jalur),
// fungsi ini menuliskannya + status kembali "proses" (mencabut "selesai"),
// mengosongkan tanggalSelesai, dan mencatat Riwayat.
export async function rollbackTahap({ id, tahapSelesai, tahapAktif, label }) {
  const { error } = await supabase.from("Pengajuan").update({
    tahapSelesai, tahapAktif, status: "proses", tanggalSelesai: null,
  }).eq("id", id);
  if (error) return err("Gagal memundurkan tahap: " + error.message);

  const aktor = await aktorSekarang();
  await supabase.from("Riwayat").insert({
    pengajuanId: id, tahap: tahapAktif,
    waktu: new Date().toLocaleString("id-ID"),
    catatan: "", catatanInternal: `Tahap dimundurkan oleh Admin ke "${label || tahapAktif}" untuk koreksi.`,
    isKembali: false, oleh: aktor.oleh, olehNama: aktor.olehNama,
  });

  return ok({ id, pesan: `Tahap dimundurkan ke "${label || tahapAktif}".` });
}

export async function setSelesai({ id, tanggalSelesai }) {
  const tgl = tanggalSelesai
    ?? new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const { error } = await supabase
    .from("Pengajuan").update({ status: "selesai", tanggalSelesai: tgl }).eq("id", id);
  if (error) return err("Gagal menandai selesai: " + error.message);
  const aktor = await aktorSekarang();
  await supabase.from("Riwayat").insert({
    pengajuanId: id, tahap: "SELESAI",
    waktu: new Date().toLocaleString("id-ID"),
    catatan: "SKPP selesai dan diserahkan kepada pemohon", isKembali: false,
    oleh: aktor.oleh, olehNama: aktor.olehNama,
  });
  return ok({ id, tanggalSelesai: tgl });
}

// ── Serah terima SKPP ke pemohon (bukti: data penerima + tanda tangan + foto) ──
const BUKET_SERAH = "bukti-serah-terima";

// Ubah dataURL (mis. PNG tanda tangan dari canvas) menjadi Blob untuk diunggah.
async function dataUrlKeBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export async function serahTerimaSKPP({ id, penerimaNama, penerimaNIP, penerimaStatus, ttdDataUrl, fotoFile }) {
  const stamp = Date.now();
  let ttdPath = null, buktiPath = null;
  try {
    if (ttdDataUrl) {
      const blob = await dataUrlKeBlob(ttdDataUrl);
      ttdPath = `${id}/ttd-${stamp}.png`;
      const { error } = await supabase.storage.from(BUKET_SERAH)
        .upload(ttdPath, blob, { contentType: "image/png", upsert: true });
      if (error) return err("Gagal mengunggah tanda tangan: " + error.message);
    }
    if (fotoFile) {
      const ext = (fotoFile.name?.split(".").pop() || "jpg").toLowerCase();
      buktiPath = `${id}/bukti-${stamp}.${ext}`;
      const { error } = await supabase.storage.from(BUKET_SERAH)
        .upload(buktiPath, fotoFile, { upsert: true });
      if (error) return err("Gagal mengunggah foto bukti: " + error.message);
    }
  } catch (e) {
    return err("Gagal mengunggah berkas bukti: " + String(e?.message ?? e));
  }

  const waktu = new Date().toLocaleString("id-ID");
  const tglSelesai = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  // Tuntaskan tahap akhir: tandai tahap aktif (tahap terakhir) sebagai selesai
  // agar progress menjadi 100% — langkah yg biasanya dilakukan updateTahap.
  const { data: cur } = await supabase
    .from("Pengajuan").select("tahapSelesai, tahapAktif").eq("id", id).maybeSingle();
  const tahapSelesai = (cur?.tahapSelesai || "").split(",").filter(Boolean);
  if (cur?.tahapAktif && !tahapSelesai.includes(cur.tahapAktif)) tahapSelesai.push(cur.tahapAktif);

  const { error } = await supabase.from("Pengajuan").update({
    status: "selesai",
    tanggalSelesai: tglSelesai,
    tahapSelesai: tahapSelesai.join(","),
    tanggalSerahTerima: waktu,
    penerimaNama: penerimaNama || null,
    penerimaNIP: penerimaNIP || null,
    penerimaStatus: penerimaStatus || null,
    ttdSerahPath: ttdPath,
    buktiSerahPath: buktiPath,
  }).eq("id", id);
  if (error) return err("Gagal mencatat serah terima: " + error.message);

  const aktor = await aktorSekarang();
  await supabase.from("Riwayat").insert({
    pengajuanId: id, tahap: "SELESAI", waktu,
    catatan: `SKPP diserahkan kepada ${penerimaNama || "pemohon"}${penerimaStatus ? ` (${penerimaStatus})` : ""}.`,
    isKembali: false, oleh: aktor.oleh, olehNama: aktor.olehNama,
  });
  return ok({ id, tanggalSelesai: tglSelesai, waktu });
}

// URL bertanda-tangan (sementara) untuk melihat berkas bukti dari bucket privat.
export async function buktiSerahUrl(path, detik = 600) {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUKET_SERAH).createSignedUrl(path, detik);
  return data?.signedUrl || null;
}

// ── Dokumen SKPP final (hasil scan) — diunggah staf, diunduh pemohon di portal ──
const BUKET_SKPP = "skpp-final";
// Unggah/ganti file SKPP terscan utk pengajuan {id}, lalu catat path-nya di
// Pengajuan.skppFinalPath. RLS storage: hanya staf (is_staff) yang boleh menulis.
export async function unggahSkppFinal({ id, file }) {
  const path = `${id}.pdf`;
  const up = await supabase.storage.from(BUKET_SKPP)
    .upload(path, file, { contentType: file.type || "application/pdf", upsert: true });
  if (up.error) return err("Gagal mengunggah file SKPP: " + up.error.message);
  const { error } = await supabase.from("Pengajuan").update({ skppFinalPath: path }).eq("id", id);
  if (error) return err("File terunggah tetapi gagal dicatat: " + error.message);
  return ok({ path, pesan: "Dokumen SKPP berhasil diunggah." });
}
// URL sementara untuk melihat/mengunduh SKPP terscan (sisi dasbor).
export async function skppFinalUrl(path, detik = 600) {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUKET_SKPP).createSignedUrl(path, detik);
  return data?.signedUrl || null;
}

// Hapus pengajuan beserta riwayatnya (khusus admin).
export async function hapusPengajuan({ id }) {
  await supabase.from("Riwayat").delete().eq("pengajuanId", id);
  // .select() mengembalikan baris yang benar-benar terhapus, untuk mendeteksi
  // bila penghapusan diam-diam tidak terjadi (mis. kebijakan RLS Supabase).
  const { data: del, error } = await supabase.from("Pengajuan").delete().eq("id", id).select();
  if (error) return err("Gagal menghapus pengajuan: " + error.message);
  if (!del || del.length === 0) {
    return err("Server tidak menghapus data. Periksa kebijakan akses (RLS) tabel \"Pengajuan\" di Supabase — pastikan operasi DELETE diizinkan.");
  }
  return ok({ id, pesan: "Pengajuan berhasil dihapus." });
}

// ══════════════════════════════════════════════════════════════════════════════
// ANTREAN PENGAJUAN ONLINE (loket: Terima / Kembalikan / Tolak)
// ══════════════════════════════════════════════════════════════════════════════
const BUKET_BERKAS = "berkas-pengajuan";

// URL bertanda-tangan (sementara) untuk melihat berkas persyaratan dari bucket privat.
export async function berkasPengajuanUrl(path, detik = 600) {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUKET_BERKAS).createSignedUrl(path, detik);
  return data?.signedUrl || null;
}

// Unduh berkas persyaratan secara paksa. Signed URL Supabase Storage lintas-
// domain, jadi atribut `download` HTML biasa tidak dipatuhi browser -- ambil
// sebagai blob dulu lalu picu unduhan lewat elemen <a> sementara.
export async function unduhBerkasPengajuan(path, filename) {
  const url = await berkasPengajuanUrl(path);
  if (!url) return false;
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename || path.split("/").pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
  return true;
}

// Unggah Draft SKPP (staf, pada tahap "Pembuatan Draft SKPP"). Path memakai
// prefix UID STAF pengunggah (bukan pemohon) krn policy RLS storage
// mewajibkan folder pertama = auth.uid() milik pengunggah -- staf sudah
// diberi akses insert tabel via is_staff() (lihat berkas_insert), jadi tidak
// perlu migrasi RLS baru. UID diambil langsung dari sesi auth (bukan dari
// state `user` di App.jsx, yang cuma menyimpan username/nama/role/pangkat).
export async function uploadDraftSkpp({ pengajuanId, file }) {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return err("Sesi berakhir. Silakan masuk kembali.");
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${authUser.id}/${pengajuanId}/draft-skpp-${Date.now()}-${safeName}`;
  const up = await supabase.storage.from(BUKET_BERKAS).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return err("Gagal mengunggah draft SKPP: " + up.error.message);
  const meta = await supabase.from("BerkasPengajuan").insert({
    pengajuanId, jenis: "Draft SKPP", path, uploadedBy: authUser.id,
  });
  if (meta.error) return err("Gagal menyimpan metadata: " + meta.error.message);
  return ok({ path });
}

// Unggah Rincian Perhitungan Kekurangan Pembayaran Pangkat Pengabdian (staf,
// tahap B5), khusus pengajuan online yang diajukan Bendahara OPD -- berkas
// ini TIDAK disembunyikan dari pemohon (beda dgn Draft SKPP), krn memang
// ditujukan utk diunduh Bendahara OPD lewat portal.
export async function uploadRincianKekurangan({ pengajuanId, file }) {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return err("Sesi berakhir. Silakan masuk kembali.");
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${authUser.id}/${pengajuanId}/rincian-kekurangan-${Date.now()}-${safeName}`;
  const up = await supabase.storage.from(BUKET_BERKAS).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return err("Gagal mengunggah berkas: " + up.error.message);
  const meta = await supabase.from("BerkasPengajuan").insert({
    pengajuanId, jenis: "Rincian Perhitungan Kekurangan Pembayaran Pangkat Pengabdian", path, uploadedBy: authUser.id,
  });
  if (meta.error) return err("Gagal menyimpan metadata: " + meta.error.message);
  return ok({ path });
}

// Unggah hasil PDF SKPP yang fotonya sudah ditempel otomatis (tahap
// "Penempelan Foto & Penomoran"). Sama pola dgn uploadDraftSkpp.
export async function uploadSkppFotoDitempel({ pengajuanId, file }) {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return err("Sesi berakhir. Silakan masuk kembali.");
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${authUser.id}/${pengajuanId}/skpp-foto-${Date.now()}-${safeName}`;
  const up = await supabase.storage.from(BUKET_BERKAS).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return err("Gagal mengunggah berkas: " + up.error.message);
  const meta = await supabase.from("BerkasPengajuan").insert({
    pengajuanId, jenis: "SKPP (Foto Ditempel)", path, uploadedBy: authUser.id,
  });
  if (meta.error) return err("Gagal menyimpan metadata: " + meta.error.message);
  return ok({ path });
}

// Semua pengajuan online (sumber='online'), berapapun statusnya -- tab
// "Menunggu"/"Ditolak"/"Diterima" difilter di sisi UI dari status ini.
// Turut disertakan role akun pengaju (bendahara/pemohon) via join profiles,
// utk menampilkan apakah diajukan Bendahara OPD atau perorangan.
export async function listAntreanOnline() {
  const [{ data: pengajuan, error: e1 }, { data: berkas }, { data: profils }] = await Promise.all([
    supabase.from("Pengajuan").select("*").eq("sumber", "online").order("id", { ascending: false }),
    supabase.from("BerkasPengajuan").select("*").order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, role"),
  ]);
  if (e1) return err("Gagal memuat antrean pengajuan online: " + e1.message);
  const ids = new Set((pengajuan ?? []).map(p => p.id));
  const roleById = new Map((profils ?? []).map(pr => [pr.id, pr.role]));
  const data = (pengajuan ?? []).map(p => ({
    ...p,
    berkas: (berkas ?? []).filter(b => b.pengajuanId === p.id && ids.has(p.id)),
    pengajuRole: roleById.get(p.submittedBy) || null,
  }));
  return ok({ data });
}

// Terima: pengajuan online masuk alur normal. Loket TIDAK lagi menentukan jalur
// proses — jalur ditetapkan Staf Pengampu OPD saat "Verifikasi Kelengkapan
// Berkas" (tahap A2/B2). Loket hanya menandai "Berkas Diterima di Loket" (A1)
// selesai & memindahkan tahap aktif ke Verifikasi Kelengkapan Berkas (A2).
// Basis A dipakai untuk id tahap awal yang SAMA pada kedua jalur (A1/A2 == B1/B2);
// seri tahapan final ditetapkan begitu jalur dipilih di tahap verifikasi.
// kasubid & subjenis dipakai nanti saat penomoran SKPP (lihat generateTemplateNomor).
export async function terimaPengajuanOnline({ id, kasubid, subjenis }) {
  if (!kasubid) return err("Kasubid pembayaran wajib dipilih.");
  const est = new Date(); est.setDate(est.getDate() + 7);
  const estimasiSelesai = est.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  const { error } = await supabase.from("Pengajuan").update({
    jalur: null, estimasiSelesai, tahapAktif: "A2", tahapSelesai: "A1",
    status: "proses", catatan: null, kasubid, subjenis: subjenis || null,
  }).eq("id", id);
  if (error) return err("Gagal menerima pengajuan: " + error.message);

  const aktor = await aktorSekarang();
  await supabase.from("Riwayat").insert({
    pengajuanId: id, tahap: "A1",
    waktu: new Date().toLocaleString("id-ID"),
    catatan: "Berkas diterima di loket (pengajuan online)", isKembali: false,
    oleh: aktor.oleh, olehNama: aktor.olehNama,
  });

  return ok({ id, pesan: "Pengajuan diterima & masuk ke tahap Verifikasi Kelengkapan Berkas." });
}

// Kembalikan: tetap berstatus "diajukan" (antrean) + catatan agar pemohon
// melengkapi/mengganti berkas lalu mengunggah ulang lewat portal.
export async function kembalikanPengajuanOnline({ id, catatan }) {
  const c = (catatan || "").trim();
  if (!c) return err("Catatan/alasan pengembalian wajib diisi.");
  const { error } = await supabase.from("Pengajuan").update({ catatan: c }).eq("id", id);
  if (error) return err("Gagal mengembalikan pengajuan: " + error.message);
  return ok({ id, pesan: "Pengajuan dikembalikan ke pemohon untuk dilengkapi." });
}

// Tolak: pengajuan tidak dilanjutkan (keperluan tidak sesuai / bukan wewenang, dst).
export async function tolakPengajuanOnline({ id, alasan }) {
  const c = (alasan || "").trim();
  if (!c) return err("Alasan penolakan wajib diisi.");
  const { error } = await supabase.from("Pengajuan").update({ status: "ditolak", catatan: c }).eq("id", id);
  if (error) return err("Gagal menolak pengajuan: " + error.message);
  return ok({ id, pesan: "Pengajuan ditolak." });
}

// Tolak bukti pelunasan hutang yang diunggah pemohon (mis. bukti setoran keliru/
// tidak sah). Lewat RPC SECURITY DEFINER (bukan delete langsung dari klien):
// hanya Staf Pengampu OPD ('staf') / Admin yang diizinkan (dicek di server),
// jadi tidak perlu memberi hak DELETE umum ke tabel BerkasPengajuan lewat RLS.
// Hapus berkasnya (status kembali "belum diunggah" di portal, pemohon diminta
// unggah ulang) + catat alasan penolakan ke Riwayat.
export async function tolakBuktiHutang({ pengajuanId, berkasId, label, alasan }) {
  const a = (alasan || "").trim();
  if (!a) return err("Alasan penolakan wajib diisi.");
  const { error } = await supabase.rpc("tolak_bukti_hutang", {
    p_pengajuan_id: pengajuanId, p_berkas_id: berkasId, p_label: label, p_alasan: a,
  });
  if (error) return err("Gagal menolak bukti: " + error.message);
  return ok({ pesan: "Bukti ditolak & pemohon diminta unggah ulang." });
}

// ── SURVEI KEPUASAN MASYARAKAT (SKM / IKM) ──────────────────────────────────
// Rekap agregat survei layanan pada rentang tanggal (kosong = seluruh periode).
// Mengembalikan { responden, nrr:{u1..u9}, ikm, mutu, saran[] } via RPC
// SECURITY DEFINER rekap_survei_skm (baca-only, khusus staf yang login).
export async function rekapSurvei(dari = null, sampai = null) {
  const { data, error } = await supabase.rpc("rekap_survei_skm", {
    p_dari: dari || null,
    p_sampai: sampai || null,
  });
  if (error) return err("Gagal memuat rekap survei: " + error.message);
  return ok({ data: data || {} });
}
