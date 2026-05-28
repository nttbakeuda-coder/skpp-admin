import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
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
  "Juru Muda / I-a","Juru Muda Tingkat I / I-b","Juru / I-c","Juru Tingkat I / I-d",
  "Pengatur Muda / II-a","Pengatur Muda Tingkat I / II-b","Pengatur / II-c","Pengatur Tingkat I / II-d",
  "Penata Muda / III-a","Penata Muda Tingkat I / III-b","Penata / III-c","Penata Tingkat I / III-d",
  "Pembina / IV-a","Pembina Tingkat I / IV-b","Pembina Utama Muda / IV-c",
  "Pembina Utama Madya / IV-d","Pembina Utama / IV-e"
];

const DAFTAR_KASUBID = ["Ibu Ivoni S. Meok, SE., MM","Ibu Vebby R. Saba, SE"];

const DAFTAR_KEPERLUAN = [
  "Pensiun","Pensiun Janda","Pensiun Duda","Pindah",
  "Pemberhentian dengan Hormat","Pemberhentian dengan Hormat PPPK",
  "Pemberhentian Tidak dengan Hormat","Meninggal Dunia","Lainnya"
];

const KODE_KASUBID = {
  "Ibu Ivoni S. Meok, SE., MM": "BKUD3.1",
  "Ibu Vebby R. Saba, SE": "BKUD3.2",
};

const KODE_ALASAN = {
  "Pensiun":"PS","Pensiun Janda":"PJ","Pensiun Duda":"PD","Pindah":"Pdh",
  "Pemberhentian dengan Hormat":"PDH","Pemberhentian dengan Hormat PPPK":"PDHPPPK",
  "Pemberhentian Tidak dengan Hormat":"PTDH","Meninggal Dunia":"MD","Lainnya":"LN",
};

function generateTemplateNomor(nomorUrut, kasubid, alasan) {
  const tahun = new Date().getFullYear();
  const kodeKasubid = KODE_KASUBID[kasubid] || "BKUD3.X";
  const kodeAlasan = KODE_ALASAN[alasan] || "XX";
  return `900.1.3/${nomorUrut}/${kodeKasubid}/${kodeAlasan}/${tahun}`;
}

const AKUN_STAF = [
  { id:"1", username:"admin",    password:"(tersimpan di database)", nama:"Administrator",        role:"admin",    opd:"BKD Provinsi NTT" },
  { id:"2", username:"operator", password:"(tersimpan di database)", nama:"Staf Loket",           role:"operator", opd:"Loket SKPP" },
  { id:"3", username:"staf",     password:"(tersimpan di database)", nama:"Staf Pengampuh OPD",  role:"staf",     opd:"Pengampuh OPD" },
];

const API_URL = "https://script.google.com/macros/s/AKfycbxdSGg9F6P4FpNJsr3jhVklVKTqxFjepQbs4mHblDDv2ySMXD8nkZfrhMcEgz8IcPOoeA/exec";
const TANDA_TERIMA_URL = "/tanda_terima_SKPP.html";

function cetakTandaTerima(p) {
  const params = new URLSearchParams({
    id: p.id||"", kode: p.kodeAkses||"", nama: p.nama||"", nip: p.nip||"",
    jabatan: p.jabatan||"", pangkat: p.pangkat||"", opd: p.opd||"",
    alasan: p.alasan||"", jalur: p.jalur||"A", tgl: p.tanggalMasuk||"",
  });
  window.open(`${TANDA_TERIMA_URL}?${params.toString()}`, "_blank");
}

const TAHAPAN_A = [
  { id:"A1", label:"Berkas Diterima di Loket",      icon:"📥", pelaksana:"Staf Loket" },
  { id:"A2", label:"Verifikasi Kelengkapan Berkas", icon:"🔍", pelaksana:"Staf Pengampuh OPD" },
  { id:"A3", label:"Verifikasi Data PNS",           icon:"👤", pelaksana:"Staf Pengampuh OPD" },
  { id:"A4", label:"Pembuatan Draft SKPP",          icon:"📝", pelaksana:"Penyusun SKPP" },
  { id:"A5", label:"Verifikasi & Proses Tanda Tangan Pimpinan", icon:"✅", pelaksana:"Staf Pengampuh OPD → Kasubid → Kuasa BUD" },
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
  { id:"B9",  label:"Verifikasi & Proses Tanda Tangan Pimpinan", icon:"✅", pelaksana:"Staf Pengampuh OPD → Kasubid → Kuasa BUD" },
  { id:"B10", label:"Penempelan Foto & Penomoran",        icon:"📸", pelaksana:"Staf Loket" },
  { id:"B11", label:"SKPP Siap Diserahkan",               icon:"🎉", pelaksana:"Staf Loket", final:true },
];

