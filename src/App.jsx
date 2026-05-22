import { useState, useEffect, useCallback } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbxdSGg9F6P4FpNJsr3jhVklVKTqxFjepQbs4mHblDDv2ySMXD8nkZfrhMcEgz8IcPOoeA/exec";

// ==========================================
// PENGATURAN AKUN LOGIN STAF (Silakan Ubah)
// ==========================================
const AKUN_STAF = {
  username: "adminbakeuda",
  password: "skppntt2026"
};

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
  // State untuk Keamanan Login
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [inputUser, setInputUser] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // State Data Dashboard
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errLoad, setErrLoad] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true); setErrLoad("");
    try {
      const res = await apiGet({ action: "daftarSemua" });
      if (res.ok) setData(res.data.map(normalizeP));
      else setErrLoad(res.pesan);
    } catch {
      setErrLoad("Gagal memuat data. Periksa koneksi.");
    }
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => { load(); }, [load]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputUser === AKUN_STAF.username && inputPass === AKUN_STAF.password) {
      localStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Username atau Password salah!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setInputUser("");
    setInputPass("");
  };

  const handleInputBaru = async (formData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action: "inputBaru", data: formData });
      if (res.ok) { alert(`✓ ${res.id} berhasil disimpan`); setShowForm(false); load(); }
      else alert("Gagal menyimpan: " + res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const matchS = !q || p.id?.toLowerCase().includes(q) || p.nama?.toLowerCase().includes(q) || p.nip?.toString().includes(q) || p.opd?.toLowerCase().includes(q);
    const matchF = filterStatus === "semua" || p.status === filterStatus;
    return matchS && matchF;
  });

  const stats = { 
    total: data.length, 
    proses: data.filter(d=>d.status==="proses").length, 
    selesai: data.filter(d=>d.status==="selesai").length, 
    kembali: data.filter(d=>d.status==="kembali").length 
  };

  // Tampilan Halaman Login jika Belum Autentikasi
  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ background: "white", padding: "32px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "100%", maxWidth: "400px", border: "1px solid #e2e8f0" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ margin: "0 0 8px 0", fontWeight: 800, color: "#0f1e3c" }}>Login Staf</h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Dashboard Internal SKPP Bakeuda NTT</p>
          </div>
          
          {loginError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, marginBottom: "16px", textAlign: "center" }}>{loginError}</div>}
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Username</label>
              <input style={{ width: "100%", padding: "10px", border: "1.5px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box", outline: "none" }} value={inputUser} onChange={e => setInputUser(e.target.value)} required />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Password</label>
              <input type="password" style={{ width: "100%", padding: "10px", border: "1.5px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box", outline: "none" }} value={inputPass} onChange={e => setInputPass(e.target.value)} required />
            </div>
            <button type="submit" style={{ width: "100%", padding: "12px", background: "#1d4ed8", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Masuk ke Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  // Tampilan Utama Dashboard Staf (Jika sudah Login)
  return (
    <div className="container" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght=400;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #1e293b; margin:0; }
        .card { background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,.05); border: 1px solid #e2e8f0; margin-bottom: 24px; overflow: hidden; }
        .card-header { padding: 18px 22px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; background: #fff; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
        .stat-number { font-size: 32px; font-weight: 800; }
        .stat-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
        .btn { padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; }
        .btn-primary { background: #1d4ed8; color: white; }
        .btn-secondary { background: #f1f5f9; color: #334155; }
        .btn-danger { background: #fee2e2; color: #b91c1c; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
        th { background: #f8fafc; padding: 12px 14px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 14px; border-bottom: 1px solid #f1f5f9; }
        .badge { padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .badge-blue { background: #dbeafe; color: #1d4ed8; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .form-control { width: 100%; padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; box-sizing: border-box; outline:none; }
        .form-group { margin-bottom: 14px; }
        .form-label { display:block; font-size:12px; font-weight:700; color:#475569; margin-bottom:4px; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f1e3c", margin: 0 }}>Dashboard Internal SKPP</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Sistem Penginputan Data & Verifikasi Internal - Bakeuda NTT</p>
        </div>
        <button className="btn btn-danger" onClick={handleLogout} style={{ fontWeight: 700 }}>Keluar (Logout)</button>
      </div>

      {/* STATS */}
      <div className="stat-grid">
        {[["Total Berkas", stats.total, "#0f1e3c"], ["Sedang Diproses", stats.proses, "#1d4ed8"], ["Selesai", stats.selesai, "#059669"], ["Dikembalikan", stats.kembali, "#d97706"]].map(([l,v,c]) => (
          <div key={l} className="stat-card"><div className="stat-number" style={{ color:c }}>{v}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>

      {/* TABLE CARD */}
      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 800, color: "#0f1e3c" }}>Daftar Pengajuan SKPP</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-secondary" onClick={load} disabled={loading}>⟳ Refresh</button>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Input SKPP Baru</button>
          </div>
        </div>

        <div style={{ padding: "14px 22px", background: "#fff", display: "flex", gap: "12px", borderBottom: "1px solid #f1f5f9" }}>
          <input className="form-control" style={{ maxWidth: "300px" }} placeholder="Cari nama, NIP, OPD..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ maxWidth: "180px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="semua">Semua Status</option>
            <option value="proses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="kembali">Dikembalikan</option>
          </select>
        </div>

        {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Memuat Data...</div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>No. Register</th><th>Nama PNS</th><th>NIP</th><th>OPD / Instansi</th><th>Keperluan</th><th>Jalur</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: "#1d4ed8" }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.nama}</td>
                    <td>{p.nip}</td>
                    <td>{p.opd}</td>
                    <td>{p.alasan}</td>
                    <td><span className={`badge ${p.jalur==="A"?"badge-blue":"badge-green"}`}>Jalur {p.jalur}</span></td>
                    <td>
                      <span className={`badge ${p.status==="selesai"?"badge-green":p.status==="kembali"?"badge-amber":"badge-blue"}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL INPUT BARU */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"white", padding:"24px", borderRadius:"12px", width:"100%", maxWidth:"500px" }}>
            <h3 style={{ margin:"0 0 16px 0", fontWeight:800 }}>Input Berkas Baru</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              handleInputBaru(Object.fromEntries(fd));
            }}>
              <div className="form-group"><label className="form-label">Nama Lengkap PNS</label><input className="form-control" name="nama" required /></div>
              <div className="form-group"><label className="form-label">NIP</label><input className="form-control" name="nip" required /></div>
              <div className="form-group"><label className="form-label">OPD / Instansi</label><input className="form-control" name="opd" required /></div>
              <div className="form-group"><label className="form-label">Alasan Keperluan</label><input className="form-control" name="alasan" placeholder="Pensiun / Pindah Tugas" required /></div>
              <div className="form-group">
                <label className="form-label">Jalur Pengajuan</label>
                <select className="form-control" name="jalur">
                  <option value="A">Jalur A - Tanpa Pangkat Pengabdian</option>
                  <option value="B">Jalur B - Ada Pangkat Pengabdian</option>
                </select>
              </div>
              <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end", marginTop:"20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Berkas"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}