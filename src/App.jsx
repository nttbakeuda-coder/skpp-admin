import { useState, useEffect, useCallback } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbxdSGg9F6P4FpNJsr3jhVklVKTqxFjepQbs4mHblDDv2ySMXD8nkZfrhMcEgz8IcPOoeA/exec";

const AKUN_STAF = {
  username: "adminbakeuda",
  password: "skppntt2026"
};

const JALUR = { A: "Jalur A – Tanpa Pangkat Pengabdian", B: "Jalur B – Ada Pangkat Pengabdian" };

const TAHAPAN_A = [
  { id: "A1", label: "Berkas Diterima di Loket", icon: "📥", pelaksana: "Staf Pengampuh OPD", keterangan: "Berkas pengajuan SKPP diterima dan dicatat dalam buku register." },
  { id: "A2", label: "Verifikasi Kelengkapan Berkas", icon: "🔍", pelaksana: "Staf Pengampuh OPD", keterangan: "Pemeriksaan kelengkapan dan kesesuaian dokumen persyaratan." },
  { id: "A3", label: "Verifikasi Data PNS", icon: "👤", pelaksana: "Staf Pengampuh OPD", keterangan: "Validasi data PNS (NIP, pangkat, gaji terakhir) dan konfirmasi tidak ada pangkat pengabdian." },
  { id: "A4", label: "Pembuatan Draft SKPP", icon: "📝", pelaksana: "Penyusun SKPP", keterangan: "Penyusunan draft SKPP berdasarkan data yang telah diverifikasi." },
  { id: "A5", label: "Pemeriksaan & Paraf Kasubid", icon: "✅", pelaksana: "Staf Pengampuh OPD → Kasubid", keterangan: "Pemeriksaan oleh Staf Pengampuh OPD, paraf Kasubid & TTD Kuasa BUD diproses internal." },
  { id: "A6", label: "Penempelan Foto & Penomoran", icon: "📸", pelaksana: "Staf Bidang Perbendaharaan", keterangan: "Penempelan foto PNS, penomoran SKPP, dan cap dinas." },
  { id: "A7", label: "SKPP Siap Diserahkan", icon: "🎉", pelaksana: "Staf Pengampuh OPD", keterangan: "SKPP telah selesai dan siap diambil oleh pemohon/Bendahara Gaji OPD.", final: true },
];

const TAHAPAN_B = [
  { id: "B1", label: "Berkas Diterima di Loket", icon: "📥", pelaksana: "Staf Pengampuh OPD", keterangan: "Berkas pengajuan SKPP termasuk SK Pangkat Pengabdian diterima dan dicatat." },
  { id: "B2", label: "Verifikasi Kelengkapan Berkas", icon: "🔍", pelaksana: "Staf Pengampuh OPD", keterangan: "Pemeriksaan kelengkapan dokumen persyaratan." },
  { id: "B3", label: "Identifikasi Pangkat Pengabdian", icon: "🏅", pelaksana: "Staf Pengampuh OPD", keterangan: "Konfirmasi adanya pangkat pengabdian, berkas diteruskan ke Operator SIMgaji." },
  { id: "B4", label: "Perhitungan Kekurangan (SIMgaji)", icon: "🖥️", pelaksana: "Operator SIMgaji", keterangan: "Input data dan perhitungan kekurangan selisih kenaikan pangkat pada aplikasi SIMgaji Taspen." },
  { id: "B5", label: "Rincian Kekurangan → Bendahara OPD", icon: "📤", pelaksana: "Operator SIMgaji / Staf Pengampuh", keterangan: "Dokumen rincian kekurangan pangkat diserahkan ke Bendahara Gaji OPD untuk dibuatkan SPP-SPM." },
  { id: "B6", label: "SPP-SPM Diterima dari OPD", icon: "📋", pelaksana: "Staf Bidang Perbendaharaan", keterangan: "SPP-SPM Kekurangan Pangkat diterima dan diverifikasi." },
  { id: "B7", label: "Proses SP2D Kekurangan Pangkat", icon: "💳", pelaksana: "Staf Bidang Perbendaharaan", keterangan: "SP2D diterbitkan dan kekurangan pangkat dibayarkan ke rekening PNS." },
  { id: "B8", label: "Pembuatan Draft SKPP", icon: "📝", pelaksana: "Penyusun SKPP", keterangan: "Draft SKPP disusun berdasarkan pangkat baru (pangkat pengabdian)." },
  { id: "B9", label: "Pemeriksaan & Paraf Kasubid", icon: "✅", pelaksana: "Staf Pengampuh OPD → Kasubid", keterangan: "Pemeriksaan oleh Staf Pengampuh OPD, paraf Kasubid & TTD Kuasa BUD diproses internal." },
  { id: "B10", label: "Penempelan Foto & Penomoran", icon: "📸", pelaksana: "Staf Bidang Perbendaharaan", keterangan: "Penempelan foto PNS, penomoran SKPP, dan cap dinas." },
  { id: "B11", label: "SKPP Siap Diserahkan", icon: "🎉", pelaksana: "Staf Pengampuh OPD", keterangan: "SKPP telah selesai dan siap diambil oleh pemohon/Bendahara Gaji OPD.", final: true },
];