const cekIzinProses = (userRole, pelaksanaTahapan) => {
  if (userRole === "admin") return true;
  if (pelaksanaTahapan === "Staf Perbendaharaan" || pelaksanaTahapan === "Operator / Staf Perbendaharaan") {
    return userRole === "operator" || userRole === "staf";
  }
  if (pelaksanaTahapan === "Staf Loket" || pelaksanaTahapan === "Operator SIMgaji") return userRole === "operator";
  if (pelaksanaTahapan === "Staf Pengampuh OPD" || pelaksanaTahapan === "Penyusun SKPP") return userRole === "staf";
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
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

// ─── SVG ICON COMPONENTS ─────────────────────────────────────────────────────
function Ico({ children, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
const IcoDashboard = () => <Ico><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></Ico>;
const IcoList = () => <Ico><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/></Ico>;
const IcoPlus = () => <Ico><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const IcoClock = () => <Ico><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico>;
const IcoUsers = () => <Ico><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>;
const IcoLogout = () => <Ico><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ico>;
const IcoFile = () => <Ico><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Ico>;
const IcoSearch = () => <Ico><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>;
const IcoRefresh = () => <Ico><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></Ico>;
const IcoDownload = () => <Ico><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ico>;
const IcoCheck = () => <Ico><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoAlert = () => <Ico><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ico>;
const IcoArrowBack = () => <Ico><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></Ico>;
const IcoPrint = () => <Ico><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></Ico>;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* ── DESIGN.MD COLOR TOKENS ── */
    --primary: #00327d;
    --on-primary: #ffffff;
    --primary-container: #0047ab;
    --on-primary-container: #a5bdff;
    --inverse-primary: #b1c5ff;
    --primary-fixed: #dae2ff;
    --primary-fixed-dim: #b1c5ff;
    --on-primary-fixed: #001946;
    --on-primary-fixed-variant: #00419e;

    --secondary: #785900;
    --on-secondary: #ffffff;
    --secondary-container: #fdc003;
    --on-secondary-container: #6c5000;
    --secondary-fixed: #ffdf9e;
    --secondary-fixed-dim: #fabd00;
    --on-secondary-fixed: #261a00;
    --on-secondary-fixed-variant: #5b4300;

    --tertiary: #74000a;
    --on-tertiary: #ffffff;
    --tertiary-container: #9f0012;
    --on-tertiary-container: #ffa79f;
    --tertiary-fixed: #ffdad6;
    --tertiary-fixed-dim: #ffb3ac;

    --error: #ba1a1a;
    --on-error: #ffffff;
    --error-container: #ffdad6;
    --on-error-container: #93000a;

    --surface: #f9f9fc;
    --surface-dim: #dadadc;
    --surface-bright: #f9f9fc;
    --surface-container-lowest: #ffffff;
    --surface-container-low: #f3f3f6;
    --surface-container: #eeeef0;
    --surface-container-high: #e8e8ea;
    --surface-container-highest: #e2e2e5;
    --on-surface: #1a1c1e;
    --on-surface-variant: #434653;
    --inverse-surface: #2f3133;
    --inverse-on-surface: #f0f0f3;
    --outline: #737784;
    --outline-variant: #c3c6d5;
    --surface-tint: #2559bd;
    --background: #f9f9fc;

    /* ── SEMANTIC ALIASES (backward compat) ── */
    --navy:    #00327d;
    --blue:    #0047ab;
    --green:   #059669;
    --amber:   #f59e0b;
    --red:     #ba1a1a;
    --success: #059669;
    --warning: #f59e0b;
    --g50:  #f9f9fc; --g100: #f3f3f6; --g200: #eeeef0; --g300: #cbd5e1;
    --g400: #737784; --g500: #64748b; --g600: #434653; --g700: #1a1c1e; --g800: #1a1c1e;
    --on-surface-var: #434653;
    --outline-var:    #c3c6d5;
    --primary-pale:   #dae2ff;
    --primary-dark:   #001946;
    --primary-light:  #0047ab;
    --secondary-pale: #ffdf9e;
    --secondary-light: #fabd00;
    --success-pale:   #d1fae5;
    --warning-pale:   #fef3c7;
    --error-pale:     #ffdad6;

    /* ── TYPOGRAPHY SCALE ── */
    --font: 'Inter', -apple-system, sans-serif;
    --mono: 'JetBrains Mono', 'Fira Code', monospace;

    /* ── ELEVATION / SHADOW ── */
    --shadow-1: 0px 4px 20px rgba(0,0,0,0.04);
    --shadow-2: 0px 12px 32px rgba(0,0,0,0.08);
    --shadow-card: 0px 1px 3px rgba(0,0,0,0.06), 0px 4px 16px rgba(0,0,0,0.04);
    --shadow-modal: 0px 20px 60px rgba(0,0,0,0.18), 0px 4px 12px rgba(0,0,0,0.08);

    /* ── RADII ── */
    --r-sm:   0.25rem;   /* 4px */
    --r-md:   0.75rem;   /* 12px — buttons, inputs */
    --r:      1rem;      /* 16px — standard cards */
    --r-lg:   1.5rem;    /* 24px — large cards, modals */
    --r-full: 9999px;    /* pills */
    --rs:     12px;      /* compat alias */

    /* ── SPACING ── */
    --sidebar: 280px;
    --sidebar-collapsed: 80px;
  }

  body {
    font-family: var(--font);
    background: var(--surface);
    color: var(--on-surface);
    height: 100vh;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ════════════════════════════════════════════
     LAYOUT
  ════════════════════════════════════════════ */
  .layout { display: flex; height: 100vh; overflow: hidden; }

  /* ════════════════════════════════════════════
     SIDEBAR  — white, left-bar active indicator
  ════════════════════════════════════════════ */
  .sidebar {
    width: var(--sidebar);
    background: var(--surface-container-lowest);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: 1px solid var(--outline-variant);
  }

  .sidebar-brand {
    padding: 24px 20px 20px;
    border-bottom: 1px solid var(--outline-variant);
  }
  .sidebar-logo {
    width: 42px; height: 42px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(0,50,125,0.3);
  }
  .sidebar-title {
    color: var(--on-surface);
    font-weight: 800;
    font-size: 15px;
    letter-spacing: -0.4px;
    line-height: 1.3;
  }
  .sidebar-sub {
    color: var(--on-surface-variant);
    font-size: 11.5px;
    margin-top: 4px;
    line-height: 1.5;
  }

  /* User Profile Card */
  .sidebar-user {
    margin: 16px 14px;
    background: var(--surface-container-low);
    border-radius: var(--r);
    padding: 14px 16px;
    border: 1px solid var(--outline-variant);
  }
  .sidebar-user-name {
    color: var(--on-surface);
    font-weight: 700;
    font-size: 13.5px;
    line-height: 1.3;
    margin-bottom: 2px;
  }
  .sidebar-user-role-label {
    color: var(--on-surface-variant);
    font-size: 11.5px;
    margin-bottom: 8px;
  }

  /* Nav */
  .sidebar-nav { padding: 8px 12px; flex: 1; }

  .nav-section {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--outline);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 14px 12px 6px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--r-md);
    cursor: pointer;
    margin-bottom: 2px;
    transition: all 0.15s ease;
    color: var(--on-surface-variant);
    font-size: 13.5px;
    font-weight: 500;
    position: relative;
    border-left: 3px solid transparent;
  }
  .nav-item:hover {
    background: var(--surface-container-low);
    color: var(--on-surface);
  }
  .nav-item.active {
    background: var(--primary-fixed);
    color: var(--primary);
    border-left-color: var(--primary);
    font-weight: 600;
  }
  .nav-item .ni { font-size: 16px; width: 18px; text-align: center; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .nav-badge {
    margin-left: auto;
    background: var(--error);
    color: white;
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: var(--r-full);
    min-width: 20px;
    text-align: center;
  }

  .sidebar-footer {
    padding: 14px 14px 20px;
    border-top: 1px solid var(--outline-variant);
  }
  .logout-btn {
    width: 100%;
    padding: 10px 14px;
    background: var(--surface-container-low);
    border: 1.5px solid var(--outline-variant);
    border-radius: var(--r-md);
    color: var(--on-surface-variant);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .logout-btn:hover {
    background: var(--error-container);
    border-color: #fca5a5;
    color: var(--error);
  }

  /* ════════════════════════════════════════════
     MAIN CONTENT
  ════════════════════════════════════════════ */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .topbar {
    background: var(--surface-container-lowest);
    border-bottom: 1px solid var(--outline-variant);
    padding: 0 32px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .topbar-title {
    font-weight: 700;
    font-size: 20px;
    color: var(--on-surface);
    letter-spacing: -0.5px;
    line-height: 1.2;
  }
  .topbar-sub {
    font-size: 12px;
    color: var(--on-surface-variant);
    margin-top: 1px;
  }
  .topbar-date {
    font-size: 12px;
    color: var(--outline);
    font-weight: 500;
    font-family: var(--mono);
    background: var(--surface-container-low);
    padding: 5px 12px;
    border-radius: var(--r-full);
    border: 1px solid var(--outline-variant);
  }

  .content { flex: 1; overflow-y: auto; padding: 28px 32px; }

  /* ════════════════════════════════════════════
     CARDS  — Level 1 elevation
  ════════════════════════════════════════════ */
  .card {
    background: var(--surface-container-lowest);
    border-radius: var(--r);
    box-shadow: var(--shadow-card);
    border: 1px solid var(--outline-variant);
    overflow: hidden;
  }
  .card-header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--outline-variant);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    background: var(--surface-container-lowest);
  }
  .card-header-title {
    font-weight: 700;
    font-size: 14px;
    color: var(--on-surface);
    letter-spacing: -0.2px;
  }
  .card-body { padding: 24px; }

  /* ════════════════════════════════════════════
     STAT GRID  (4-column dashboard)
  ════════════════════════════════════════════ */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  .stat-card {
    background: var(--surface-container-lowest);
    border-radius: var(--r);
    padding: 20px 22px;
    border: 1px solid var(--outline-variant);
    box-shadow: var(--shadow-card);
    display: flex;
    align-items: flex-start;
    gap: 14px;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .stat-card:hover {
    box-shadow: var(--shadow-2);
    transform: translateY(-1px);
  }
  .stat-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }
  .stat-num {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1;
  }
  .stat-label {
    font-size: 11px;
    color: var(--on-surface-variant);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 4px;
  }

  /* Hero gradient card */
  .hero-card {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #1a4db3 100%);
    border-radius: var(--r-lg);
    padding: 28px 32px;
    color: white;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .hero-card::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 200px; height: 200px;
    background: rgba(255,255,255,0.05);
    border-radius: 50%;
  }
  .hero-card::after {
    content: '';
    position: absolute;
    bottom: -60px; right: 80px;
    width: 240px; height: 240px;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
  }

  /* ════════════════════════════════════════════
     BADGES / PILLS
  ════════════════════════════════════════════ */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: var(--r-full);
    font-size: 11.5px;
    font-weight: 600;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }
  .badge-blue   { background: var(--primary-fixed);     color: var(--primary); }
  .badge-green  { background: var(--success-pale);       color: var(--success); }
  .badge-amber  { background: var(--warning-pale);       color: #92400e; }
  .badge-red    { background: var(--error-container);    color: var(--tertiary); }
  .badge-purple { background: #f5f3ff;                   color: #5b21b6; }
  .badge-gold   { background: var(--secondary-fixed);    color: var(--on-secondary-container); }

  /* chip (lighter variant) */
  .chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: var(--r-full);
    font-size: 12px;
    font-weight: 500;
    background: var(--surface-container);
    color: var(--on-surface-variant);
  }
  .chip-blue  { background: var(--primary-fixed);   color: var(--primary); }
  .chip-green { background: var(--success-pale);     color: var(--success); }
  .chip-gold  { background: var(--secondary-fixed);  color: var(--on-secondary-container); }

  /* ════════════════════════════════════════════
     BUTTONS
  ════════════════════════════════════════════ */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: var(--r-md);
    font-family: var(--font);
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s ease;
    white-space: nowrap;
    letter-spacing: -0.1px;
  }
  .btn-primary {
    background: var(--primary);
    color: white;
    box-shadow: 0 2px 8px rgba(0,50,125,0.25);
  }
  .btn-primary:hover { background: var(--on-primary-fixed); box-shadow: 0 4px 14px rgba(0,50,125,0.35); }
  .btn-secondary {
    background: var(--surface-container-low);
    color: var(--on-surface);
    border: 1.5px solid var(--outline-variant);
  }
  .btn-secondary:hover { background: var(--surface-container); }
  .btn-success  { background: var(--success);         color: white; }
  .btn-success:hover { background: #047857; }
  .btn-danger   { background: var(--error);            color: white; }
  .btn-danger:hover  { background: #941a1f; }
  .btn-ghost    { background: none; color: var(--on-surface-variant); border: 1.5px solid var(--outline-variant); }
  .btn-ghost:hover { background: var(--surface-container-low); }
  .btn-sm { padding: 7px 13px; font-size: 12.5px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ════════════════════════════════════════════
     TABLE
  ════════════════════════════════════════════ */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  th {
    background: var(--surface-container-low);
    padding: 11px 16px;
    text-align: left;
    font-weight: 700;
    color: var(--on-surface-variant);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    border-bottom: 1.5px solid var(--outline-variant);
    white-space: nowrap;
  }
  td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--outline-variant);
    color: var(--on-surface);
    vertical-align: middle;
  }
  .tr-clickable:hover td { background: var(--surface-container-low); cursor: pointer; }
  .tr-selected td { background: var(--primary-fixed) !important; }

  /* ════════════════════════════════════════════
     FORM CONTROLS
  ════════════════════════════════════════════ */
  .form-group { margin-bottom: 16px; }
  .form-label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--on-surface-variant);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .form-control {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid var(--outline-variant);
    border-radius: var(--r-md);
    font-family: var(--font);
    font-size: 14px;
    color: var(--on-surface);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    background: var(--surface-container-lowest);
  }
  .form-control:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0,50,125,0.08);
  }
  textarea.form-control { resize: vertical; min-height: 80px; }
  select.form-control { cursor: pointer; }

  /* ── Pill-shaped search bar ── */
  .search-wrap { position: relative; flex: 1; min-width: 240px; }
  .search-input {
    width: 100%;
    padding: 9px 16px 9px 42px;
    border: 1.5px solid var(--outline-variant);
    border-radius: var(--r-full);
    font-family: var(--font);
    font-size: 13.5px;
    background: var(--surface-container-lowest);
    color: var(--on-surface);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .search-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0,50,125,0.08);
  }
  .search-input::placeholder { color: var(--outline); }
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--outline);
    display: flex; align-items: center;
  }

  /* ════════════════════════════════════════════
     MODAL  — Level 2 elevation
  ════════════════════════════════════════════ */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(26,28,30,0.45);
    backdrop-filter: blur(8px);
    display: flex; align-items: flex-start; justify-content: center;
    z-index: 1000;
    padding: 32px;
    overflow-y: auto;
  }
  .modal {
    background: var(--surface-container-lowest);
    border-radius: var(--r-lg);
    width: 100%;
    max-width: 740px;
    box-shadow: var(--shadow-modal);
    margin: auto;
    animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid var(--outline-variant);
  }
  .modal-header {
    padding: 22px 26px;
    border-bottom: 1px solid var(--outline-variant);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  }
  .modal-body {
    padding: 22px 26px;
    max-height: 68vh;
    overflow-y: auto;
  }
  .modal-footer {
    padding: 14px 26px;
    border-top: 1px solid var(--outline-variant);
    display: flex; gap: 8px; justify-content: flex-end;
    background: var(--surface-container-low);
    border-radius: 0 0 var(--r-lg) var(--r-lg);
  }
  .modal-close {
    background: none; border: none;
    font-size: 18px; cursor: pointer;
    color: var(--outline);
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.15s;
    line-height: 1;
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
  }
  .modal-close:hover { background: var(--surface-container); color: var(--on-surface); }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }

  /* ════════════════════════════════════════════
     TABS
  ════════════════════════════════════════════ */
  .tabs {
    display: flex; gap: 2px;
    border-bottom: 1.5px solid var(--outline-variant);
    margin-bottom: 22px;
  }
  .tab {
    padding: 11px 18px;
    font-size: 13.5px; font-weight: 600;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    margin-bottom: -1.5px;
    color: var(--on-surface-variant);
    transition: all 0.15s;
    border-radius: 6px 6px 0 0;
  }
  .tab.active { color: var(--primary); border-bottom-color: var(--primary); }
  .tab:hover:not(.active) { color: var(--on-surface); background: var(--surface-container-low); }

  /* ════════════════════════════════════════════
     TIMELINE
  ════════════════════════════════════════════ */
  .timeline-item { display: flex; gap: 16px; position: relative; }
  .timeline-item:not(:last-child) { padding-bottom: 22px; }
  .timeline-left { display: flex; flex-direction: column; align-items: center; width: 40px; flex-shrink: 0; }
  .t-dot {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    border: 2.5px solid transparent;
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .t-dot.done    { background: var(--success-pale);  border-color: var(--success); }
  .t-dot.active  { background: var(--primary-fixed); border-color: var(--primary); animation: pulse 2s infinite; }
  .t-dot.pending { background: var(--surface-container-low); border-color: var(--outline-variant); opacity: 0.5; }
  .t-dot.ret     { background: var(--warning-pale);  border-color: var(--warning); }
  .t-line { flex: 1; width: 2.5px; background: var(--outline-variant); min-height: 22px; margin-top: 4px; }
  .t-line.done { background: var(--success); }
  @keyframes pulse {
    0%   { box-shadow: 0 0 0 0 rgba(0,50,125,0.3); }
    70%  { box-shadow: 0 0 0 8px rgba(0,50,125,0); }
    100% { box-shadow: 0 0 0 0 rgba(0,50,125,0); }
  }

  /* ════════════════════════════════════════════
     PROGRESS BAR
  ════════════════════════════════════════════ */
  .progress-wrap {
    background: var(--surface-container-high);
    border-radius: var(--r-full);
    height: 8px;
    overflow: hidden;
  }
  .progress-bar {
    height: 100%;
    border-radius: var(--r-full);
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ════════════════════════════════════════════
     GRID HELPERS
  ════════════════════════════════════════════ */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }

  /* ════════════════════════════════════════════
     ALERTS
  ════════════════════════════════════════════ */
  .alert {
    padding: 12px 16px;
    border-radius: var(--r-md);
    font-size: 13.5px;
    display: flex; gap: 12px; align-items: flex-start;
    margin-bottom: 16px;
    border: 1.5px solid;
  }
  .alert-blue   { background: var(--primary-fixed);    border-color: var(--primary-fixed-dim); color: var(--primary); }
  .alert-amber  { background: var(--warning-pale);     border-color: #fcd34d;  color: #92400e; }
  .alert-green  { background: var(--success-pale);     border-color: #a7f3d0;  color: var(--success); }
  .alert-red    { background: var(--error-container);  border-color: #fca5a5;  color: var(--error); }

  /* ════════════════════════════════════════════
     INFO ROWS (detail modal)
  ════════════════════════════════════════════ */
  .info-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: baseline; }
  .info-lbl {
    font-size: 11px;
    color: var(--on-surface-variant);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    min-width: 120px;
    flex-shrink: 0;
  }
  .info-val { font-size: 13.5px; color: var(--on-surface); font-weight: 500; }

  /* ════════════════════════════════════════════
     STEP BUTTONS
  ════════════════════════════════════════════ */
  .step-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px;
    border-radius: var(--r-md);
    border: 1.5px solid var(--outline-variant);
    background: var(--surface-container-lowest);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    width: 100%; text-align: left;
    margin-bottom: 6px;
    transition: all 0.15s;
  }
  .step-btn.done   { border-color: var(--success); background: var(--success-pale); color: var(--success); cursor: default; }
  .step-btn.aktif  { border-color: var(--primary); background: var(--primary-fixed); color: var(--primary); }
  .step-btn.wait   { opacity: 0.4; cursor: not-allowed; color: var(--on-surface-variant); }

  /* ════════════════════════════════════════════
     LOGIN PAGE  — premium gradient
  ════════════════════════════════════════════ */
  .login-bg {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 55%, #1a4db3 100%);
    position: relative;
    overflow: hidden;
  }
  .login-bg::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(253,192,3,0.08) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 70%);
  }
  .login-card {
    background: var(--surface-container-lowest);
    border-radius: var(--r-lg);
    width: 420px;
    max-width: calc(100vw - 32px);
    padding: 44px;
    box-shadow: 0px 24px 72px rgba(0,0,0,0.35), 0px 4px 16px rgba(0,0,0,0.12);
    position: relative;
    z-index: 1;
  }
  .login-logo-wrap {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 28px;
  }
  .login-logo {
    width: 52px; height: 52px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 20px rgba(0,50,125,0.35);
    flex-shrink: 0;
    color: white;
  }
  .login-brand-text {}
  .login-brand-name {
    font-weight: 800;
    font-size: 20px;
    color: var(--primary);
    letter-spacing: -0.5px;
    line-height: 1.2;
  }
  .login-brand-sub {
    font-size: 12px;
    color: var(--on-surface-variant);
    margin-top: 2px;
  }
  .login-divider {
    height: 1px;
    background: var(--outline-variant);
    margin: 0 0 24px;
  }

  /* ════════════════════════════════════════════
     TOAST
  ════════════════════════════════════════════ */
  .toast {
    position: fixed;
    bottom: 28px; right: 28px;
    background: var(--inverse-surface);
    color: var(--inverse-on-surface);
    padding: 13px 22px;
    border-radius: var(--r-md);
    font-size: 13.5px; font-weight: 600;
    z-index: 9999;
    box-shadow: var(--shadow-modal);
    animation: slideUp 0.2s ease;
    display: flex; align-items: center; gap: 10px;
    max-width: 380px;
  }

  /* ════════════════════════════════════════════
     LOADING / EMPTY STATES
  ════════════════════════════════════════════ */
  .spinner {
    width: 28px; height: 28px;
    border: 3px solid var(--surface-container-high);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin: 0 auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-box {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; padding: 56px;
    color: var(--on-surface-variant); font-size: 14px;
  }
  .empty-box { text-align: center; padding: 48px; color: var(--on-surface-variant); }
  .empty-icon { font-size: 44px; margin-bottom: 12px; }
  .empty-text { font-size: 15px; font-weight: 700; color: var(--on-surface); }
  .empty-sub  { font-size: 13px; margin-top: 6px; color: var(--on-surface-variant); }

  /* Role table badges */
  .role-admin    { background: #f5f3ff; color: #5b21b6; }
  .role-staf     { background: var(--primary-fixed); color: var(--primary); }
  .role-operator { background: var(--warning-pale);  color: #92400e; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--outline-variant); border-radius: var(--r-full); }
  ::-webkit-scrollbar-thumb:hover { background: var(--outline); }
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
    if (!user.trim() || !pass) { setErr("Username dan password wajib diisi."); return; }
    setIsLoggingIn(true); setErr("");
    try {
      const res = await apiPost({ action:"login", username:user.trim(), password:pass });
      if (res && res.ok) {
        localStorage.setItem("isLoggedIn","true");
        localStorage.setItem("namaStaf", res.nama);
        localStorage.setItem("roleStaf", res.role);
        onLogin({ username: user.trim(), nama: res.nama, role: res.role });
      } else {
        setErr(res.pesan || "Username atau password salah.");
      }
    } catch { setErr("Gagal terhubung ke server database."); }
    finally { setIsLoggingIn(false); }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo-wrap">
          <div className="login-logo">
            <IcoFile size={26} />
          </div>
          <div className="login-brand-text">
            <div className="login-brand-name">SKPP Tracker</div>
            <div className="login-brand-sub">Bidang Perbendaharaan — BKD Provinsi NTT</div>
          </div>
        </div>
        <div className="login-divider" />

        {err && (
          <div className="alert alert-red" style={{marginBottom:18}}>
            <IcoAlert size={16}/>
            <span>{err}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-control"
            value={user}
            onChange={e => setUser(e.target.value)}
            onKeyDown={e => e.key==="Enter" && submit()}
            disabled={isLoggingIn}
            autoComplete="username"
            placeholder="Masukkan username"
          />
        </div>

        <div className="form-group" style={{marginBottom:24}}>
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key==="Enter" && submit()}
            disabled={isLoggingIn}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <button
          className="btn btn-primary"
          style={{width:"100%", justifyContent:"center", padding:"12px", fontSize:14, letterSpacing:"-0.2px"}}
          onClick={submit}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Memeriksa Akun...</>
          ) : "Masuk ke Dashboard →"}
        </button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ user, active, onChange, counts, onLogout }) {
  const items = [
    { id:"dashboard", icon:<IcoDashboard/>, label:"Dashboard" },
    { id:"pengajuan", icon:<IcoList/>,      label:"Daftar Pengajuan", badge: counts.proses },
    { id:"input",     icon:<IcoPlus/>,      label:"Input Pengajuan Baru" },
    { id:"riwayat",   icon:<IcoClock/>,     label:"Riwayat & Arsip" },
  ];
  const adminItems = [
    { id:"users", icon:<IcoUsers/>, label:"Manajemen Staf" },
  ];

  const roleLabel = user.role==="admin" ? "Admin" : user.role==="operator" ? "Staf Loket" : "Staf Pengampuh OPD";
  const roleClass = user.role==="admin" ? "badge-purple" : user.role==="operator" ? "badge-gold" : "badge-blue";

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <IcoFile size={20} />
        </div>
        <div className="sidebar-title">SKPP Tracker Admin</div>
        <div className="sidebar-sub">Bidang Perbendaharaan – Badan Keuangan Daerah Provinsi NTT</div>
      </div>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="sidebar-user-name">{user.nama}</div>
        <div className="sidebar-user-role-label">{user.opd || "—"}</div>
        <span className={`badge ${roleClass}`} style={{fontSize:11}}>{roleLabel}</span>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <div className="nav-section">Menu Utama</div>
        {items.map(it => {
          if (user.role === "staf" && it.id === "input") return null;
          return (
            <div key={it.id} className={`nav-item ${active===it.id?"active":""}`} onClick={() => onChange(it.id)}>
              <span className="ni">{it.icon}</span>
              <span style={{flex:1}}>{it.label}</span>
              {it.badge > 0 && <span className="nav-badge">{it.badge}</span>}
            </div>
          );
        })}
        {user.role === "admin" && (
          <>
            <div className="nav-section">Administrasi</div>
            {adminItems.map(it => (
              <div key={it.id} className={`nav-item ${active===it.id?"active":""}`} onClick={() => onChange(it.id)}>
                <span className="ni">{it.icon}</span>
                <span style={{flex:1}}>{it.label}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <IcoLogout size={15}/>
          Keluar dari Sistem
        </button>
      </div>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function SBadge({ s, p }) {
  const status = s || (p && p.status) || "proses";
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
        const done  = selesai.includes(step.id);
        const aktif = p.tahapAktif === step.id;
        const isLast = idx === tahapan.length - 1;
        const log = riwayat.find(r => r.tahap === step.id);
        const isRet = log?.isKembali===true || log?.isKembali==="TRUE";
        let dot = "pending"; if(done) dot=isRet?"ret":"done"; else if(aktif) dot="active";
        return (
          <div key={step.id} className="timeline-item">
            <div className="timeline-left">
              <div className={`t-dot ${dot}`}>{done&&!isRet?"✓":isRet?"↩":step.icon}</div>
              {!isLast && <div className={`t-line ${done&&!isRet?"done":""}`} />}
            </div>
            <div className="timeline-content" style={{paddingBottom:isLast?0:20}}>
              <div style={{fontWeight:700,fontSize:13,color:!done&&!aktif?"var(--outline)":"var(--on-surface)",marginBottom:2}}>{step.label}</div>
              <div style={{fontSize:11.5,color:"var(--on-surface-variant)",marginBottom:4}}>{step.pelaksana}</div>
              {aktif&&!done && <span className="badge badge-blue" style={{marginBottom:4,fontSize:11}}>Sedang diproses</span>}
              {log && <div style={{fontSize:11,color:"var(--outline)",fontFamily:"var(--mono)"}}>{log.waktu}</div>}
              {log?.catatan && (
                <div style={{
                  background: isRet?"#fffbeb":"var(--surface-container-low)",
                  border: `1px solid ${isRet?"#fde68a":"var(--outline-variant)"}`,
                  borderRadius:8, padding:"7px 11px", fontSize:12,
                  color: isRet?"#92400e":"var(--on-surface-variant)", marginTop:6
                }}>
                  {isRet?"⚠️ ":""}{log.catatan}
                </div>
              )}
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
  const stepAktif = tahapan.find(t => t.id===p.tahapAktif && !p.tahapSelesai.includes(t.id));
  const prog = getProgress(p);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:740}}>
        <div className="modal-header">
          <div>
            <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--primary)",fontWeight:700,marginBottom:3,letterSpacing:"0.05em"}}>{p.id}</div>
            <div style={{fontWeight:800,fontSize:17,color:"var(--on-surface)",letterSpacing:"-0.4px"}}>{p.nama}</div>
            <div style={{fontSize:12,color:"var(--on-surface-variant)",marginTop:3}}>{p.opd} · {p.alasan} · {p.jalur==="A"?"Jalur A":"Jalur B"}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <SBadge p={p}/>
            <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="tabs">
            {["info","proses","riwayat"].map(t => (
              <div key={t} className={`tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
                {t==="info"?"Data Pegawai":t==="proses"?"Update Proses":"Riwayat Lengkap"}
              </div>
            ))}
          </div>

          {tab==="info" && (
            <div>
              <div style={{background:"var(--surface-container-low)",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1px solid var(--outline-variant)"}}>
                <div className="grid-2" style={{gap:8}}>
                  {[
                    ["NIP",     p.nip,     true],
                    ["Jabatan", p.jabatan],
                    ["Pangkat", p.pangkat],
                    ["Keperluan", p.alasan],
                    ["Kasubid",   p.kasubid],
                    ["Tgl Masuk", p.tanggalMasuk],
                    [p.status==="selesai"?"Tgl Selesai":"Est. Selesai", p.status==="selesai"?p.tanggalSelesai:p.estimasiSelesai],
                  ].map(([l,v,mono])=>(
                    <div key={l} className="info-row">
                      <span className="info-lbl">{l}</span>
                      <span className="info-val" style={{
                        ...(mono?{fontFamily:"var(--mono)",fontSize:12}:{}),
                        ...(l==="Tgl Selesai"?{color:"var(--success)",fontWeight:700}:{})
                      }}>{v||"—"}</span>
                    </div>
                  ))}
                  {p.nomorSKPP && (
                    <div className="info-row">
                      <span className="info-lbl">No. SKPP</span>
                      <span className="info-val" style={{color:"var(--success)",fontWeight:700,fontFamily:"var(--mono)"}}>{p.nomorSKPP}</span>
                    </div>
                  )}
                  {p.kodeAkses && (
                    <div style={{
                      gridColumn:"1/-1",
                      background:"linear-gradient(135deg,var(--primary) 0%,var(--primary-container) 100%)",
                      borderRadius:12,padding:"14px 18px",marginTop:8,
                      display:"flex",alignItems:"center",justifyContent:"space-between",gap:12
                    }}>
                      <div>
                        <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:4}}>Kode Akses Portal</div>
                        <div style={{color:"var(--secondary-container)",fontFamily:"var(--mono)",fontSize:28,fontWeight:800,letterSpacing:8}}>{p.kodeAkses}</div>
                      </div>
                      <button className="btn btn-sm" style={{background:"var(--secondary-container)",color:"var(--on-secondary-container)",fontWeight:700,flexShrink:0,gap:6}} onClick={onCetak}>
                        <IcoPrint size={14}/> Cetak Tanda Terima
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,color:"var(--on-surface-variant)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Progress</span>
                <span style={{fontSize:13,fontWeight:800,color:prog===100?"var(--success)":"var(--primary)",fontFamily:"var(--mono)"}}>{prog}%</span>
              </div>
              <div className="progress-wrap" style={{height:10}}>
                <div className="progress-bar" style={{width:`${prog}%`,background:prog===100?"var(--success)":p.status==="kembali"?"var(--warning)":"var(--primary)"}}/>
              </div>
            </div>
          )}

          {tab==="proses" && (
            <div>
              {(p.status==="selesai"||prog===100) ? (
                <div className="alert alert-green"><IcoCheck size={16}/><span>SKPP sudah selesai dan diserahkan. Tidak ada tahap yang perlu diupdate.</span></div>
              ) : p.status==="kembali" ? (
                <div>
                  <div style={{background:"#fffbeb",border:"2px solid #f59e0b",borderRadius:12,padding:"18px",marginBottom:16}}>
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
                  <div className="alert alert-blue" style={{marginBottom:14}}>
                    <span>ℹ️</span>
                    <div><strong>Tahap aktif: {stepAktif.icon} {stepAktif.label}</strong><br/><span style={{fontSize:12}}>Pelaksana: {stepAktif.pelaksana}</span></div>
                  </div>
                  {isPenomoran(stepAktif.id) && (
                    <div style={{background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#0369a1",marginBottom:10}}>📋 Input Nomor SKPP</div>
                      <div className="form-group" style={{marginBottom:8}}>
                        <label className="form-label">Nomor Urut (sesuai buku regis) *</label>
                        <input
                          className="form-control"
                          type="text"
                          value={nomorUrut}
                          onChange={e => setNomorUrut(e.target.value.replace(/[^0-9]/g,""))}
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
                  <div
                    style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:10,cursor:"pointer",marginBottom:14}}
                    onClick={() => setIsKembali(!isKembali)}
                  >
                    <input type="checkbox" checked={isKembali} readOnly style={{width:15,height:15}} />
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:"#92400e"}}>Kembalikan Berkas</div>
                      <div style={{fontSize:11,color:"#b45309"}}>Berkas tidak lengkap/sesuai, perlu dikembalikan ke pemohon</div>
                    </div>
                  </div>
                  <button
                    className="btn"
                    style={{
                      width:"100%", justifyContent:"center",
                      background: isKembali?"var(--error)":"var(--primary)",
                      color:"white",
                      opacity: !cekIzinProses(user?.role, stepAktif.pelaksana)?0.6:1
                    }}
                    disabled={saving || !cekIzinProses(user?.role, stepAktif.pelaksana) || (isPenomoran(stepAktif.id) && !nomorUrut)}
                    onClick={() => {
                      const indexSaatIni = tahapan.findIndex(t => t.id===stepAktif.id);
                      const nextStepId = indexSaatIni < tahapan.length-1 ? tahapan[indexSaatIni+1].id : "";
                      onUpdate({
                        pengajuanId: p.id,
                        stepId: stepAktif.id,
                        nextStepId: nextStepId,
                        catatan: catatan,
                        isKembali: isKembali,
                        isFinal: stepAktif.final===true,
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
              <hr style={{margin:"18px 0",border:"none",borderTop:"1px solid var(--outline-variant)"}}/>
              <div style={{fontWeight:700,fontSize:11,color:"var(--on-surface-variant)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.07em"}}>Semua Tahap</div>
              {tahapan.map(step => {
                const isDone = p.tahapSelesai.includes(step.id), isAktif = p.tahapAktif===step.id;
                let cls="step-btn wait"; if(isDone) cls="step-btn done"; else if(isAktif) cls="step-btn aktif";
                return (
                  <div key={step.id} className={cls}>
                    <span>{step.icon}</span>
                    <span style={{flex:1}}>{step.label}</span>
                    {isDone && <span style={{fontSize:11}}>✓ Selesai</span>}
                    {isAktif && !isDone && <span className="badge badge-blue" style={{fontSize:10}}>Aktif</span>}
                  </div>
                );
              })}
            </div>
          )}

          {tab==="riwayat" && <Timeline p={p}/>}
        </div>
      </div>
    </div>
  );
}

// ─── SEARCHABLE SELECT ────────────────────────────────────────────────────────
function SearchableSelect({ label, value, onChange, options, placeholder="-- Pilih --" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClick(e) { if(ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { if(open && inputRef.current) inputRef.current.focus(); }, [open]);

  const select = (opt) => { onChange(opt); setQuery(""); setOpen(false); };
  const clear   = (e)   => { e.stopPropagation(); onChange(""); setQuery(""); };

  return (
    <div className="form-group" ref={ref} style={{position:"relative"}}>
      {label && <label className="form-label">{label}</label>}
      <div
        onClick={() => setOpen(o=>!o)}
        style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 14px",
          border:`1.5px solid ${open?"var(--primary)":"var(--outline-variant)"}`,
          borderRadius:"var(--r-md)", background:"white", cursor:"pointer",
          fontSize:13.5, color:value?"var(--on-surface)":"var(--outline)",
          userSelect:"none", transition:"border-color .15s",
        }}
      >
        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value||placeholder}</span>
        <span style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,marginLeft:6}}>
          {value && <span onClick={clear} style={{color:"var(--outline)",fontSize:14,lineHeight:1,padding:"0 2px"}} title="Hapus pilihan">✕</span>}
          <span style={{color:"var(--outline)",fontSize:10,transition:"transform .15s",display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
        </span>
      </div>
      {open && (
        <div style={{
          position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:2000,
          background:"white",border:"1.5px solid var(--outline-variant)",borderRadius:"var(--r-md)",
          boxShadow:"0 8px 24px rgba(0,0,0,.12)",overflow:"hidden",
        }}>
          <div style={{padding:"8px 10px",borderBottom:"1px solid var(--outline-variant)",display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:"var(--outline)",display:"flex"}}><IcoSearch size={13}/></span>
            <input
              ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ketik untuk mencari..."
              style={{flex:1,border:"none",outline:"none",fontSize:13,fontFamily:"var(--font)",color:"var(--on-surface)",background:"transparent"}}
            />
            {query && <span onClick={()=>setQuery("")} style={{color:"var(--on-surface-variant)",cursor:"pointer",fontSize:13}}>✕</span>}
          </div>
          <div style={{maxHeight:220,overflowY:"auto"}}>
            {filtered.length===0 ? (
              <div style={{padding:"12px 14px",fontSize:12,color:"var(--on-surface-variant)",textAlign:"center"}}>Tidak ditemukan</div>
            ) : filtered.map((opt,i) => (
              <div
                key={i} onClick={() => select(opt)}
                style={{
                  padding:"9px 14px",fontSize:13,cursor:"pointer",
                  background:value===opt?"var(--primary-fixed)":"white",
                  color:value===opt?"var(--primary)":"var(--on-surface)",
                  fontWeight:value===opt?600:400,
                  borderLeft:value===opt?"3px solid var(--primary)":"3px solid transparent",
                  transition:"background .1s",
                }}
                onMouseEnter={e=>{if(value!==opt)e.currentTarget.style.background="var(--surface-container-low)";}}
                onMouseLeave={e=>{if(value!==opt)e.currentTarget.style.background="white";}}
              >{opt}</div>
            ))}
          </div>
          <div style={{padding:"5px 14px",borderTop:"1px solid var(--outline-variant)",fontSize:11,color:"var(--on-surface-variant)"}}>
            {filtered.length} dari {options.length} pilihan
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INPUT BARU ───────────────────────────────────────────────────────────────
function InputBaru({ onClose, onSave, onSaveBulk, saving }) {
  const [mode, setMode] = useState("tunggal");
  const [form, setForm] = useState({ nama:"", nip:"", opd:"", jabatan:"", pangkat:"", alasan:"Pensiun", jalur:"A", kasubid:DAFTAR_KASUBID[0] });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const [bulkOPD, setBulkOPD] = useState("");
  const [bulkKasubid, setBulkKasubid] = useState(DAFTAR_KASUBID[0]);
  const emptyItem = () => ({ nama:"", nip:"", jabatan:"", pangkat:"", alasan:"Pensiun", jalur:"A", _id:Date.now()+Math.random() });
  const [items, setItems] = useState([emptyItem()]);
  const setItem = (idx,k,v) => setItems(prev=>prev.map((it,i)=>i===idx?{...it,[k]:v}:it));
  const addItem = () => setItems(prev=>[...prev,emptyItem()]);
  const removeItem = (idx) => setItems(prev=>prev.filter((_,i)=>i!==idx));
  const duplicateItem = (idx) => setItems(prev=>{ const clone={...prev[idx],_id:Date.now()+Math.random()}; const next=[...prev]; next.splice(idx+1,0,clone); return next; });
  const bulkValid = bulkOPD && bulkKasubid && items.length>0 && items.every(it=>it.nama&&it.nip);
  const handleSaveBulk = () => {
    if(!bulkValid) return;
    onSaveBulk({ namaOPD:bulkOPD, kasubid:bulkKasubid, items:items.map(({_id,...rest})=>rest) });
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:mode==="bulk"?860:600}}>
        <div className="modal-header">
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"var(--primary)",letterSpacing:"-0.4px"}}>Input Pengajuan SKPP</div>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              {["tunggal","bulk"].map(m=>(
                <button key={m} onClick={()=>setMode(m)} style={{
                  padding:"4px 14px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
                  background:mode===m?"var(--primary)":"var(--surface-container-low)",
                  color:mode===m?"white":"var(--on-surface-variant)",
                }}>
                  {m==="tunggal"?"👤 Tunggal":"📦 Bulk (Bendahara OPD)"}
                </button>
              ))}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>

        {mode==="tunggal" && (<>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Nama Lengkap *</label><input className="form-control" value={form.nama} onChange={e=>set("nama",e.target.value)} placeholder="Sesuai SK"/></div>
              <div className="form-group"><label className="form-label">NIP *</label><input className="form-control" value={form.nip} onChange={e=>set("nip",e.target.value)} placeholder="18 digit" style={{fontFamily:"var(--mono)"}}/></div>
            </div>
            <div className="grid-2">
              <SearchableSelect label="OPD / Instansi *" value={form.opd} onChange={v=>set("opd",v)} options={DAFTAR_OPD} placeholder="-- Pilih OPD / Instansi --"/>
              <div className="form-group"><label className="form-label">Jabatan Terakhir</label><input className="form-control" value={form.jabatan} onChange={e=>set("jabatan",e.target.value)}/></div>
            </div>
            <SearchableSelect label="Pangkat / Golongan" value={form.pangkat} onChange={v=>set("pangkat",v)} options={DAFTAR_PANGKAT} placeholder="-- Pilih Pangkat / Golongan --"/>
            <div className="form-group">
              <label className="form-label">Kasubid Pembayaran *</label>
              <select className="form-control" value={form.kasubid} onChange={e=>set("kasubid",e.target.value)}>
                {DAFTAR_KASUBID.map((k,i)=><option key={i} value={k}>{k}</option>)}
              </select>
              <div style={{marginTop:6,padding:"6px 10px",background:"var(--surface-container-low)",borderRadius:8,fontSize:11,color:"var(--on-surface-variant)",fontFamily:"var(--mono)"}}>Kode: {KODE_KASUBID[form.kasubid]}</div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Keperluan SKPP</label>
                <select className="form-control" value={form.alasan} onChange={e=>set("alasan",e.target.value)}>
                  {DAFTAR_KEPERLUAN.map(k=><option key={k}>{k}</option>)}
                </select>
                <div style={{marginTop:6,padding:"6px 10px",background:"var(--surface-container-low)",borderRadius:8,fontSize:11,color:"var(--on-surface-variant)",fontFamily:"var(--mono)"}}>Kode: {KODE_ALASAN[form.alasan]||"—"}</div>
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

        {mode==="bulk" && (<>
          <div className="modal-body">
            <div className="alert alert-blue" style={{marginBottom:16}}>
              <span>📦</span>
              <div style={{fontSize:12}}><strong>Mode Bulk — Pengajuan dari Bendahara OPD.</strong> Isi data umum OPD di atas, lalu tambahkan daftar pegawai di bawah. Semua pengajuan akan mendapatkan <strong>satu kode akses bersama</strong>.</div>
            </div>
            <div style={{background:"var(--surface-container-low)",borderRadius:12,padding:"14px 16px",marginBottom:18,border:"1.5px solid var(--outline-variant)"}}>
              <div style={{fontWeight:700,fontSize:11,color:"var(--on-surface-variant)",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.07em"}}>Data Bersama Seluruh Pengajuan</div>
              <div className="grid-2">
                <SearchableSelect label="OPD / Instansi Pengirim *" value={bulkOPD} onChange={v=>setBulkOPD(v)} options={DAFTAR_OPD} placeholder="-- Pilih OPD --"/>
                <div className="form-group">
                  <label className="form-label">Kasubid Pembayaran *</label>
                  <select className="form-control" value={bulkKasubid} onChange={e=>setBulkKasubid(e.target.value)}>
                    {DAFTAR_KASUBID.map((k,i)=><option key={i} value={k}>{k}</option>)}
                  </select>
                  <div style={{marginTop:5,padding:"5px 10px",background:"white",borderRadius:8,fontSize:11,color:"var(--on-surface-variant)",fontFamily:"var(--mono)"}}>Kode: {KODE_KASUBID[bulkKasubid]}</div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:11,color:"var(--on-surface-variant)",textTransform:"uppercase",letterSpacing:"0.07em"}}>
                Daftar Pegawai <span style={{background:"var(--primary)",color:"white",borderRadius:999,padding:"2px 8px",fontSize:11,fontWeight:800,marginLeft:6}}>{items.length}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={addItem}>+ Tambah Baris</button>
            </div>
            <div style={{overflowX:"auto",border:"1.5px solid var(--outline-variant)",borderRadius:12}}>
              <table style={{width:"100%",tableLayout:"fixed"}}>
                <colgroup>
                  <col style={{width:"3%"}}/><col style={{width:"22%"}}/><col style={{width:"18%"}}/>
                  <col style={{width:"17%"}}/><col style={{width:"18%"}}/><col style={{width:"13%"}}/>
                  <col style={{width:"5%"}}/><col style={{width:"4%"}}/>
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
                  {items.map((it,idx)=>(
                    <tr key={it._id} style={{background:idx%2===0?"white":"var(--surface-container-low)"}}>
                      <td style={{textAlign:"center",color:"var(--outline)",fontSize:12,fontWeight:700,padding:"8px 6px"}}>{idx+1}</td>
                      <td style={{padding:"6px 8px"}}><input className="form-control" style={{marginBottom:0,border:"1px solid var(--outline-variant)",width:"100%",minWidth:0,fontSize:12}} value={it.nama} onChange={e=>setItem(idx,"nama",e.target.value)} placeholder="Nama sesuai SK"/></td>
                      <td style={{padding:"6px 8px"}}><input className="form-control" style={{marginBottom:0,fontFamily:"var(--mono)",fontSize:11,border:"1px solid var(--outline-variant)",width:"100%",minWidth:0}} value={it.nip} onChange={e=>setItem(idx,"nip",e.target.value)} placeholder="18 digit"/></td>
                      <td style={{padding:"6px 8px"}}><input className="form-control" style={{marginBottom:0,border:"1px solid var(--outline-variant)",width:"100%",minWidth:0,fontSize:12}} value={it.jabatan} onChange={e=>setItem(idx,"jabatan",e.target.value)} placeholder="Jabatan"/></td>
                      <td style={{padding:"6px 8px"}}>
                        <select className="form-control" style={{marginBottom:0,fontSize:11,border:"1px solid var(--outline-variant)",width:"100%",minWidth:0,paddingRight:4}} value={it.pangkat} onChange={e=>setItem(idx,"pangkat",e.target.value)}>
                          <option value="">-- Pangkat --</option>
                          {DAFTAR_PANGKAT.map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"6px 8px"}}>
                        <select className="form-control" style={{marginBottom:0,fontSize:11,border:"1px solid var(--outline-variant)",width:"100%",minWidth:0,paddingRight:4}} value={it.alasan} onChange={e=>setItem(idx,"alasan",e.target.value)}>
                          {DAFTAR_KEPERLUAN.map(k=><option key={k} value={k}>{k}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"6px 8px",textAlign:"center"}}>
                        <select className="form-control" style={{marginBottom:0,fontSize:12,border:"1px solid var(--outline-variant)",width:"100%",minWidth:0,textAlign:"center",paddingLeft:4,paddingRight:4}} value={it.jalur} onChange={e=>setItem(idx,"jalur",e.target.value)}>
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                      </td>
                      <td style={{padding:"6px 6px"}}>
                        <div style={{display:"flex",gap:3,justifyContent:"center"}}>
                          <button title="Duplikat baris ini" onClick={()=>duplicateItem(idx)} style={{padding:"4px 6px",border:"1px solid var(--outline-variant)",borderRadius:6,background:"white",cursor:"pointer",fontSize:12,lineHeight:1}}>⧉</button>
                          {items.length>1 && <button title="Hapus baris ini" onClick={()=>removeItem(idx)} style={{padding:"4px 6px",border:"1px solid #fca5a5",borderRadius:6,background:"var(--error-container)",cursor:"pointer",color:"var(--error)",fontSize:12,lineHeight:1}}>✕</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:14,padding:"12px 18px",background:"linear-gradient(135deg,var(--primary) 0%,var(--primary-container) 100%)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>Total Pengajuan Bulk</div>
                <div style={{color:"var(--secondary-container)",fontFamily:"var(--mono)",fontSize:24,fontWeight:800}}>{items.length} <span style={{fontSize:13,fontWeight:400,color:"rgba(255,255,255,.6)"}}>SKPP</span></div>
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
              {saving?"⟳ Menyimpan...":`📦 Simpan ${items.length} Pengajuan Bulk`}
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── PAGE DASHBOARD ───────────────────────────────────────────────────────────
function PageDashboard({ data, loading }) {
  const s = {
    total:   data.length,
    proses:  data.filter(d => !(d.status==="selesai"||getProgress(d)===100) && d.status!=="kembali").length,
    selesai: data.filter(d => d.status==="selesai"||getProgress(d)===100).length,
    kembali: data.filter(d => d.status==="kembali").length,
  };
  const bulanIni = data.filter(d => {
    const dt=new Date(d.tanggalMasuk); const n=new Date();
    return dt.getMonth()===n.getMonth() && dt.getFullYear()===n.getFullYear();
  }).length;
  const byOPD  = data.reduce((acc,p)=>{ acc[p.opd]=(acc[p.opd]||0)+1; return acc; }, {});
  const topOPD = Object.entries(byOPD).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const pctSelesai = s.total ? Math.round((s.selesai/s.total)*100) : 0;

  const statCards = [
    { label:"Total Pengajuan", val:s.total,   color:"var(--primary)",         bg:"var(--primary-fixed)",     icon:"📋" },
    { label:"Sedang Diproses", val:s.proses,  color:"var(--primary-container)",bg:"#dbeafe",                  icon:"⟳" },
    { label:"Selesai",         val:s.selesai, color:"var(--success)",          bg:"var(--success-pale)",       icon:"✓" },
    { label:"Dikembalikan",    val:s.kembali, color:"#92400e",                 bg:"var(--secondary-fixed)",    icon:"↩" },
  ];

  return (
    <div>
      {/* Hero gradient card */}
      <div className="hero-card" style={{marginBottom:20}}>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",opacity:0.6,marginBottom:8}}>Ringkasan Sistem — SKPP Tracker</div>
              <div style={{fontSize:40,fontWeight:800,letterSpacing:"-2px",lineHeight:1}}>{loading?"—":s.total}</div>
              <div style={{fontSize:13,opacity:0.7,marginTop:6}}>Total pengajuan terdaftar dalam sistem</div>
            </div>
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              {[
                { label:"Selesai", val:s.selesai, color:"#86efac" },
                { label:"Diproses", val:s.proses, color:"#93c5fd" },
                { label:"Dikembalikan", val:s.kembali, color:"var(--secondary-container)" },
              ].map(st=>(
                <div key={st.label} style={{textAlign:"center"}}>
                  <div style={{fontSize:26,fontWeight:800,letterSpacing:"-1px",color:st.color}}>{loading?"—":st.val}</div>
                  <div style={{fontSize:11,opacity:0.6,marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{st.label}</div>
                </div>
              ))}
            </div>
          </div>
          {s.total>0 && (
            <div style={{marginTop:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,opacity:0.6,fontWeight:600}}>Tingkat Penyelesaian</span>
                <span style={{fontSize:12,fontWeight:700,color:"#86efac",fontFamily:"var(--mono)"}}>{pctSelesai}%</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:999,height:8,overflow:"hidden"}}>
                <div style={{width:`${pctSelesai}%`,height:"100%",background:"#86efac",borderRadius:999,transition:"width .6s ease"}}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {statCards.map(st=>(
          <div key={st.label} className="stat-card">
            <div className="stat-icon" style={{background:st.bg}}>{st.icon}</div>
            <div>
              <div className="stat-num" style={{color:st.color}}>{loading?"—":st.val}</div>
              <div className="stat-label">{st.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid-2" style={{gap:16}}>
        {/* Pengajuan bulan ini */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">Pengajuan Bulan Ini</div>
            <span className="chip chip-blue" style={{fontSize:11}}>
              {new Date().toLocaleString("id-ID",{month:"long",year:"numeric"})}
            </span>
          </div>
          <div className="card-body">
            <div style={{fontSize:48,fontWeight:900,color:"var(--primary)",letterSpacing:"-3px",lineHeight:1}}>{loading?"—":bulanIni}</div>
            <div style={{fontSize:12,color:"var(--on-surface-variant)",marginTop:6,marginBottom:20}}>Pengajuan baru diterima bulan ini</div>
            <div style={{borderTop:"1px solid var(--outline-variant)",paddingTop:16,display:"flex",flexDirection:"column",gap:10}}>
              {[
                ["Jalur A (tanpa pangkat pengabdian)", data.filter(d=>d.jalur==="A").length],
                ["Jalur B (ada pangkat pengabdian)",   data.filter(d=>d.jalur==="B").length],
              ].map(([label,val])=>(
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12.5,color:"var(--on-surface-variant)"}}>{label}</span>
                  <span style={{fontWeight:700,fontSize:13,color:"var(--on-surface)",fontFamily:"var(--mono)"}}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top OPD */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">Top OPD Pengajuan</div>
            <span className="chip" style={{fontSize:11}}>{topOPD.length} OPD aktif</span>
          </div>
          <div className="card-body" style={{padding:"16px 20px"}}>
            {loading ? (
              <div className="loading-box" style={{padding:32}}><div className="spinner"/></div>
            ) : topOPD.length===0 ? (
              <div style={{color:"var(--outline)",fontSize:13,textAlign:"center",padding:"24px 0"}}>Belum ada data</div>
            ) : topOPD.map(([opd,jml],i)=>{
              const pct = s.total ? Math.round((jml/s.total)*100) : 0;
              return (
                <div key={opd} style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                    <div style={{
                      width:22,height:22,borderRadius:"50%",
                      background:i===0?"var(--primary-fixed)":"var(--surface-container-low)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:11,fontWeight:700,color:i===0?"var(--primary)":"var(--outline)",flexShrink:0
                    }}>{i+1}</div>
                    <div style={{flex:1,fontSize:12.5,color:"var(--on-surface)",fontWeight:500,lineHeight:1.3}}>{opd}</div>
                    <span className="badge badge-blue" style={{fontSize:11}}>{jml}</span>
                  </div>
                  <div style={{marginLeft:32}}>
                    <div className="progress-wrap" style={{height:4}}>
                      <div className="progress-bar" style={{width:`${pct}%`,background:i===0?"var(--primary)":"var(--outline-variant)"}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warning banner */}
      {data.filter(d=>d.status==="kembali").length>0 && (
        <div className="alert alert-amber" style={{marginTop:16}}>
          <IcoAlert size={16}/>
          <div>
            <strong>Perlu Perhatian —</strong> Ada <strong>{data.filter(d=>d.status==="kembali").length} pengajuan</strong> dengan berkas yang dikembalikan. Segera koordinasi dengan OPD terkait.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE PENGAJUAN ───────────────────────────────────────────────────────────
function PagePengajuan({ data, loading, onRefresh, onDetail, onInputBaru, onExport, user }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterJalur, setFilterJalur] = useState("semua");
  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const ms = !q||p.id?.toLowerCase().includes(q)||p.nama?.toLowerCase().includes(q)||p.nip?.toString().includes(q)||p.opd?.toLowerCase().includes(q);
    const mf = filterStatus==="semua"||(filterStatus==="selesai"?(p.status==="selesai"||getProgress(p)===100):p.status===filterStatus);
    const mj = filterJalur==="semua"||p.jalur===filterJalur;
    return ms&&mf&&mj;
  });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="card-header-title">Daftar Pengajuan SKPP</div>
            <span className="chip chip-blue" style={{fontSize:11}}>{filtered.length} entri</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>onExport(filtered)} disabled={filtered.length===0} style={{gap:6}}>
              <IcoDownload size={14}/> Export CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading} style={{gap:6}}>
              <IcoRefresh size={14}/> Refresh
            </button>
            {user?.role!=="staf" && (
              <button className="btn btn-primary btn-sm" onClick={onInputBaru} style={{gap:6}}>
                <IcoPlus size={14}/> Input Baru
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{padding:"12px 20px",borderBottom:"1px solid var(--outline-variant)",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div className="search-wrap">
            <span className="search-icon"><IcoSearch size={15}/></span>
            <input className="search-input" placeholder="Cari nama, NIP, nomor, OPD..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="form-control" style={{width:"auto",fontSize:13,borderRadius:999,paddingLeft:14,paddingRight:14}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="semua">Semua Status</option>
            <option value="proses">Sedang Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="kembali">Dikembalikan</option>
          </select>
          <select className="form-control" style={{width:"auto",fontSize:13,borderRadius:999,paddingLeft:14,paddingRight:14}} value={filterJalur} onChange={e=>setFilterJalur(e.target.value)}>
            <option value="semua">Semua Jalur</option>
            <option value="A">Jalur A</option>
            <option value="B">Jalur B</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-box"><div className="spinner"/><span>Memuat data...</span></div>
        ) : (
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
                {filtered.map(p=>{
                  const prog = getProgress(p);
                  return (
                    <tr key={p.id} className="tr-clickable" onClick={()=>onDetail(p)}>
                      <td style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color:"var(--primary)"}}>{p.id}</td>
                      <td style={{fontWeight:600,maxWidth:180}}>{p.nama}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--outline)"}}>{p.nip}</td>
                      <td style={{fontSize:12,maxWidth:140,color:"var(--on-surface-variant)"}}>{p.opd}</td>
                      <td><span className="chip">{p.alasan}</span></td>
                      <td><span className={`chip ${p.jalur==="A"?"chip-blue":"chip-green"}`}>Jalur {p.jalur}</span></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div className="progress-wrap" style={{flex:1,height:6}}>
                            <div className="progress-bar" style={{width:`${prog}%`,background:prog===100?"var(--success)":p.status==="kembali"?"var(--warning)":"var(--primary)"}}/>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:"var(--outline)",minWidth:28,fontFamily:"var(--mono)"}}>{prog}%</span>
                        </div>
                      </td>
                      <td><SBadge p={p}/></td>
                      <td style={{fontSize:12,color:"var(--outline)",whiteSpace:"nowrap"}}>{p.tanggalMasuk}</td>
                    </tr>
                  );
                })}
                {filtered.length===0 && (
                  <tr><td colSpan={9}>
                    <div className="empty-box">
                      <div className="empty-icon">🔍</div>
                      <div className="empty-text">Tidak ada data ditemukan</div>
                      <div className="empty-sub">Coba ubah filter atau kata kunci pencarian</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE RIWAYAT ─────────────────────────────────────────────────────────────
function PageRiwayat({ data, loading, onDetail }) {
  const selesai = data.filter(d => d.status==="selesai"||getProgress(d)===100);
  const [search, setSearch] = useState("");
  const filtered = selesai.filter(p => {
    const q = search.toLowerCase();
    return !q||p.id?.toLowerCase().includes(q)||p.nama?.toLowerCase().includes(q)||p.nip?.toString().includes(q)||p.nomorSKPP?.toLowerCase().includes(q);
  });

  return (
    <div className="card">
      <div className="card-header">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="card-header-title">Riwayat & Arsip SKPP Selesai</div>
          <span className="chip chip-green" style={{fontSize:11}}>{filtered.length} dokumen</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={()=>exportCSV(filtered)} disabled={filtered.length===0} style={{gap:6}}>
          <IcoDownload size={14}/> Export CSV
        </button>
      </div>
      <div style={{padding:"12px 20px",borderBottom:"1px solid var(--outline-variant)"}}>
        <div className="search-wrap">
          <span className="search-icon"><IcoSearch size={15}/></span>
          <input className="search-input" placeholder="Cari nama, NIP, nomor pengajuan, atau nomor SKPP..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>
      {loading ? (
        <div className="loading-box"><div className="spinner"/><span>Memuat data...</span></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No. SKPP</th><th>No. Pengajuan</th><th>Nama PNS</th>
                <th>OPD</th><th>Keperluan</th><th>Tgl Masuk</th><th>Tgl Selesai</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} className="tr-clickable" onClick={()=>onDetail(p)}>
                  <td style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color:"var(--success)"}}>{p.nomorSKPP||"—"}</td>
                  <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--outline)"}}>{p.id}</td>
                  <td style={{fontWeight:600}}>{p.nama}</td>
                  <td style={{fontSize:12,color:"var(--on-surface-variant)"}}>{p.opd}</td>
                  <td><span className="chip">{p.alasan}</span></td>
                  <td style={{fontSize:12,color:"var(--outline)"}}>{p.tanggalMasuk}</td>
                  <td style={{fontSize:12,color:"var(--success)",fontWeight:600}}>{p.tanggalSelesai}</td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={7}>
                  <div className="empty-box">
                    <div className="empty-icon">📁</div>
                    <div className="empty-text">Belum ada SKPP yang selesai</div>
                    <div className="empty-sub">Data arsip akan muncul di sini setelah pengajuan selesai diproses</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PAGE USERS ───────────────────────────────────────────────────────────────
function PageUsers() {
  const [users, setUsers] = useState(AKUN_STAF);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username:"", password:"", nama:"", role:"staf", opd:"" });
  const [showPass, setShowPass] = useState({});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = () => {
    if(!form.username||!form.password||!form.nama) return alert("Semua field wajib diisi.");
    if(users.find(u=>u.username===form.username)) return alert("Username sudah digunakan.");
    setUsers(prev=>[...prev,{id:String(prev.length+1),...form}]);
    setForm({username:"",password:"",nama:"",role:"staf",opd:""});
    setShowForm(false);
  };
  const del = (id) => { if(confirm("Hapus akun ini?")) setUsers(prev=>prev.filter(u=>u.id!==id)); };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">Manajemen Akun Staf</div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowForm(true)} style={{gap:6}}><IcoPlus size={14}/> Tambah Staf</button>
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
                  {showPass[u.id]?u.password:"••••••••"}
                  <button className="btn btn-ghost btn-sm" style={{marginLeft:8,padding:"2px 7px"}} onClick={()=>setShowPass(p=>({...p,[u.id]:!p[u.id]}))}>
                    {showPass[u.id]?"🙈":"👁"}
                  </button>
                </td>
                <td><span className={`badge ${u.role==="admin"?"role-admin badge-purple":u.role==="operator"?"role-operator badge-gold":"role-staf badge-blue"}`}>{u.role}</span></td>
                <td style={{fontSize:12,color:"var(--on-surface-variant)"}}>{u.opd}</td>
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
              <div style={{fontWeight:800,fontSize:16,color:"var(--primary)",letterSpacing:"-0.4px"}}>Tambah Akun Staf Baru</div>
              <button className="modal-close" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Username *</label><input className="form-control" value={form.username} onChange={e=>set("username",e.target.value)} placeholder="Tanpa spasi"/></div>
                <div className="form-group"><label className="form-label">Password *</label><input className="form-control" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min. 6 karakter"/></div>
              </div>
              <div className="form-group"><label className="form-label">Nama Lengkap *</label><input className="form-control" value={form.nama} onChange={e=>set("nama",e.target.value)}/></div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={form.role} onChange={e=>set("role",e.target.value)}>
                    <option value="staf">Staf</option>
                    <option value="operator">Operator SIMgaji</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">OPD / Tugas</label><input className="form-control" value={form.opd} onChange={e=>set("opd",e.target.value)} placeholder="Pengampuh OPD..."/></div>
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
      if(res.ok) setData(res.data.map(norm));
      else setErrLoad(res.pesan||"Gagal memuat data.");
    } catch { setErrLoad("Gagal terhubung ke server."); }
    setLoading(false);
  }, []);

  useEffect(() => { if(user) load(); }, [user, load]);

  const handleInputBaru = async (formData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action:"inputBaru", data:formData });
      if(res.ok) {
        showToast(`✓ ${res.id} berhasil disimpan`);
        setShowInput(false);
        await load();
        setPage("pengajuan");
        if(res.kodeAkses) {
          setTimeout(() => {
            setKodeAksesModal({ id:res.id, kode:res.kodeAkses, isBulk:false, data:{...formData,id:res.id,tanggalMasuk:new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})} });
          }, 400);
        }
      } else alert("Gagal: "+res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const handleInputBulk = async (bulkData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action:"inputBulk", data:bulkData });
      if(res.ok) {
        showToast(`✓ ${res.jumlah} pengajuan bulk berhasil disimpan`);
        setShowInput(false);
        await load();
        setPage("pengajuan");
        if(res.kodeAkses) {
          setTimeout(() => {
            setKodeAksesModal({ isBulk:true, grupId:res.grupId, kode:res.kodeAkses, jumlah:res.jumlah, daftarId:res.daftarId, namaOPD:bulkData.namaOPD });
          }, 400);
        }
      } else alert("Gagal: "+res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const handleUpdate = async (updateData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action:"updateTahap", data:updateData });
      if(res.ok) {
        showToast(updateData.isKembali?"↩ Berkas dikembalikan":updateData.isResume?"✅ Proses berhasil dilanjutkan kembali":"✓ Tahap berhasil diperbarui");
        await load();
        if(updateData.nextStepId==="") {
          try {
            const tanggalSelesai = new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
            const mark = await apiPost({ action:"setSelesai", id:updateData.pengajuanId, tanggalSelesai });
            if(mark.ok) { showToast("✓ Pengajuan ditandai Selesai pada server"); await load(); }
          } catch(e) { console.warn("Gagal menandai selesai:",e); }
        }
        const refreshed = await apiGet({ action:"detail", id:updateData.pengajuanId });
        if(refreshed.ok) setSelected(norm(refreshed.data));
      } else alert("Gagal: "+res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const counts = { proses: data.filter(d=>d.status==="proses").length };

  const PAGE_TITLES = {
    dashboard: { title:"Dashboard",               sub:`Selamat datang, ${user?.nama||""}` },
    pengajuan: { title:"Daftar Pengajuan SKPP",   sub:"Kelola seluruh pengajuan SKPP" },
    input:     { title:"Input Pengajuan Baru",    sub:"Daftarkan pengajuan SKPP baru" },
    riwayat:   { title:"Riwayat & Arsip",         sub:"SKPP yang telah selesai diproses" },
    users:     { title:"Manajemen Staf",          sub:"Kelola akun dan hak akses staf" },
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
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}
      <div className="layout">
        <Sidebar user={user} active={page} onChange={setPage} counts={counts} onLogout={()=>setUser(null)}/>
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div>
              <div className="topbar-title">{PAGE_TITLES[page]?.title}</div>
              <div className="topbar-sub">{PAGE_TITLES[page]?.sub}</div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              {errLoad && (
                <div className="alert alert-red" style={{margin:0,padding:"6px 12px",fontSize:12}}>
                  <IcoAlert size={14}/><span>{errLoad}</span>
                  <button className="btn btn-secondary btn-sm" style={{marginLeft:8}} onClick={load}>Coba Lagi</button>
                </div>
              )}
              <div className="topbar-date">
                {new Date().toLocaleDateString("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="content">
            {page==="dashboard" && <PageDashboard data={data} loading={loading}/>}
            {page==="pengajuan" && <PagePengajuan data={data} loading={loading} onRefresh={load} onDetail={setSelected} onInputBaru={()=>setShowInput(true)} onExport={exportCSV} user={user}/>}
            {page==="input"     && <div className="card card-body"><PagePengajuan data={[]} loading={false} onRefresh={()=>{}} onDetail={()=>{}} onInputBaru={()=>setShowInput(true)} onExport={()=>{}} user={user}/></div>}
            {page==="riwayat"   && <PageRiwayat data={data} loading={loading} onDetail={setSelected}/>}
            {page==="users"     && user.role==="admin" && <PageUsers/>}
            {page==="users"     && user.role!=="admin" && (
              <div className="alert alert-red">
                <span>🚫</span><span>Anda tidak memiliki akses ke halaman ini. Hanya Admin yang dapat mengelola akun staf.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <DetailModal p={selected} onClose={()=>setSelected(null)} onUpdate={handleUpdate} saving={saving}
          onCetak={()=>cetakTandaTerima(selected)} user={user}/>
      )}

      {/* Input Modal */}
      {(showInput||page==="input") && (
        <InputBaru onClose={()=>{ setShowInput(false); if(page==="input") setPage("pengajuan"); }} onSave={handleInputBaru} onSaveBulk={handleInputBulk} saving={saving}/>
      )}

      {/* Kode Akses Modal */}
      {kodeAksesModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setKodeAksesModal(null);}}>
          <div className="modal" style={{maxWidth:520}}>
            <div className="modal-header">
              <div style={{fontWeight:800,fontSize:16,color:"var(--primary)",letterSpacing:"-0.4px"}}>
                {kodeAksesModal.isBulk?"📦 Pengajuan Bulk Berhasil Didaftarkan":"🎉 Pengajuan Berhasil Didaftarkan"}
              </div>
              <button className="modal-close" onClick={()=>setKodeAksesModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-green" style={{marginBottom:20}}>
                <IcoCheck size={16}/>
                <div>
                  {kodeAksesModal.isBulk
                    ? <><strong>{kodeAksesModal.jumlah} pengajuan</strong> dari <strong>{kodeAksesModal.namaOPD}</strong> berhasil disimpan.</>
                    : <><strong>{kodeAksesModal.id}</strong> berhasil disimpan ke sistem.</>
                  }
                </div>
              </div>

              <div style={{
                background:"linear-gradient(135deg,var(--primary) 0%,var(--primary-container) 100%)",
                borderRadius:16,padding:24,textAlign:"center",marginBottom:16
              }}>
                <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:10}}>
                  {kodeAksesModal.isBulk?"Kode Akses Bersama (1 Kode untuk Semua)":"Kode Akses Portal Pelacakan"}
                </div>
                <div style={{color:"var(--secondary-container)",fontFamily:"var(--mono)",fontSize:52,fontWeight:900,letterSpacing:14,lineHeight:1}}>
                  {kodeAksesModal.kode}
                </div>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:12}}>
                  {kodeAksesModal.isBulk
                    ? <>Grup: <span style={{color:"var(--secondary-container)",fontFamily:"var(--mono)"}}>{kodeAksesModal.grupId}</span></>
                    : <>Untuk pengajuan: <span style={{color:"var(--secondary-container)",fontFamily:"var(--mono)"}}>{kodeAksesModal.id}</span></>
                  }
                </div>
              </div>

              {kodeAksesModal.isBulk && kodeAksesModal.daftarId && (
                <div style={{background:"var(--surface-container-low)",border:"1px solid var(--outline-variant)",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--on-surface-variant)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Nomor Pengajuan Terdaftar</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {kodeAksesModal.daftarId.map(id=>(
                      <span key={id} style={{fontFamily:"var(--mono)",fontSize:11,background:"white",border:"1px solid var(--outline-variant)",borderRadius:6,padding:"3px 8px",color:"var(--primary)",fontWeight:700}}>{id}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="alert alert-amber">
                <IcoAlert size={16}/>
                <div style={{fontSize:12}}>
                  <strong>Serahkan kode ini kepada {kodeAksesModal.isBulk?"Bendahara OPD":"pemohon"}</strong> bersama tanda terima.
                  {kodeAksesModal.isBulk?" Satu kode ini dapat digunakan untuk memantau status semua SKPP sekaligus.":" Kode akses hanya ditampilkan sekali di sini."}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setKodeAksesModal(null)}>Tutup</button>
              {!kodeAksesModal.isBulk && (
                <button className="btn btn-primary" style={{gap:6}} onClick={()=>{cetakTandaTerima({...kodeAksesModal.data,kodeAkses:kodeAksesModal.kode});setKodeAksesModal(null);}}>
                  <IcoPrint size={14}/> Cetak Tanda Terima
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
