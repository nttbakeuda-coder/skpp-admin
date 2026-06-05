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

// Akun staf kini dikelola langsung dari sheet "Akun" via action daftarAkun/tambahAkun/hapusAkun/resetPassword.

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
function Ico({ children, size = 15 }) {
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
const IcoBell = () => <Ico><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ico>;
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
    --sidebar: 224px;
    --sidebar-collapsed: 60px;
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
     SIDEBAR — smooth collapsible
  ════════════════════════════════════════════ */
  .sidebar {
    width: var(--sidebar);
    background: var(--surface-container-lowest);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    border-right: 1px solid var(--outline-variant);
    padding: 10px 8px;
    overflow: hidden;           /* clip saat animasi */
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sidebar.collapsed {
    width: var(--sidebar-collapsed);
    padding: 10px 4px;
  }

  /* ── Header row ── */
  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    min-height: 34px;
    flex-shrink: 0;
  }

  /* Logo / tombol expand — selalu terlihat, lebar tetap */
  .sidebar-logo {
    width: 32px; height: 32px;
    min-width: 32px;
    background: transparent;
    border-radius: 9px;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 900; color: white;
    flex-shrink: 0;
    font-family: var(--font);
    cursor: default;
  }
  .sidebar-logo img { width: 100%; height: 100%; object-fit: contain; }

  /* Teks brand — fade in/out */
  .sidebar-brand-text {
    flex: 1;
    overflow: hidden;
    opacity: 1;
    max-width: 160px;
    transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .sidebar.collapsed .sidebar-brand-text {
    opacity: 0;
    max-width: 0;
  }
  .sidebar-brand-name {
    font-weight: 800; font-size: 13px; color: var(--primary);
    white-space: nowrap; letter-spacing: 0.2px; line-height: 1.2;
  }
  .sidebar-brand-sub {
    font-size: 8.5px; color: var(--on-surface-variant);
    margin-top: 1px; line-height: 1.25;
  }

  /* Tombol toggle — selalu terlihat */
  .btn-toggle {
    width: 26px; height: 26px; min-width: 26px;
    background: none; border: none; cursor: pointer;
    color: var(--on-surface-variant);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
    margin-left: auto;
  }
  .btn-toggle:hover { background: var(--surface-container-high); color: var(--primary); }

  /* Saat collapsed: tombol toggle pindah ke posisi logo (logo disembunyikan) */
  .sidebar.collapsed .sidebar-logo { display: none; }
  .sidebar.collapsed .btn-toggle   { margin-left: 0; }

  /* ── User card ── */
  .sidebar-user {
    background: var(--surface-container-low);
    border-radius: var(--r-md);
    padding: 10px 12px;
    border: 1px solid var(--outline-variant);
    margin-bottom: 10px;
    overflow: hidden;
    opacity: 1;
    max-height: 90px;
    transition: opacity 0.2s ease,
                max-height 0.3s cubic-bezier(0.4,0,0.2,1),
                padding 0.3s ease,
                margin 0.3s ease;
  }
  .sidebar.collapsed .sidebar-user {
    opacity: 0;
    max-height: 0;
    padding-top: 0; padding-bottom: 0;
    margin-bottom: 0;
    border-color: transparent;
  }
  .sidebar-user-name {
    font-weight: 700; font-size: 12.5px; color: var(--on-surface);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    line-height: 1.3; letter-spacing: -0.2px;
  }
  .sidebar-user-role-label {
    font-size: 10.5px; color: var(--on-surface-variant); margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* ── Nav section label ── */
  .nav-section {
    font-size: 9px; font-weight: 700; color: var(--outline);
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 7px 6px 3px;
    white-space: nowrap;
    overflow: hidden;
    opacity: 1;
    max-height: 28px;
    transition: opacity 0.15s ease, max-height 0.3s ease, padding 0.3s ease;
  }
  .sidebar.collapsed .nav-section {
    opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0;
  }

  /* ── Nav ── */
  .sidebar-nav { display: flex; flex-direction: column; gap: 1px; flex: 1; }

  .nav-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; height: 36px;
    padding: 0 7px;
    border-radius: var(--r-md);
    cursor: pointer;
    transition: background 0.15s, color 0.15s,
                border-radius 0.3s, justify-content 0.15s;
    color: var(--on-surface-variant);
    position: relative;
    border-left: 3px solid transparent;
    font-size: 12.5px; font-weight: 500;
    white-space: nowrap;
  }
  .nav-item:hover { background: var(--surface-container-low); color: var(--on-surface); }
  .nav-item.active {
    background: var(--primary-fixed); color: var(--primary);
    border-left-color: var(--primary); font-weight: 600;
  }

  /* Saat collapsed: item jadi bulat terpusat */
  .sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 0;
    border-left-color: transparent;
    border-radius: 14px;
  }
  .sidebar.collapsed .nav-item.active {
    border-left: 3px solid var(--primary);
  }

  /* Tooltip — hanya muncul saat collapsed */
  .nav-item::after {
    content: attr(data-tip);
    position: absolute;
    left: calc(100% + 10px);
    top: 50%; transform: translateY(-50%);
    background: var(--inverse-surface);
    color: var(--inverse-on-surface);
    padding: 5px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 9999;
  }
  .sidebar.collapsed .nav-item:hover::after { opacity: 1; }

  .nav-item .ni {
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; width: 16px;
  }
  /* Label teks nav — fade out saat collapsed */
  .nav-label {
    flex: 1; overflow: hidden; text-overflow: ellipsis;
    opacity: 1; max-width: 180px;
    transition: opacity 0.15s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .sidebar.collapsed .nav-label { opacity: 0; max-width: 0; }

  .nav-badge {
    margin-left: auto; flex-shrink: 0;
    background: var(--error); color: white;
    font-size: 10px; font-weight: 700;
    padding: 2px 7px; border-radius: var(--r-full);
    min-width: 20px; text-align: center;
    transition: opacity 0.15s, position 0.15s;
  }
  /* Badge: di pojok saat collapsed */
  .sidebar.collapsed .nav-badge {
    position: absolute; top: 7px; right: 5px;
    margin-left: 0; padding: 1px 5px;
    font-size: 9px; min-width: 16px; line-height: 14px;
  }

  /* ── Footer ── */
  .sidebar-footer {
    display: flex; flex-direction: column; gap: 3px;
    border-top: 1px solid var(--outline-variant);
    padding-top: 8px; margin-top: 6px;
    flex-shrink: 0;
  }
  .logout-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 7px;
    background: none; border: none; border-radius: var(--r-md);
    color: var(--on-surface-variant);
    font-family: var(--font); font-size: 12.5px; font-weight: 600;
    cursor: pointer; transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .logout-btn:hover { background: var(--error-container); color: var(--error); }
  .sidebar.collapsed .logout-btn { justify-content: center; padding: 10px 0; }
  .logout-label {
    opacity: 1; max-width: 180px;
    transition: opacity 0.15s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
  }
  .sidebar.collapsed .logout-label { opacity: 0; max-width: 0; }



  /* ════════════════════════════════════════════
     MAIN CONTENT
  ════════════════════════════════════════════ */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .topbar {
    background: rgba(249,249,252,0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--outline-variant);
    padding: 0 24px;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .topbar-title {
    font-weight: 700;
    font-size: 15px;
    color: var(--on-surface);
    letter-spacing: -0.4px;
    line-height: 1.2;
  }
  .topbar-sub {
    font-size: 11px;
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

  /* ── Topbar kiri: identitas instansi ── */
  .topbar-instansi {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .topbar-instansi-name {
    font-size: 12.5px;
    font-weight: 800;
    color: var(--primary);
    letter-spacing: -0.3px;
    line-height: 1.2;
    white-space: nowrap;
  }
  .topbar-instansi-sub {
    font-size: 10px;
    color: var(--on-surface-variant);
    font-weight: 500;
    margin-top: 1px;
    white-space: nowrap;
  }

  /* ── Ticker motivasi — credit scroll kanan ke kiri ── */
  .ticker-wrap {
    width: 350px !important; /* Kunci lebar wadah */
    flex: none !important; /* Cegah wadah membesar/mengecil */
    display: flex;
    align-items: center;
    justify-content: flex-start; /* Rata kiri agar sapaan diam di sebelah kiri wadah */
    gap: 10px;
    overflow: hidden;
    position: relative;
    margin-right: 16px;
  }
  .ticker-greeting {
    font-size: 12px;
    font-weight: 700;
    color: var(--primary);
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: -0.2px;
  }
  .ticker-divider {
    width: 1px;
    height: 14px;
    background: var(--outline-variant);
    flex-shrink: 0;
  }
  .ticker-text-clip {
    flex: 1;
    overflow: hidden;
    position: relative;
    height: 20px;
    display: flex;
    align-items: center;
    min-width: 0;
    /* fade tepi kiri dan kanan */
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
  }
  .ticker-text {
    display: inline-block;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 400;
    color: var(--on-surface-variant);
    line-height: 1;
    will-change: transform;
    position: relative;
  }
  /* scroll masuk dari kanan */
  @keyframes tickerSlideIn {
    0%   { transform: translateX(100%); opacity: 0; }
    8%   { opacity: 1; }
    100% { transform: translateX(-110%); opacity: 0; }
  }
  /* berhenti di tengah dulu, baru keluar ke kiri */
  @keyframes tickerScrollCredit {
    0%   { transform: translateX(100%); opacity: 0; }
    2%   { opacity: 1; }
    98%  { opacity: 1; }
    100% { transform: translateX(-100%); opacity: 0; }
  }
  
  .ticker-text.animating {
    animation: tickerScrollCredit 8s linear forwards; 
  }
  .topbar-actions {
    display: flex; align-items: center; gap: 12px; justify-content: flex-end;
    min-width: 0;
  }
  /* --- Logo Pemprov NTT di kanan atas --- */
  /* Hanya tombol PEMICU logo yang dibuat transparan, JANGAN popup-nya.
     (Selektor lama [class*="profile"] tak sengaja menarget .profile-popup
      sehingga popup ikut transparan.) */
  .topbar-logo-btn {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
  }
  .topbar-logo-btn img {
    width: 35px !important;
    height: 35px !important;
    background: transparent !important;
    border-radius: 0 !important;
    border: none !important;
    box-shadow: none !important;
    object-fit: contain !important;
  }
  /* Profile popup */
  .profile-popup {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 220px;
    background: var(--surface-container-lowest);
    border: 1px solid var(--outline-variant);
    border-radius: var(--r);
    box-shadow: var(--shadow-2);
    z-index: 1000;
    overflow: hidden;
  }
  .profile-popup-header {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--outline-variant);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .profile-popup-avatar {
    width: 40px; height: 40px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
  }
  .profile-popup-avatar img {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .profile-popup-name { font-size: 12px; font-weight: 700; color: var(--on-surface); line-height: 1.3; }
  .profile-popup-role { font-size: 10px; color: var(--on-surface-variant); margin-top: 2px; }
  .profile-popup-section { padding: 8px 6px; }
  .profile-popup-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px;
    border-radius: var(--r-md);
    font-size: 12.5px; font-weight: 500;
    color: var(--on-surface-variant);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .profile-popup-item:hover { background: var(--surface-container-low); color: var(--on-surface); }
  .profile-popup-item.danger:hover { background: var(--error-container); color: var(--error); }
  .profile-popup-opd {
    padding: 8px 16px 10px;
    border-top: 1px solid var(--outline-variant);
    font-size: 10px; color: var(--on-surface-variant);
  }
  .profile-popup-opd strong { display: block; color: var(--on-surface); font-size: 11px; font-weight: 600; margin-bottom: 1px; }
  .notif-popup {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 300px;
    background: var(--surface-container-lowest);
    border: 1px solid var(--outline-variant);
    border-radius: var(--r);
    box-shadow: var(--shadow-2);
    z-index: 1000;
    overflow: hidden;
  }
  .notif-popup-header {
    padding: 12px 14px;
    border-bottom: 1px solid var(--outline-variant);
    font-weight: 700; font-size: 13px; color: var(--on-surface);
  }
  .notif-item {
    padding: 11px 14px;
    border-bottom: 1px solid var(--surface-container-low);
    font-size: 12px; color: var(--on-surface-variant);
    cursor: pointer; transition: background 0.15s;
  }
  .notif-item:hover { background: var(--surface-container-low); }
  .notif-item-title { font-weight: 600; color: var(--on-surface); font-size: 12px; margin-bottom: 2px; }
  .notif-item-sub { font-size: 11px; color: var(--on-surface-variant); }
  .notif-empty { padding: 24px 14px; text-align: center; font-size: 12px; color: var(--outline); }
  .topbar-search {
    position: relative; display: flex; align-items: center;
  }
  .topbar-search-input {
    height: 32px;
    padding: 0 12px 0 34px;
    width: 200px;
    border-radius: var(--r-full);
    border: 1.5px solid var(--outline-variant);
    background: var(--surface-container-lowest);
    font-family: var(--font);
    font-size: 12px;
    color: var(--on-surface);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .topbar-search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,50,125,.08); }
  .topbar-search-icon {
    position: absolute; left: 10px; color: var(--outline);
    display: flex; align-items: center;
  }
  .notif-btn {
    position: relative;
    width: 32px; height: 32px;
    background: none; border: none; cursor: pointer;
    color: var(--on-surface-variant);
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    transition: all .15s;
  }
  .notif-btn:hover { background: var(--surface-container); color: var(--primary); }
  .notif-dot {
    position: absolute; top: 6px; right: 6px;
    width: 6px; height: 6px;
    background: var(--primary);
    border-radius: 50%;
    border: 2px solid var(--surface-container-lowest);
  }
  .avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: var(--primary-fixed);
    color: var(--primary);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 11px;
    cursor: pointer;
    box-shadow: var(--shadow-1);
    flex-shrink: 0;
  }

  /* ── Halaman Profil ── */
  .profil-row {
    display: grid;
    grid-template-columns: 280px 1fr;
    align-items: center;
    gap: 16px;
    padding: 16px 4px;
    border-bottom: 1px solid var(--outline-variant);
  }
  .profil-row:last-of-type { border-bottom: none; }
  .profil-row-label {
    display: flex; align-items: center; gap: 9px;
    font-size: 13px; font-weight: 500;
    color: var(--on-surface-variant);
  }
  .profil-row-label svg { color: var(--outline); flex-shrink: 0; }
  .profil-section-title {
    font-size: 14px; font-weight: 800; color: var(--primary);
    letter-spacing: -0.3px; margin-bottom: 2px;
  }
  @media (max-width: 720px) {
    .profil-row { grid-template-columns: 1fr; gap: 6px; align-items: start; }
  }

  .content { flex: 1; overflow-y: auto; padding: 20px 24px; }

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
    padding: 13px 18px;
    border-bottom: 1px solid var(--outline-variant);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    background: var(--surface-container-lowest);
  }
  .card-header-title {
    font-weight: 700;
    font-size: 13px;
    color: var(--on-surface);
    letter-spacing: -0.2px;
  }
  .card-body { padding: 18px; }

  /* ════════════════════════════════════════════
     STAT GRID  (4-column dashboard)
  ════════════════════════════════════════════ */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 14px;
  }
  .stat-card {
    background: var(--surface-container-lowest);
    border-radius: var(--r);
    padding: 14px 16px;
    border: 1px solid var(--outline-variant);
    box-shadow: var(--shadow-card);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .stat-card:hover {
    box-shadow: var(--shadow-2);
    transform: translateY(-1px);
  }
  .stat-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    flex-shrink: 0;
  }
  .stat-num {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1;
  }
  .stat-label {
    font-size: 10px;
    color: var(--on-surface-variant);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 3px;
  }

  /* Hero gradient card */
  .hero-card {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 60%, #1a4db3 100%);
    border-radius: 20px;
    padding: 22px;
    color: white;
    position: relative;
    overflow: hidden;
    height: 280px;
    display: flex;
    flex-direction: column;
  }
  .hero-card::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
    filter: blur(40px);
  }
  .hero-card::after {
    content: '';
    position: absolute;
    bottom: -60px; right: 80px;
    width: 220px; height: 220px;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
    filter: blur(60px);
  }

  /* Radial progress ring */
  .radial-wrap {
    position: relative; width: 110px; height: 110px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
  }
  .radial-inner {
    position: absolute;
    background: white;
    border-radius: 50%;
    width: 86px; height: 86px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .radial-pct { font-size: 20px; font-weight: 800; color: var(--primary); letter-spacing: -1px; line-height: 1; }
  .radial-lbl { font-size: 8px; font-weight: 700; color: var(--outline); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

  /* Dashboard 3-column grid */
  .dash-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
    margin-bottom: 16px;
    align-items: start;
  }
  .dash-stacked { display: flex; flex-direction: column; gap: 10px; }
  .stat-card-v2 {
    background: var(--surface-container-lowest);
    border-radius: 18px;
    padding: 16px;
    border: 1px solid var(--outline-variant);
    box-shadow: var(--shadow-card);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 76px;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .stat-card-v2:hover { box-shadow: var(--shadow-2); transform: translateY(-1px); }
  .stat-v2-num {
    font-size: 26px; font-weight: 800; color: var(--on-surface);
    letter-spacing: -1.5px; line-height: 1;
  }
  .stat-v2-label {
    font-size: 9px; font-weight: 700; color: var(--on-surface-variant);
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
  }
  .stat-mini-chart { width: 56px; height: 28px; opacity: 0.25; }

  /* Top OPD card */
  .opd-card {
    background: var(--surface-container-lowest);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid var(--outline-variant);
    box-shadow: var(--shadow-card);
    height: 280px;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .opd-rank {
    width: 24px; height: 24px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
    flex-shrink: 0;
  }
  .opd-rank.first { background: rgba(0,50,125,0.1); color: var(--primary); }
  .opd-rank.other { background: var(--surface-container-high); color: var(--on-surface-variant); }

  /* Welcome area */
  .welcome-area { margin-bottom: 18px; }
  .welcome-greeting { font-size: 12px; color: var(--on-surface-variant); font-weight: 500; margin-bottom: 2px; }
  .welcome-name { font-size: 22px; font-weight: 800; color: var(--on-surface); letter-spacing: -1px; line-height: 1.15; }

  /* Terbaru table card */
  .terbaru-card {
    background: var(--surface-container-lowest);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--outline-variant);
    box-shadow: var(--shadow-card);
    margin-top: 16px;
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
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--r-md);
    font-family: var(--font);
    font-size: 12.5px;
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
  .btn-sm { padding: 5px 10px; font-size: 11.5px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ════════════════════════════════════════════
     TABLE
  ════════════════════════════════════════════ */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th {
    background: var(--surface-container-low);
    padding: 9px 13px;
    text-align: left;
    font-weight: 700;
    color: var(--on-surface-variant);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    border-bottom: 1.5px solid var(--outline-variant);
    white-space: nowrap;
  }
  td {
    padding: 11px 13px;
    border-bottom: 1px solid var(--outline-variant);
    color: var(--on-surface);
    vertical-align: middle;
  }
  .tr-clickable:hover td { background: var(--surface-container-low); cursor: pointer; }
  .tr-selected td { background: var(--primary-fixed) !important; }

  /* ════════════════════════════════════════════
     FORM CONTROLS
  ════════════════════════════════════════════ */
  .form-group { margin-bottom: 13px; }
  .form-label {
    display: block;
    font-size: 10.5px;
    font-weight: 700;
    color: var(--on-surface-variant);
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1.5px solid var(--outline-variant);
    border-radius: var(--r-md);
    font-family: var(--font);
    font-size: 13px;
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
    padding: 24px;
    overflow-y: auto;
  }
  .modal {
    background: var(--surface-container-lowest);
    border-radius: var(--r-lg);
    width: 100%;
    max-width: 680px;
    box-shadow: var(--shadow-modal);
    margin: auto;
    animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid var(--outline-variant);
  }
  .modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--outline-variant);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
  }
  .modal-body {
    padding: 16px 20px;
    max-height: 68vh;
    overflow-y: auto;
  }
  .modal-footer {
    padding: 12px 20px;
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
    margin-bottom: 16px;
  }
  .tab {
    padding: 8px 14px;
    font-size: 12.5px; font-weight: 600;
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
  .timeline-item { display: flex; gap: 12px; position: relative; }
  .timeline-item:not(:last-child) { padding-bottom: 16px; }
  .timeline-left { display: flex; flex-direction: column; align-items: center; width: 32px; flex-shrink: 0; }
  .t-dot {
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    border: 2px solid transparent;
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
    padding: 10px 13px;
    border-radius: var(--r-md);
    font-size: 12.5px;
    display: flex; gap: 10px; align-items: flex-start;
    margin-bottom: 13px;
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
    width: 380px;
    max-width: calc(100vw - 32px);
    padding: 32px;
    box-shadow: 0px 24px 72px rgba(0,0,0,0.35), 0px 4px 16px rgba(0,0,0,0.12);
    position: relative;
    z-index: 1;
  }
  .login-logo-wrap {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px;
  }
  .login-logo {
    width: 54px; height: 54px;
    background: transparent;
    border-radius: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: none;
    flex-shrink: 0;
    color: var(--primary);
    overflow: hidden;
  }
  .login-logo img { width: 100%; height: 100%; object-fit: contain; }
  .login-brand-text {}
  .login-brand-name {
    font-weight: 800;
    font-size: 17px;
    color: var(--primary);
    letter-spacing: -0.5px;
    line-height: 1.2;
  }
  .login-brand-sub {
    font-size: 11px;
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
    width: 22px; height: 22px;
    border: 2.5px solid var(--surface-container-high);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin: 0 auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-box {
    display: flex; flex-direction: column; align-items: center;
    gap: 10px; padding: 40px;
    color: var(--on-surface-variant); font-size: 13px;
  }
  .empty-box { text-align: center; padding: 36px; color: var(--on-surface-variant); }
  .empty-icon { font-size: 36px; margin-bottom: 10px; }
  .empty-text { font-size: 13px; font-weight: 700; color: var(--on-surface); }
  .empty-sub  { font-size: 12px; margin-top: 4px; color: var(--on-surface-variant); }

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

// ─── TICKER MOTIVASI ─────────────────────────────────────────────────────────
const MOTIVASI_LIST = [
  "Kerja keras hari ini adalah investasi terbaik untuk masa depan.",
  "Setiap pelayanan tulus adalah cahaya bagi masyarakat NTT.",
  "Integritas dan dedikasi adalah fondasi birokrasi yang kuat.",
  "Satu langkah kecil dalam pelayanan berdampak besar bagi rakyat.",
  "Profesionalisme kita menentukan kepercayaan publik kepada pemerintah.",
];

function getSapaan() {
  const jam = new Date().getHours();
  if (jam >= 5  && jam < 11) return "Selamat Pagi";
  if (jam >= 11 && jam < 15) return "Selamat Siang";
  if (jam >= 15 && jam < 19) return "Selamat Sore";
  return "Selamat Malam";
}

function TickerMotivasi() {
  const [idx, setIdx]       = useState(0);
  const [key, setKey]       = useState(0);   // force re-mount animasi
  const [text, setText]     = useState(MOTIVASI_LIST[0]);
  const timerRef            = useRef(null);
  const sapaan              = getSapaan();

  // Durasi 1 siklus animasi CSS = 8s; setelah selesai ganti teks
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const nxt = (idx + 1) % MOTIVASI_LIST.length;
      setIdx(nxt);
      setText(MOTIVASI_LIST[nxt]);
      setKey(k => k + 1);
    }, 8200);
    return () => clearTimeout(timerRef.current);
  }, [key]);

  return (
    <div className="ticker-wrap">
      <span className="ticker-greeting">{sapaan} 👋</span>
      <span className="ticker-divider"/>
      <div className="ticker-text-clip">
        <span key={key} className="ticker-text animating">{text}</span>
      </div>
    </div>
  );
}

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
            <img
              src="/logo-sipasti.png"
              alt="SI-PASTI"
              onError={e=>{e.target.style.display="none";e.target.parentElement.appendChild(Object.assign(document.createElement("span"),{textContent:"SP"}));}}
            />
          </div>
          <div className="login-brand-text">
            <div className="login-brand-name">SI-PASTI</div>
            <div className="login-brand-sub">Sistem Pemantauan Alur SKPP Terintegrasi</div>
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
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { id:"dashboard", icon:<IcoDashboard/>, label:"Dashboard" },
    { id:"pengajuan", icon:<IcoList/>,      label:"Daftar Pengajuan", badge: counts.proses },
    { id:"input",     icon:<IcoPlus/>,      label:"Input Pengajuan Baru" },
    { id:"riwayat",   icon:<IcoClock/>,     label:"Riwayat & Arsip" },
  ];
  const adminItems = [
    { id:"users", icon:<IcoUsers/>, label:"Manajemen Staf" },
  ];

  const initials = user?.nama
    ? user.nama.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()
    : "S";
  const roleLabel = user.role==="admin" ? "Admin" : user.role==="operator" ? "Staf Loket" : "Staf Pengampuh OPD";
  const roleClass = user.role==="admin" ? "badge-purple" : user.role==="operator" ? "badge-gold" : "badge-blue";

  return (
    <div className={`sidebar${collapsed ? " collapsed" : ""}`}>

      {/* ── Header ── */}
      <div className="sidebar-header">
        {/* Logo SI-PASTI (fallback ke inisial bila gambar tak ada) */}
        <div className="sidebar-logo">
          <img
            src="/logo-sipasti.png"
            alt="SI-PASTI"
            onError={e=>{
              const p=e.target.parentElement;
              p.style.background="linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)";
              p.style.boxShadow="0 3px 10px rgba(0,50,125,0.3)";
              p.textContent=initials;
            }}
          />
        </div>

        {/* Teks brand (fade out saat collapsed) */}
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">SI-PASTI</div>
          <div className="sidebar-brand-sub">Sistem Pemantauan Alur SKPP Terintegrasi</div>
        </div>

        {/* Tombol toggle — selalu terlihat, menggantikan logo saat collapsed */}
        <button
          className="btn-toggle"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Perluas menu" : "Ciutkan menu"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{transition:"transform 0.3s", transform: collapsed ? "rotate(180deg)" : "rotate(0deg)"}}>
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M9 3v18"/>
          </svg>
        </button>
      </div>

      {/* ── User card (collapse via max-height) ── */}
      <div className="sidebar-user">
        <div className="sidebar-user-name">{user.nama}</div>
        {user.opd && <div className="sidebar-user-role-label">{user.opd}</div>}
        <span className={`badge ${roleClass}`} style={{fontSize:10,marginTop:5,display:"inline-flex"}}>{roleLabel}</span>
      </div>

      {/* ── Navigation ── */}
      <div className="sidebar-nav">
        <div className="nav-section">Menu Utama</div>
        {items.map(it => {
          if (user.role === "staf" && it.id === "input") return null;
          return (
            <div
              key={it.id}
              className={`nav-item${active===it.id?" active":""}`}
              onClick={() => onChange(it.id)}
              data-tip={it.label}
            >
              <span className="ni">{it.icon}</span>
              <span className="nav-label">{it.label}</span>
              {it.badge > 0 && <span className="nav-badge">{it.badge}</span>}
            </div>
          );
        })}
        {user.role === "admin" && (
          <>
            <div className="nav-section">Administrasi</div>
            {adminItems.map(it => (
              <div
                key={it.id}
                className={`nav-item${active===it.id?" active":""}`}
                onClick={() => onChange(it.id)}
                data-tip={it.label}
              >
                <span className="ni">{it.icon}</span>
                <span className="nav-label">{it.label}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <IcoLogout size={14}/>
          <span className="logout-label">Keluar dari Sistem</span>
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
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--primary)",fontWeight:700,marginBottom:2,letterSpacing:"0.05em"}}>{p.id}</div>
            <div style={{fontWeight:800,fontSize:15,color:"var(--on-surface)",letterSpacing:"-0.4px"}}>{p.nama}</div>
            <div style={{fontSize:11,color:"var(--on-surface-variant)",marginTop:2}}>{p.opd} · {p.alasan} · {p.jalur==="A"?"Jalur A":"Jalur B"}</div>
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
            <div style={{fontWeight:800,fontSize:14,color:"var(--primary)",letterSpacing:"-0.4px"}}>Input Pengajuan SKPP</div>
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

// ─── HELPER: hitung usia dokumen dari tanggal masuk ──────────────────────────
function hitungHariKe(tanggalMasuk) {
  if (!tanggalMasuk) return null;
  const masuk = new Date(tanggalMasuk);
  if (isNaN(masuk)) return null;
  const diff = Math.floor((Date.now() - masuk.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function AgingBadge({ tanggalMasuk, status, progress }) {
  if (status === "selesai" || progress === 100) return null;
  const hari = hitungHariKe(tanggalMasuk);
  if (hari === null) return null;
  // SLA: batas 14 hari kerja (kuning ≥ 10, merah ≥ 14)
  const isKritis = hari >= 14;
  const isWarning = hari >= 10 && hari < 14;
  if (!isKritis && !isWarning && hari < 3) return (
    <span style={{fontSize:10,fontFamily:"var(--mono)",fontWeight:600,color:"var(--on-surface-variant)"}}>Hari ke-{hari+1}</span>
  );
  return (
    <span style={{
      fontSize:10,fontFamily:"var(--mono)",fontWeight:700,
      padding:"2px 7px",borderRadius:999,
      background: isKritis ? "var(--error-container)" : "var(--warning-pale)",
      color: isKritis ? "var(--error)" : "#92400e",
      display:"inline-flex",alignItems:"center",gap:4,
    }}>
      {isKritis ? "🔴" : "🟡"} Hari ke-{hari+1}
    </span>
  );
}

// ─── PAGE DASHBOARD ───────────────────────────────────────────────────────────
function PageDashboard({ data, loading, user, onDetail }) {
  // ── Filter waktu ──
  const [filterWaktu, setFilterWaktu] = useState("bulan_ini");

  const filterData = useCallback((arr) => {
    const now = new Date();
    return arr.filter(p => {
      if (!p.tanggalMasuk) return filterWaktu === "semua";
      const d = new Date(p.tanggalMasuk);
      if (isNaN(d)) return filterWaktu === "semua";
      if (filterWaktu === "hari_ini") {
        return d.toDateString() === now.toDateString();
      }
      if (filterWaktu === "minggu_ini") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        return d >= startOfWeek;
      }
      if (filterWaktu === "bulan_ini") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true; // "semua"
    });
  }, [filterWaktu]);

  const filteredData = filterData(data);

  const s = {
    total:   filteredData.length,
    proses:  filteredData.filter(d => !(d.status==="selesai"||getProgress(d)===100) && d.status!=="kembali").length,
    selesai: filteredData.filter(d => d.status==="selesai"||getProgress(d)===100).length,
    kembali: filteredData.filter(d => d.status==="kembali").length,
  };

  const byOPD  = filteredData.reduce((acc,p)=>{ acc[p.opd]=(acc[p.opd]||0)+1; return acc; }, {});
  const topOPD = Object.entries(byOPD).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const pctSelesai = s.total ? Math.round((s.selesai/s.total)*100) : 0;
  const recent = [...filteredData].sort((a,b)=>new Date(b.tanggalMasuk)-new Date(a.tanggalMasuk)).slice(0,6);

  const WAKTU_OPTS = [
    { v:"hari_ini",  l:"Hari Ini" },
    { v:"minggu_ini",l:"Minggu Ini" },
    { v:"bulan_ini", l:"Bulan Ini" },
    { v:"semua",     l:"Semua Data" },
  ];

  const labelWaktu = WAKTU_OPTS.find(o=>o.v===filterWaktu)?.l || "";

  // Sparkline data dari filteredData (dikelompokkan 7 titik terakhir)
  const sparkline7 = (() => {
    const days = 7;
    const pts = [];
    for (let i = days-1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate()+1);
      pts.push(data.filter(p => {
        if(!p.tanggalMasuk) return false;
        const m = new Date(p.tanggalMasuk);
        return m >= d && m < next;
      }).length);
    }
    return pts;
  })();

  const sparkPath = (pts, maxH=24) => {
    const max = Math.max(...pts, 1);
    const w = 100 / (pts.length - 1);
    return pts.map((v,i) => `${i===0?"M":"L"}${i*w},${maxH - (v/max)*maxH}`).join(" ");
  };

  return (
    <div>
      {/* Welcome + Filter Waktu */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div className="welcome-area" style={{marginBottom:0}}>
          <div className="welcome-greeting">Selamat Datang,</div>
          <div className="welcome-name">{user?.nama || "—"}</div>
        </div>
        {/* ── Filter Rentang Waktu ── */}
        <div style={{display:"flex",gap:4,background:"var(--surface-container-low)",padding:4,borderRadius:12,border:"1.5px solid var(--outline-variant)"}}>
          {WAKTU_OPTS.map(opt=>(
            <button key={opt.v} onClick={()=>setFilterWaktu(opt.v)} style={{
              padding:"5px 14px",borderRadius:9,fontSize:12,fontWeight:600,
              border:"none",cursor:"pointer",transition:"all .15s",
              background: filterWaktu===opt.v ? "var(--primary)" : "transparent",
              color: filterWaktu===opt.v ? "white" : "var(--on-surface-variant)",
              boxShadow: filterWaktu===opt.v ? "0 2px 8px rgba(0,50,125,.2)" : "none",
            }}>{opt.l}</button>
          ))}
        </div>
      </div>

      {/* 4 Stat Cards — baris pertama, menggantikan hero card besar */}
      <div className="stat-grid" style={{marginBottom:14}}>
        {/* Total Pengajuan */}
        <div className="stat-card" style={{flexDirection:"column",gap:6,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div className="stat-label" style={{marginBottom:4}}>Total Pengajuan</div>
              <div className="stat-num">{loading?"—":s.total}</div>
            </div>
            <div className="stat-icon" style={{background:"var(--primary-fixed)",color:"var(--primary)",fontSize:15}}>📋</div>
          </div>
          {/* Sparkline 7 hari — dengan label */}
          <div style={{marginTop:4}}>
            <div style={{fontSize:9,color:"var(--outline)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>
              Tren 7 Hari Terakhir
            </div>
            <svg viewBox="0 0 100 26" style={{width:"100%",height:26}} preserveAspectRatio="none">
              <path d={sparkPath(sparkline7)} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{fontSize:10,color:"var(--on-surface-variant)",marginTop:2}}>{labelWaktu}</div>
        </div>

        {/* Sedang Diproses */}
        <div className="stat-card" style={{flexDirection:"column",gap:6,padding:"14px 16px",position:"relative",overflow:"hidden",
          borderLeft:"3px solid var(--primary)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div className="stat-label" style={{marginBottom:4}}>Sedang Diproses</div>
              <div className="stat-num" style={{color:"var(--primary)"}}>{loading?"—":s.proses}</div>
            </div>
            <div className="stat-icon" style={{background:"var(--primary-fixed)",color:"var(--primary)",fontSize:15}}>⚙️</div>
          </div>
          <div style={{marginTop:4}}>
            <div style={{fontSize:9,color:"var(--outline)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>
              Tren 7 Hari Terakhir
            </div>
            <svg viewBox="0 0 100 26" style={{width:"100%",height:26}} preserveAspectRatio="none">
              <path d={sparkPath(sparkline7.map((_,i)=>
                data.filter(p=>{
                  if(!p.tanggalMasuk) return false;
                  const d=new Date(); d.setDate(d.getDate()-(6-i)); d.setHours(0,0,0,0);
                  const n=new Date(d); n.setDate(n.getDate()+1);
                  const m=new Date(p.tanggalMasuk);
                  return m>=d&&m<n&&!(p.status==="selesai"||getProgress(p)===100)&&p.status!=="kembali";
                }).length
              ))} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{fontSize:10,color:"var(--on-surface-variant)",marginTop:2}}>{labelWaktu}</div>
        </div>

        {/* Selesai */}
        <div className="stat-card" style={{flexDirection:"column",gap:6,padding:"14px 16px",
          borderLeft:"3px solid var(--success)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div className="stat-label" style={{marginBottom:4}}>Selesai</div>
              <div className="stat-num" style={{color:"var(--success)"}}>{loading?"—":s.selesai}</div>
            </div>
            <div className="stat-icon" style={{background:"var(--success-pale)",color:"var(--success)",fontSize:15}}>✅</div>
          </div>
          {/* Progress bar visual */}
          <div style={{marginTop:4}}>
            <div style={{fontSize:9,color:"var(--outline)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>
              Persentase Selesai
            </div>
            <div style={{background:"var(--surface-container-high)",borderRadius:99,height:6,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:99,background:"var(--success)",width:`${pctSelesai}%`,transition:"width .6s ease"}}/>
            </div>
            <div style={{fontSize:10,fontWeight:700,color:"var(--success)",marginTop:4,fontFamily:"var(--mono)"}}>{pctSelesai}%</div>
          </div>
        </div>

        {/* Dikembalikan */}
        <div className="stat-card" style={{flexDirection:"column",gap:6,padding:"14px 16px",
          borderLeft: s.kembali>0 ? "3px solid var(--warning)" : "3px solid var(--outline-variant)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div className="stat-label" style={{marginBottom:4}}>Dikembalikan</div>
              <div className="stat-num" style={{color:s.kembali>0?"var(--amber)":"var(--on-surface)"}}>{loading?"—":s.kembali}</div>
            </div>
            <div className="stat-icon" style={{
              background:s.kembali>0?"var(--warning-pale)":"var(--surface-container-low)",
              color:s.kembali>0?"#92400e":"var(--on-surface-variant)",fontSize:15}}>↩️</div>
          </div>
          <div style={{marginTop:4}}>
            <div style={{fontSize:9,color:"var(--outline)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>
              Distribusi
            </div>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:22}}>
              {[0.4,0.8,0.6,1.0].map((h,i)=>(
                <div key={i} style={{flex:1,height:`${h*100}%`,background:s.kembali>0?"var(--amber)":"var(--outline-variant)",borderRadius:"2px 2px 0 0",opacity:0.5}}/>
              ))}
            </div>
          </div>
          <div style={{fontSize:10,color:"var(--on-surface-variant)",marginTop:2}}>{labelWaktu}</div>
        </div>
      </div>

      {/* 3-column grid — Top OPD + mini insight */}
      <div className="dash-grid" style={{marginBottom:16}}>
        {/* Col 1+2 — Quick stats row */}
        <div style={{gridColumn:"span 2",display:"flex",flexDirection:"column",gap:10}}>
          {/* SLA Alert — dokumen mendekati batas */}
          {(() => {
            const kritisItems = data.filter(p =>
              !(p.status==="selesai"||getProgress(p)===100) &&
              hitungHariKe(p.tanggalMasuk) >= 10
            );
            if (kritisItems.length === 0) return null;
            return (
              <div style={{
                background:"linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)",
                border:"1.5px solid #fde68a",borderRadius:14,padding:"12px 16px",
                display:"flex",alignItems:"center",gap:12,
              }}>
                <span style={{fontSize:20}}>⚠️</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#92400e"}}>
                    {kritisItems.length} dokumen mendekati batas waktu SLA
                  </div>
                  <div style={{fontSize:11,color:"#b45309",marginTop:2}}>
                    {kritisItems.slice(0,2).map(p=>`${p.nama||"—"} (Hari ke-${(hitungHariKe(p.tanggalMasuk)||0)+1})`).join(", ")}
                    {kritisItems.length > 2 && ` +${kritisItems.length-2} lainnya`}
                  </div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:"#92400e",background:"#fde68a",borderRadius:8,padding:"4px 10px",whiteSpace:"nowrap"}}>
                  Perlu Tindakan
                </div>
              </div>
            );
          })()}

          {/* Breakdown jalur */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              { jalur:"A", label:"Jalur A", sub:"Tanpa Pangkat Pengabdian", color:"var(--primary)", bg:"var(--primary-fixed)" },
              { jalur:"B", label:"Jalur B", sub:"Ada Pangkat Pengabdian",   color:"#5b21b6",        bg:"#f5f3ff" },
            ].map(j => {
              const total = filteredData.filter(p=>p.jalur===j.jalur).length;
              const selesai = filteredData.filter(p=>p.jalur===j.jalur&&(p.status==="selesai"||getProgress(p)===100)).length;
              return (
                <div key={j.jalur} style={{
                  background:"var(--surface-container-lowest)",
                  border:`1.5px solid var(--outline-variant)`,
                  borderLeft:`4px solid ${j.color}`,
                  borderRadius:14,padding:"14px 16px",
                  boxShadow:"var(--shadow-card)",
                }}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div>
                      <span style={{
                        fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,
                        background:j.bg,color:j.color,
                      }}>{j.label}</span>
                    </div>
                    <span style={{fontSize:20,fontWeight:800,color:j.color,fontFamily:"var(--mono)",letterSpacing:"-1px"}}>{loading?"—":total}</span>
                  </div>
                  <div style={{fontSize:11,color:"var(--on-surface-variant)",marginBottom:8}}>{j.sub}</div>
                  <div style={{background:"var(--surface-container-high)",borderRadius:99,height:5,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:99,background:j.color,width:`${total?Math.round(selesai/total*100):0}%`,transition:"width .6s ease"}}/>
                  </div>
                  <div style={{fontSize:10,color:"var(--on-surface-variant)",marginTop:5,display:"flex",justifyContent:"space-between"}}>
                    <span>{selesai} selesai</span>
                    <span style={{fontFamily:"var(--mono)",fontWeight:700,color:j.color}}>{total?Math.round(selesai/total*100):0}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 3 — Top OPD */}
        <div className="opd-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:13,color:"var(--on-surface)",letterSpacing:"-0.2px"}}>Top OPD Pengajuan</div>
            <span className="chip" style={{fontSize:10}}>{topOPD.length} OPD</span>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}}>
            {loading ? (
              <div className="loading-box" style={{padding:18}}><div className="spinner"/></div>
            ) : topOPD.length===0 ? (
              <div style={{color:"var(--outline)",fontSize:12,textAlign:"center",padding:"18px 0"}}>Belum ada data</div>
            ) : topOPD.map(([opd,jml],i) => {
              const pct = s.total ? Math.round((jml/s.total)*100) : 0;
              return (
                <div key={opd} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:10,transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface-container-low)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div className={`opd-rank ${i===0?"first":"other"}`}>{i+1}</div>
                    <div style={{fontSize:12,fontWeight:500,color:"var(--on-surface)",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={opd}>{opd}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:6}}>
                    <div style={{fontWeight:700,fontSize:13,color:"var(--on-surface)"}}>{jml}</div>
                    <div style={{fontSize:9,color:"var(--on-surface-variant)",fontWeight:600,textTransform:"uppercase"}}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daftar Pengajuan Terbaru — dengan kolom NIP, Aging, dan tombol Aksi */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:14,color:"var(--on-surface)",letterSpacing:"-0.3px"}}>
            Daftar Pengajuan Terbaru
          </div>
          <span className="chip" style={{fontSize:10}}>6 terbaru · {labelWaktu}</span>
        </div>
        <div className="terbaru-card">
          {loading ? (
            <div className="loading-box"><div className="spinner"/><span>Memuat data...</span></div>
          ) : recent.length===0 ? (
            <div className="empty-box"><div className="empty-icon">📂</div><div className="empty-text">Belum ada pengajuan pada periode ini</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No. Pengajuan</th>
                  <th>OPD / Nama</th>
                  <th>NIP</th>
                  <th>Jalur</th>
                  <th>Status</th>
                  <th>Tgl Masuk · Aging</th>
                  <th style={{textAlign:"center"}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(p=>{
                  const prog = getProgress(p);
                  const isDone = p.status==="selesai"||prog===100;
                  return (
                    <tr key={p.id} className="tr-clickable" onClick={()=>onDetail && onDetail(p)}>
                      <td style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color:"var(--primary)",whiteSpace:"nowrap"}}>{p.id||"—"}</td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:9}}>
                          <div style={{width:26,height:26,borderRadius:"50%",background:"var(--primary-fixed)",color:"var(--primary)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:10,flexShrink:0}}>
                            {(p.opd||"?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontWeight:600,fontSize:12,color:"var(--on-surface)",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.opd||"—"}</div>
                            <div style={{fontSize:10,color:"var(--on-surface-variant)"}}>{p.nama||"—"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--outline)",whiteSpace:"nowrap"}}>{p.nip||"—"}</td>
                      <td>
                        {/* Warna berbeda: Jalur A = biru, Jalur B = ungu */}
                        <span style={{
                          fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,whiteSpace:"nowrap",
                          background: p.jalur==="A" ? "var(--primary-fixed)" : "#f5f3ff",
                          color:       p.jalur==="A" ? "var(--primary)"       : "#5b21b6",
                        }}>Jalur {p.jalur||"A"}</span>
                      </td>
                      <td><SBadge p={p}/></td>
                      <td>
                        <div style={{fontSize:11,color:"var(--on-surface-variant)",fontFamily:"var(--mono)",whiteSpace:"nowrap",marginBottom:3}}>{fmtDate(p.tanggalMasuk)}</div>
                        {!isDone && <AgingBadge tanggalMasuk={p.tanggalMasuk} status={p.status} progress={prog}/>}
                      </td>
                      <td style={{textAlign:"center"}}>
                        <button
                          onClick={e=>{e.stopPropagation();onDetail && onDetail(p);}}
                          title="Lihat Detail Berkas"
                          style={{
                            width:30,height:30,borderRadius:8,border:"1.5px solid var(--outline-variant)",
                            background:"var(--surface-container-low)",color:"var(--primary)",
                            display:"inline-flex",alignItems:"center",justifyContent:"center",
                            cursor:"pointer",transition:"all .15s",fontSize:14,
                          }}
                          onMouseEnter={e=>{e.currentTarget.style.background="var(--primary-fixed)";e.currentTarget.style.borderColor="var(--primary)";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="var(--surface-container-low)";e.currentTarget.style.borderColor="var(--outline-variant)";}}
                        >👁</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Warning banner */}
      {s.kembali > 0 && (
        <div className="alert alert-amber" style={{marginTop:16}}>
          <IcoAlert size={16}/>
          <div>
            <strong>Perlu Perhatian —</strong> Ada <strong>{s.kembali} pengajuan</strong> dengan berkas yang dikembalikan. Segera koordinasi dengan OPD terkait.
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
                      <td><span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,whiteSpace:"nowrap",background:p.jalur==="A"?"var(--primary-fixed)":"#f5f3ff",color:p.jalur==="A"?"var(--primary)":"#5b21b6"}}>Jalur {p.jalur}</span></td>
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
function PageUsers({ onToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errLoad, setErrLoad] = useState("");

  const muat = useCallback(async () => {
    setLoading(true); setErrLoad("");
    try {
      const res = await apiGet({ action:"daftarAkun" });
      if (res && res.ok) setUsers(res.data || []);
      else setErrLoad((res && res.pesan) || "Gagal memuat daftar akun.");
    } catch { setErrLoad("Gagal terhubung ke server."); }
    setLoading(false);
  }, []);
  useEffect(() => { muat(); }, [muat]);

  const jmlAdmin = users.filter(u=>u.role==="admin").length;

  // ── Tambah akun ──
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username:"", password:"", nama:"", role:"staf", opd:"" });
  const [savingAdd, setSavingAdd] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const simpanAkun = async () => {
    if (!form.username.trim() || !form.password || !form.nama.trim()) return onToast("Username, password, dan nama wajib diisi.");
    if (form.password.length < 6 || !/[A-Z]/.test(form.password)) return onToast("Password minimal 6 karakter & 1 huruf kapital.");
    setSavingAdd(true);
    try {
      const res = await apiPost({ action:"tambahAkun", username:form.username.trim(), password:form.password, nama:form.nama.trim(), role:form.role, opd:form.opd.trim() });
      if (res && res.ok) {
        onToast(res.pesan || "Akun berhasil ditambahkan.");
        setForm({username:"",password:"",nama:"",role:"staf",opd:""});
        setShowForm(false);
        muat();
      } else onToast((res && res.pesan) || "Gagal menambah akun.");
    } catch { onToast("Gagal terhubung ke server."); }
    setSavingAdd(false);
  };

  // ── Hapus akun ──
  const hapus = async (u) => {
    if (!confirm(`Hapus akun "${u.username}"? Tindakan ini permanen.`)) return;
    try {
      const res = await apiPost({ action:"hapusAkun", username:u.username });
      if (res && res.ok) { onToast(res.pesan || "Akun dihapus."); muat(); }
      else onToast((res && res.pesan) || "Gagal menghapus akun.");
    } catch { onToast("Gagal terhubung ke server."); }
  };

  // ── Reset kata sandi ──
  const [resetTarget, setResetTarget] = useState(null);
  const [rp, setRp] = useState({ baru:"", konfirmasi:"" });
  const [showRp, setShowRp] = useState(false);
  const [savingRp, setSavingRp] = useState(false);
  const bukaReset = (u) => { setResetTarget(u); setRp({baru:"",konfirmasi:""}); setShowRp(false); };
  const simpanReset = async () => {
    if (!rp.baru) return onToast("Kata sandi baru wajib diisi.");
    if (rp.baru.length < 6 || !/[A-Z]/.test(rp.baru)) return onToast("Kata sandi minimal 6 karakter & 1 huruf kapital.");
    if (rp.baru !== rp.konfirmasi) return onToast("Konfirmasi kata sandi tidak cocok.");
    setSavingRp(true);
    try {
      const res = await apiPost({ action:"resetPassword", username:resetTarget.username, passwordBaru:rp.baru });
      if (res && res.ok) { onToast(res.pesan || "Kata sandi berhasil direset."); setResetTarget(null); }
      else onToast((res && res.pesan) || "Gagal mereset kata sandi.");
    } catch { onToast("Gagal terhubung ke server."); }
    setSavingRp(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">Manajemen Akun Staf</div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-secondary btn-sm" onClick={muat} disabled={loading}>↻ Muat Ulang</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowForm(true)} style={{gap:6}}><IcoPlus size={14}/> Tambah Staf</button>
        </div>
      </div>

      {errLoad && (
        <div className="alert alert-red" style={{margin:"16px 20px 0"}}>
          <IcoAlert size={14}/><span style={{fontSize:12}}>{errLoad}</span>
          <button className="btn btn-secondary btn-sm" style={{marginLeft:8}} onClick={muat}>Coba Lagi</button>
        </div>
      )}

      <div className="table-wrap" style={{padding:"0 0 16px"}}>
        <table>
          <thead><tr><th>Nama Lengkap</th><th>Username</th><th>Role</th><th>OPD / Tugas</th><th style={{textAlign:"right"}}>Aksi</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="empty-box"><div className="empty-text">Memuat akun…</div></div></td></tr>
            ) : users.length===0 && !errLoad ? (
              <tr><td colSpan={5}><div className="empty-box"><div className="empty-icon">👥</div><div className="empty-text">Belum ada akun</div></div></td></tr>
            ) : users.map((u,i)=>(
              <tr key={u.id||u.username||i}>
                <td style={{fontWeight:600}}>{u.nama}</td>
                <td style={{fontFamily:"var(--mono)",fontSize:12}}>{u.username}</td>
                <td><span className={`badge ${u.role==="admin"?"role-admin badge-purple":u.role==="operator"?"role-operator badge-gold":"role-staf badge-blue"}`}>{u.role}</span></td>
                <td style={{fontSize:12,color:"var(--on-surface-variant)"}}>{u.opd||"—"}</td>
                <td>
                  <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>bukaReset(u)}>Reset Password</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>hapus(u)} disabled={u.role==="admin"&&jmlAdmin<=1}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Akun */}
      {showForm && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
          <div className="modal" style={{maxWidth:500}}>
            <div className="modal-header">
              <div style={{fontWeight:800,fontSize:14,color:"var(--primary)",letterSpacing:"-0.4px"}}>Tambah Akun Staf Baru</div>
              <button className="modal-close" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Username *</label><input className="form-control" value={form.username} onChange={e=>set("username",e.target.value)} placeholder="Tanpa spasi"/></div>
                <div className="form-group"><label className="form-label">Password *</label><input className="form-control" type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="6+ karakter, 1 huruf kapital"/></div>
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
              <button className="btn btn-primary" onClick={simpanAkun} disabled={savingAdd}>{savingAdd?"Menyimpan…":"Simpan Akun"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetTarget && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setResetTarget(null);}}>
          <div className="modal" style={{maxWidth:440}}>
            <div className="modal-header">
              <div style={{fontWeight:800,fontSize:14,color:"var(--primary)",letterSpacing:"-0.4px"}}>Reset Kata Sandi</div>
              <button className="modal-close" onClick={()=>setResetTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-amber" style={{marginTop:0}}>
                <span>🔑</span><span style={{fontSize:12}}>Menetapkan kata sandi baru untuk <strong>{resetTarget.nama}</strong> (<span style={{fontFamily:"var(--mono)"}}>{resetTarget.username}</span>). Kata sandi lama tidak diperlukan.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Kata Sandi Baru</label>
                <div style={{position:"relative"}}>
                  <input className="form-control" style={{paddingRight:40}} type={showRp?"text":"password"} value={rp.baru} onChange={e=>setRp(p=>({...p,baru:e.target.value}))} placeholder="6+ karakter, 1 huruf kapital" autoComplete="new-password"/>
                  <button type="button" onClick={()=>setShowRp(s=>!s)} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--outline)",padding:6}}>{showRp?"🙈":"👁"}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Konfirmasi Kata Sandi Baru</label>
                <input className="form-control" type={showRp?"text":"password"} value={rp.konfirmasi} onChange={e=>setRp(p=>({...p,konfirmasi:e.target.value}))} placeholder="Ulangi kata sandi baru" autoComplete="new-password"/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setResetTarget(null)}>Batal</button>
              <button className="btn btn-primary" onClick={simpanReset} disabled={savingRp}>{savingRp?"Menyimpan…":"Reset Kata Sandi"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HALAMAN PROFIL ───────────────────────────────────────────────────────────
function PageProfil({ user, onToast, onUpdateUser }) {
  const storeKey = `skpp_profil_${user?.username || "anon"}`;
  const load = () => {
    try { return JSON.parse(localStorage.getItem(storeKey) || "{}"); }
    catch { return {}; }
  };
  const saved = load();
  const [form, setForm] = useState({
    nama:    saved.nama    ?? user?.nama ?? "",
    nik:     saved.nik     ?? "",
    npwp:    saved.npwp    ?? "",
    tglLahir:saved.tglLahir ?? "",
    pangkat: saved.pangkat ?? "",
    alamat:  saved.alamat  ?? "",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const [saving, setSaving] = useState(false);

  // ── Kata sandi ──
  const [pwd, setPwd] = useState({ lama:"", baru:"", konfirmasi:"" });
  const setP = (k,v) => setPwd(p=>({...p,[k]:v}));
  const [showPwd, setShowPwd] = useState({});
  const [savingPwd, setSavingPwd] = useState(false);

  // Muat profil dari server saat halaman dibuka (fallback: data lokal)
  useEffect(() => {
    let aktif = true;
    (async () => {
      try {
        const res = await apiGet({ action:"profil", username:user?.username });
        if (aktif && res && res.ok && res.data) {
          const d = res.data;
          setForm(f => ({
            nama:    d.nama     ?? f.nama,
            nik:     d.nik      ?? f.nik,
            npwp:    d.npwp     ?? f.npwp,
            tglLahir:d.tglLahir ?? f.tglLahir,
            pangkat: d.pangkat  ?? f.pangkat,
            alamat:  d.alamat   ?? f.alamat,
          }));
        }
      } catch {}
    })();
    return () => { aktif = false; };
  }, []);

  const simpanProfil = async () => {
    if (!form.nama.trim()) { onToast("Nama wajib diisi."); return; }
    setSaving(true);
    try {
      localStorage.setItem(storeKey, JSON.stringify(form));
      onUpdateUser?.({ nama: form.nama.trim() });
      // Sinkron ke backend; bila action belum tersedia, data tetap aman di perangkat
      let serverOk = false;
      try {
        const res = await apiPost({ action:"updateProfil", username:user?.username, data:form });
        serverOk = !!(res && res.ok);
      } catch {}
      onToast(serverOk
        ? "Profil berhasil diperbarui."
        : "Profil tersimpan di perangkat ini. (Server belum menyimpan — aktifkan action updateProfil di backend.)");
    } catch {
      onToast("Gagal menyimpan profil.");
    } finally { setSaving(false); }
  };

  const simpanPassword = async () => {
    if (!pwd.lama || !pwd.baru) { onToast("Kata sandi lama dan baru wajib diisi."); return; }
    if (pwd.baru.length < 6) { onToast("Kata sandi baru minimal 6 karakter."); return; }
    if (!/[A-Z]/.test(pwd.baru)) { onToast("Kata sandi baru wajib memuat minimal 1 huruf kapital."); return; }
    if (pwd.baru !== pwd.konfirmasi) { onToast("Konfirmasi kata sandi tidak cocok."); return; }
    setSavingPwd(true);
    try {
      const res = await apiPost({
        action:"gantiPassword",
        username:user?.username,
        passwordLama:pwd.lama,
        passwordBaru:pwd.baru,
      });
      if (res && res.ok) {
        setPwd({ lama:"", baru:"", konfirmasi:"" });
        onToast("Kata sandi berhasil diperbarui.");
      } else {
        onToast((res && res.pesan) || "Gagal memperbarui kata sandi. Pastikan kata sandi lama benar.");
      }
    } catch {
      onToast("Gagal terhubung ke server untuk memperbarui kata sandi.");
    } finally { setSavingPwd(false); }
  };

  const Eye = ({on}) => on
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

  const pwdField = (key, label, placeholder) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{position:"relative"}}>
        <input
          className="form-control"
          style={{paddingRight:40}}
          type={showPwd[key]?"text":"password"}
          value={pwd[key]}
          onChange={e=>setP(key, e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
        />
        <button type="button"
          onClick={()=>setShowPwd(s=>({...s,[key]:!s[key]}))}
          style={{position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--outline)", display:"flex", alignItems:"center", padding:6}}>
          <Eye on={showPwd[key]}/>
        </button>
      </div>
    </div>
  );

  const ico = {
    nama: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    nik:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    npwp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    tgl:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    pangkat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
    alamat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">Profil</div>
      </div>
      <div className="card-body">
        <div className="profil-row">
          <div className="profil-row-label">{ico.nama} Nama</div>
          <input className="form-control" style={{marginBottom:0}} value={form.nama} onChange={e=>set("nama", e.target.value)} placeholder="Nama lengkap & gelar"/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.nik} NIK</div>
          <input className="form-control" style={{marginBottom:0}} value={form.nik} onChange={e=>set("nik", e.target.value)} placeholder="Nomor Induk Kependudukan"/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.npwp} NPWP SKPD</div>
          <input className="form-control" style={{marginBottom:0}} value={form.npwp} onChange={e=>set("npwp", e.target.value)} placeholder="NPWP SKPD"/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.tgl} Tanggal Lahir</div>
          <input className="form-control" style={{marginBottom:0}} type="date" value={form.tglLahir} onChange={e=>set("tglLahir", e.target.value)}/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.pangkat} Pangkat dan Golongan</div>
          <div style={{marginTop:-8, marginBottom:-16}}>
            <SearchableSelect value={form.pangkat} onChange={v=>set("pangkat", v)} options={DAFTAR_PANGKAT} placeholder="-- Pilih Pangkat / Golongan --"/>
          </div>
        </div>
        <div className="profil-row">
          <div className="profil-row-label" style={{alignSelf:"start", paddingTop:10}}>{ico.alamat} Alamat</div>
          <textarea className="form-control" style={{marginBottom:0, minHeight:70, resize:"vertical"}} value={form.alamat} onChange={e=>set("alamat", e.target.value)} placeholder="Alamat domisili"/>
        </div>

        <div style={{marginTop:20}}>
          <button className="btn btn-primary" onClick={simpanProfil} disabled={saving}>
            {saving ? "Menyimpan…" : "Perbarui"}
          </button>
        </div>

        <div style={{borderTop:"1px solid var(--outline-variant)", margin:"28px 0 20px"}}/>

        <div className="profil-section-title">Perbarui Kata Sandi</div>
        <div style={{maxWidth:520, marginTop:14}}>
          {pwdField("lama", "Kata Sandi Sebelumnya", "Masukkan kata sandi saat ini")}
          {pwdField("baru", "Kata Sandi Baru", "6+ karakter, 1 huruf kapital")}
          {pwdField("konfirmasi", "Konfirmasi Kata Sandi Baru", "Ulangi kata sandi baru")}
          <button className="btn btn-primary" style={{marginTop:6}} onClick={simpanPassword} disabled={savingPwd}>
            {savingPwd ? "Menyimpan…" : "Perbarui Kata Sandi"}
          </button>
        </div>
      </div>
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
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Tutup popup notif / profil saat klik di luar areanya
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Badge sidebar = semua pengajuan yang butuh perhatian (proses + dikembalikan)
  // agar konsisten dengan angka di dashboard
  const counts = {
    proses: data.filter(d => !(d.status==="selesai"||getProgress(d)===100)).length
  };

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
            {/* Kiri — identitas instansi */}
            <div className="topbar-instansi">
              <div className="topbar-instansi-name">Pemerintah Provinsi Nusa Tenggara Timur</div>
              <div className="topbar-instansi-sub">Badan Keuangan Daerah — Bidang Perbendaharaan</div>
            </div>
            <div className="topbar-actions">
              {errLoad && (
                <div className="alert alert-red" style={{margin:0,padding:"6px 12px",fontSize:12}}>
                  <IcoAlert size={14}/><span>{errLoad}</span>
                  <button className="btn btn-secondary btn-sm" style={{marginLeft:8}} onClick={load}>Coba Lagi</button>
                </div>
              )}
              {/* Ticker motivasi — menyatu dengan topbar, tanpa badge */}
              <TickerMotivasi/>
              {/* Notifikasi lonceng */}
              <div style={{position:"relative"}} ref={notifRef}>
                <button className="notif-btn" onClick={()=>{setShowNotif(v=>!v);setShowProfile(false);}}>
                  <IcoBell size={16}/>
                  {data.filter(d=>d.status==="proses").length>0 && <span className="notif-dot"/>}
                </button>
                {showNotif && (
                  <>
                    <div className="notif-popup">
                      <div className="notif-popup-header">🔔 Notifikasi Progres</div>
                      {data.filter(d=>d.status==="proses").length===0 ? (
                        <div className="notif-empty">Tidak ada notifikasi saat ini</div>
                      ) : data.filter(d=>d.status==="proses").slice(0,5).map(d=>(
                        <div key={d.id} className="notif-item" onClick={()=>{setSelected(d);setShowNotif(false);}}>
                          <div className="notif-item-title">{d.nama}</div>
                          <div className="notif-item-sub">{d.id} · Menunggu tindakan</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Logo Pemprov NTT + popup profil */}
              <div style={{position:"relative"}} ref={profileRef}>
                <div
                  className="topbar-logo-btn"
                  style={{width: 35, height: 35, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"}}
                  title="Profil"
                  onClick={()=>{setShowProfile(v=>!v);setShowNotif(false);}}
                >
                  <img 
                    src="/logo-ntt.png" 
                    alt="NTT" 
                    style={{width: "100%", height: "100%", objectFit: "contain"}}
                    onError={e=>{e.target.style.display="none";e.target.parentElement.innerHTML=`<span style="font-size:10px;font-weight:800;color:var(--primary)">${user?.nama?user.nama.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"U"}</span>`;}}
                  />
                </div>
                {showProfile && (
                  <>
                    <div className="profile-popup">
                      <div className="profile-popup-header">
                        <div className="profile-popup-avatar">
                          <img src="/logo-ntt.png"
                            alt="NTT" style={{width:"100%",height:"100%",objectFit:"contain"}}
                            onError={e=>{e.target.style.display="none";}}
                          />
                        </div>
                        <div>
                          <div className="profile-popup-name">{user?.nama||"Pengguna"}</div>
                          <div className="profile-popup-role">{user?.role==="admin"?"Administrator":user?.role==="operator"?"Staf Loket":"Staf Pengampuh OPD"}</div>
                        </div>
                      </div>
                      <div className="profile-popup-opd">
                        <strong>Provinsi Nusa Tenggara Timur</strong>
                        Tahun {new Date().getFullYear()}
                      </div>
                      <div className="profile-popup-section">
                        <div className="profile-popup-item" onClick={()=>{setShowProfile(false);setPage("profil");}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          Profil
                        </div>
                        <div className="profile-popup-item danger" onClick={()=>{setShowProfile(false);setUser(null);}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          Keluar
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="content">
            {page==="dashboard" && <PageDashboard data={data} loading={loading} user={user} onDetail={setSelected}/>}
            {page==="pengajuan" && <PagePengajuan data={data} loading={loading} onRefresh={load} onDetail={setSelected} onInputBaru={()=>setShowInput(true)} onExport={exportCSV} user={user}/>}
            {page==="input"     && <div className="card card-body"><PagePengajuan data={[]} loading={false} onRefresh={()=>{}} onDetail={()=>{}} onInputBaru={()=>setShowInput(true)} onExport={()=>{}} user={user}/></div>}
            {page==="riwayat"   && <PageRiwayat data={data} loading={loading} onDetail={setSelected}/>}
            {page==="profil"    && <PageProfil user={user} onToast={setToast} onUpdateUser={u=>setUser(prev=>({...prev,...u}))}/>}
            {page==="users"     && user.role==="admin" && <PageUsers onToast={showToast}/>}
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
              <div style={{fontWeight:800,fontSize:14,color:"var(--primary)",letterSpacing:"-0.4px"}}>
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
                borderRadius:12,padding:18,textAlign:"center",marginBottom:13
              }}>
                <div style={{color:"rgba(255,255,255,.5)",fontSize:9,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>
                  {kodeAksesModal.isBulk?"Kode Akses Bersama (1 Kode untuk Semua)":"Kode Akses Portal Pelacakan"}
                </div>
                <div style={{color:"var(--secondary-container)",fontFamily:"var(--mono)",fontSize:38,fontWeight:900,letterSpacing:10,lineHeight:1}}>
                  {kodeAksesModal.kode}
                </div>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:10,marginTop:10}}>
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