import { useState, useEffect, useCallback, useRef } from "react";

const DAFTAR_OPD = [
  "Dinas Pendidikan dan Kebudayaan Provinsi NTT",
  "Dinas Kesehatan Provinsi NTT",
  "Dinas Pekerjaan Umum dan Perumahan Rakyat Provinsi NTT",
  "Satuan Polisi Pamong Praja Provinsi NTT",
  "Badan Penanggulangan Bencana Daerah Provinsi NTT",
  "Dinas Sosial Provinsi NTT",
  "Dinas Ketenagakerjaan dan Transmigrasi Provinsi NTT",
  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana Provinsi NTT",
  "Dinas Lingkungan Hidup dan Kehutanan Provinsi NTT",
  "Dinas Kependudukan dan Pencatatan Sipil Provinsi NTT",
  "Dinas Pemberdayaan Masyarakat dan Desa Provinsi NTT",
  "Dinas Perhubungan Provinsi NTT",
  "Dinas Komunikasi dan Informatika Provinsi NTT",
  "Dinas Koperasi, Usaha Kecil dan Menengah Provinsi NTT",
  "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu Provinsi NTT",
  "Dinas Kepemudaan dan Olahraga Provinsi NTT",
  "Dinas Kearsipan dan Perpustakaan Provinsi NTT",
  "Dinas Kelautan dan Perikanan Provinsi NTT",
  "Dinas Pariwisata dan Ekonomi Kreatif Provinsi NTT",
  "Dinas Pertanian dan Ketahanan Pangan Provinsi NTT",
  "Dinas Peternakan Provinsi NTT",
  "Dinas Energi dan Sumber Daya Mineral Provinsi NTT",
  "Dinas Perindustrian dan Perdagangan Provinsi NTT",
  "Sekretariat Daerah Provinsi NTT",
  "Sekretariat Dewan Perwakilan Rakyat Daerah Provinsi NTT",
  "Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah Provinsi NTT",
  "Badan Pendapatan dan Aset Daerah Provinsi NTT",
  "Badan Keuangan Daerah Provinsi NTT",
  "Badan Kepegawaian Daerah Provinsi NTT",
  "Badan Pengembangan Sumber Daya Manusia Daerah Provinsi NTT",
  "Badan Pengelola Perbatasan Daerah Provinsi NTT",
  "Badan Penghubung di Jakarta Provinsi NTT",
  "Inspektorat Daerah Provinsi NTT",
  "Badan Kesatuan Bangsa dan Politik Provinsi NTT"
];

const DAFTAR_PANGKAT = [
  "Juru Muda / I-a",
  "Juru Muda Tingkat I / I-b",
  "Juru / I-c",
  "Juru Tingkat I / I-d",
  "Pengatur Muda / II-a",
  "Pengatur Muda Tingkat I / II-b",
  "Pengatur / II-c",
  "Pengatur Tingkat I / II-d",
  "Penata Muda / III-a",
  "Penata Muda Tingkat I / III-b",
  "Penata / III-c",
  "Penata Tingkat I / III-d",
  "Pembina / IV-a",
  "Pembina Tingkat I / IV-b",
  "Pembina Utama Muda / IV-c",
  "Pembina Utama Madya / IV-d",
  "Pembina Utama / IV-e"
];

const DAFTAR_KASUBID = [
  "Ibu Ivoni S. Meok, SE., MM",
  "Ibu Vebby R. Saba, SE"
];

const DAFTAR_KEPERLUAN = [
  "Pensiun",
  "Pensiun Janda",
  "Pensiun Duda",
  "Pindah",
  "Pemberhentian dengan Hormat",
  "Pemberhentian dengan Hormat PPPK",
  "Pemberhentian Tidak dengan Hormat",
  "Meninggal Dunia",
  "Lainnya"
];

// Kode singkat untuk setiap Kasubid (dipakai di nomor SKPP)
const KODE_KASUBID = {
  "Ibu Ivoni S. Meok, SE., MM": "BKUD3.1",
  "Ibu Vebby R. Saba, SE":      "BKUD3.2",
};

// Kode singkat untuk setiap keperluan SKPP (dipakai di nomor SKPP)
const KODE_ALASAN = {
  "Pensiun":                          "PS",
  "Pensiun Janda":                    "PJ",
  "Pensiun Duda":                     "PD",
  "Pindah":                           "Pdh",
  "Pemberhentian dengan Hormat":      "PDH",
  "Pemberhentian dengan Hormat PPPK": "PDHPPPK",
  "Pemberhentian Tidak dengan Hormat":"PTDH",
  "Meninggal Dunia":                  "MD",
  "Lainnya":                          "LN",
};

// Generate preview nomor SKPP lengkap
// Format: 900.1.3/{nomorUrut}/{kodeKasubid}/{kodeAlasan}/{tahun}
function generateTemplateNomor(nomorUrut, kasubid, alasan) {
  const tahun       = new Date().getFullYear();
  const kodeKasubid = KODE_KASUBID[kasubid] || "BKUD3.X";
  const kodeAlasan  = KODE_ALASAN[alasan]   || "XX";
  return `900.1.3/${nomorUrut}/${kodeKasubid}/${kodeAlasan}/${tahun}`;
}

// Data staf default untuk halaman Manajemen Staf (UI lokal)
// Login sesungguhnya divalidasi via Google Sheets sheet "Akun"
const AKUN_STAF = [
  { id:"1", username:"admin",    password:"(tersimpan di database)", nama:"Administrator",        role:"admin",    opd:"BKD Provinsi NTT" },
  { id:"2", username:"operator", password:"(tersimpan di database)", nama:"Staf Loket",           role:"operator", opd:"Loket SKPP" },
  { id:"3", username:"staf",     password:"(tersimpan di database)", nama:"Staf Pengampuh OPD",  role:"staf",     opd:"Pengampuh OPD" },
];
// ============================================================
//  GANTI URL INI dengan URL deployment Apps Script Anda
// ============================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxdSGg9F6P4FpNJsr3jhVklVKTqxFjepQbs4mHblDDv2ySMXD8nkZfrhMcEgz8IcPOoeA/exec";

// URL halaman tanda terima (sesuaikan dengan URL deploy Anda)
const TANDA_TERIMA_URL = "/tanda_terima_SKPP.html";

// Fungsi cetak tanda terima — buka di tab baru dengan data via URL params
function cetakTandaTerima(p) {
  const params = new URLSearchParams({
    id:      p.id      || "",
    kode:    p.kodeAkses || "",
    nama:    p.nama    || "",
    nip:     p.nip     || "",
    jabatan: p.jabatan || "",
    pangkat: p.pangkat || "",
    opd:     p.opd     || "",
    alasan:  p.alasan  || "",
    jalur:   p.jalur   || "A",
    tgl:     p.tanggalMasuk || "",
  });
  window.open(`${TANDA_TERIMA_URL}?${params.toString()}`, "_blank");
}

// ─── DATA TAHAPAN ─────────────────────────────────────────────────────────────
const TAHAPAN_A = [
  { id:"A1", label:"Berkas Diterima di Loket",      icon:"📥", pelaksana:"Staf Loket" },
  { id:"A2", label:"Verifikasi Kelengkapan Berkas", icon:"🔍", pelaksana:"Staf Pengampuh OPD" },
  { id:"A3", label:"Verifikasi Data PNS",           icon:"👤", pelaksana:"Staf Pengampuh OPD" },
  { id:"A4", label:"Pembuatan Draft SKPP",          icon:"📝", pelaksana:"Penyusun SKPP" },
  { id:"A5", label:"Verifikasi & Proses Tanda Tangan Pimpinan",   icon:"✅", pelaksana:"Staf Pengampuh OPD → Kasubid → Kuasa BUD" },
  { id:"A6", label:"Penempelan Foto & Penomoran",   icon:"📸", pelaksana:"Staf Loket" },
  { id:"A7", label:"SKPP Siap Diserahkan",          icon:"🎉", pelaksana:"Staf Loket", final:true },
];
const TAHAPAN_B = [
  { id:"B1",  label:"Berkas Diterima di Loket",            icon:"📥", pelaksana:"Staf Loket" },
  { id:"B2",  label:"Verifikasi Kelengkapan Berkas",       icon:"🔍", pelaksana:"Staf Pengampuh OPD" },
  { id:"B3",  label:"Identifikasi Pangkat Pengabdian",     icon:"🏅", pelaksana:"Staf Pengampuh OPD" },
  { id:"B4",  label:"Perhitungan Kekurangan (SIMgaji)",    icon:"🖥️", pelaksana:"Staf Pengampuh OPD" },
  { id:"B5",  label:"Rincian Kekurangan → Bendahara OPD", icon:"📤", pelaksana:"Staf Pengampuh OPD" },
  { id:"B6",  label:"SPP-SPM Diterima dari OPD",          icon:"📋", pelaksana:"Staf Perbendaharaan" },
  { id:"B7",  label:"Proses SP2D Kekurangan Pangkat",     icon:"💳", pelaksana:"Staf Perbendaharaan" },
  { id:"B8",  label:"Pembuatan Draft SKPP",               icon:"📝", pelaksana:"Staf Perbendaharaan" },
  { id:"B9",  label:"Verifikasi & Proses Tanda Tangan Pimpinan",        icon:"✅", pelaksana:"Staf Pengampuh OPD → Kasubid → Kuasa BUD" },
  { id:"B10", label:"Penempelan Foto & Penomoran",        icon:"📸", pelaksana:"Staf Loket" },
  { id:"B11", label:"SKPP Siap Diserahkan",               icon:"🎉", pelaksana:"Staf Loket", final:true },
];
const cekIzinProses = (userRole, pelaksanaTahapan) => {
  // 1. Admin selalu punya akses penuh
  if (userRole === "admin") return true;

  // 2. Mengakomodir Staf Perbendaharaan & Kerja Sama Bersama (Simultan)
  if (
    pelaksanaTahapan === "Staf Perbendaharaan" || 
    pelaksanaTahapan === "Operator / Staf Perbendaharaan"
  ) {
    return userRole === "operator" || userRole === "staf";
  }

  // 3. Khusus Operator / Staf Loket
  if (
    pelaksanaTahapan === "Staf Loket" || 
    pelaksanaTahapan === "Operator SIMgaji"
  ) {
    return userRole === "operator";
  }

  // 4. Khusus Staf Pengampuh OPD / Penyusun SKPP
  if (
    pelaksanaTahapan === "Staf Pengampuh OPD" || 
    pelaksanaTahapan === "Penyusun SKPP"
  ) {
    return userRole === "staf";
  }

  // 5. Mengakomodir tahapan multi-level (Kasubid & Kuasa BUD)
  if (pelaksanaTahapan?.includes("Kasubid") || pelaksanaTahapan?.includes("Kuasa BUD")) {
    return userRole === "staf" || userRole === "admin";
  }

  return false;
};

// ─── API ──────────────────────────────────────────────────────────────────────
async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString());
  return res.json();
}
async function apiPost(body) {
  const res = await fetch(API_URL, { method:"POST", body: JSON.stringify(body) });
  return res.json();
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const norm = p => ({
  ...p,
  tahapSelesai: Array.isArray(p.tahapSelesai) ? p.tahapSelesai : (p.tahapSelesai||"").split(",").filter(Boolean),
  riwayat: p.riwayat || [],
});
const getProgress = p => {
  const t = p.jalur==="A" ? TAHAPAN_A : TAHAPAN_B;
  const s = Array.isArray(p.tahapSelesai) ? p.tahapSelesai : (p.tahapSelesai||"").split(",").filter(Boolean);
  return Math.round((s.length / t.length) * 100);
};
const fmtDate = d => { if(!d) return "-"; const dt=d instanceof Date?d:new Date(d); return isNaN(dt)?d:dt.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}); };
const fmtFull = d => { if(!d) return "-"; const dt=d instanceof Date?d:new Date(d); return isNaN(dt)?d:dt.toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); };

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
function exportCSV(data) {
  const headers = ["No. Pengajuan","Nama","NIP","OPD","Jabatan","Pangkat","Keperluan","Jalur","Status","Progress","Tgl Masuk","Tgl Selesai","No. SKPP"];
  const rows = data.map(p => [
    p.id, p.nama, p.nip, p.opd, p.jabatan, p.pangkat, p.alasan,
    p.jalur==="A"?"Tanpa Pangkat Pengabdian":"Ada Pangkat Pengabdian",
    (p.status==="selesai"||getProgress(p)===100)?"Selesai":p.status==="kembali"?"Dikembalikan":"Diproses",
    getProgress(p)+"%", p.tanggalMasuk||"", p.tanggalSelesai||"", p.nomorSKPP||""
  ]);
  const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=`SKPP_Data_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --primary:#00327d;--primary-dark:#001946;--primary-light:#0047ab;--primary-pale:#dae2ff;
    --secondary:#fdc003;--secondary-light:#fabd00;--secondary-pale:#ffdf9e;
    --error:#ba1a1a;--error-pale:#ffdad6;
    --success:#059669;--success-pale:#d1fae5;
    --warning:#f59e0b;--warning-pale:#fef3c7;
    --g50:#f9f9fc;--g100:#f3f3f6;--g200:#eeeef0;--g300:#cbd5e1;
    --g400:#737784;--g500:#64748b;--g600:#434653;--g700:#1a1c1e;--g800:#1a1c1e;
    --on-surface:#1a1c1e;--on-surface-var:#434653;--outline:#737784;--outline-var:#c3c6d5;
    --font:'Inter',sans-serif;--mono:'JetBrains Mono',monospace;
    --r:16px;--rs:12px;--shadow:0px 1px 3px rgba(0,0,0,.08),0px 4px 16px rgba(0,0,0,.06);
    --shadow-lg:0px 12px 32px rgba(0,0,0,.12);
    --sidebar:280px;--sidebar-collapsed:80px;
  }
  body{font-family:var(--font);background:#f9f9fc;color:var(--on-surface);height:100vh;overflow:hidden;}
  .layout{display:flex;height:100vh;overflow:hidden;}

  /* SIDEBAR */
  .sidebar{width:var(--sidebar);background:#ffffff;display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;border-right:1px solid var(--outline-var);}
  .sidebar-brand{padding:24px 20px 20px;border-bottom:1px solid var(--outline-var);}
  .sidebar-logo{width:40px;height:40px;background:var(--primary);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:12px;}
  .sidebar-title{color:var(--g700);font-weight:800;font-size:16px;letter-spacing:-.5px;line-height:1.2;}
  .sidebar-sub{color:var(--on-surface-var);font-size:12px;margin-top:4px;line-height:1.4;}
  .sidebar-user{margin:16px 12px;background:#f9f9fc;border-radius:12px;padding:14px;border:1px solid var(--outline-var);}
  .sidebar-user-name{color:var(--g700);font-weight:700;font-size:14px;}
  .sidebar-user-role{color:var(--on-surface-var);font-size:12px;margin-top:3px;}
  .sidebar-nav{padding:12px 12px;flex:1;}
  .nav-section{font-size:11px;font-weight:700;color:var(--on-surface-var);text-transform:uppercase;letter-spacing:1px;padding:14px 12px 8px;}
  .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:4px;transition:all .15s;color:var(--on-surface-var);font-size:14px;font-weight:500;border-left:3px solid transparent;}
  .nav-item:hover{background:#f3f3f6;color:var(--g700);}
  .nav-item.active{background:var(--primary-pale);color:var(--primary);border-left-color:var(--primary);font-weight:600;}
  .nav-item .ni{font-size:18px;width:20px;text-align:center;}
  .nav-badge{margin-left:auto;background:var(--error);color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;}
  .sidebar-footer{padding:14px 12px;border-top:1px solid var(--outline-var);}
  .logout-btn{width:100%;padding:10px;background:#f9f9fc;border:1.5px solid var(--outline-var);border-radius:10px;color:var(--on-surface-var);font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
  .logout-btn:hover{background:#fef2f2;border-color:#fecaca;color:var(--error);}


  /* MAIN */
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
  .topbar{background:#ffffff;border-bottom:1px solid var(--outline-var);padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .topbar-title{font-weight:800;font-size:20px;color:var(--g700);letter-spacing:-.5px;}
  .topbar-sub{font-size:12px;color:var(--on-surface-var);margin-top:2px;}
  .content{flex:1;overflow-y:auto;padding:32px;}

  /* CARDS */
  .card{background:#ffffff;border-radius:var(--r);box-shadow:0px 1px 3px rgba(0,0,0,.08);border:1px solid var(--outline-var);}
  .card-header{padding:20px 24px;border-bottom:1px solid var(--outline-var);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
  .card-body{padding:24px;}

  /* STAT GRID */
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:24px;}
  .stat-card{background:#ffffff;border-radius:var(--r);padding:24px;border:1px solid var(--outline-var);box-shadow:0px 1px 3px rgba(0,0,0,.08);display:flex;align-items:center;gap:16px;}
  .stat-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;}
  .stat-num{font-size:32px;font-weight:800;letter-spacing:-1px;line-height:1;}
  .stat-label{font-size:12px;color:var(--on-surface-var);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:4px;}

  /* BADGES */
  .badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;}
  .badge-blue{background:var(--primary-pale);color:var(--primary);}
  .badge-green{background:var(--success-pale);color:var(--success);}
  .badge-amber{background:var(--warning-pale);color:var(--warning);}
  .badge-red{background:var(--error-pale);color:var(--error);}
  .badge-purple{background:#f5f3ff;color:#5b21b6;}

  /* BUTTONS */
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:var(--rs);font-family:var(--font);font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all .15s;}
  .btn-primary{background:var(--primary);color:white;}
  .btn-primary:hover{background:var(--primary-dark);}
  .btn-secondary{background:#f3f3f6;color:var(--g700);border:1.5px solid var(--outline-var);}
  .btn-secondary:hover{background:#eeeef0;}
  .btn-success{background:var(--success);color:white;}
  .btn-success:hover{background:#047857;}
  .btn-danger{background:var(--error);color:white;}
  .btn-danger:hover{background:#941a1f;}
  .btn-sm{padding:8px 14px;font-size:13px;}
  .btn:disabled{opacity:.5;cursor:not-allowed;}
  .btn-ghost{background:none;color:var(--on-surface-var);border:1.5px solid var(--outline-var);}
  .btn-ghost:hover{background:#f9f9fc;}

  /* TABLE */
  .table-wrap{overflow-x:auto;}
  table{width:100%;border-collapse:collapse;font-size:14px;}
  th{background:#f9f9fc;padding:12px 16px;text-align:left;font-weight:700;color:var(--on-surface-var);font-size:12px;text-transform:uppercase;letter-spacing:.6px;border-bottom:1.5px solid var(--outline-var);white-space:nowrap;}
  td{padding:14px 16px;border-bottom:1px solid var(--outline-var);color:var(--on-surface);vertical-align:middle;}
  .tr-clickable:hover td{background:#f9f9fc;cursor:pointer;}
  .tr-selected td{background:var(--primary-pale)!important;}

  /* FORM */
  .form-group{margin-bottom:16px;}
  .form-label{display:block;font-size:12px;font-weight:700;color:var(--on-surface-var);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;}
  .form-control{width:100%;padding:10px 14px;border:1.5px solid var(--outline-var);border-radius:var(--rs);font-family:var(--font);font-size:14px;color:var(--on-surface);outline:none;transition:border-color .15s;background:#ffffff;}
  .form-control:focus{border-color:var(--primary);background:#ffffff;}
  textarea.form-control{resize:vertical;min-height:80px;}
  select.form-control{cursor:pointer;}

  /* SEARCH */
  .search-wrap{position:relative;flex:1;min-width:240px;}
  .search-input{width:100%;padding:10px 14px 10px 40px;border:1.5px solid var(--outline-var);border-radius:999px;font-family:var(--font);font-size:14px;background:#ffffff;color:var(--on-surface);outline:none;transition:border-color .15s;}
  .search-input:focus{border-color:var(--primary);}
  .search-input::placeholder{color:var(--on-surface-var);}
  .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--on-surface-var);font-size:16px;}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(26,28,30,.4);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;z-index:1000;padding:28px;overflow-y:auto;}
  .modal{background:#ffffff;border-radius:24px;width:100%;max-width:740px;box-shadow:0px 12px 32px rgba(0,0,0,.15);margin:auto;animation:slideUp .2s ease;border:1px solid var(--outline-var);}
  .modal-header{padding:24px 28px;border-bottom:1px solid var(--outline-var);display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
  .modal-body{padding:24px 28px;max-height:68vh;overflow-y:auto;}
  .modal-footer{padding:16px 28px;border-top:1px solid var(--outline-var);display:flex;gap:10px;justify-content:flex-end;}
  .modal-close{background:none;border:none;font-size:20px;cursor:pointer;color:var(--on-surface-var);padding:4px 8px;border-radius:8px;transition:all .15s;}
  .modal-close:hover{background:#f3f3f6;color:var(--g700);}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}

  /* TABS */
  .tabs{display:flex;gap:4px;border-bottom:1.5px solid var(--outline-var);margin-bottom:24px;}
  .tab{padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-1.5px;color:var(--on-surface-var);transition:all .15s;}
  .tab.active{color:var(--primary);border-bottom-color:var(--primary);font-weight:700;}
  .tab:hover:not(.active){color:var(--g700);}

  /* TIMELINE */
  .timeline-item{display:flex;gap:16px;position:relative;}
  .timeline-item:not(:last-child){padding-bottom:22px;}
  .timeline-left{display:flex;flex-direction:column;align-items:center;width:40px;flex-shrink:0;}
  .t-dot{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2.5px solid transparent;flex-shrink:0;position:relative;z-index:1;}
  .t-dot.done{background:var(--success-pale);border-color:var(--success);}
  .t-dot.active{background:var(--primary-pale);border-color:var(--primary);animation:pulse 2s infinite;}
  .t-dot.pending{background:#f3f3f6;border-color:var(--outline-var);opacity:.6;}
  .t-dot.ret{background:var(--warning-pale);border-color:var(--warning);}
  .t-line{flex:1;width:2.5px;background:var(--outline-var);min-height:22px;margin-top:4px;}
  .t-line.done{background:var(--success);}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,50,125,.3);}70%{box-shadow:0 0 0 8px rgba(0,50,125,0);}100%{box-shadow:0 0 0 0 rgba(0,50,125,0);}}

  /* PROGRESS */
  .progress-wrap{background:#f3f3f6;border-radius:999px;height:6px;overflow:hidden;}
  .progress-bar{height:100%;border-radius:999px;transition:width .4s ease;}

  /* GRID */
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
  .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}

  /* ALERT */
  .alert{padding:14px 16px;border-radius:var(--rs);font-size:14px;display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;border:1.5px solid;}
  .alert-blue{background:#dae2ff;border-color:#b1c5ff;color:var(--primary);}
  .alert-amber{background:var(--warning-pale);border-color:#fcd34d;color:var(--warning);}
  .alert-green{background:var(--success-pale);border-color:#a7f3d0;color:var(--success);}
  .alert-red{background:var(--error-pale);border-color:#fecaca;color:var(--error);}

  /* INFO ROW */
  .info-row{display:flex;gap:10px;margin-bottom:10px;align-items:baseline;}
  .info-lbl{font-size:12px;color:var(--on-surface-var);font-weight:700;text-transform:uppercase;letter-spacing:.5px;min-width:120px;flex-shrink:0;}
  .info-val{font-size:14px;color:var(--on-surface);font-weight:500;}

  /* STEP BTN */
  .step-btn{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--rs);border:1.5px solid var(--outline-var);background:#ffffff;font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;width:100%;text-align:left;margin-bottom:8px;transition:all .15s;}
  .step-btn.done{border-color:var(--success);background:var(--success-pale);color:var(--success);cursor:default;}
  .step-btn.aktif{border-color:var(--primary);background:var(--primary-pale);color:var(--primary);}
  .step-btn.wait{opacity:.4;cursor:not-allowed;color:var(--on-surface-var);}

  /* LOGIN */
  .login-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 60%,#0047ab 100%);}
  .login-card{background:#ffffff;border-radius:24px;width:420px;padding:44px;box-shadow:0px 20px 60px rgba(0,0,0,.3);}
  .login-logo{width:52px;height:52px;background:var(--secondary);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:18px;}

  /* CHIP */
  .chip{display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background:#f3f3f6;color:var(--on-surface-var);}
  .chip-blue{background:var(--primary-pale);color:var(--primary);}
  .chip-green{background:var(--success-pale);color:var(--success);}

  /* TOAST */
  .toast{position:fixed;bottom:32px;right:32px;background:var(--primary);color:white;padding:14px 22px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0px 12px 32px rgba(0,0,0,.25);animation:slideUp .2s ease;}

  /* USER TABLE BADGE */
  .role-admin{background:#f5f3ff;color:#5b21b6;}
  .role-staf{background:var(--primary-pale);color:var(--primary);}
  .role-operator{background:var(--warning-pale);color:var(--warning);}

  /* SCROLLBAR */
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:var(--outline-var);border-radius:999px;}
  ::-webkit-scrollbar-thumb:hover{background:var(--on-surface-var);}

  .spinner{width:32px;height:32px;border:3px solid #f3f3f6;border-top-color:var(--primary);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .loading-box{display:flex;flex-direction:column;align-items:center;gap:12px;padding:56px;color:var(--on-surface-var);font-size:14px;}

  .empty-box{text-align:center;padding:56px;color:var(--on-surface-var);}
  .empty-icon{font-size:48px;margin-bottom:12px;}
  .empty-text{font-size:15px;font-weight:700;color:var(--g700);}
  .empty-sub{font-size:13px;margin-top:6px;color:var(--on-surface-var);}
`;

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return <div className="toast">{msg}</div>;
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const submit = async () => {
    if (!user.trim() || !pass) {
      setErr("Username dan password wajib diisi.");
      return;
    }

    setIsLoggingIn(true);
    setErr("");

    try {
      // Mengirim request login ke backend Apps Script yang terhubung ke Google Sheets
      // Pastikan fungsi 'apiPost' sudah tersedia di dalam kod anda untuk menghantar data
      const res = await apiPost({ 
        action: "login", 
        username: user.trim(), 
        password: pass 
      });

      if (res && res.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("namaStaf", res.nama);
        localStorage.setItem("roleStaf", res.role);
        
        // Memanggil fungsi onLogin bawaan aplikasi untuk masuk ke dashboard
        onLogin({ username: user.trim(), nama: res.nama, role: res.role });
      } else {
        setErr(res.pesan || "Username atau password salah.");
      }
    } catch (e) {
      setErr("Gagal terhubung ke server database.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">📁</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: "var(--primary)", marginBottom: 4 }}>SKPP Admin</div>
        <div style={{ fontSize: 13, color: "var(--on-surface-var)", marginBottom: 28 }}>Bidang Perbendaharaan BKD NTT</div>
        
        {err && <div className="alert alert-red" style={{ marginBottom: 14 }}><span>⚠️</span> <span>{err}</span></div>}
        
        <div className="form-group">
          <label className="form-label">Username</label>
          <input 
            className="form-control" 
            value={user} 
            onChange={e => setUser(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && submit()}
            disabled={isLoggingIn}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-control" 
            value={pass} 
            onChange={e => setPass(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && submit()}
            disabled={isLoggingIn}
          />
        </div>
        
        <button 
          className="btn btn-primary" 
          style={{ width: "100%", justifyContent: "center", padding: 12, cursor: isLoggingIn ? "wait" : "pointer", opacity: isLoggingIn ? 0.7 : 1 }}
          onClick={submit}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? "Memeriksa Akun..." : "Masuk ke Dashboard →"}
        </button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ user, active, onChange, counts, onLogout }) {
  const items = [
    { id:"dashboard", icon:"📊", label:"Dashboard" },
    { id:"pengajuan", icon:"📋", label:"Daftar Pengajuan", badge: counts.proses },
    { id:"input", icon:"➕", label:"Input Pengajuan Baru" },
    { id:"riwayat", icon:"🕐", label:"Riwayat & Arsip" },
  ];
  const adminItems = [
    { id:"users", icon:"👥", label:"Manajemen Staf" },
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">📄</div>
        <div className="sidebar-title">SKPP Tracker Admin</div>
        <div className="sidebar-sub">Bidang Perbendaharaan – Badan Keuangan Daerah Provinsi NTT</div>
      </div>
      <div className="sidebar-user">
        <div className="sidebar-user-name">{user.nama}</div>
        <div className="sidebar-user-role">{user.opd}</div>
        <div style={{ marginTop:6 }}>
          <span className={`badge ${user.role==="admin"?"badge-purple":user.role==="operator"?"badge-amber":"badge-blue"}`}>
            {user.role==="admin"?"Admin":user.role==="operator"?"Staf Loket":"Staf Pengampuh OPD"}
          </span>
        </div>
      </div>
      <div className="sidebar-nav">
        <div className="nav-section">Menu Utama</div>
        {items.map(it => {
        // JIKA yang login adalah "staf" (Staf Pengampuh OPD), SEMBUNYIKAN menu Input Baru
        if (user.role === "staf" && it.id === "input") return null;
  
        return (
         <div key={it.id} className={`nav-item ${active===it.id?"active":""}`} onClick={()=>onChange(it.id)}>
          <span className="ni">{it.icon}</span>
          <span style={{ flex: 1 }}>{it.label}</span>
          {it.badge > 0 && <span className="nav-badge">{it.badge}</span>}
         </div>
          );
        })}
        {user.role === "admin" && (
          <>
            <div className="nav-section">Administrasi</div>
            {adminItems.map(it => (
              <div key={it.id} className={`nav-item ${active===it.id?"active":""}`} onClick={()=>onChange(it.id)}>
                <span className="ni">{it.icon}</span>
                <span style={{ flex:1 }}>{it.label}</span>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>⎋ &nbsp;Keluar dari Sistem</button>
      </div>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function SBadge({ s, p }) {
  // Backwards-compatible: accept either status string via `s` or full pengajuan object via `p`
  const status = s || (p && p.status) || "proses";
  // If full object provided, prefer computed progress to determine finished state
  const prog = p ? getProgress(p) : null;
  if (prog === 100 || status === "selesai") return <span className="badge badge-green">✓ Selesai</span>;
  if (status === "kembali") return <span className="badge badge-amber">↩ Dikembalikan</span>;
  return <span className="badge badge-blue">⟳ Diproses</span>;
}

// ─── TIMELINE ────────────────────────────────────────────────────────────────
function Timeline({ p }) {
  const tahapan = p.jalur==="A" ? TAHAPAN_A : TAHAPAN_B;
  const selesai = p.tahapSelesai || [];
  const riwayat = p.riwayat || [];
  return (
    <div>
      {tahapan.map((step,idx) => {
        const done = selesai.includes(step.id);
        const aktif = p.tahapAktif === step.id;
        const isLast = idx===tahapan.length-1;
        const log = riwayat.find(r=>r.tahap===step.id);
        const isRet = log?.isKembali===true||log?.isKembali==="TRUE";
        let dot = "pending"; if(done) dot=isRet?"ret":"done"; else if(aktif) dot="active";
        return (
          <div key={step.id} className="timeline-item">
            <div className="timeline-left">
              <div className={`t-dot ${dot}`}>{done&&!isRet?"✓":isRet?"↩":step.icon}</div>
              {!isLast && <div className={`t-line ${done&&!isRet?"done":""}`} />}
            </div>
            <div className="timeline-content" style={{ paddingBottom:isLast?0:20 }}>
              <div style={{ fontWeight:700, fontSize:13, color:!done&&!aktif?"var(--g400)":"var(--g800)", marginBottom:2 }}>{step.label}</div>
              <div style={{ fontSize:11, color:"var(--g500)", marginBottom:4 }}>{step.pelaksana}</div>
              {aktif&&!done && <span className="badge badge-blue" style={{ marginBottom:4 }}>Sedang diproses</span>}
              {log && <div style={{ fontSize:11, color:"var(--g400)", fontFamily:"var(--mono)" }}>{log.waktu}</div>}
              {log?.catatan && <div style={{ background:isRet?"#fffbeb":"var(--g50)", border:`1px solid ${isRet?"#fde68a":"var(--g200)"}`, borderRadius:6, padding:"6px 10px", fontSize:12, color:isRet?"#92400e":"var(--g600)", marginTop:5 }}>{isRet?"⚠️ ":""}{log.catatan}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ p, onClose, onUpdate, saving, onCetak, user }) {
  const [tab, setTab] = useState("info");
  const [catatan, setCatatan] = useState("");
  const [isKembali, setIsKembali] = useState(false);
  const [nomorUrut, setNomorUrut] = useState("");
  const isPenomoran = (stepId) => stepId === "A6" || stepId === "B10";
  const tahapan = p.jalur==="A" ? TAHAPAN_A : TAHAPAN_B;
  const stepAktif = tahapan.find(t => t.id === p.tahapAktif && !p.tahapSelesai.includes(t.id));
  const prog = getProgress(p);
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:740 }}>
        <div className="modal-header">
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--primary)", fontWeight:700, marginBottom:2 }}>{p.id}</div>
            <div style={{ fontWeight:800, fontSize:17, color:"var(--primary)" }}>{p.nama}</div>
            <div style={{ fontSize:12, color:"var(--on-surface-var)", marginTop:2 }}>{p.opd} · {p.alasan} · {p.jalur==="A"?"Jalur A":"Jalur B"}</div>
          </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <SBadge p={p} />
            <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
          </div>
        </div>
        <div className="modal-body">
          <div className="tabs">
            {["info","proses","riwayat"].map(t => (
              <div key={t} className={`tab ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
                {t==="info"?"Data Pegawai":t==="proses"?"Update Proses":"Riwayat Lengkap"}
              </div>
            ))}
          </div>

          {tab==="info" && (
            <div>
              <div style={{ background:"#f9f9fc", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                <div className="grid-2" style={{ gap:8 }}>
                  {[
                    ["NIP", p.nip, true],
                    ["Jabatan", p.jabatan],
                    ["Pangkat", p.pangkat],
                    ["Keperluan", p.alasan],
                    ["Kasubid", p.kasubid],
                    ["Tgl Masuk", p.tanggalMasuk],
                    [p.status==="selesai" ? "Tgl Selesai" : "Est. Selesai", p.status==="selesai" ? p.tanggalSelesai : p.estimasiSelesai],
                  ].map(([l,v,mono])=>(
                    <div key={l} className="info-row">
                      <span className="info-lbl">{l}</span>
                      <span className="info-val" style={{
                        ...(mono?{fontFamily:"var(--mono)",fontSize:12}:{}),
                        ...(l==="Tgl Selesai"?{color:"var(--success)",fontWeight:700}:{})
                      }}>{v||"-"}</span>
                    </div>
                  ))}
                  {p.nomorSKPP && <div className="info-row"><span className="info-lbl">No. SKPP</span><span className="info-val" style={{color:"var(--success)",fontWeight:700,fontFamily:"var(--mono)"}}>{p.nomorSKPP}</span></div>}
                  {p.kodeAkses && (
                    <div style={{background:"var(--primary)",borderRadius:10,padding:"12px 16px",marginTop:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <div style={{color:"rgba(255,255,255,.45)",fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:4}}>Kode Akses Portal</div>
                        <div style={{color:"var(--secondary)",fontFamily:"var(--mono)",fontSize:28,fontWeight:800,letterSpacing:8}}>{p.kodeAkses}</div>
                      </div>
                      <button className="btn btn-sm" style={{background:"var(--secondary)",color:"var(--primary)",fontWeight:700,flexShrink:0}} onClick={onCetak}>
                        🖨️ Cetak Tanda Terima
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--on-surface-var)" }}>Progress</span>
                <span style={{ fontSize:12, fontWeight:800, color:prog===100?"var(--success)":"var(--primary)" }}>{prog}%</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width:`${prog}%`, background:prog===100?"var(--success)":p.status==="kembali"?"var(--warning)":"var(--primary)" }} />
              </div>
            </div>
          )}

          {tab==="proses" && (
            <div>
              {(p.status==="selesai"||prog===100) ? (
                <div className="alert alert-green"><span>🎉</span><span>SKPP sudah selesai dan diserahkan. Tidak ada tahap yang perlu diupdate.</span></div>

              ) : p.status === "kembali" ? (
                /* ─── CABANG KEMBALI: tampil untuk SEMUA pengajuan berstatus kembali ─── */
                <div>
                  <div style={{background:"#fffbeb",border:"2px solid #f59e0b",borderRadius:10,padding:"18px",marginBottom:16}}>
                    <div style={{fontWeight:800,fontSize:15,color:"#92400e",marginBottom:8}}>⚠️ Berkas Sedang Dikembalikan</div>
                    <div style={{fontSize:13,color:"#b45309",marginBottom:14,lineHeight:1.6}}>
                      Berkas pengajuan ini telah dikembalikan kepada pemohon. Jika berkas perbaikan sudah diterima dan lengkap, klik tombol hijau di bawah untuk melanjutkan proses dari tahap yang sama — <strong>tanpa mengulang dari awal</strong>.
                    </div>
                    <button
                      className="btn btn-success"
                      style={{width:"100%",fontWeight:"bold",justifyContent:"center",fontSize:14,padding:"12px"}}
                      disabled={saving}
                      onClick={() => {
                        if (!window.confirm("Apakah berkas perbaikan sudah lengkap dan siap diproses kembali?")) return;
                        onUpdate({
                          pengajuanId: p.id,
                          stepId: p.tahapAktif,
                          isResume: true,
                          catatan: "Sistem: Berkas perbaikan telah diterima, proses dilanjutkan kembali."
                        });
                      }}
                    >
                      {saving ? "⏳ Memproses..." : "✅ Berkas Telah Dilengkapi — Lanjutkan Proses"}
                    </button>
                  </div>
                </div>

              ) : stepAktif ? (
                <div>
                  <div className="alert alert-blue" style={{ marginBottom:14 }}><span>ℹ️</span><div><strong>Tahap aktif: {stepAktif.icon} {stepAktif.label}</strong><br/><span style={{fontSize:12}}>Pelaksana: {stepAktif.pelaksana}</span></div></div>
                  {isPenomoran(stepAktif.id) && (
                    <div style={{background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#0369a1",marginBottom:10}}>📋 Input Nomor SKPP</div>
                      <div className="form-group" style={{marginBottom:8}}>
                        <label className="form-label">Nomor Urut (sesuai buku regis) *</label>
                        <input
                          className="form-control"
                          type="text"
                          value={nomorUrut}
                          onChange={e=>setNomorUrut(e.target.value.replace(/[^0-9]/g,""))}
                          placeholder="Contoh: 42"
                          style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:15}}
                        />
                      </div>
                      {nomorUrut && (
                        <div style={{marginTop:6,padding:"10px 12px",background:"white",border:"1px solid #bae6fd",borderRadius:8}}>
                          <div style={{fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Preview Nomor SKPP</div>
                          <div style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:13,color:"#0369a1"}}>
                            {generateTemplateNomor(nomorUrut, p.kasubid, p.alasan)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Catatan Proses</label>
                    <textarea className="form-control" value={catatan} onChange={e=>setCatatan(e.target.value)} placeholder={`Tuliskan catatan untuk tahap: ${stepAktif.label}`} />
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:8, cursor:"pointer", marginBottom:14 }} onClick={()=>setIsKembali(!isKembali)}>
                    <input type="checkbox" checked={isKembali} readOnly style={{width:15,height:15}} />
                    <div><div style={{fontWeight:700,fontSize:13,color:"#92400e"}}>Kembalikan Berkas</div><div style={{fontSize:11,color:"#b45309"}}>Berkas tidak lengkap/sesuai, perlu dikembalikan ke pemohon</div></div>
                  </div>
                  <button
                    className="btn"
                    style={{ 
                    width: "100%", 
                    justifyContent: "center", 
                    background: isKembali ? "var(--error)" : "var(--primary)", 
                    color: "white", 
                    opacity: !cekIzinProses(user?.role, stepAktif.pelaksana) ? 0.6 : 1 
                    }}
                    disabled={saving || !cekIzinProses(user?.role, stepAktif.pelaksana) || (isPenomoran(stepAktif.id) && !nomorUrut)}
                    onClick={() => {
                    // 1. Cari tahu posisi nomor urut tahap aktif saat ini
                    const indexSaatIni = tahapan.findIndex(t => t.id === stepAktif.id);
    
                    // 2. Tentukan ID tahap selanjutnya (misal: dari B1 ke B2)
                    const nextStepId = indexSaatIni < tahapan.length - 1 ? tahapan[indexSaatIni + 1].id : "";
    
                    // 3. Jalankan fungsi update dengan membawa data lengkap
                    onUpdate({ 
                    pengajuanId: p.id, 
                    stepId: stepAktif.id, 
                    nextStepId: nextStepId, 
                    catatan: catatan, 
                    isKembali: isKembali, 
                    isFinal: stepAktif.final === true,
                    nomorSKPP: isPenomoran(stepAktif.id) ? generateTemplateNomor(nomorUrut, p.kasubid, p.alasan) : undefined,
                    });
                    }}
                    >
                    {saving ? "⏳ Menyimpan..." : 
                    !cekIzinProses(user?.role, stepAktif.pelaksana) ? `🔒 Khusus: ${stepAktif.pelaksana}` : 
                    isKembali ? "↩ Kembalikan Berkas" : "✔ Tandai Tahap Ini Selesai"}
                  </button>
                </div>
              ) : (
                <div className="alert alert-amber"><span>⚠️</span><span>Tidak ada tahap aktif yang bisa diupdate saat ini.</span></div>
              )}
              <hr style={{margin:"18px 0",border:"none",borderTop:"1px solid var(--outline-var)"}}/>
              <div style={{fontWeight:700,fontSize:12,color:"var(--on-surface-var)",marginBottom:10,textTransform:"uppercase",letterSpacing:".4px"}}>Semua Tahap</div>
              {tahapan.map(step=>{
                const isDone=p.tahapSelesai.includes(step.id), isAktif=p.tahapAktif===step.id;
                let cls="step-btn wait"; if(isDone) cls="step-btn done"; else if(isAktif) cls="step-btn aktif";
                return <div key={step.id} className={cls}><span>{step.icon}</span><span style={{flex:1}}>{step.label}</span>{isDone&&<span style={{fontSize:11}}>✓ Selesai</span>}{isAktif&&!isDone&&<span className="badge badge-blue" style={{fontSize:10}}>Aktif</span>}</div>;
              })}
            </div>
          )}

          {tab==="riwayat" && <Timeline p={p} />}
        </div>
      </div>
    </div>
  );
}

// ─── SEARCHABLE SELECT ────────────────────────────────────────────────────────
function SearchableSelect({ label, value, onChange, options, placeholder = "-- Pilih --" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const select = (opt) => {
    onChange(opt);
    setQuery("");
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div className="form-group" ref={ref} style={{ position: "relative" }}>
      {label && <label className="form-label">{label}</label>}
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", border: `1.5px solid ${open ? "var(--primary)" : "var(--outline-var)"}`,
          borderRadius: "var(--rs)", background: "white", cursor: "pointer",
          fontSize: 13, color: value ? "var(--g800)" : "var(--g400)",
          userSelect: "none", transition: "border-color .15s",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || placeholder}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 6 }}>
          {value && (
            <span
              onClick={clear}
              style={{ color: "var(--g400)", fontSize: 14, lineHeight: 1, padding: "0 2px", borderRadius: 4 }}
              title="Hapus pilihan"
            >✕</span>
          )}
          <span style={{ color: "var(--g400)", fontSize: 10, transition: "transform .15s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </span>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 2000,
          background: "white", border: "1.5px solid var(--g200)", borderRadius: "var(--rs)",
          boxShadow: "0 8px 24px rgba(0,0,0,.12)", overflow: "hidden",
        }}>
          {/* Search input */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--g100)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--g400)", fontSize: 13 }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ketik untuk mencari..."
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 13,
                fontFamily: "var(--font)", color: "var(--g800)", background: "transparent",
              }}
            />
            {query && (
              <span onClick={() => setQuery("")} style={{ color: "var(--on-surface-var)", cursor: "pointer", fontSize: 13 }}>✕</span>
            )}
          </div>
          {/* Options list */}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--on-surface-var)", textAlign: "center" }}>
                Tidak ditemukan
              </div>
            ) : filtered.map((opt, i) => (
              <div
                key={i}
                onClick={() => select(opt)}
                style={{
                  padding: "9px 14px", fontSize: 13, cursor: "pointer",
                  background: value === opt ? "var(--primary-pale)" : "white",
                  color: value === opt ? "var(--primary)" : "var(--on-surface)",
                  fontWeight: value === opt ? 600 : 400,
                  borderLeft: value === opt ? "3px solid var(--primary)" : "3px solid transparent",
                  transition: "background .1s",
                }}
                onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = "#f9f9fc"; }}
                onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = "white"; }}
              >
                {opt}
              </div>
            ))}
          </div>
          {/* Count info */}
          <div style={{ padding: "5px 14px", borderTop: "1px solid var(--outline-var)", fontSize: 11, color: "var(--on-surface-var)" }}>
            {filtered.length} dari {options.length} pilihan
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INPUT BARU (Tunggal) ─────────────────────────────────────────────────────
function InputBaru({ onClose, onSave, onSaveBulk, saving }) {
  const [mode, setMode] = useState("tunggal"); // "tunggal" | "bulk"

  // ── State TUNGGAL ──
  const [form, setForm] = useState({ nama:"", nip:"", opd:"", jabatan:"", pangkat:"", alasan:"Pensiun", jalur:"A", kasubid:DAFTAR_KASUBID[0] });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // ── State BULK ──
  // Informasi bersama seluruh item
  const [bulkOPD,     setBulkOPD]     = useState("");
  const [bulkKasubid, setBulkKasubid] = useState(DAFTAR_KASUBID[0]);
  // Template baris kosong
  const emptyItem = () => ({ nama:"", nip:"", jabatan:"", pangkat:"", alasan:"Pensiun", jalur:"A", _id: Date.now()+Math.random() });
  const [items, setItems] = useState([emptyItem()]);

  const setItem = (idx, k, v) => setItems(prev => prev.map((it,i) => i===idx ? {...it,[k]:v} : it));
  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems(prev => prev.filter((_,i)=>i!==idx));
  const duplicateItem = (idx) => setItems(prev => {
    const clone = { ...prev[idx], _id: Date.now()+Math.random() };
    const next  = [...prev];
    next.splice(idx+1, 0, clone);
    return next;
  });

  const bulkValid = bulkOPD && bulkKasubid && items.length > 0 && items.every(it => it.nama && it.nip);

  const handleSaveBulk = () => {
    if (!bulkValid) return;
    onSaveBulk({
      namaOPD: bulkOPD,
      kasubid: bulkKasubid,
      items:   items.map(({_id, ...rest}) => rest),  // hapus field internal _id
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: mode==="bulk" ? 860 : 600 }}>
        <div className="modal-header">
          {/* Judul + toggle mode */}
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:"var(--primary)" }}>Input Pengajuan SKPP</div>
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              {["tunggal","bulk"].map(m => (
                <button key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding:"4px 14px", borderRadius:999, fontSize:12, fontWeight:700, cursor:"pointer", border:"none",
                    background: mode===m ? "var(--blue)" : "var(--g100)",
                    color:      mode===m ? "white"       : "var(--g600)",
                  }}>
                  {m==="tunggal" ? "👤 Tunggal" : "📦 Bulk (Bendahara OPD)"}
                </button>
              ))}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        {/* ══════════════ MODE TUNGGAL ══════════════ */}
        {mode === "tunggal" && (<>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Nama Lengkap *</label><input className="form-control" value={form.nama} onChange={e=>set("nama",e.target.value)} placeholder="Sesuai SK" /></div>
            <div className="form-group"><label className="form-label">NIP *</label><input className="form-control" value={form.nip} onChange={e=>set("nip",e.target.value)} placeholder="18 digit" style={{fontFamily:"var(--mono)"}} /></div>
          </div>
          <div className="grid-2">
            <SearchableSelect label="OPD / Instansi *" value={form.opd} onChange={v=>set("opd",v)} options={DAFTAR_OPD} placeholder="-- Pilih OPD / Instansi --" />
            <div className="form-group"><label className="form-label">Jabatan Terakhir</label><input className="form-control" value={form.jabatan} onChange={e=>set("jabatan",e.target.value)} /></div>
          </div>
          <SearchableSelect label="Pangkat / Golongan" value={form.pangkat} onChange={v=>set("pangkat",v)} options={DAFTAR_PANGKAT} placeholder="-- Pilih Pangkat / Golongan --" />
          <div className="form-group">
            <label className="form-label">Kasubid Pembayaran *</label>
            <select className="form-control" value={form.kasubid} onChange={e=>set("kasubid",e.target.value)}>
              {DAFTAR_KASUBID.map((k,i)=><option key={i} value={k}>{k}</option>)}
            </select>
            <div style={{marginTop:6,padding:"6px 10px",background:"var(--g50)",borderRadius:6,fontSize:11,color:"var(--g500)",fontFamily:"var(--mono)"}}>Kode: {KODE_KASUBID[form.kasubid]}</div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Keperluan SKPP</label>
              <select className="form-control" value={form.alasan} onChange={e=>set("alasan",e.target.value)}>
                {DAFTAR_KEPERLUAN.map(k=><option key={k}>{k}</option>)}
              </select>
              <div style={{marginTop:6,padding:"6px 10px",background:"var(--g50)",borderRadius:6,fontSize:11,color:"var(--g500)",fontFamily:"var(--mono)"}}>Kode: {KODE_ALASAN[form.alasan]||"-"}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Jalur Proses</label>
              <select className="form-control" value={form.jalur} onChange={e=>set("jalur",e.target.value)}>
                <option value="A">Jalur A – Tanpa Pangkat Pengabdian</option>
                <option value="B">Jalur B – Ada Pangkat Pengabdian</option>
              </select>
            </div>
          </div>
          {form.jalur==="B" && <div className="alert alert-amber"><span>ℹ️</span><span style={{fontSize:12}}>Jalur B memerlukan proses kekurangan pangkat via SIMgaji dan SP2D sebelum SKPP dibuat.</span></div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn btn-primary" disabled={saving||!form.nama||!form.nip||!form.opd||!form.kasubid} onClick={()=>onSave(form)}>
            {saving?"⟳ Menyimpan...":"Simpan & Mulai Proses"}
          </button>
        </div>
        </>)}

        {/* ══════════════ MODE BULK ══════════════ */}
        {mode === "bulk" && (<>
        <div className="modal-body">
          {/* Info banner bulk */}
          <div className="alert alert-blue" style={{marginBottom:16}}>
            <span>📦</span>
            <div style={{fontSize:12}}>
              <strong>Mode Bulk — Pengajuan dari Bendahara OPD.</strong> Isi data umum OPD di atas, lalu tambahkan daftar pegawai di bawah. Semua pengajuan akan mendapatkan <strong>satu kode akses bersama</strong> yang dapat digunakan untuk memantau seluruh SKPP dalam kiriman ini.
            </div>
          </div>

          {/* Data bersama (OPD & Kasubid) */}
          <div style={{background:"var(--g50)",borderRadius:10,padding:"14px 16px",marginBottom:18,border:"1.5px solid var(--g200)"}}>
            <div style={{fontWeight:700,fontSize:12,color:"var(--g600)",marginBottom:12,textTransform:"uppercase",letterSpacing:".4px"}}>Data Bersama Seluruh Pengajuan</div>
            <div className="grid-2">
              <SearchableSelect label="OPD / Instansi Pengirim *" value={bulkOPD} onChange={v=>setBulkOPD(v)} options={DAFTAR_OPD} placeholder="-- Pilih OPD --" />
              <div className="form-group">
                <label className="form-label">Kasubid Pembayaran *</label>
                <select className="form-control" value={bulkKasubid} onChange={e=>setBulkKasubid(e.target.value)}>
                  {DAFTAR_KASUBID.map((k,i)=><option key={i} value={k}>{k}</option>)}
                </select>
                <div style={{marginTop:5,padding:"5px 10px",background:"white",borderRadius:6,fontSize:11,color:"var(--g500)",fontFamily:"var(--mono)"}}>Kode: {KODE_KASUBID[bulkKasubid]}</div>
              </div>
            </div>
          </div>

          {/* Daftar pegawai */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:12,color:"var(--g600)",textTransform:"uppercase",letterSpacing:".4px"}}>
              Daftar Pegawai <span style={{background:"var(--blue)",color:"white",borderRadius:999,padding:"2px 8px",fontSize:11,fontWeight:800,marginLeft:6}}>{items.length}</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addItem}>+ Tambah Baris</button>
          </div>

          {/* Tabel entri pegawai */}
          <div style={{overflowX:"auto",border:"1.5px solid var(--g200)",borderRadius:10}}>
            <table style={{width:"100%",tableLayout:"fixed"}}>
              <colgroup>
                <col style={{width:"3%"}} />   {/* # */}
                <col style={{width:"22%"}} />  {/* Nama */}
                <col style={{width:"18%"}} />  {/* NIP */}
                <col style={{width:"17%"}} />  {/* Jabatan */}
                <col style={{width:"18%"}} />  {/* Pangkat */}
                <col style={{width:"13%"}} />  {/* Keperluan */}
                <col style={{width:"5%"}} />   {/* Jalur */}
                <col style={{width:"4%"}} />   {/* Aksi */}
              </colgroup>
              <thead>
                <tr>
                  <th style={{textAlign:"center",padding:"10px 6px"}}>#</th>
                  <th style={{padding:"10px 8px"}}>Nama Lengkap *</th>
                  <th style={{padding:"10px 8px"}}>NIP *</th>
                  <th style={{padding:"10px 8px"}}>Jabatan</th>
                  <th style={{padding:"10px 8px"}}>Pangkat / Gol</th>
                  <th style={{padding:"10px 8px"}}>Keperluan</th>
                  <th style={{padding:"10px 8px",textAlign:"center"}}>Jalur</th>
                  <th style={{padding:"10px 6px"}}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it._id} style={{background: idx%2===0?"white":"var(--g50)"}}>
                    <td style={{textAlign:"center",color:"var(--g400)",fontSize:12,fontWeight:700,padding:"8px 6px"}}>{idx+1}</td>
                    <td style={{padding:"6px 8px"}}>
                      <input className="form-control" style={{marginBottom:0,border:"1px solid var(--g200)",width:"100%",minWidth:0,fontSize:12}}
                        value={it.nama} onChange={e=>setItem(idx,"nama",e.target.value)} placeholder="Nama sesuai SK" />
                    </td>
                    <td style={{padding:"6px 8px"}}>
                      <input className="form-control" style={{marginBottom:0,fontFamily:"var(--mono)",fontSize:11,border:"1px solid var(--g200)",width:"100%",minWidth:0}}
                        value={it.nip} onChange={e=>setItem(idx,"nip",e.target.value)} placeholder="18 digit" />
                    </td>
                    <td style={{padding:"6px 8px"}}>
                      <input className="form-control" style={{marginBottom:0,border:"1px solid var(--g200)",width:"100%",minWidth:0,fontSize:12}}
                        value={it.jabatan} onChange={e=>setItem(idx,"jabatan",e.target.value)} placeholder="Jabatan" />
                    </td>
                    <td style={{padding:"6px 8px"}}>
                      <select className="form-control" style={{marginBottom:0,fontSize:11,border:"1px solid var(--g200)",width:"100%",minWidth:0,paddingRight:4}}
                        value={it.pangkat} onChange={e=>setItem(idx,"pangkat",e.target.value)}>
                        <option value="">-- Pangkat --</option>
                        {DAFTAR_PANGKAT.map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"6px 8px"}}>
                      <select className="form-control" style={{marginBottom:0,fontSize:11,border:"1px solid var(--g200)",width:"100%",minWidth:0,paddingRight:4}}
                        value={it.alasan} onChange={e=>setItem(idx,"alasan",e.target.value)}>
                        {DAFTAR_KEPERLUAN.map(k=><option key={k} value={k}>{k}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"6px 8px",textAlign:"center"}}>
                      <select className="form-control" style={{marginBottom:0,fontSize:12,border:"1px solid var(--g200)",width:"100%",minWidth:0,textAlign:"center",paddingLeft:4,paddingRight:4}}
                        value={it.jalur} onChange={e=>setItem(idx,"jalur",e.target.value)}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                    </td>
                    <td style={{padding:"6px 6px"}}>
                      <div style={{display:"flex",gap:3,justifyContent:"center"}}>
                        <button title="Duplikat baris ini"
                          onClick={()=>duplicateItem(idx)}
                          style={{padding:"4px 6px",border:"1px solid var(--g200)",borderRadius:6,background:"white",cursor:"pointer",fontSize:12,lineHeight:1}}>⧉</button>
                        {items.length > 1 && (
                          <button title="Hapus baris ini"
                            onClick={()=>removeItem(idx)}
                            style={{padding:"4px 6px",border:"1px solid #fecaca",borderRadius:6,background:"#fef2f2",cursor:"pointer",color:"var(--red)",fontSize:12,lineHeight:1}}>✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ringkasan */}
          <div style={{marginTop:14,padding:"10px 14px",background:"var(--navy)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>Total Pengajuan Bulk</div>
              <div style={{color:"#C9A84C",fontFamily:"var(--mono)",fontSize:24,fontWeight:800}}>{items.length} <span style={{fontSize:13,fontWeight:400,color:"rgba(255,255,255,.6)"}}>SKPP</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:4}}>Satu Kode Akses untuk Semua</div>
              <div style={{color:"rgba(255,255,255,.5)",fontSize:12}}>Kode akan digenerate otomatis setelah disimpan</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn btn-primary" disabled={saving||!bulkValid} onClick={handleSaveBulk}>
            {saving ? "⟳ Menyimpan..." : `📦 Simpan ${items.length} Pengajuan Bulk`}
          </button>
        </div>
        </>)}
      </div>
    </div>
  );
}

// ─── HALAMAN DASHBOARD ────────────────────────────────────────────────────────
function PageDashboard({ data, loading }) {
  const s = {
    total: data.length,
    proses: data.filter(d => !(d.status==="selesai" || getProgress(d)===100) && d.status!=="kembali").length,
    selesai: data.filter(d => d.status==="selesai" || getProgress(d)===100).length,
    kembali: data.filter(d=>d.status==="kembali").length
  };
  const bulanIni = data.filter(d => { const dt=new Date(d.tanggalMasuk); const n=new Date(); return dt.getMonth()===n.getMonth()&&dt.getFullYear()===n.getFullYear(); }).length;
  const byOPD = data.reduce((acc,p) => { acc[p.opd]=(acc[p.opd]||0)+1; return acc; }, {});
  const topOPD = Object.entries(byOPD).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return (
    <div>
      <div className="stat-grid">
        {[
          {icon:"📋",label:"Total Pengajuan",val:s.total,color:"var(--navy)",bg:"#e8edf5"},
          {icon:"⟳",label:"Sedang Diproses",val:s.proses,color:"var(--blue)",bg:"#dbeafe"},
          {icon:"✓",label:"Selesai",val:s.selesai,color:"var(--green)",bg:"#d1fae5"},
          {icon:"↩",label:"Dikembalikan",val:s.kembali,color:"var(--amber)",bg:"#fef3c7"},
        ].map(st=>(
          <div key={st.label} className="stat-card">
            <div className="stat-icon" style={{background:st.bg}}>{st.icon}</div>
            <div><div className="stat-num" style={{color:st.color}}>{loading?"—":st.val}</div><div className="stat-label">{st.label}</div></div>
          </div>
        ))}
      </div>
      <div className="grid-2" style={{gap:16}}>
        <div className="card">
          <div className="card-header"><div style={{fontWeight:700,fontSize:14,color:"var(--navy)"}}>Pengajuan Bulan Ini</div></div>
          <div className="card-body">
            <div style={{fontSize:40,fontWeight:800,color:"var(--blue)",letterSpacing:"-2px"}}>{loading?"—":bulanIni}</div>
            <div style={{fontSize:12,color:"var(--g500)",marginTop:4}}>Pengajuan diterima bulan {new Date().toLocaleString("id-ID",{month:"long",year:"numeric"})}</div>
            <hr style={{margin:"14px 0",border:"none",borderTop:"1px solid var(--g100)"}}/>
            <div style={{fontSize:12,color:"var(--g600)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span>Jalur A (tanpa pangkat pengabdian)</span><strong>{data.filter(d=>d.jalur==="A").length}</strong></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Jalur B (ada pangkat pengabdian)</span><strong>{data.filter(d=>d.jalur==="B").length}</strong></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div style={{fontWeight:700,fontSize:14,color:"var(--navy)"}}>Top OPD Pengajuan</div></div>
          <div className="card-body">
            {loading ? <div className="spinner" /> : topOPD.length===0 ? <div style={{color:"var(--g400)",fontSize:13}}>Belum ada data</div> : topOPD.map(([opd,jml],i)=>(
              <div key={opd} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"var(--g100)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--g500)",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,fontSize:12,color:"var(--g700)",fontWeight:500}}>{opd}</div>
                <div className="badge badge-blue">{jml}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {data.filter(d=>d.status==="kembali").length>0 && (
        <div className="alert alert-amber" style={{marginTop:16}}>
          <span>⚠️</span>
          <div>
            <strong>Perlu Perhatian</strong><br/>
            Ada {data.filter(d=>d.status==="kembali").length} pengajuan dengan berkas yang dikembalikan. Segera koordinasi dengan OPD terkait.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HALAMAN PENGAJUAN ────────────────────────────────────────────────────────
function PagePengajuan({ data, loading, onRefresh, onDetail, onInputBaru, onExport, user }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterJalur, setFilterJalur] = useState("semua");
  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const ms = !q||p.id?.toLowerCase().includes(q)||p.nama?.toLowerCase().includes(q)||p.nip?.toString().includes(q)||p.opd?.toLowerCase().includes(q);
    const mf = filterStatus==="semua" || (
      filterStatus==="selesai" ? (p.status==="selesai"||getProgress(p)===100) : p.status===filterStatus
    );
    const mj = filterJalur==="semua"||p.jalur===filterJalur;
    return ms&&mf&&mj;
  });
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{fontWeight:700,fontSize:14,color:"var(--navy)"}}>Daftar Pengajuan SKPP <span className="chip chip-blue" style={{marginLeft:8}}>{filtered.length} entri</span></div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>onExport(filtered)} disabled={filtered.length===0}>⬇ Export CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading}>⟳ Refresh</button>
            {user?.role !== "staf" && (
            <button className="btn btn-primary btn-sm" onClick={onInputBaru}>+ Input Baru</button>
            )}
          </div>
        </div>
        <div style={{padding:"12px 20px",borderBottom:"1px solid var(--g100)",display:"flex",gap:10,flexWrap:"wrap"}}>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Cari nama, NIP, nomor, OPD..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{width:"auto",fontSize:13}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="semua">Semua Status</option>
            <option value="proses">Sedang Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="kembali">Dikembalikan</option>
          </select>
          <select className="form-control" style={{width:"auto",fontSize:13}} value={filterJalur} onChange={e=>setFilterJalur(e.target.value)}>
            <option value="semua">Semua Jalur</option>
            <option value="A">Jalur A</option>
            <option value="B">Jalur B</option>
          </select>
        </div>
        {loading ? <div className="loading-box"><div className="spinner"/><span>Memuat data...</span></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Pengajuan</th><th>Nama Pegawai</th><th>NIP</th><th>OPD</th>
                  <th>Keperluan</th><th>Jalur</th><th style={{width:130}}>Progress</th>
                  <th>Status</th><th>Tgl Masuk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const prog = getProgress(p);
                  return (
                    <tr key={p.id} className="tr-clickable" onClick={()=>onDetail(p)}>
                      <td style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color:"var(--blue)"}}>{p.id}</td>
                      <td style={{fontWeight:600,maxWidth:180}}>{p.nama}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--g500)"}}>{p.nip}</td>
                      <td style={{fontSize:12,maxWidth:140}}>{p.opd}</td>
                      <td><span className="chip">{p.alasan}</span></td>
                      <td><span className={`chip ${p.jalur==="A"?"chip-blue":"chip-green"}`}>Jalur {p.jalur}</span></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div className="progress-wrap" style={{flex:1}}>
                            <div className="progress-bar" style={{width:`${prog}%`,background:prog===100?"var(--green)":p.status==="kembali"?"var(--amber)":"var(--blue)"}} />
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:"var(--g500)",minWidth:28}}>{prog}%</span>
                        </div>
                      </td>
                      <td><SBadge p={p} /></td>
                      <td style={{fontSize:12,color:"var(--g500)",whiteSpace:"nowrap"}}>{p.tanggalMasuk}</td>
                    </tr>
                  );
                })}
                {filtered.length===0 && <tr><td colSpan={9}><div className="empty-box"><div className="empty-icon">🔍</div><div className="empty-text">Tidak ada data</div><div className="empty-sub">Coba ubah filter atau kata kunci pencarian</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HALAMAN RIWAYAT / ARSIP ──────────────────────────────────────────────────
function PageRiwayat({ data, loading, onDetail }) {
  const selesai = data.filter(d=>d.status==="selesai"||getProgress(d)===100);
  const [search, setSearch] = useState("");
  const filtered = selesai.filter(p => {
    const q=search.toLowerCase();
    return !q||p.id?.toLowerCase().includes(q)||p.nama?.toLowerCase().includes(q)||p.nip?.toString().includes(q)||p.nomorSKPP?.toLowerCase().includes(q);
  });
  return (
    <div className="card">
      <div className="card-header">
        <div style={{fontWeight:700,fontSize:14,color:"var(--navy)"}}>Riwayat & Arsip SKPP Selesai <span className="chip chip-green" style={{marginLeft:8}}>{filtered.length} dokumen</span></div>
        <button className="btn btn-ghost btn-sm" onClick={()=>exportCSV(filtered)} disabled={filtered.length===0}>⬇ Export CSV</button>
      </div>
      <div style={{padding:"12px 20px",borderBottom:"1px solid var(--g100)"}}>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Cari nama, NIP, nomor pengajuan, atau nomor SKPP..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>
      {loading ? <div className="loading-box"><div className="spinner"/><span>Memuat data...</span></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>No. SKPP</th><th>No. Pengajuan</th><th>Nama PNS</th><th>OPD</th><th>Keperluan</th><th>Tgl Masuk</th><th>Tgl Selesai</th></tr></thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} className="tr-clickable" onClick={()=>onDetail(p)}>
                  <td style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color:"var(--green)"}}>{p.nomorSKPP||"—"}</td>
                  <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--g500)"}}>{p.id}</td>
                  <td style={{fontWeight:600}}>{p.nama}</td>
                  <td style={{fontSize:12}}>{p.opd}</td>
                  <td><span className="chip">{p.alasan}</span></td>
                  <td style={{fontSize:12,color:"var(--g500)"}}>{p.tanggalMasuk}</td>
                  <td style={{fontSize:12,color:"var(--green)",fontWeight:600}}>{p.tanggalSelesai}</td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={7}><div className="empty-box"><div className="empty-icon">📁</div><div className="empty-text">Belum ada SKPP yang selesai</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MANAJEMEN STAF ───────────────────────────────────────────────────────────
function PageUsers() {
  const [users, setUsers] = useState(AKUN_STAF);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username:"", password:"", nama:"", role:"staf", opd:"" });
  const [showPass, setShowPass] = useState({});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = () => {
    if(!form.username||!form.password||!form.nama) return alert("Semua field wajib diisi.");
    if(users.find(u=>u.username===form.username)) return alert("Username sudah digunakan.");
    setUsers(prev=>[...prev, { id:String(prev.length+1), ...form }]);
    setForm({ username:"", password:"", nama:"", role:"staf", opd:"" });
    setShowForm(false);
  };
  const del = (id) => { if(confirm("Hapus akun ini?")) setUsers(prev=>prev.filter(u=>u.id!==id)); };
  return (
    <div className="card">
      <div className="card-header">
        <div style={{fontWeight:700,fontSize:14,color:"var(--navy)"}}>Manajemen Akun Staf</div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowForm(true)}>+ Tambah Staf</button>
      </div>
      <div className="alert alert-blue" style={{margin:"16px 20px 0"}}>
        <span>ℹ️</span><span style={{fontSize:12}}>Perubahan akun bersifat sementara (session ini saja). Untuk permanen, edit array AKUN_STAF di file App.jsx.</span>
      </div>
      <div className="table-wrap" style={{padding:"0 0 16px"}}>
        <table>
          <thead><tr><th>Nama Lengkap</th><th>Username</th><th>Password</th><th>Role</th><th>OPD / Tugas</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id}>
                <td style={{fontWeight:600}}>{u.nama}</td>
                <td style={{fontFamily:"var(--mono)",fontSize:12}}>{u.username}</td>
                <td style={{fontFamily:"var(--mono)",fontSize:12}}>
                  {showPass[u.id] ? u.password : "••••••••"}
                  <button className="btn btn-ghost btn-sm" style={{marginLeft:8,padding:"2px 7px"}} onClick={()=>setShowPass(p=>({...p,[u.id]:!p[u.id]}))}>
                    {showPass[u.id]?"🙈":"👁"}
                  </button>
                </td>
                <td><span className={`badge ${u.role==="admin"?"role-admin badge-purple":u.role==="operator"?"role-operator badge-amber":"role-staf badge-blue"}`}>{u.role}</span></td>
                <td style={{fontSize:12,color:"var(--g600)"}}>{u.opd}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={()=>del(u.id)} disabled={u.role==="admin"&&users.filter(x=>x.role==="admin").length===1}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
          <div className="modal" style={{maxWidth:500}}>
            <div className="modal-header">
              <div style={{fontWeight:800,fontSize:16,color:"var(--navy)"}}>Tambah Akun Staf Baru</div>
              <button className="modal-close" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Username *</label><input className="form-control" value={form.username} onChange={e=>set("username",e.target.value)} placeholder="Tanpa spasi" /></div>
                <div className="form-group"><label className="form-label">Password *</label><input className="form-control" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min. 6 karakter" /></div>
              </div>
              <div className="form-group"><label className="form-label">Nama Lengkap *</label><input className="form-control" value={form.nama} onChange={e=>set("nama",e.target.value)} /></div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={form.role} onChange={e=>set("role",e.target.value)}>
                    <option value="staf">Staf</option>
                    <option value="operator">Operator SIMgaji</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">OPD / Tugas</label><input className="form-control" value={form.opd} onChange={e=>set("opd",e.target.value)} placeholder="Pengampuh OPD..." /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Batal</button>
              <button className="btn btn-primary" onClick={save}>Simpan Akun</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errLoad, setErrLoad] = useState("");
  const [selected, setSelected] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [kodeAksesModal, setKodeAksesModal] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""), 3200); };

  const load = useCallback(async () => {
    setLoading(true); setErrLoad("");
    try {
      const res = await apiGet({ action:"daftarSemua" });
      if (res.ok) setData(res.data.map(norm));
      else setErrLoad(res.pesan||"Gagal memuat data.");
    } catch { setErrLoad("Gagal terhubung ke server."); }
    setLoading(false);
  }, []);

  useEffect(() => { if(user) load(); }, [user, load]);

  const handleInputBaru = async (formData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action:"inputBaru", data:formData });
      if (res.ok) {
        showToast(`✓ ${res.id} berhasil disimpan`);
        setShowInput(false);
        await load();
        setPage("pengajuan");
        // Tampilkan modal kode akses setelah berhasil
        if (res.kodeAkses) {
          setTimeout(() => {
            setKodeAksesModal({ id: res.id, kode: res.kodeAkses, isBulk: false, data: { ...formData, id: res.id, tanggalMasuk: new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) } });
          }, 400);
        }
      } else alert("Gagal: " + res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  // ── Handler Input BULK ──────────────────────────────────────────────────────
  const handleInputBulk = async (bulkData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action:"inputBulk", data:bulkData });
      if (res.ok) {
        showToast(`✓ ${res.jumlah} pengajuan bulk berhasil disimpan`);
        setShowInput(false);
        await load();
        setPage("pengajuan");
        // Tampilkan modal kode akses bulk
        if (res.kodeAkses) {
          setTimeout(() => {
            setKodeAksesModal({
              isBulk:   true,
              grupId:   res.grupId,
              kode:     res.kodeAkses,
              jumlah:   res.jumlah,
              daftarId: res.daftarId,
              namaOPD:  bulkData.namaOPD,
            });
          }, 400);
        }
      } else alert("Gagal: " + res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const handleUpdate = async (updateData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action:"updateTahap", data:updateData });
      if (res.ok) {
        showToast(updateData.isKembali?"↩ Berkas dikembalikan":updateData.isResume?"✅ Proses berhasil dilanjutkan kembali":"✓ Tahap berhasil diperbarui");
        // refresh list first
        await load();

        // Jika nextStepId kosong, berarti tahap terakhir telah diselesaikan — beri tahu server untuk menandai selesai
        if (updateData.nextStepId === "") {
          try {
            const tanggalSelesai = new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
            const mark = await apiPost({ action: "setSelesai", id: updateData.pengajuanId, tanggalSelesai });
            if (mark.ok) {
              showToast("✓ Pengajuan ditandai Selesai pada server");
              await load();
            }
          } catch (e) {
            console.warn("Gagal menandai selesai:", e);
          }
        }

        const refreshed = await apiGet({ action:"detail", id:updateData.pengajuanId });
        if(refreshed.ok) setSelected(norm(refreshed.data));
      } else alert("Gagal: "+res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const counts = { proses: data.filter(d=>d.status==="proses").length };

  const PAGE_TITLES = {
    dashboard: { title:"Dashboard", sub:`Selamat datang, ${user?.nama||""}` },
    pengajuan: { title:"Daftar Pengajuan SKPP", sub:"Kelola seluruh pengajuan SKPP" },
    input: { title:"Input Pengajuan Baru", sub:"Daftarkan pengajuan SKPP baru" },
    riwayat: { title:"Riwayat & Arsip", sub:"SKPP yang telah selesai diproses" },
    users: { title:"Manajemen Staf", sub:"Kelola akun dan hak akses staf" },
  };

  if (!user) return (
    <>
      <style>{S}</style>
      <Login onLogin={u => { setUser(u); setPage("dashboard"); }} />
    </>
  );

  return (
    <>
      <style>{S}</style>
      {toast && <Toast msg={toast} onDone={()=>setToast("")} />}
      <div className="layout">
        <Sidebar user={user} active={page} onChange={setPage} counts={counts} onLogout={()=>setUser(null)} />
        <div className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">{PAGE_TITLES[page]?.title}</div>
              <div style={{fontSize:12,color:"var(--g500)",marginTop:1}}>{PAGE_TITLES[page]?.sub}</div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              {errLoad && <div className="alert alert-red" style={{margin:0,padding:"6px 12px",fontSize:12}}><span>⚠️</span><span>{errLoad}</span><button className="btn btn-secondary btn-sm" style={{marginLeft:8}} onClick={load}>Coba Lagi</button></div>}
              <div style={{fontSize:12,color:"var(--g400)",fontFamily:"var(--mono)"}}>{new Date().toLocaleDateString("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>
            </div>
          </div>
          <div className="content">
            {page==="dashboard" && <PageDashboard data={data} loading={loading} />}
            {page==="pengajuan" && <PagePengajuan data={data} loading={loading} onRefresh={load} onDetail={setSelected} onInputBaru={()=>setShowInput(true)} onExport={exportCSV} user={user} />}
            {page==="input" && <div className="card card-body"><PagePengajuan data={[]} loading={false} onRefresh={()=>{}} onDetail={()=>{}} onInputBaru={()=>setShowInput(true)} onExport={()=>{}} user={user} /></div>}
            {page==="riwayat" && <PageRiwayat data={data} loading={loading} onDetail={setSelected} />}
            {page==="users" && user.role==="admin" && <PageUsers />}
            {page==="users" && user.role!=="admin" && <div className="alert alert-red"><span>🚫</span><span>Anda tidak memiliki akses ke halaman ini. Hanya Admin yang dapat mengelola akun staf.</span></div>}
          </div>
        </div>
      </div>

      {selected && (
        <DetailModal p={selected} onClose={()=>setSelected(null)} onUpdate={handleUpdate} saving={saving}
          onCetak={() => cetakTandaTerima(selected)} user={user} />
      )}
      {(showInput || page==="input") && (
        <InputBaru onClose={()=>{ setShowInput(false); if(page==="input") setPage("pengajuan"); }} onSave={handleInputBaru} onSaveBulk={handleInputBulk} saving={saving} />
      )}

      {/* MODAL KODE AKSES — muncul setelah input baru berhasil */}
      {kodeAksesModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setKodeAksesModal(null);}}>
          <div className="modal" style={{maxWidth:520}}>
            <div className="modal-header">
              <div style={{fontWeight:800,fontSize:16,color:"var(--navy)"}}>
                {kodeAksesModal.isBulk ? "📦 Pengajuan Bulk Berhasil Didaftarkan" : "🎉 Pengajuan Berhasil Didaftarkan"}
              </div>
              <button className="modal-close" onClick={()=>setKodeAksesModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Success alert */}
              <div className="alert alert-green" style={{marginBottom:20}}>
                <span>✓</span>
                <div>
                  {kodeAksesModal.isBulk
                    ? <><strong>{kodeAksesModal.jumlah} pengajuan</strong> dari <strong>{kodeAksesModal.namaOPD}</strong> berhasil disimpan ke sistem.</>
                    : <><strong>{kodeAksesModal.id}</strong> berhasil disimpan ke sistem.</>
                  }
                </div>
              </div>

              {/* Kode Akses Display */}
              <div style={{background:"var(--navy)",borderRadius:14,padding:24,textAlign:"center",marginBottom:16}}>
                <div style={{color:"rgba(255,255,255,.5)",fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>
                  {kodeAksesModal.isBulk ? "Kode Akses Bersama (1 Kode untuk Semua)" : "Kode Akses Portal Pelacakan"}
                </div>
                <div style={{color:"#C9A84C",fontFamily:"var(--mono)",fontSize:48,fontWeight:800,letterSpacing:12,lineHeight:1}}>
                  {kodeAksesModal.kode}
                </div>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:10}}>
                  {kodeAksesModal.isBulk
                    ? <>Grup: <span style={{color:"#C9A84C",fontFamily:"var(--mono)"}}>{kodeAksesModal.grupId}</span></>
                    : <>Untuk pengajuan: <span style={{color:"#C9A84C",fontFamily:"var(--mono)"}}>{kodeAksesModal.id}</span></>
                  }
                </div>
              </div>

              {/* Daftar ID bulk */}
              {kodeAksesModal.isBulk && kodeAksesModal.daftarId && (
                <div style={{background:"var(--g50)",border:"1px solid var(--g200)",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--g500)",textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>
                    Nomor Pengajuan yang Terdaftar
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {kodeAksesModal.daftarId.map(id=>(
                      <span key={id} style={{fontFamily:"var(--mono)",fontSize:11,background:"white",border:"1px solid var(--g200)",borderRadius:6,padding:"3px 8px",color:"var(--blue)",fontWeight:700}}>{id}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="alert alert-amber">
                <span>⚠️</span>
                <div style={{fontSize:12}}>
                  <strong>Serahkan kode ini kepada {kodeAksesModal.isBulk ? "Bendahara OPD" : "pemohon"}</strong> bersama tanda terima.
                  {kodeAksesModal.isBulk
                    ? " Dengan satu kode ini, mereka dapat memantau status semua SKPP yang diajukan sekaligus."
                    : " Kode akses hanya ditampilkan sekali di sini."}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setKodeAksesModal(null)}>Tutup</button>
              {!kodeAksesModal.isBulk && (
                <button className="btn btn-primary" onClick={()=>{cetakTandaTerima({...kodeAksesModal.data, kodeAkses:kodeAksesModal.kode}); setKodeAksesModal(null);}}>
                  🖨️ Cetak Tanda Terima
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
