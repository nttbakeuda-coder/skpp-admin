import { useState, useEffect, useCallback } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbxdSGg9F6P4FpNJsr3jhVklVKTqxFjepQbs4mHblDDv2ySMXD8nkZfrhMcEgz8IcPOoeA/exec";

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

// Fungsi normalisasi yang super aman dari data kosong/rusak
function normalizeP(p) {
  const jl = p.jalur === "B" ? "B" : "A";
  const tahapan = jl === "B" ? TAHAPAN_B : TAHAPAN_A;
  
  let arrSelesai = [];
  if (Array.isArray(p.tahapSelesai)) {
    arrSelesai = p.tahapSelesai;
  } else if (p.tahapSelesai) {
    arrSelesai = String(p.tahapSelesai).split(",").map(x => x.trim()).filter(Boolean);
  }

  let aktif = p.tahapAktif ? String(p.tahapAktif).trim() : "";
  if (!aktif || aktif === "undefined" || aktif === "null") {
    const belumSelesai = tahapan.find(t => !arrSelesai.includes(t.id));
    aktif = belumSelesai ? belumSelesai.id : tahapan[0].id;
  }

  return {
    id: p.id || "REG-UNKNOWN",
    nama: p.nama || "Tanpa Nama",
    nip: p.nip || "-",
    opd: p.opd || "-",
    alasan: p.alasan || "-",
    jalur: jl,
    status: p.status || "proses",
    tahapSelesai: arrSelesai,
    tahapAktif: aktif,
    riwayat: Array.isArray(p.riwayat) ? p.riwayat : []
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
      if (res && res.ok && Array.isArray(res.data)) {
        setData(res.data.map(normalizeP));
      }
    } catch (e) { 
      console.error("Gagal load data:", e); 
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
    } catch { alert("Gagal menyimpan berkas."); }
    setSaving(false);
  };

  const handleUpdateTahap = async (formData) => {
    setSaving(true);
    try {
      const tahapan = selected.jalur === "B" ? TAHAPAN_B : TAHAPAN_A;
      const stepIdx = tahapan.findIndex(t => t.id === showUpdate.id);
      const isFinal = tahapan[stepIdx]?.final || false;
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
        if (resRefresh && resRefresh.data) {
          const allData = resRefresh.data.map(normalizeP);
          setData(allData);
          const updatedRow = allData.find(d => d.id === selected.id);
          setSelected(updatedRow || null);
        }
        alert("Tahap berhasil diperbarui!");
      } else {
        alert("Gagal memperbarui di server: " + res.pesan);
      }
    } catch { alert("Gagal terhubung untuk update tahap."); }
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
        th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 13px; color:#475569; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .row-hover:hover td { background: #f1f5f9 !important; }
        .badge { padding: 4px 8px; border-radius: 99px; font-size: 11px; font-weight: bold; }
        .btn-update { background: #1d4ed8; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn-update:hover { background: #1e40af; }
        .btn-selesai { background: #d1fae5; color: #065f46; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: white; padding: 24px; border-radius: 12px; width: 450px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); color:#1e293b; }
      `}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <div>
          <h1 style={{ margin:0, fontSize:"24px" }}>Dashboard Internal SKPP</h1>
          <p style={{ margin:"4px 0 0 0", color:"#64748b", fontSize:"14px" }}>Bakeuda Provinsi NTT</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding:"10px 20px", background:"#1d4ed8", color:"white", border:"none", borderRadius:"8px", fontWeight:"bold", cursor:"pointer" }}>+ Input Baru</button>
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: "10px" }}>
           <input placeholder="Cari NIP / Nama..." style={{ padding:"10px", width:"300px", border:"1px solid #e2e8f0", borderRadius:"6px" }} value={search} onChange={e => setSearch(e.target.value)} />
           <button onClick={load} style={{ padding:"10px", background:"#f1f5f9", border:"1px solid #cbd5e1", borderRadius:"6px", cursor:"pointer" }}>⟳ Refresh</button>
        </div>
        
        {loading ? <div style={{ padding:"30px", textAlign:"center", color:"#64748b" }}>Memuat berkas...</div> : (
          <table>
            <thead>
              <tr>
                <th>ID Register</th><th>Nama PNS</th><th>NIP</th><th>OPD / Instansi</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign:"center", padding:"30px", color:"#64748b" }}>Tidak ada data berkas pengajuan</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="row-hover" onClick={() => { console.log('klik row', p.id); setSelected(p); }} style={{ background:"white", cursor: "pointer" }}>
                  <td style={{ color: "#1d4ed8", fontWeight: "bold", cursor: "pointer", userSelect: "none" }}>{p.id}</td>
                  <td style={{ color: "#1d4ed8", fontWeight: "bold", cursor: "pointer", userSelect: "none" }}>{p.nama}</td>
                  <td style={{ cursor: "pointer", userSelect: "none" }}>{p.nip}</td>
                  <td style={{ cursor: "pointer", userSelect: "none" }}>{p.opd}</td>
                  <td style={{ cursor: "pointer", userSelect: "none" }}><span className="badge" style={{ background: p.status==="selesai"?"#d1fae5":p.status==="kembali"?"#fef3c7" : "#dbeafe", color: p.status==="selesai"?"#065f46":p.status==="kembali"?"#92400e":"#1d4ed8" }}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL POP-UP DETAIL PROSES */}
      {selected && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal-box" style={{ width: "550px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", borderBottom:"1px solid #e2e8f0", marginBottom:"15px", paddingBottom:"10px" }}>
              <div>
                <h3 style={{ margin:0, color:"#1d4ed8" }}>{selected.id}</h3>
                <p style={{ margin:"4px 0 0 0", fontWeight:"bold", fontSize:"16px" }}>{selected.nama}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", fontSize:"24px", cursor:"pointer" }}>×</button>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "20px", fontSize: "13px", border:"1px solid #e2e8f0" }}>
              <div style={{ display:"flex", marginBottom:"6px" }}><span style={{ width:"100px", color:"#64748b", fontWeight:"600" }}>NIP</span>: {selected.nip}</div>
              <div style={{ display:"flex", marginBottom:"6px" }}><span style={{ width:"100px", color:"#64748b", fontWeight:"600" }}>OPD</span>: {selected.opd}</div>
              <div style={{ display:"flex" }}><span style={{ width:"100px", color:"#64748b", fontWeight:"600" }}>Alur Berkas</span>: Jalur {selected.jalur}</div>
            </div>

            <h4 style={{ marginBottom: "14px", borderBottom:"2px solid #f1f5f9", paddingBottom:"8px", margin:0 }}>Progres Tahapan</h4>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginTop:"10px" }}>
              {((selected && selected.jalur === "B") ? TAHAPAN_B : TAHAPAN_A).map((step, idx, arr) => {
                const isSelesai = Array.isArray(selected?.tahapSelesai) && selected.tahapSelesai.includes(step.id);
                const isAktif = String(selected?.tahapAktif) === String(step.id);

                return (
                  <div key={step.id} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ position: "relative", width: "30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "999px", display: "grid", placeItems: "center", background: isSelesai ? "#16a34a" : isAktif ? "#2563eb" : "#cbd5e1", color: "white", fontSize: "14px" }}>
                        {isSelesai ? "✓" : step.icon}
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ flex: 1, width: "4px", marginTop: "8px", background: isSelesai ? "#16a34a" : "#e2e8f0", borderRadius: "999px" }} />
                      )}
                    </div>

                    <div style={{ flex: 1, padding: "16px", borderRadius: "18px", border: isAktif ? "1px solid #bfdbfe" : "1px solid #e2e8f0", background: isAktif ? "#f8fbff" : isSelesai ? "#f0fdf4" : "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: isAktif ? "700" : "600", color: isAktif ? "#1d4ed8" : isSelesai ? "#166534" : "#334155" }}>{step.label}</div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{step.pelaksana}</div>
                        </div>
                        {isAktif && (
                          <span style={{ padding: "4px 10px", borderRadius: "999px", background: "#eff6ff", color: "#1d4ed8", fontSize: "11px", fontWeight: "700" }}>Sedang diproses</span>
                        )}
                      </div>

                      <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>{step.keterangan}</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center" }}>
                      {isSelesai ? (
                        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "700" }}>Selesai</span>
                      ) : isAktif ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowUpdate(step); }} style={{ background: "#1d4ed8", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Update →</button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Menunggu</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTION PROSES JALUR */}
      {showUpdate && (
        <div className="modal" style={{ zIndex: 1100 }}>
          <div className="modal-box">
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"15px", alignItems:"center" }}>
              <h3 style={{ margin:0 }}>Update Tahap</h3>
              <button onClick={() => setShowUpdate(null)} style={{ background:"none", border:"none", fontSize:"20px", cursor:"pointer" }}>×</button>
            </div>
            <div style={{ background:"#eff6ff", padding:"12px", borderRadius:"8px", marginBottom:"15px", border:"1px solid #bfdbfe", fontSize:"13px" }}>
               <strong>🎯 {showUpdate.label}</strong>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTahap({ catatan: e.target.catatan.value, isKembali: e.target.isKembali.checked });
            }}>
              <div style={{ marginBottom:"15px" }}>
                <label style={{ fontSize:"11px", fontWeight:"bold", display:"block", marginBottom:"6px" }}>CATATAN PROSES</label>
                <textarea name="catatan" placeholder="Tulis catatan perkembangan dokumen di sini..." style={{ width:"100%", height:"70px", padding:"10px", borderRadius:"8px", border:"1px solid #e2e8f0", boxSizing:"border-box" }} required></textarea>
              </div>
              
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", padding:"10px", borderRadius:"8px", marginBottom:"20px" }}>
                <label style={{ display:"flex", gap:"8px", cursor:"pointer", alignItems:"center" }}>
                  <input type="checkbox" name="isKembali" />
                  <span style={{ fontSize:"12px", fontWeight:"bold", color:"#92400e" }}>Kembalikan Berkas ke Loket awal</span>
                </label>
              </div>

              <div style={{ display:"flex", gap:"10px" }}>
                <button type="button" onClick={() => setShowUpdate(null)} style={{ flex:1, padding:"10px", borderRadius:"6px", border:"1px solid #cbd5e1", background:"white", cursor:"pointer" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", borderRadius:"6px", border:"none", background:"#059669", color:"white", fontWeight:"bold", cursor:"pointer" }}>
                  {saving ? "Memproses..." : "✓ Tandai Selesai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT BARU */}
      {showForm && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box">
            <h3 style={{ margin:"0 0 16px 0" }}>Input Berkas Baru</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              handleInputBaru(Object.fromEntries(fd));
            }}>
              <input name="nama" placeholder="Nama Lengkap PNS" required style={{ width:"100%", padding:"10px", marginBottom:"10px", boxSizing:"border-box" }} />
              <input name="nip" placeholder="NIP" required style={{ width:"100%", padding:"10px", marginBottom:"10px", boxSizing:"border-box" }} />
              <input name="opd" placeholder="Instansi / OPD" required style={{ width:"100%", padding:"10px", marginBottom:"10px", boxSizing:"border-box" }} />
              <input name="alasan" placeholder="Alasan Keperluan" required style={{ width:"100%", padding:"10px", marginBottom:"12px", boxSizing:"border-box" }} />
              <select name="jalur" style={{ width:"100%", padding:"10px", marginBottom:"20px" }}>
                <option value="A">Jalur A (Tanpa Pangkat Pengabdian)</option>
                <option value="B">Jalur B (Ada Pangkat Pengabdian)</option>
              </select>
              <div style={{ display:"flex", gap:"10px" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex:1, padding:"10px" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ flex:1, background:"#1d4ed8", color:"white", padding:"10px", border:"none", fontWeight:"bold" }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}