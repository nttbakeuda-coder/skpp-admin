import { supabase } from "./supabaseClient";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ok  = (extra = {}) => ({ ok: true,  ...extra });
const err = (pesan)       => ({ ok: false, pesan });

function kodeAksesRandom() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
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
  return ok({ username: prof.username, nama: prof.nama, role: prof.role, pangkat: prof.pangkat || "" });
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
    .from("profiles").select("username, nama, role, pangkat").order("nama");
  if (error) return err(error.message || "Gagal memuat daftar akun.");
  return ok({ data: data || [] });
}

export async function tambahAkun({ username, password, nama, role }) {
  return await adminAkun({ action: "create", username, password, nama, role });
}

export async function editAkun({ username, nama, role }) {
  return await adminAkun({ action: "edit", username, nama, role });
}

export async function hapusAkun({ username }) {
  return await adminAkun({ action: "hapus", username });
}

export async function resetPassword({ username, passwordBaru }) {
  return await adminAkun({ action: "resetPassword", username, passwordBaru });
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
  const [{ data: pengajuan, error: e1 }, { data: riwayat }] = await Promise.all([
    supabase.from("Pengajuan").select("*").order("id", { ascending: false }),
    supabase.from("Riwayat").select("*").order("waktu", { ascending: true }),
  ]);
  if (e1) return err("Gagal memuat data pengajuan.");
  const data = (pengajuan ?? []).map(p => ({
    ...p,
    riwayat: (riwayat ?? []).filter(r => r.pengajuanId === p.id),
  }));
  return ok({ data });
}

export async function detail({ id }) {
  const [{ data: p, error: e1 }, { data: riwayat }] = await Promise.all([
    supabase.from("Pengajuan").select("*").eq("id", id).maybeSingle(),
    supabase.from("Riwayat").select("*").eq("pengajuanId", id).order("waktu", { ascending: true }),
  ]);
  if (e1 || !p) return err("Data tidak ditemukan.");
  return ok({ data: { ...p, riwayat: riwayat ?? [] } });
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
  const { pengajuanId, stepId, nextStepId, isKembali, isResume, catatan, catatanInternal, nomorSKPP } = updateData;

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
    tahapSelesai: tahapSelesai.join(","),
    // isResume: buka kembali tahap yang sama (tetap di stepId), jangan maju.
    tahapAktif:   (isKembali || isResume) ? stepId : (nextStepId || p.tahapAktif),
    status:       isKembali ? "kembali" : "proses",
  };
  if (nomorSKPP) updates.nomorSKPP = nomorSKPP;

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
