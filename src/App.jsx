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
  return {
    ...p,
    tahapSelesai: Array.isArray(p.tahapSelesai) ? p.tahapSelesai : (p.tahapSelesai || "").split(",").filter(Boolean),
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
  const [errLoad, setErrLoad] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showUpdate, setShowUpdate] = useState(null); // ID Tahap yang akan diupdate
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true); setErrLoad("");
    try {
      const res = await apiGet({ action: "daftarSemua" });
      if (res.ok) setData(res.data.map(normalizeP));
      else setErrLoad(res.pesan);
    } catch { setErrLoad("Gagal memuat data."); }
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
      if (res.ok) { alert("Selesai!"); setShowForm(false); load(); }
    } catch { alert("Error"); }
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
        // Refresh data table & detail
        const resRefresh = await apiGet({ action: "daftarSemua" });
        const allData = resRefresh.data.map(normalizeP);
        setData(allData);
        setSelected(allData.find(d => d.id === selected.id));
      }
    } catch { alert("Gagal update"); }
    setSaving(false);
  };

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    return !q || p.id?.toLowerCase().includes(q) || p.nama?.toLowerCase().includes(q) || p.nip?.toString().includes(q);
  });

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "sans-serif" }}>
        <form onSubmit={handleLogin} style={{ background: "white", padding: "32px", borderRadius: "12px", width: "320px" }}>
          <h2>Login Staf</h2>
          <input placeholder="Username" style={{ width:"100%", padding:"10px", marginBottom:"10px" }} value={inputUser} onChange={e => setInputUser(e.target.value)} />
          <input type="password" placeholder="Password" style={{ width:"100%", padding:"10px", marginBottom:"10px" }} value={inputPass} onChange={e => setInputPass(e.target.value)} />
          <button type="submit" style={{ width:"100%", padding:"10px", background:"#1d4ed8", color:"white", border:"none" }}>Masuk</button>
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
        tr:hover td { background: #f8fafc; cursor: pointer; }
        .badge { padding: 4px 8px; border-radius: 99px; font-size: 11px; font-weight: bold; }
        .btn-update { background: #1d4ed8; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; }
        .btn-selesai { background: #d1fae5; color: #065f46; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justifyContent: center; z-index: 1000; }
        .modal-box { background: white; padding: 24px; borderRadius: 12px; width: 450px; }
      `}</style>

      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"20px" }}>
        <h1>Dashboard SKPP</h1>
        <button onClick={() => setShowForm(true)} style={{ padding:"10px 20px", background:"#1d4ed8", color:"white", border:"none", borderRadius:"8px" }}>+ Input Baru</button>
      </div>

      <div className="card">
        <div className="card-header">
           <input placeholder="Cari NIP / Nama..." style={{ padding:"8px", width:"300px" }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nama</th><th>NIP</th><th>OPD</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} onClick={() => setSelected(p)}>
                <td style={{ color: "#1d4ed8", fontWeight: "bold" }}>{p.id}</td>
                <td>{p.nama}</td><td>{p.nip}</td><td>{p.opd}</td>
                <td><span className="badge" style={{ background: p.status==="selesai"?"#d1fae5":"#dbeafe" }}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DETAIL & UPDATE TAHAP (Persis Foto 3) */}
      {selected && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal-box" style={{ width: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", borderBottom:"1px solid #eee", marginBottom:"15px", paddingBottom:"10px" }}>
              <div>
                <h3 style={{ margin:0, color:"#1d4ed8" }}>{selected.id}</h3>
                <p style={{ margin:0, fontWeight:"bold" }}>{selected.nama}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", fontSize:"20px" }}>×</button>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px" }}>
              <div style={{ display:"flex", marginBottom:"5px" }}><span style={{ width:"100px", color:"#64748b" }}>NIP</span>: {selected.nip}</div>
              <div style={{ display:"flex", marginBottom:"5px" }}><span style={{ width:"100px", color:"#64748b" }}>Jalur</span>: Jalur {selected.jalur}</div>
            </div>

            <h4 style={{ marginBottom: "10px" }}>Update Tahap Proses</h4>
            {(selected.jalur === "A" ? TAHAPAN_A : TAHAPAN_B).map((step) => {
              const isSelesai = selected.tahapSelesai.includes(step.id);
              const isAktif = selected.tahapAktif === step.id;

              return (
                <div key={step.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px", borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ opacity: isSelesai || isAktif ? 1 : 0.3 }}>{step.icon}</span>
                    <span style={{ fontSize:"13px", color: isSelesai || isAktif ? "#1e293b" : "#94a3b8" }}>{step.label}</span>
                  </div>
                  {isSelesai ? (
                    <span className="btn-selesai">Selesai</span>
                  ) : isAktif ? (
                    <button className="btn-update" onClick={() => setShowUpdate(step)}>Update ↓</button>
                  ) : (
                    <span style={{ fontSize:"11px", color:"#cbd5e1" }}>Menunggu</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL FORM UPDATE (Persis Foto 1) */}
      {showUpdate && (
        <div className="modal" style={{ zIndex: 1100 }}>
          <div className="modal-box">
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"20px" }}>
              <h3 style={{ margin:0 }}>Update Tahap Proses</h3>
              <button onClick={() => setShowUpdate(null)} style={{ background:"none", border:"none" }}>×</button>
            </div>
            <div style={{ background:"#eff6ff", padding:"12px", borderRadius:"8px", marginBottom:"15px", border:"1px solid #bfdbfe" }}>
               <p style={{ margin:0, fontSize:"13px", fontWeight:"bold", color:"#1e40af" }}>✅ {showUpdate.label}</p>
               <p style={{ margin:"5px 0 0 0", fontSize:"11px", color:"#1