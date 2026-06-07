import { supabase } from "./supabaseClient";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ok  = (extra = {}) => ({ ok: true,  ...extra });
const err = (pesan)       => ({ ok: false, pesan });

function kodeAksesRandom() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
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
// AUTH
// ══════════════════════════════════════════════════════════════════════════════

export async function login({ username, password }) {
  const { data, error } = await supabase
    .from("Akun").select("*")
    .eq("username", username).eq("password", password).maybeSingle();
  if (error) return err("Gagal terhubung ke database.");
  if (!data)  return err("Username atau password salah.");
  return ok({ nama: data.nama, role: data.role });
}

// ══════════════════════════════════════════════════════════════════════════════
// MANAJEMEN AKUN
// ══════════════════════════════════════════════════════════════════════════════

export async function daftarAkun() {
  const { data, error } = await supabase
    .from("Akun").select("username, nama, role").order("nama");
  if (error) return err("Gagal memuat daftar akun.");
  return ok({ data });
}

export async function tambahAkun({ username, password, nama, role }) {
  const { data: ada } = await supabase
    .from("Akun").select("username").eq("username", username).maybeSingle();
  if (ada) return err(`Username "${username}" sudah digunakan.`);
  const { error } = await supabase
    .from("Akun").insert({ username, password, nama, role });
  if (error) return err("Gagal menambahkan akun: " + error.message);
  return ok({ pesan: `Akun "${username}" berhasil ditambahkan.` });
}

export async function hapusAkun({ username }) {
  const { error } = await supabase.from("Akun").delete().eq("username", username);
  if (error) return err("Gagal menghapus akun: " + error.message);
  return ok({ pesan: `Akun "${username}" berhasil dihapus.` });
}

export async function resetPassword({ username, passwordBaru }) {
  const { error } = await supabase
    .from("Akun").update({ password: passwordBaru }).eq("username", username);
  if (error) return err("Gagal mereset kata sandi: " + error.message);
  return ok({ pesan: "Kata sandi berhasil direset." });
}

export async function profil({ username }) {
  const { data, error } = await supabase
    .from("Akun").select("*").eq("username", username).maybeSingle();
  if (error || !data) return err("Gagal memuat profil.");
  return ok({ data });
}

export async function updateProfil({ username, data: formData }) {
  const { error } = await supabase
    .from("Akun")
    .update({ nama: formData.nama })
    .eq("username", username);
  if (error) return err("Gagal memperbarui profil.");
  return ok({ pesan: "Profil berhasil diperbarui." });
}

export async function gantiPassword({ username, passwordLama, passwordBaru }) {
  const { data: akun } = await supabase
    .from("Akun").select("password").eq("username", username).maybeSingle();
  if (!akun || akun.password !== passwordLama) return err("Kata sandi lama tidak sesuai.");
  const { error } = await supabase
    .from("Akun").update({ password: passwordBaru }).eq("username", username);
  if (error) return err("Gagal mengubah kata sandi.");
  return ok({ pesan: "Kata sandi berhasil diubah." });
}

// ══════════════════════════════════════════════════════════════════════════════
// PENGAJUAN
// ══════════════════════════════════════════════════════════════════════════════

export async function daftarSemua() {
  const [{ data: pengajuan, error: e1 }, { data: riwayat }] = await Promise.all([
    supabase.from("Pengajuan").select("*").order("tanggalMasuk", { ascending: false }),
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
  const tahapAktif = formData.jalur === "A" ? "A1" : "B1";

  const { error } = await supabase.from("Pengajuan").insert({
    id, ...formData, kodeAkses, tanggalMasuk, estimasiSelesai,
    tahapAktif, tahapSelesai: "", status: "proses",
  });
  if (error) return err("Gagal menyimpan pengajuan: " + error.message);

  await supabase.from("Riwayat").insert({
    pengajuanId: id, tahap: tahapAktif,
    waktu: new Date().toLocaleString("id-ID"),
    catatan: "Berkas diterima di loket", isKembali: false,
  });

  return ok({ id, kodeAkses, pesan: "Pengajuan berhasil disimpan." });
}

export async function inputBulk({ data: bulkData }) {
  const { namaOPD, kasubid, items } = bulkData;
  const kodeAkses = kodeAksesRandom();
  const grupId = "GRUP-" + Date.now();
  const tanggalMasuk = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const daftarId = [];

  for (const item of items) {
    const id = await nextId();
    daftarId.push(id);
    const est = new Date(); est.setDate(est.getDate() + 7);
    const tahapAktif = item.jalur === "A" ? "A1" : "B1";

    await supabase.from("Pengajuan").insert({
      id, ...item, opd: namaOPD, kasubid,
      kodeAkses, tanggalMasuk,
      estimasiSelesai: est.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      tahapAktif, tahapSelesai: "", status: "proses",
    });
    await supabase.from("Riwayat").insert({
      pengajuanId: id, tahap: tahapAktif,
      waktu: new Date().toLocaleString("id-ID"),
      catatan: "Berkas diterima di loket (bulk)", isKembali: false,
    });
  }

  await supabase.from("BulkGrup").insert({
    id: grupId, kodeAkses, namaOPD, jumlah: daftarId.length, tanggal: tanggalMasuk,
  });

  return ok({ jumlah: daftarId.length, grupId, kodeAkses, daftarId });
}

export async function updateTahap({ data: updateData }) {
  const { pengajuanId, stepId, nextStepId, isKembali, catatan, nomorSKPP } = updateData;

  const { data: p } = await supabase
    .from("Pengajuan").select("tahapSelesai, tahapAktif").eq("id", pengajuanId).maybeSingle();
  if (!p) return err("Pengajuan tidak ditemukan.");

  const tahapSelesai = p.tahapSelesai
    ? p.tahapSelesai.split(",").filter(Boolean)
    : [];
  if (!isKembali && !tahapSelesai.includes(stepId)) tahapSelesai.push(stepId);

  const updates = {
    tahapSelesai: tahapSelesai.join(","),
    tahapAktif:   isKembali ? stepId : (nextStepId || p.tahapAktif),
    status:       isKembali ? "kembali" : "proses",
  };
  if (nomorSKPP) updates.nomorSKPP = nomorSKPP;

  const { error } = await supabase.from("Pengajuan").update(updates).eq("id", pengajuanId);
  if (error) return err("Gagal update tahap: " + error.message);

  await supabase.from("Riwayat").insert({
    pengajuanId, tahap: stepId,
    waktu: new Date().toLocaleString("id-ID"),
    catatan: catatan ?? "", isKembali: isKembali ?? false,
  });

  return ok({ nextStepId });
}

export async function setSelesai({ id, tanggalSelesai }) {
  const tgl = tanggalSelesai
    ?? new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const { error } = await supabase
    .from("Pengajuan").update({ status: "selesai", tanggalSelesai: tgl }).eq("id", id);
  if (error) return err("Gagal menandai selesai: " + error.message);
  await supabase.from("Riwayat").insert({
    pengajuanId: id, tahap: "SELESAI",
    waktu: new Date().toLocaleString("id-ID"),
    catatan: "SKPP selesai dan diserahkan kepada pemohon", isKembali: false,
  });
  return ok({ id, tanggalSelesai: tgl });
}