async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

async function apiPost(body) {
  const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(body) });
  return res.json();
}

function normalizeP(p) {
  // Ambil data tahapSelesai dengan aman
  let arrSelesai = [];
  if (Array.isArray(p.tahapSelesai)) {
    arrSelesai = p.tahapSelesai;
  } else if (p.tahapSelesai) {
    arrSelesai = String(p.tahapSelesai).split(",").filter(Boolean);
  }

  // Tentukan tahapan berdasarkan jalur
  const tahapan = p.jalur === "B" ? TAHAPAN_B : TAHAPAN_A;
  
  // Deteksi otomatis jika tahapAktif kosong dari Apps Script
  let aktif = p.tahapAktif || "";
  if (!aktif) {
    const belumSelesai = tahapan.find(t => !arrSelesai.includes(t.id));
    aktif = belumSelesai ? belumSelesai.id : "";
  }

  return {
    ...p,
    tahapSelesai: arrSelesai,
    tahapAktif: aktif,
    riwayat: p.riwayat || [],
  };
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [inputUser, setInputUser] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showUpdate, setShowUpdate] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await apiGet({ action: "daftarSemua" });
      if (res.ok) {
        setData(res.data.map(normalizeP));
      }
    } catch { 
      console.error("Gagal memuat data."); 
    }
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => { load(); }, [load]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputUser === AKUN_STAF.username && inputPass === AKUN_STAF.password) {
      localStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
    } else { setLoginError("Akun salah!"); }
  };

  const handleInputBaru = async (formData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action: "inputBaru", data: formData });
      if (res.ok) { 
        alert("Berkas baru berhasil ditambahkan!"); 
        setShowForm(false); 
        load(); 
      }
    } catch { alert("Gagal menyimpan berkas baru."); }
    setSaving(false);
  };

  const handleUpdateTahap = async (formData) => {
    setSaving(true);
    try {
      const tahapan = selected.jalur === "A" ? TAHAPAN_A : TAHAPAN_B;
      const stepIdx = tahapan.findIndex(t => t.id === showUpdate.id);
      const isFinal = tahapan[stepIdx].final || false;
      const nextStepId = tahapan[stepIdx + 1]?.id || "";

      const res = await apiPost({ 
        action: "updateTahap", 
        data: { 
          pengajuanId: selected.id, 
          stepId: showUpdate.id, 
          catatan: formData.catatan, 
          isKembali: formData.isKembali,
          jalur: selected.jalur,
          isFinal,
          nextStepId
        } 
      });

      if (res.ok) {
        setShowUpdate(null);
        const resRefresh = await apiGet({ action: "daftarSemua" });
        const allData = resRefresh.data.map(normalizeP);
        setData(allData);
        setSelected(allData.find(d => d.id === selected.id));
        alert("Tahap berhasil diperbarui!");
      }
    } catch { alert("Gagal update tahap."); }
    setSaving(false);
  };

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const matchS = !q || p.id?.toLowerCase().includes(q) || p.nama?.toLowerCase().includes(q) || p.nip?.toString().includes(q);
    const matchF = filterStatus === "semua" || p.status === filterStatus;
    return matchS && matchF;
  });

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "sans-serif" }}>
        <form onSubmit={handleLogin} style={{ background: "white", padding: "32px", borderRadius: "12px", width: "320px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <h2 style={{ textAlign:"center", margin:"0 0 20px 0" }}>Login Staf</h2>
          {loginError && <div style={{ color:"red", marginBottom:"10px", textAlign:"center", fontSize:"13px" }}>{loginError}</div>}
          <input placeholder="Username" style={{ width:"100%", padding:"10px", marginBottom:"10px", boxSizing:"border-box" }} value={inputUser} onChange={e => setInputUser(e.target.value)} required />
          <input type="password" placeholder="Password" style={{ width:"100%", padding:"10px", marginBottom:"15px", boxSizing:"border-box" }} value={inputPass} onChange={e => setInputPass(e.target.value)} required />
          <button type="submit" style={{ width:"100%", padding:"12px", background:"#1d4ed8", color:"white", border:"none", borderRadius:"6px", fontWeight:"bold", cursor:"pointer" }}>Masuk</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <style>{`
        .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden; }
        .card-header { padding: 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 13px; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .row-hover: