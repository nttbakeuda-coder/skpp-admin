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
  "Berhenti Atas Permintaan Sendiri",
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
  "Pindah":                           "PND",
  "Pemberhentian dengan Hormat":      "PDH",
  "Pemberhentian dengan Hormat PPPK": "PPPK",
  "Pemberhentian Tidak dengan Hormat":"PTDH",
  "Berhenti Atas Permintaan Sendiri": "BAPS",
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
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --navy:#0f1e3c;--navy2:#1a3260;--navy3:#243d73;
    --blue:#1d4ed8;--blue2:#3b82f6;--blue-pale:#eff6ff;
    --green:#059669;--green-pale:#ecfdf5;
    --amber:#d97706;--amber-pale:#fffbeb;
    --red:#dc2626;--red-pale:#fef2f2;
    --purple:#7c3aed;--purple-pale:#f5f3ff;
    --g50:#f8fafc;--g100:#f1f5f9;--g200:#e2e8f0;--g300:#cbd5e1;
    --g400:#94a3b8;--g500:#64748b;--g600:#475569;--g700:#334155;--g800:#1e293b;
    --font:'Plus Jakarta Sans',sans-serif;--mono:'JetBrains Mono',monospace;
    --r:12px;--rs:8px;--shadow:0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06);
    --sidebar:260px;
  }
  body{font-family:var(--font);background:var(--g50);color:var(--g800);height:100vh;overflow:hidden;}
  .layout{display:flex;height:100vh;overflow:hidden;}

  /* SIDEBAR */
  .sidebar{width:var(--sidebar);background:var(--navy);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;}
  .sidebar-brand{padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,.08);}
  .sidebar-logo{width:36px;height:36px;background:var(--blue);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:10px;}
  .sidebar-title{color:white;font-weight:800;font-size:14px;letter-spacing:-.3px;}
  .sidebar-sub{color:#64748b;font-size:11px;margin-top:2px;}
  .sidebar-user{margin:12px;background:rgba(255,255,255,.06);border-radius:10px;padding:12px;border:1px solid rgba(255,255,255,.08);}
  .sidebar-user-name{color:white;font-weight:700;font-size:13px;}
  .sidebar-user-role{color:#64748b;font-size:11px;margin-top:2px;}
  .sidebar-nav{padding:8px 12px;flex:1;}
  .nav-section{font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.8px;padding:12px 8px 6px;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .15s;color:#94a3b8;font-size:13px;font-weight:500;}
  .nav-item:hover{background:rgba(255,255,255,.08);color:white;}
  .nav-item.active{background:var(--blue);color:white;}
  .nav-item .ni{font-size:16px;width:20px;text-align:center;}
  .nav-badge{margin-left:auto;background:var(--red);color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:999px;}
  .sidebar-footer{padding:12px;border-top:1px solid rgba(255,255,255,.08);}
  .logout-btn{width:100%;padding:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:8px;color:#94a3b8;font-family:var(--font);font-size:13px;cursor:pointer;transition:all .15s;}
  .logout-btn:hover{background:rgba(220,38,38,.15);color:#fca5a5;border-color:rgba(220,38,38,.3);}

  /* MAIN */
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
  .topbar{background:white;border-bottom:1px solid var(--g200);padding:0 28px;height:60px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .topbar-title{font-weight:800;font-size:18px;color:var(--navy);letter-spacing:-.3px;}
  .topbar-sub{font-size:12px;color:var(--g500);margin-top:2px;}
  .content{flex:1;overflow-y:auto;padding:24px 28px;}

  /* CARDS */
  .card{background:white;border-radius:var(--r);box-shadow:var(--shadow);border:1px solid var(--g200);}
  .card-header{padding:16px 20px;border-bottom:1px solid var(--g100);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
  .card-body{padding:20px;}

  /* STAT GRID */
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
  .stat-card{background:white;border-radius:var(--r);padding:18px 20px;border:1px solid var(--g200);box-shadow:var(--shadow);display:flex;align-items:center;gap:14px;}
  .stat-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
  .stat-num{font-size:28px;font-weight:800;letter-spacing:-1px;line-height:1;}
  .stat-label{font-size:11px;color:var(--g500);font-weight:600;text-transform:uppercase;letter-spacing:.4px;margin-top:2px;}

  /* BADGES */
  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;}
  .badge-blue{background:#dbeafe;color:#1d4ed8;}
  .badge-green{background:#d1fae5;color:#065f46;}
  .badge-amber{background:#fef3c7;color:#92400e;}
  .badge-red{background:#fee2e2;color:#991b1b;}
  .badge-purple{background:#ede9fe;color:#5b21b6;}

  /* BUTTONS */
  .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--rs);font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .15s;}
  .btn-primary{background:var(--blue);color:white;}
  .btn-primary:hover{background:#1e40af;}
  .btn-secondary{background:var(--g100);color:var(--g700);border:1px solid var(--g200);}
  .btn-secondary:hover{background:var(--g200);}
  .btn-success{background:var(--green);color:white;}
  .btn-success:hover{background:#047857;}
  .btn-danger{background:var(--red);color:white;}
  .btn-sm{padding:6px 12px;font-size:12px;}
  .btn:disabled{opacity:.4;cursor:not-allowed;}
  .btn-ghost{background:none;color:var(--g500);border:1px solid var(--g200);}
  .btn-ghost:hover{background:var(--g50);}

  /* TABLE */
  .table-wrap{overflow-x:auto;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:var(--g50);padding:10px 14px;text-align:left;font-weight:700;color:var(--g600);font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid var(--g200);white-space:nowrap;}
  td{padding:12px 14px;border-bottom:1px solid var(--g100);color:var(--g700);vertical-align:middle;}
  .tr-clickable:hover td{background:var(--g50);cursor:pointer;}
  .tr-selected td{background:var(--blue-pale)!important;}

  /* FORM */
  .form-group{margin-bottom:14px;}
  .form-label{display:block;font-size:11px;font-weight:700;color:var(--g600);margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px;}
  .form-control{width:100%;padding:9px 12px;border:1.5px solid var(--g200);border-radius:var(--rs);font-family:var(--font);font-size:13px;color:var(--g800);outline:none;transition:border-color .15s;background:white;}
  .form-control:focus{border-color:var(--blue2);}
  textarea.form-control{resize:vertical;min-height:72px;}
  select.form-control{cursor:pointer;}

  /* SEARCH */
  .search-wrap{position:relative;flex:1;min-width:220px;}
  .search-input{width:100%;padding:9px 12px 9px 38px;border:1.5px solid var(--g200);border-radius:var(--rs);font-family:var(--font);font-size:13px;background:white;color:var(--g800);outline:none;transition:border-color .15s;}
  .search-input:focus{border-color:var(--blue2);}
  .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--g400);font-size:14px;}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(15,30,60,.55);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;z-index:1000;padding:24px;overflow-y:auto;}
  .modal{background:white;border-radius:16px;width:100%;max-width:680px;box-shadow:0 20px 60px rgba(0,0,0,.2);margin:auto;animation:slideUp .2s ease;}
  .modal-header{padding:20px 24px;border-bottom:1px solid var(--g100);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
  .modal-body{padding:22px 24px;max-height:68vh;overflow-y:auto;}
  .modal-footer{padding:14px 24px;border-top:1px solid var(--g100);display:flex;gap:8px;justify-content:flex-end;}
  .modal-close{background:none;border:none;font-size:18px;cursor:pointer;color:var(--g400);padding:4px;border-radius:6px;}
  .modal-close:hover{background:var(--g100);}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}

  /* TABS */
  .tabs{display:flex;gap:2px;border-bottom:2px solid var(--g200);margin-bottom:20px;}
  .tab{padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--g500);transition:all .15s;}
  .tab.active{color:var(--blue);border-bottom-color:var(--blue);}
  .tab:hover:not(.active){color:var(--g700);}

  /* TIMELINE */
  .timeline-item{display:flex;gap:14px;position:relative;}
  .timeline-item:not(:last-child){padding-bottom:20px;}
  .timeline-left{display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0;}
  .t-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2.5px solid transparent;flex-shrink:0;position:relative;z-index:1;}
  .t-dot.done{background:#d1fae5;border-color:var(--green);}
  .t-dot.active{background:#dbeafe;border-color:var(--blue);animation:pulse 2s infinite;}
  .t-dot.pending{background:var(--g100);border-color:var(--g300);opacity:.5;}
  .t-dot.ret{background:#fef3c7;border-color:var(--amber);}
  .t-line{flex:1;width:2px;background:var(--g200);min-height:20px;margin-top:4px;}
  .t-line.done{background:var(--green);}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(59,130,246,.4);}70%{box-shadow:0 0 0 7px rgba(59,130,246,0);}100%{box-shadow:0 0 0 0 rgba(59,130,246,0);}}

  /* PROGRESS */
  .progress-wrap{background:var(--g100);border-radius:999px;height:5px;overflow:hidden;}
  .progress-bar{height:100%;border-radius:999px;transition:width .4s ease;}

  /* GRID */
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}

  /* ALERT */
  .alert{padding:11px 14px;border-radius:var(--rs);font-size:13px;display:flex;gap:9px;align-items:flex-start;margin-bottom:14px;}
  .alert-blue{background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;}
  .alert-amber{background:#fffbeb;border:1px solid #fde68a;color:#92400e;}
  .alert-green{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;}
  .alert-red{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;}

  /* INFO ROW */
  .info-row{display:flex;gap:8px;margin-bottom:7px;align-items:baseline;}
  .info-lbl{font-size:11px;color:var(--g500);font-weight:700;text-transform:uppercase;letter-spacing:.4px;min-width:110px;flex-shrink:0;}
  .info-val{font-size:13px;color:var(--g800);font-weight:500;}

  /* STEP BTN */
  .step-btn{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:var(--rs);border:1.5px solid var(--g200);background:white;font-family:var(--font);font-size:12px;font-weight:600;cursor:pointer;width:100%;text-align:left;margin-bottom:7px;transition:all .15s;}
  .step-btn.done{border-color:var(--green);background:#ecfdf5;color:#065f46;cursor:default;}
  .step-btn.aktif{border-color:var(--blue);background:var(--blue-pale);color:var(--blue);}
  .step-btn.wait{opacity:.35;cursor:not-allowed;}

  /* LOGIN */
  .login-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--navy) 0%,var(--navy2) 60%,var(--navy3) 100%);}
  .login-card{background:white;border-radius:20px;width:420px;padding:40px;box-shadow:0 24px 80px rgba(0,0,0,.3);}
  .login-logo{width:48px;height:48px;background:var(--blue);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;}

  /* CHIP */
  .chip{display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:var(--g100);color:var(--g600);}
  .chip-blue{background:#dbeafe;color:#1e40af;}
  .chip-green{background:#d1fae5;color:#065f46;}

  /* TOAST */
  .toast{position:fixed;bottom:28px;right:28px;background:var(--navy);color:white;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.3);animation:slideUp .2s ease;}

  /* USER TABLE BADGE */
  .role-admin{background:#ede9fe;color:#5b21b6;}
  .role-staf{background:#dbeafe;color:#1d4ed8;}
  .role-operator{background:#fef3c7;color:#92400e;}

  /* SCROLLBAR */
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:var(--g300);border-radius:999px;}

  .spinner{width:28px;height:28px;border:3px solid var(--g200);border-top-color:var(--blue);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .loading-box{display:flex;flex-direction:column;align-items:center;gap:10px;padding:48px;color:var(--g500);font-size:13px;}

  .empty-box{text-align:center;padding:48px;color:var(--g400);}
  .empty-icon{font-size:40px;margin-bottom:10px;}
  .empty-text{font-size:14px;font-weight:600;}
  .empty-sub{font-size:12px;margin-top:4px;}
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
        <div style={{ fontWeight: 800, fontSize: 22, color: "var(--navy)", marginBottom: 4 }}>SKPP Admin</div>
        <div style={{ fontSize: 13, color: "var(--g500)", marginBottom: 28 }}>Bidang Perbendaharaan BKD NTT</div>
        
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
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget&&!saving)onClose();}}>
      <div className="modal" style={{ maxWidth:740 }}>
        <div className="modal-header">
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--blue)", fontWeight:700, marginBottom:2 }}>{p.id}</div>
            <div style={{ fontWeight:800, fontSize:17, color:"var(--navy)" }}>{p.nama}</div>
            <div style={{ fontSize:12, color:"var(--g500)", marginTop:2 }}>{p.opd} · {p.alasan} · {p.jalur==="A"?"Jalur A":"Jalur B"}</div>
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
              <div style={{ background:"var(--g50)", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
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
                        ...(l==="Tgl Selesai"?{color:"var(--green)",fontWeight:700}:{})
                      }}>{v||"-"}</span>
                    </div>
                  ))}
                  {p.nomorSKPP && <div className="info-row"><span className="info-lbl">No. SKPP</span><span className="info-val" style={{color:"var(--green)",fontWeight:700,fontFamily:"var(--mono)"}}>{p.nomorSKPP}</span></div>}
                  {p.kodeAkses && (
                    <div style={{background:"var(--navy)",borderRadius:10,padding:"12px 16px",marginTop:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <div style={{color:"rgba(255,255,255,.45)",fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:4}}>Kode Akses Portal</div>
                        <div style={{color:"#C9A84C",fontFamily:"var(--mono)",fontSize:28,fontWeight:800,letterSpacing:8}}>{p.kodeAkses}</div>
                      </div>
                      <button className="btn btn-sm" style={{background:"#C9A84C",color:"var(--navy)",fontWeight:700,flexShrink:0}} onClick={onCetak}>
                        🖨️ Cetak Tanda Terima
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--g600)" }}>Progress</span>
                <span style={{ fontSize:12, fontWeight:800, color:prog===100?"var(--green)":"var(--blue)" }}>{prog}%</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width:`${prog}%`, background:prog===100?"var(--green)":p.status==="kembali"?"var(--amber)":"var(--blue)" }} />
              </div>
            </div>
          )}

          {tab==="proses" && (
            <div>
              {(p.status==="selesai"||prog===100) ? (
                <div className="alert alert-green"><span>🎉</span><span>SKPP sudah selesai dan diserahkan. Tidak ada tahap yang perlu diupdate.</span></div>
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
                    background: isKembali ? "var(--red)" : "var(--blue)", 
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
              <hr style={{margin:"18px 0",border:"none",borderTop:"1px solid var(--g100)"}}/>
              <div style={{fontWeight:700,fontSize:12,color:"var(--g600)",marginBottom:10,textTransform:"uppercase",letterSpacing:".4px"}}>Semua Tahap</div>
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
          padding: "9px 12px", border: `1.5px solid ${open ? "var(--blue2)" : "var(--g200)"}`,
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
              <span onClick={() => setQuery("")} style={{ color: "var(--g400)", cursor: "pointer", fontSize: 13 }}>✕</span>
            )}
          </div>
          {/* Options list */}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--g400)", textAlign: "center" }}>
                Tidak ditemukan
              </div>
            ) : filtered.map((opt, i) => (
              <div
                key={i}
                onClick={() => select(opt)}
                style={{
                  padding: "9px 14px", fontSize: 13, cursor: "pointer",
                  background: value === opt ? "var(--blue-pale)" : "white",
                  color: value === opt ? "var(--blue)" : "var(--g800)",
                  fontWeight: value === opt ? 600 : 400,
                  borderLeft: value === opt ? "3px solid var(--blue)" : "3px solid transparent",
                  transition: "background .1s",
                }}
                onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = "var(--g50)"; }}
                onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = "white"; }}
              >
                {opt}
              </div>
            ))}
          </div>
          {/* Count info */}
          <div style={{ padding: "5px 14px", borderTop: "1px solid var(--g100)", fontSize: 11, color: "var(--g400)" }}>
            {filtered.length} dari {options.length} pilihan
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INPUT BARU ───────────────────────────────────────────────────────────────
function InputBaru({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ nama:"", nip:"", opd:"", jabatan:"", pangkat:"", alasan:"Pensiun", jalur:"A", kasubid:DAFTAR_KASUBID[0] });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget&&!saving)onClose();}}>
      <div className="modal" style={{ maxWidth:600 }}>
        <div className="modal-header">
          <div style={{ fontWeight:800, fontSize:16, color:"var(--navy)" }}>Input Pengajuan SKPP Baru</div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Nama Lengkap *</label><input className="form-control" value={form.nama} onChange={e=>set("nama",e.target.value)} placeholder="Sesuai SK" /></div>
            <div className="form-group"><label className="form-label">NIP *</label><input className="form-control" value={form.nip} onChange={e=>set("nip",e.target.value)} placeholder="18 digit" style={{fontFamily:"var(--mono)"}} /></div>
          </div>
          <div className="grid-2">
            <SearchableSelect
              label="OPD / Instansi *"
              value={form.opd}
              onChange={v => set("opd", v)}
              options={DAFTAR_OPD}
              placeholder="-- Pilih OPD / Instansi --"
            />
            <div className="form-group"><label className="form-label">Jabatan Terakhir</label><input className="form-control" value={form.jabatan} onChange={e=>set("jabatan",e.target.value)} /></div>
          </div>
          <SearchableSelect
            label="Pangkat / Golongan"
            value={form.pangkat}
            onChange={v => set("pangkat", v)}
            options={DAFTAR_PANGKAT}
            placeholder="-- Pilih Pangkat / Golongan --"
          />
          <div className="form-group">
            <label className="form-label">Kasubid Pembayaran *</label>
            <select className="form-control" value={form.kasubid} onChange={e=>set("kasubid",e.target.value)}>
              {DAFTAR_KASUBID.map((k,i)=><option key={i} value={k}>{k}</option>)}
            </select>
            <div style={{marginTop:6,padding:"6px 10px",background:"var(--g50)",borderRadius:6,fontSize:11,color:"var(--g500)",fontFamily:"var(--mono)"}}>
              Kode: {KODE_KASUBID[form.kasubid]}
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Keperluan SKPP</label>
              <select className="form-control" value={form.alasan} onChange={e=>set("alasan",e.target.value)}>
                {DAFTAR_KEPERLUAN.map(k=><option key={k}>{k}</option>)}
              </select>
              <div style={{marginTop:6,padding:"6px 10px",background:"var(--g50)",borderRadius:6,fontSize:11,color:"var(--g500)",fontFamily:"var(--mono)"}}>
                Kode: {KODE_ALASAN[form.alasan] || "-"}
              </div>
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
            setKodeAksesModal({ id: res.id, kode: res.kodeAkses, data: { ...formData, id: res.id, tanggalMasuk: new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) } });
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
        showToast(updateData.isKembali?"↩ Berkas dikembalikan":"✓ Tahap berhasil diperbarui");
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
        <InputBaru onClose={()=>{ setShowInput(false); if(page==="input") setPage("pengajuan"); }} onSave={handleInputBaru} saving={saving} />
      )}

      {/* MODAL KODE AKSES — muncul setelah input baru berhasil */}
      {kodeAksesModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setKodeAksesModal(null);}}>
          <div className="modal" style={{maxWidth:480}}>
            <div className="modal-header">
              <div style={{fontWeight:800,fontSize:16,color:"var(--navy)"}}>🎉 Pengajuan Berhasil Didaftarkan</div>
              <button className="modal-close" onClick={()=>setKodeAksesModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-green" style={{marginBottom:20}}>
                <span>✓</span>
                <div><strong>{kodeAksesModal.id}</strong> berhasil disimpan ke sistem.</div>
              </div>

              {/* Kode Akses Display */}
              <div style={{background:"var(--navy)",borderRadius:14,padding:24,textAlign:"center",marginBottom:20}}>
                <div style={{color:"rgba(255,255,255,.5)",fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>
                  Kode Akses Portal Pelacakan
                </div>
                <div style={{color:"var(--ntt-gold,#C9A84C)",fontFamily:"var(--mono)",fontSize:48,fontWeight:800,letterSpacing:12,lineHeight:1}}>
                  {kodeAksesModal.kode}
                </div>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:10}}>
                  Untuk pengajuan: <span style={{color:"#C9A84C",fontFamily:"var(--mono)"}}>{kodeAksesModal.id}</span>
                </div>
              </div>

              <div className="alert alert-amber">
                <span>⚠️</span>
                <div style={{fontSize:12}}>
                  <strong>Serahkan kode ini kepada pemohon</strong> bersama tanda terima. Kode akses hanya ditampilkan sekali di sini. Untuk melihat kembali, buka detail pengajuan di tabel.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setKodeAksesModal(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={()=>{cetakTandaTerima({...kodeAksesModal.data, kodeAkses:kodeAksesModal.kode}); setKodeAksesModal(null);}}>
                🖨️ Cetak Tanda Terima
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
