import { useState, useEffect, useCallback, useRef } from "react";
import {
  login, logout, sesiSaatIni,
  daftarAkun, tambahAkun, editAkun, hapusAkun, resetPassword,
  ajukanResetPassword, daftarPermintaanReset, tandaiResetSelesai, hapusPermintaanReset,
  profil, updateProfil, gantiPassword,
  daftarSemua, detail, inputBaru, inputBulk, updateTahap, setSelesai, hapusPengajuan,
} from "./api";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
// Batas waktu sesi tanpa aktivitas: setelah IDLE_LIMIT_MINUTES idle, muncul
// peringatan; jika tetap tidak ada aktivitas selama IDLE_WARNING_SECONDS, logout.
const IDLE_LIMIT_MINUTES = 15;
const IDLE_WARNING_SECONDS = 60;

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

// Pilihan dokumen persyaratan SKPP untuk dropdown "Dokumen Kurang".
const DAFTAR_DOKUMEN_SKPP = [
  "Surat Pengantar dari OPD",
  "SK Pensiun / SK Pemberhentian",
  "SK Kenaikan Pangkat Terakhir",
  "SK Kenaikan Gaji Berkala Terakhir",
  "Daftar Gaji Terakhir (Asli)",
  "Surat Keterangan Penghentian Pembayaran (SKPP) sebelumnya",
  "Fotokopi KTP",
  "Fotokopi Kartu Pegawai (Karpeg)",
  "Fotokopi NPWP",
  "Fotokopi Kartu Taspen",
  "Buku Rekening / Rekening Koran",
  "SPTJM (Surat Pernyataan Tanggung Jawab Mutlak)",
  "Surat Keterangan Bebas Temuan / Bebas Hutang",
  "Pas Foto Terbaru",
  "Akta Kematian (untuk Janda/Duda)",
  "Surat Nikah / Akta Perkawinan (untuk Janda/Duda)",
];

// Pilihan tindakan yang diperlukan untuk dropdown "Tindakan yang Diperlukan".
const DAFTAR_TINDAKAN = [
  "Melengkapi dokumen yang kurang",
  "Memperbaiki dokumen yang tidak sesuai",
  "Melegalisir / mengesahkan dokumen",
  "Menyerahkan dokumen asli",
  "Menyerahkan fotokopi yang jelas/terbaca",
  "Memperbarui dokumen yang sudah kedaluwarsa",
  "Melengkapi tanda tangan / stempel basah",
  "Melampirkan dokumen pendukung tambahan",
];

// ── Daftar Periksa Verifikasi Berkas (Lampiran 1) ──────────────────────────
// Dokumen persyaratan dikelompokkan sesuai lampiran. {t}=teks, {ket}=catatan kolom.
const DP_DOKUMEN_GRUP = [
  { grup:"I. DOKUMEN UMUM (WAJIB UNTUK SEMUA JENIS SKPP)", items:[
    { t:"Fotokopi KTP Pegawai yang Bersangkutan" },
    { t:"Fotokopi Kartu Keluarga yang masih berlaku" },
    { t:"Surat Pernyataan Bebas Hutang dari Bendahara Gaji OPD (bermaterai)" },
    { t:"Pas foto terbaru ukuran 4×6 berlatar merah/biru sebanyak 3 (tiga) lembar" },
  ]},
  { grup:"II. DOKUMEN TAMBAHAN — PENSIUN (BUP / APS / CACAT / MENINGGAL)", items:[
    { t:"SK Pensiun / Persetujuan Pensiun yang telah ditetapkan oleh BKN / Pejabat Pembina Kepegawaian" },
    { t:"Fotokopi Surat Keputusan Kenaikan Pangkat Pengabdian (jika ada dan belum berlaku pada tanggal pensiun)", ket:"Jalur B" },
    { t:"Fotokopi Kartu Taspen" },
    { t:"Fotokopi Akta Perkawinan / Buku Nikah (jika ada tanggungan suami/istri)", ket:"Jika berlaku" },
    { t:"Fotokopi Akta Kelahiran anak yang masih menjadi tanggungan (usia < 25 tahun / belum bekerja)", ket:"Jika berlaku" },
  ]},
  { grup:"III. DOKUMEN TAMBAHAN — PINDAH / MUTASI", items:[
    { t:"SK Pindah / Mutasi dari instansi yang berwenang" },
    { t:"Surat Pernyataan Melaksanakan Tugas (SPMT) di instansi tujuan" },
    { t:"Surat Keterangan Bebas Temuan dari Inspektorat (jika dipersyaratkan)", ket:"Jika berlaku" },
  ]},
  { grup:"IV. DOKUMEN TAMBAHAN — BERHENTI ATAS PERMINTAAN SENDIRI (APS)", items:[
    { t:"SK Pemberhentian yang telah ditetapkan oleh pejabat berwenang" },
    { t:"Surat Pernyataan Tidak Menuntut Hak atas Pensiun (jika APS sebelum BUP)", ket:"Jika berlaku" },
  ]},
  { grup:"V. DOKUMEN TAMBAHAN — JANDA / DUDA", items:[
    { t:"Akta Kematian Pegawai yang bersangkutan (asli atau dilegalisir)" },
    { t:"Fotokopi Akta Perkawinan / Buku Nikah (dilegalisir)" },
    { t:"Fotokopi KTP Janda/Duda yang masih berlaku" },
  ]},
];
const DP_DOKUMEN_FLAT = DP_DOKUMEN_GRUP.flatMap(g => g.items);
// Offset indeks awal tiap grup di dalam DP_DOKUMEN_FLAT (agar state tetap selaras
// meski sebagian grup disembunyikan sesuai Jenis SKPP).
const DP_GRUP_OFFSET = (() => { let o=0; return DP_DOKUMEN_GRUP.map(g => { const s=o; o+=g.items.length; return s; }); })();
// Grup mana yang relevan untuk sebuah Jenis SKPP. Grup 0 (Umum) selalu tampil;
// 1=Pensiun, 2=Pindah, 3=Berhenti/APS, 4=Janda/Duda.
function dpGrupTampil(alasan) {
  const al = alasan||"";
  const isJD = al.includes("Janda")||al.includes("Duda")||al.includes("Meninggal");
  const isBH = al.includes("Berhenti")||al.includes("Pemberhentian");
  const isPD = al.includes("Pindah");
  const isPS = al.includes("Pensiun")&&!isJD;
  return [true, isPS, isPD, isBH, isJD];
}
const DP_HUTANG = [
  "Kelebihan pembayaran gaji pokok",
  "Kelebihan pembayaran tunjangan jabatan / tunjangan umum",
  "Kelebihan pembayaran tunjangan kinerja / tambahan penghasilan",
  "Kelebihan pembayaran honorarium atau penghasilan lainnya",
  "Uang muka perjalanan dinas yang belum dipertanggungjawabkan",
  "Pinjaman / talangan daerah yang belum dilunasi",
  "Kewajiban finansial lain yang tercatat dalam sistem penggajian OPD",
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

// Format angka rupiah gaya akuntansi: hanya digit, dengan pemisah ribuan titik (mis. 1500000 -> "1.500.000").
function fmtRibuan(v) {
  const digit = String(v ?? "").replace(/\D/g, "");
  return digit ? digit.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
}

// Format tanggal yyyy-mm-dd (dari input kalender) menjadi "14-Mar-2026".
const BULAN_SINGKAT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
function fmtTglSingkat(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return s || "";
  const [y, m, d] = s.split("-");
  return `${d}-${BULAN_SINGKAT[parseInt(m, 10) - 1]}-${y}`;
}

// Akun staf kini dikelola langsung dari sheet "Akun" via action daftarAkun/tambahAkun/hapusAkun/resetPassword.

const TANDA_TERIMA_URL = "/tanda_terima_SKPP.html";

function cetakTandaTerima(p) {
  const params = new URLSearchParams({
    id: p.id||"", kode: p.kodeAkses||"", nama: p.nama||"", nip: p.nip||"",
    jabatan: p.jabatan||"", pangkat: p.pangkat||"", opd: p.opd||"",
    alasan: p.alasan||"", jalur: p.jalur||"A", tgl: p.tanggalMasuk||"",
  });
  window.open(`${TANDA_TERIMA_URL}?${params.toString()}`, "_blank");
}

// Tanda terima untuk pengajuan bulk — gaya senada dengan tanda terima tunggal (navy + emas).
function cetakTandaTerimaBulk({ namaOPD, kode, grupId, items = [], daftarId = [] }) {
  const logoSrc = `${window.location.origin}/logo-ntt.png`;
  const tgl = new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" });
  const tglFull = new Date().toLocaleString("id-ID", { weekday:"long", day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }) + " WITA";
  const rows = items.map((it,i)=>`<tr>
    <td style="text-align:center">${i+1}</td>
    <td class="mono">${daftarId[i]||"—"}</td>
    <td style="font-weight:600">${it.nama||"—"}</td>
    <td class="mono">${it.nip||"—"}</td>
    <td>${it.jabatan||"—"}</td>
    <td>${it.alasan||"—"}</td>
    <td>Jalur ${it.jalur||"A"}</td>
  </tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Tanda Terima Pengajuan SKPP (Bulk) — ${namaOPD||""}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#f0f0f0;display:flex;flex-direction:column;align-items:center;padding:28px 16px;gap:20px}
    .slip{background:#fff;width:100%;max-width:840px;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(13,33,55,.12)}
    .hd{background:#0D2137;padding:18px 28px;display:flex;align-items:center;gap:16px}
    .hd img{width:52px;height:52px;object-fit:contain;flex:none}
    .hd .ins{color:rgba(255,255,255,.55);font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase}
    .hd .nm{color:#fff;font-size:14px;font-weight:700;line-height:1.3}
    .hd .un{color:rgba(255,255,255,.6);font-size:11px;margin-top:2px}
    .titlebar{background:#C9A84C;padding:10px 28px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .titlebar .t{color:#0D2137;font-weight:800;font-size:14px;letter-spacing:.3px}
    .titlebar .ts{color:rgba(13,33,55,.65);font-size:10px;font-weight:600;letter-spacing:.3px}
    .titlebar .dt{font-size:11px;color:rgba(13,33,55,.6);text-align:right;white-space:nowrap}
    .body{padding:22px 28px}
    .access{background:#0D2137;border-radius:14px;padding:20px 26px;display:flex;justify-content:space-between;gap:20px;margin-bottom:20px;flex-wrap:wrap}
    .access .lab{color:rgba(255,255,255,.5);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px}
    .access .opd{color:#C9A84C;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;margin-bottom:14px;max-width:360px;line-height:1.3}
    .access .kode{color:#fff;font-family:'JetBrains Mono',monospace;font-size:30px;font-weight:700;letter-spacing:8px}
    .access-r{text-align:right}
    .badge{display:inline-block;background:rgba(14,124,123,.25);border:1px solid rgba(14,124,123,.4);color:#4ECDC4;font-size:12px;font-weight:700;padding:5px 13px;border-radius:999px}
    .access-r .grup{color:rgba(255,255,255,.55);font-size:11px;font-family:'JetBrains Mono',monospace;margin-top:12px}
    .access-r .tgl{color:rgba(255,255,255,.4);font-size:11px;margin-top:4px}
    table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
    thead th{background:#0D2137;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;white-space:nowrap}
    tbody td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12.5px;color:#0D2137;vertical-align:middle}
    tbody tr:nth-child(even) td{background:#f8fafc}
    tbody tr:last-child td{border-bottom:none}
    .mono{font-family:'JetBrains Mono',monospace;font-size:11.5px;white-space:nowrap}
    .instructions{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-top:20px}
    .inst-title{font-size:12px;font-weight:700;color:#1e40af;margin-bottom:8px}
    .inst-item{display:flex;gap:8px;font-size:12px;color:#1e3a8a;margin-bottom:5px;align-items:flex-start}
    .inst-num{width:18px;height:18px;border-radius:50%;background:#1d4ed8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex:none;margin-top:1px}
    .warn{background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-top:16px;font-size:12px;color:#92400e;display:flex;gap:8px}
    .ttd{display:flex;justify-content:flex-end;margin-top:26px}
    .ttd .box{width:46%;text-align:center;font-size:11px;color:#0D2137}
    .ttd .role{color:#64748b;margin-top:2px}
    .ttd .sl{margin-top:54px;border-top:1px solid #0D2137}
    .footer{border-top:1px solid #e2e8f0;padding:14px 28px;display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#64748b}
    @media print{body{background:#fff;padding:0;gap:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.slip{box-shadow:none;max-width:100%;border-radius:0}}
  </style></head><body>
  <div class="slip">
    <div class="hd">
      <img src="${logoSrc}" alt=""/>
      <div>
        <div class="ins">Pemerintah Provinsi Nusa Tenggara Timur</div>
        <div class="nm">Badan Keuangan Daerah Provinsi Nusa Tenggara Timur</div>
        <div class="un">Bidang Perbendaharaan</div>
      </div>
    </div>
    <div class="titlebar">
      <div>
        <div class="t">TANDA TERIMA PENGAJUAN SKPP</div>
        <div class="ts">Pengajuan Kolektif / Bulk — Satu Kode Akses untuk Semua</div>
      </div>
      <div class="dt">Dicetak: ${tglFull}</div>
    </div>
    <div class="body">
      <div class="access">
        <div>
          <div class="lab">OPD / Instansi Pengirim</div>
          <div class="opd">${namaOPD||"—"}</div>
          <div class="lab">Kode Akses Bersama (Portal Pelacakan)</div>
          <div class="kode">${kode||"—"}</div>
        </div>
        <div class="access-r">
          <div class="lab">Jumlah Pengajuan</div>
          <span class="badge">${items.length} SKPP</span>
          <div class="grup">Grup: ${grupId||"—"}</div>
          <div class="tgl">${tgl}</div>
        </div>
      </div>
      <table>
        <thead><tr>
          <th style="width:34px;text-align:center">No.</th><th style="width:150px">No. Pengajuan</th><th>Nama Pegawai</th><th style="width:155px">NIP</th><th>Jabatan</th><th style="width:90px">Keperluan</th><th style="width:74px">Jalur</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="instructions">
        <div class="inst-title">📱 Cara Melacak Status Pengajuan SKPP Secara Daring</div>
        <div class="inst-item"><div class="inst-num">1</div><span>Buka portal: <strong>sipasti.my.id</strong> dari HP atau komputer</span></div>
        <div class="inst-item"><div class="inst-num">2</div><span>Masukkan <strong>Nomor Pengajuan</strong> dan <strong>Kode Akses Bersama</strong> di atas</span></div>
        <div class="inst-item"><div class="inst-num">3</div><span>Satu kode akses ini dapat memantau status <strong>seluruh ${items.length} SKPP</strong> sekaligus</span></div>
      </div>
      <div class="warn"><span>⚠️</span><span><strong>Serahkan kode akses ini kepada Bendahara OPD</strong> bersama tanda terima. Kode bersifat rahasia dan dipakai untuk memantau status seluruh pengajuan di atas.</span></div>
      <div class="ttd">
        <div class="box"><b>Yang Menyerahkan,</b><div class="role">Bendahara / Perwakilan OPD</div><div class="sl"></div><div style="margin-top:6px">(________________________)</div></div>
      </div>
    </div>
    <div class="footer">
      <div>Bidang Perbendaharaan – Badan Keuangan Daerah Provinsi NTT</div>
      <div>Tanda terima diterbitkan otomatis oleh SI-PASTI</div>
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
  </body></html>`;
  const win = window.open("", "_blank", "width=940,height=820");
  win.document.write(html);
  win.document.close();
}

const TAHAPAN_A = [
  { id:"A1", label:"Berkas Diterima di Loket",      icon:"📥", pelaksana:"Staf Loket" },
  { id:"A2", label:"Verifikasi Kelengkapan Berkas", icon:"🔍", pelaksana:"Staf Pengampu OPD" },
  { id:"A4", label:"Pembuatan Draft SKPP",          icon:"📝", pelaksana:"Staf Perbendaharaan" },
  { id:"A5", label:"Verifikasi & Proses Tanda Tangan Pimpinan", icon:"✅", pelaksana:"Staf Pengampu OPD → Kasubid → Kuasa BUD" },
  { id:"A6", label:"Penempelan Foto & Penomoran",   icon:"📸", pelaksana:"Staf Loket" },
  { id:"A7", label:"SKPP Siap Diserahkan",          icon:"🎉", pelaksana:"Staf Loket", final:true },
];
const TAHAPAN_B = [
  { id:"B1",  label:"Berkas Diterima di Loket",            icon:"📥", pelaksana:"Staf Loket" },
  { id:"B2",  label:"Verifikasi Kelengkapan Berkas",       icon:"🔍", pelaksana:"Staf Pengampu OPD" },
  { id:"B4",  label:"Perhitungan Kekurangan (SIMgaji)",    icon:"🖥️", pelaksana:"Staf Pengampu OPD" },
  { id:"B5",  label:"Rincian Perhitungan Kekurangan Pembayaran Pangkat Pengabdian diserahkan ke Bendahara OPD", icon:"📤", pelaksana:"Staf Pengampu OPD" },
  { id:"B6",  label:"SPP-SPM Diterima dari OPD",          icon:"📋", pelaksana:"Staf Perbendaharaan" },
  { id:"B7",  label:"Proses SP2D Kekurangan Pembayaran Pangkat Pengabdian", icon:"💳", pelaksana:"Staf Perbendaharaan" },
  { id:"B8",  label:"Pembuatan Draft SKPP",               icon:"📝", pelaksana:"Staf Perbendaharaan" },
  { id:"B9",  label:"Verifikasi & Proses Tanda Tangan Pimpinan", icon:"✅", pelaksana:"Staf Pengampu OPD → Kasubid → Kuasa BUD" },
  { id:"B10", label:"Penempelan Foto & Penomoran",        icon:"📸", pelaksana:"Staf Loket" },
  { id:"B11", label:"SKPP Siap Diserahkan",               icon:"🎉", pelaksana:"Staf Loket", final:true },
];

const cekIzinProses = (userRole, pelaksanaTahapan) => {
  if (userRole === "admin") return true;
  if (pelaksanaTahapan === "Staf Perbendaharaan" || pelaksanaTahapan === "Operator / Staf Perbendaharaan") {
    return userRole === "operator" || userRole === "staf";
  }
  if (pelaksanaTahapan === "Staf Loket" || pelaksanaTahapan === "Operator SIMgaji") return userRole === "operator";
  if (pelaksanaTahapan === "Staf Pengampu OPD" || pelaksanaTahapan === "Penyusun SKPP") return userRole === "staf";
  if (pelaksanaTahapan?.includes("Kasubid") || pelaksanaTahapan?.includes("Kuasa BUD")) {
    return userRole === "staf" || userRole === "admin";
  }
  return false;
};


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
const IcoBellFilled = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="#f97316" stroke="#f97316" strokeWidth="1.5"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="#f97316" strokeWidth="2"/>
  </svg>
);
const IcoArrowBack = () => <Ico><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></Ico>;
const IcoPrint = () => <Ico><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></Ico>;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Mono:wght@400;500&display=swap');

  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* ── DESIGN.MD COLOR TOKENS ── */
    --primary: #4F6BCD;
    --on-primary: #ffffff;
    --primary-container: #3D5FC0;
    --on-primary-container: #a5bdff;
    --inverse-primary: #b1c5ff;
    --primary-fixed: #EEF2FF;
    --primary-fixed-dim: #b1c5ff;
    --on-primary-fixed: #1e3a8a;
    --on-primary-fixed-variant: #3D5FC0;

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
    --navy:    #4F6BCD;
    --blue:    #3D5FC0;
    --green:   #059669;
    --amber:   #f59e0b;
    --red:     #ba1a1a;
    --success: #059669;
    --warning: #f59e0b;
    --g50:  #f9f9fc; --g100: #f3f3f6; --g200: #eeeef0; --g300: #cbd5e1;
    --g400: #737784; --g500: #64748b; --g600: #434653; --g700: #1a1c1e; --g800: #1a1c1e;
    --on-surface-var: #434653;
    --outline-var:    #c3c6d5;
    --primary-pale:   #EEF2FF;
    --primary-dark:   #1e3a8a;
    --primary-light:  #6366F1;
    --secondary-pale: #ffdf9e;
    --secondary-light: #fabd00;
    --success-pale:   #d1fae5;
    --warning-pale:   #fef3c7;
    --error-pale:     #ffdad6;

    /* ── TYPOGRAPHY SCALE ── */
    --font: 'Inter', -apple-system, sans-serif;
    --mono: 'JetBrains Mono', 'Fira Code', monospace;

    /* ── ELEVATION / SHADOW ── */
    --shadow-1: 0px 4px 20px rgba(79,107,205,0.07);
    --shadow-2: 0px 12px 32px rgba(79,107,205,0.13);
    --shadow-card: 0px 2px 8px rgba(79,107,205,0.06), 0px 4px 20px rgba(79,107,205,0.07);
    --shadow-modal: 0px 20px 60px rgba(79,107,205,0.18), 0px 4px 12px rgba(79,107,205,0.1);

    /* ── RADII ── */
    --r-sm:   0.375rem;  /* 6px */
    --r-md:   0.875rem;  /* 14px — buttons, inputs */
    --r:      1.25rem;   /* 20px — standard cards */
    --r-lg:   1.75rem;   /* 28px — large cards, modals */
    --r-full: 9999px;    /* pills */
    --rs:     14px;      /* compat alias */

    /* ── SPACING ── */
    --sidebar: 224px;
    --sidebar-collapsed: 60px;
  }

  body {
    font-family: var(--font);
    background: var(--surface);
    color: var(--on-surface);
    min-height: 100vh;
    overflow-y: auto;
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
    background: #ffffff;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    border-right: 1px solid rgba(203,213,225,0.6);
    padding: 14px 10px;
    overflow: hidden;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 2px 0 20px rgba(79,107,205,0.04);
  }
  .sidebar.collapsed {
    width: var(--sidebar-collapsed);
    padding: 14px 5px;
  }

  /* ── Header row ── */
  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    min-height: 58px;
    flex-shrink: 0;
  }

  /* Logo / tombol expand — selalu terlihat, lebar tetap */
  .sidebar-logo {
    width: 56px; height: 56px;
    min-width: 56px;
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
    background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
    border-radius: var(--r-md);
    padding: 12px 14px;
    border: 1px solid rgba(99,102,241,0.15);
    margin-bottom: 12px;
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
    display: flex; align-items: center; gap: 9px;
    width: 100%; height: 38px;
    padding: 0 10px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s,
                border-radius 0.3s, justify-content 0.15s;
    color: var(--on-surface-variant);
    position: relative;
    border-left: 3px solid transparent;
    font-size: 12.5px; font-weight: 500;
    white-space: nowrap;
  }
  .nav-item:hover { background: #F5F7FF; color: var(--primary); }
  .nav-item.active {
    background: #EEF2FF; color: #4F6BCD;
    border-left-color: #4F6BCD; font-weight: 600;
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
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(203,213,225,0.5);
    padding: 0 28px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    position: relative;
    z-index: 200;
    box-shadow: 0 1px 16px rgba(79,107,205,0.06);
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
    position: fixed;
    top: 64px;
    right: 16px;
    width: 230px;
    background: #ffffff;
    border: 1px solid rgba(203,213,225,0.5);
    border-radius: 20px;
    box-shadow: 0 16px 48px rgba(79,107,205,0.16), 0 4px 16px rgba(79,107,205,0.08);
    z-index: 9999;
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
    position: fixed;
    top: 64px;
    right: 60px;
    width: 310px;
    background: var(--surface-container-lowest);
    border: 1px solid var(--outline-variant);
    border-radius: var(--r);
    box-shadow: var(--shadow-2);
    z-index: 9999;
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
  @keyframes bell-shake {
    0%,100% { transform: rotate(0deg); }
    10%      { transform: rotate(-14deg); }
    20%      { transform: rotate(12deg); }
    30%      { transform: rotate(-10deg); }
    40%      { transform: rotate(8deg); }
    50%      { transform: rotate(-6deg); }
    60%      { transform: rotate(4deg); }
    70%      { transform: rotate(-2deg); }
    80%      { transform: rotate(1deg); }
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
  .notif-btn.has-notif { color: #f97316; }
  .notif-btn.has-notif svg {
    animation: bell-shake 2.5s ease-in-out infinite;
    transform-origin: top center;
  }
  .notif-btn:hover { background: var(--surface-container); color: #f97316; }
  .notif-dot {
    position: absolute; top: 5px; right: 5px;
    width: 7px; height: 7px;
    background: #ef4444;
    border: 1.5px solid white;
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

  .content { flex: 1; overflow-y: auto; padding: 24px 28px; }

  /* ════════════════════════════════════════════
     CARDS  — Level 1 elevation
  ════════════════════════════════════════════ */
  .card {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 2px 16px rgba(79,107,205,0.06);
    border: 1px solid rgba(203,213,225,0.5);
    overflow: hidden;
  }
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #dde4f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    background: linear-gradient(180deg, #f6f9fe 0%, #eaf0fa 100%);
  }
  .card-header-title {
    font-weight: 700;
    font-size: 13px;
    color: var(--on-surface);
    letter-spacing: -0.2px;
  }
  .card-body { padding: 20px; }

  /* ════════════════════════════════════════════
     STAT GRID  (4-column dashboard)
  ════════════════════════════════════════════ */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 16px;
  }
  .stat-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 18px 20px;
    border: 1px solid rgba(203,213,225,0.5);
    box-shadow: 0 2px 16px rgba(79,107,205,0.07);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .stat-card:hover {
    box-shadow: 0 8px 32px rgba(79,107,205,0.14);
    transform: translateY(-3px);
  }
  .stat-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .stat-num {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1;
  }
  .stat-label {
    font-size: 10px;
    color: var(--on-surface-variant);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-top: 4px;
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
    background: #ffffff;
    border-radius: 20px;
    padding: 18px;
    border: 1px solid rgba(203,213,225,0.5);
    box-shadow: 0 2px 12px rgba(79,107,205,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 80px;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .stat-card-v2:hover { box-shadow: 0 8px 28px rgba(79,107,205,0.13); transform: translateY(-2px); }
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
    background: #ffffff;
    border-radius: 22px;
    padding: 22px;
    border: 1px solid rgba(203,213,225,0.5);
    box-shadow: 0 2px 16px rgba(79,107,205,0.07);
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
  .opd-rank.first { background: #EEF2FF; color: #4F6BCD; }
  .opd-rank.other { background: var(--surface-container-high); color: var(--on-surface-variant); }

  /* Welcome area */
  .welcome-area {
    margin-bottom: 20px;
    background: linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 80%);
    border-radius: 20px;
    padding: 20px 24px;
    border: 1px solid rgba(99,102,241,0.1);
    box-shadow: 0 2px 16px rgba(79,107,205,0.07);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .welcome-greeting { font-size: 13px; color: #6366F1; font-weight: 600; margin-bottom: 4px; letter-spacing: -0.1px; }
  .welcome-name { font-size: 24px; font-weight: 800; color: var(--on-surface); letter-spacing: -1.2px; line-height: 1.1; }

  /* Terbaru table card */
  .terbaru-card {
    background: #ffffff;
    border-radius: 20px;
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
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
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
    border-bottom: 1px solid #e2e8f4;
    color: var(--on-surface);
    vertical-align: middle;
  }
  .tr-clickable { transition: background .12s; }
  .tr-selected td { background: var(--primary-fixed) !important; }
  /* Tabel di dalam kartu halaman: header navy + zebra biru lembut agar bagian dalam berwarna & kontras */
  .card thead th { background: linear-gradient(180deg, #3a64d8 0%, #2f5bd0 100%); color: #ffffff; border-bottom: none; padding: 11px 13px; }
  .card tbody tr:nth-child(odd) td { background: #eef2fa; }
  .card tbody tr:nth-child(even) td { background: #f7f9fc; }
  .card .tr-clickable:hover td { background: #e1eafb !important; cursor: pointer; }

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
    background: rgba(16,28,52,0.46);
    backdrop-filter: blur(8px);
    display: flex; align-items: flex-start; justify-content: center;
    z-index: 1000;
    padding: 24px;
    overflow-y: auto;
    /* Selaraskan modal dengan palet dashboard (Deep Slate): aksen biru/navy, permukaan sejuk, teks hitam */
    --primary: #2f5bd0;
    --primary-container: #213a6e;
    --primary-fixed: #e9f0fc;
    --on-primary-fixed: #173a8a;
    --on-surface: #0d0d0d;
    --on-surface-variant: #2f3a4e;
    --outline: #4a5568;
    --outline-variant: #dbe2ee;
    --surface-container-lowest: #fbfcff;
    --surface-container-low: #eef2fa;
    --surface-container: #e9eef8;
    --surface-container-high: #e1eafb;
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
  /* Cegah kolom melebar mengikuti konten panjang (mis. nama OPD) — jaga lebar tetap konsisten 1fr : 1fr */
  .grid-2 > * { min-width: 0; }
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
     LOGIN PAGE — SI-PASTI Design System (split-screen)
     Tokens scoped to .login-root / .d2-root so they don't affect the rest of the app.
  ════════════════════════════════════════════ */
  .login-root, .d2-root {
    /* Brand: Navy */
    --navy-950:#001026; --navy-900:#001a40; --navy-800:#002352; --navy-700:#002d63; --navy-600:#003060; --navy-500:#0a3d7a;
    /* Brand: Blue */
    --blue-700:#0a3f96; --blue-600:#0048c0; --blue-500:#1763d6; --blue-400:#4f8ce8; --blue-300:#9cc0f3; --blue-200:#bcd6f7; --blue-100:#dce9fb; --blue-50:#eef5fe;
    /* Brand: Gold */
    --gold-700:#b07d1e; --gold-600:#d3982f; --gold-500:#e0a53c; --gold-400:#ecc06f; --gold-300:#f0d49a; --gold-100:#f9eccf; --gold-50:#fcf6e9;
    /* Neutrals */
    --grey-950:#0c1320; --grey-900:#161d2b; --grey-800:#283143; --grey-700:#3b465b; --grey-600:#586577; --grey-500:#7a8699; --grey-400:#a3adbd; --grey-300:#c9d1dd; --grey-200:#e2e7ef; --grey-150:#eaeef4; --grey-100:#f1f4f9; --grey-50:#f8fafc; --white:#ffffff;
    /* Semantic status */
    --success-700:#1e7a43; --success-600:#1f8a4c; --success-500:#27a35c; --success-100:#d4eedd; --success-50:#e7f6ed;
    --warning-600:#c47d12; --warning-500:#e0951f; --warning-50:#fcf3e0;
    --danger-700:#b21f25; --danger-600:#d22f35; --danger-500:#e2434a; --danger-100:#fadcdc; --danger-50:#fdeced;
    --info-600:#0048c0; --info-50:#eef5fe;
    /* Aliases */
    --surface-page:var(--grey-100); --surface-card:var(--white);
    --text-strong:var(--navy-900); --text-body:var(--grey-800); --text-muted:var(--grey-600); --text-subtle:var(--grey-500);
    --text-link:var(--blue-600); --text-link-hover:var(--blue-700);
    --border-subtle:var(--grey-200); --border-default:var(--grey-300); --border-strong:var(--grey-400); --border-focus:var(--blue-500);
    --field-bg:var(--white); --field-border:var(--grey-300); --field-border-hover:var(--grey-400); --field-placeholder:var(--grey-400);
    --focus-ring:0 0 0 3px rgba(23,99,214,0.28); --focus-ring-danger:0 0 0 3px rgba(226,67,74,0.26);
    /* Type */
    --font-sans:'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --font-display:'Plus Jakarta Sans', system-ui, sans-serif;
    --font-mono:'DM Mono', ui-monospace, 'SFMono-Regular', 'Menlo', monospace;
    --fw-regular:400; --fw-medium:500; --fw-semibold:600; --fw-bold:700; --fw-extrabold:800;
    --text-2xs:0.6875rem; --text-xs:0.75rem; --text-sm:0.875rem; --text-base:1rem; --text-md:1.125rem; --text-lg:1.375rem; --text-xl:1.75rem; --text-2xl:2.25rem;
    --tracking-tight:-0.015em; --tracking-wide:0.02em; --tracking-caps:0.10em;
    --font-body:var(--fw-regular) var(--text-base)/1.5 var(--font-sans);
    --font-body-sm:var(--fw-regular) var(--text-sm)/1.5 var(--font-sans);
    --font-label:var(--fw-semibold) var(--text-sm)/1.28 var(--font-sans);
    /* Radius / elevation / motion */
    --radius-xs:4px; --radius-sm:6px; --radius-md:10px; --radius-lg:14px; --radius-xl:20px; --radius-pill:999px;
    --shadow-xs:0 1px 2px rgba(0,35,82,0.06);
    --shadow-sm:0 1px 3px rgba(0,35,82,0.08), 0 1px 2px rgba(0,35,82,0.05);
    --shadow-md:0 4px 12px rgba(0,35,82,0.08), 0 2px 4px rgba(0,35,82,0.05);
    --shadow-lg:0 12px 28px rgba(0,35,82,0.12), 0 4px 8px rgba(0,35,82,0.06);
    --dur-fast:120ms; --dur-base:200ms; --ease-standard:cubic-bezier(0.2,0,0,1);
  }
  .login-root *, .login-root *::before, .login-root *::after,
  .d2-root *, .d2-root *::before, .d2-root *::after { box-sizing: border-box; }

  .login-root {
    display: grid;
    grid-template-columns: 2fr 1fr;
    zoom: 0.75;
    min-height: calc(100vh / 0.75);
    background: var(--surface-card);
    font: var(--font-body);
    color: var(--text-body);
  }

  /* Left visual panel */
  .login-visual {
    position: relative; overflow: hidden;
    background: var(--navy-800);
  }
  /* Lapisan foto bergantian (cross-fade) */
  .login-photo {
    position: absolute; inset: 0;
    background-size: cover; background-position: center 28%;
    background-repeat: no-repeat;
    opacity: 0; transition: opacity 1.4s ease;
  }
  .login-photo.is-active { opacity: 1; }
  .login-visual__scrim {
    position: absolute; inset: 0;
    background: linear-gradient(155deg, rgba(0,16,38,0.92) 0%, rgba(0,35,82,0.82) 46%, rgba(0,48,96,0.62) 78%, rgba(10,61,122,0.42) 100%);
  }
  .login-visual__inner { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; padding: 40px 48px 30px; }
  .login-orgbar { display: flex; align-items: center; gap: 13px; }
  .login-crest { height: 46px; width: auto; display: block; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35)); }
  .login-org { font: var(--fw-bold) 15px/1.15 var(--font-display); color: #fff; letter-spacing: -0.01em; }
  .login-org-sub { font: var(--fw-medium) 12px/1.2 var(--font-sans); color: rgba(255,255,255,0.72); }
  .login-hero { margin-top: auto; margin-bottom: auto; max-width: 460px; }
  .login-welcome { margin: 26px 0 14px; font: var(--fw-extrabold) clamp(30px, 3.4vw, 44px)/1.08 var(--font-display); letter-spacing: -0.02em; color: #fff; }
  .login-lead { font: var(--fw-regular) var(--text-md)/1.6 var(--font-sans); color: rgba(255,255,255,0.84); margin-bottom: 28px; }
  .login-lead strong { color: var(--gold-400); font-weight: var(--fw-semibold); }
  .login-features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 13px; }
  .login-foot { font: var(--fw-medium) 12px/1.4 var(--font-sans); color: rgba(255,255,255,0.6); }

  /* Right form panel */
  .login-form-pane { display: flex; align-items: center; justify-content: center; padding: 40px 32px; background: var(--surface-card); }
  .login-card { width: 100%; max-width: 404px; display: flex; flex-direction: column; gap: 18px; }
  .login-card__head { margin-bottom: 2px; }
  .login-eyebrow { display: inline-block; font: var(--fw-bold) var(--text-2xs)/1 var(--font-sans); letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--blue-600); margin-bottom: 10px; }
  .login-title { font: var(--fw-extrabold) var(--text-2xl)/1.1 var(--font-display); letter-spacing: -0.02em; color: var(--navy-900); margin-bottom: 7px; }
  .login-subtitle { font: var(--font-body); color: var(--text-muted); }
  .login-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: -2px; }
  .login-forgot { font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); color: var(--text-link); text-decoration: none; }
  .login-forgot:hover { color: var(--text-link-hover); text-decoration: underline; }
  .login-help { font: var(--font-body-sm); color: var(--text-muted); text-align: center; margin-top: 2px; }
  .login-help a { font-weight: var(--fw-semibold); color: var(--text-link); text-decoration: none; }
  .login-help a:hover { text-decoration: underline; }

  @media (max-width: 920px) {
    .login-root { grid-template-columns: 1fr; zoom: 1; min-height: 100vh; }
    .login-visual { display: none; }
  }

  /* ════════════════════════════════════════════
     DASHBOARD — SI-PASTI Design System (d2)
  ════════════════════════════════════════════ */
  /* Tampilan default diperkecil ke 75% agar lebih ringkas.
     Latar bergradasi lembut (biru-lavender pucat) agar tidak silau serba putih,
     namun kartu tetap putih supaya teks tajam & mudah terbaca. */
  .d2-root {
    display: grid; grid-template-columns: 264px 1fr; zoom: 0.75; min-height: calc(100vh / 0.75);
    /* Tema Deep Slate — biru-abu sejuk, low-glare */
    background:
      radial-gradient(1100px 520px at 100% -5%, rgba(110,150,225,0.16) 0%, transparent 55%),
      radial-gradient(900px 480px at -5% 110%, rgba(130,120,200,0.10) 0%, transparent 55%),
      linear-gradient(158deg, #e2e8f2 0%, #dde4ef 52%, #e5e8f1 100%);
    background-attachment: fixed;
    font: var(--font-body); color: var(--text-body);
    /* Override token (scoped ke dashboard) — nuansa biru sejuk */
    --surface-card: #f7f9fc;
    --surface-page: #dfe5ef;
    --blue-700:#1d3f8f; --blue-600:#2f5bd0; --blue-500:#3a64d8; --blue-400:#6f93e6;
    --blue-100:#dbe6fb; --blue-50:#eef3fc;
    --border-subtle:#dbe2ee; --border-default:#cad5e7; --border-strong:#b6c3db;
    /* Semua teks hitam (kontras maksimal) */
    --text-strong:#0d0d0d; --text-body:#0d0d0d; --text-muted:#0d0d0d; --text-subtle:#1a1a1a;
    --grey-50:#f3f6fb; --grey-100:#e9eef7; --grey-150:#e1e8f3;
    /* Token Material (dipakai komponen halaman) — ikut hitam */
    --on-surface:#0d0d0d; --on-surface-variant:#0d0d0d; --outline:#1a1a1a;
  }
  .d2-root .tnum, .login-root .tnum { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1, 'zero' 0; }
  /* Kartu gading + sedikit terangkat (bayangan hangat) agar terpisah jelas dari latar. */
  .d2-root .kpi, .d2-root .d2-jalur, .d2-root .d2-opd, .d2-root .d2-tbl-card,
  .d2-root .card, .d2-root .terbaru-card, .d2-root .opd-card {
    background: #f7f9fc;
    box-shadow: 0 1px 2px rgba(20,45,95,0.05), 0 14px 28px -16px rgba(20,45,95,0.22);
  }

  /* Sidebar — tint biru sejuk, bukan putih polos */
  .d2-side { background: linear-gradient(184deg, #f1f5fb 0%, #e2e9f4 100%); border-right: 1px solid #d6dfee; display: flex; flex-direction: column; padding: 18px 14px; position: sticky; top: 0; height: calc(100vh / 0.75); }
  .d2-brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 16px; height: 68px; overflow: visible; }
  .d2-mark { height: 32px; width: auto; flex: none; }
  .d2-brand-txt { display: flex; flex-direction: column; line-height: 1.12; min-width: 0; overflow: hidden; max-height: 48px; }
  .d2-brand-txt b { font-family: var(--font-display); font-weight: 700; font-size: 15px; line-height: 1; color: var(--navy-800); letter-spacing: -0.01em; }
  .d2-brand-txt span { font: var(--fw-medium) 10px/1.3 var(--font-sans); color: var(--text-subtle); margin-top: 3px; }
  .d2-admin { display: flex; align-items: center; gap: 11px; padding: 11px 12px; margin-bottom: 8px; background: var(--blue-50); border: 1px solid var(--blue-100); border-radius: var(--radius-md); }
  .d2-admin-av { width: 38px; height: 38px; border-radius: 50%; flex: none; background: var(--navy-600); color: #fff; display: grid; place-content: center; font: var(--fw-bold) var(--text-sm)/1 var(--font-sans); }
  .d2-admin-txt { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .d2-admin-txt b { font: var(--fw-bold) var(--text-sm)/1.2 var(--font-sans); color: var(--text-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .d2-admin-role { align-self: flex-start; font: var(--fw-bold) 9px/1 var(--font-sans); letter-spacing: 0.08em; text-transform: uppercase; color: var(--blue-700); background: var(--white); border: 1px solid var(--blue-200); padding: 3px 7px; border-radius: var(--radius-pill); }
  .d2-navwrap { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; flex: 1; }
  .d2-navlabel { font: var(--fw-bold) 10px/1 var(--font-sans); letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--grey-400); padding: 8px 12px 6px; }
  .d2-navitem { display: flex; align-items: center; gap: 12px; min-height: 42px; padding: 10px 12px; border: none; background: transparent; cursor: pointer; border-radius: var(--radius-md); color: var(--grey-600); font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); text-align: left; width: 100%; transition: background var(--dur-fast), color var(--dur-fast); }
  .d2-navic { display: inline-flex; color: var(--grey-500); transition: color var(--dur-fast), transform .22s cubic-bezier(.34,1.56,.64,1); }
  .d2-navitem:hover .d2-navic { transform: scale(1.18) translateY(-1px); }
  .d2-navitem:active .d2-navic { transform: scale(.94); transition-duration: .08s; }
  .d2-navtxt { flex: 1; }
  .d2-navitem:hover { background: var(--grey-100); color: var(--navy-800); }
  .d2-navitem:hover .d2-navic { color: var(--navy-700); }
  .d2-navitem.is-active { background: var(--blue-600); color: #fff; box-shadow: var(--shadow-sm); }
  .d2-navitem.is-active .d2-navic { color: #fff; }
  .d2-navbadge { flex: none; min-width: 20px; height: 20px; padding: 0 6px; border-radius: var(--radius-pill); background: var(--danger-500); color: #fff; font: var(--fw-bold) var(--text-2xs)/20px var(--font-sans); text-align: center; }
  .d2-navitem.is-active .d2-navbadge { background: #fff; color: var(--danger-600); }
  .d2-logout { margin-top: auto; display: flex; align-items: center; gap: 12px; padding: 11px 12px; border: 1px solid var(--border-subtle); background: var(--white); cursor: pointer; border-radius: var(--radius-md); color: var(--danger-600); font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); transition: background var(--dur-fast); width: 100%; }
  .d2-logout:hover { background: var(--danger-50); }

  /* ── Sidebar collapsible: rail ikon statis, transisi halus ── */
  .d2-side { width: 264px; z-index: 30; transition: width .28s cubic-bezier(.4,0,.2,1), padding .28s cubic-bezier(.4,0,.2,1); }
  /* Wrapper logo (jadi tombol perluas saat ciut) */
  .d2-logo-btn { display: inline-flex; align-items: center; flex: none; }
  .d2-side.d2-rail .d2-logo-btn { position: relative; cursor: pointer; }
  .d2-collapse-btn { position: relative; }
  /* Tooltip mengambang: nama menu (mode ciut) + buka/tutup panel (tombol & logo) */
  .d2-side.d2-rail .d2-navitem::after,
  .d2-side.d2-rail .d2-logo-btn::after,
  .d2-collapse-btn::after {
    content: attr(data-tip);
    position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%) scale(.96);
    transform-origin: left center;
    background: var(--navy-800); color: #fff;
    padding: 6px 11px; border-radius: 9px;
    font: var(--fw-semibold) 12.5px/1 var(--font-sans); white-space: nowrap; letter-spacing: .01em;
    box-shadow: 0 6px 20px -6px rgba(15,23,42,.5);
    opacity: 0; pointer-events: none; z-index: 9999;
    transition: opacity .14s ease, transform .14s ease;
  }
  .d2-side.d2-rail .d2-navitem:hover::after,
  .d2-side.d2-rail .d2-logo-btn:hover::after,
  .d2-collapse-btn:hover::after { opacity: 1; transform: translateY(-50%) scale(1); }
  /* Ikon dikunci agar tidak pernah menyusut/menggeser saat sidebar menyempit */
  .d2-navic { flex: none; width: 19px; justify-content: flex-start; }
  .d2-admin-av { flex: none; }
  .d2-collapse-btn { margin-left: auto; flex: none; width: 32px; height: 32px; display: grid; place-content: center; border: none; background: transparent; border-radius: 8px; color: var(--grey-500); cursor: pointer; transition: background .15s, color .15s; }
  .d2-collapse-btn:hover { background: var(--grey-100); color: var(--navy-700); }
  /* Saat ciut: tombol toggle diganti logo SI-PASTI (logo jadi tombol perluas) */
  .d2-side.d2-rail .d2-collapse-btn { display: none; }
  /* Teks: fade halus (bukan hilang seketika) */
  .d2-brand-txt, .d2-admin-txt, .d2-navtxt { transition: opacity .2s ease; }
  .d2-navtxt { min-width: 0; overflow: hidden; white-space: nowrap; }
  .d2-navlabel { white-space: nowrap; overflow: hidden; max-height: 30px; transition: opacity .18s ease, max-height .26s cubic-bezier(.4,0,.2,1), padding .26s ease; }

  /* Saat diciutkan: grid & sidebar menyempit serempak (halus) */
  .d2-root { transition: grid-template-columns .28s cubic-bezier(.4,0,.2,1); }
  .d2-root.side-collapsed { grid-template-columns: 72px 1fr; }
  .d2-root.side-collapsed .d2-side { width: 72px; }

  /* Mode rail: HANYA teks yang memudar; posisi & padding ikon tidak berubah */
  .d2-side.d2-rail .d2-brand-txt,
  .d2-side.d2-rail .d2-admin-txt,
  .d2-side.d2-rail .d2-navtxt { opacity: 0; pointer-events: none; }
  /* Label seksi: HANYA teks memudar; tinggi/ruang DIPERTAHANKAN agar ikon di
     bawahnya tidak naik (mencegah pergeseran vertikal). */
  .d2-side.d2-rail .d2-navlabel { opacity: 0; }
  .d2-side.d2-rail .d2-mark { display: block; cursor: pointer; }
  /* Avatar: chip dibersihkan (border tetap, warna transparan) + dipusatkan
     horizontal di rail via padding tetap (anchor, bukan width-relative -> tak nge-slide).
     Avatar 38px, rail 72px => left = (72-38)/2 = 17px = padding-left 2 (14 side +1 border). */
  .d2-admin { transition: padding .28s cubic-bezier(.4,0,.2,1); }
  .d2-side.d2-rail .d2-admin { background: transparent; border-color: transparent; padding-left: 2px; padding-right: 2px; }
  .d2-side.d2-rail .d2-admin-txt { width: 0; overflow: hidden; }
  /* Badge jadi dot di pojok ikon */
  .d2-side.d2-rail .d2-navitem { position: relative; }
  .d2-side.d2-rail .d2-navbadge { position: absolute; top: 4px; left: 26px; min-width: 16px; height: 16px; padding: 0 4px; line-height: 16px; font-size: 9px; }

  /* Main */
  .d2-main { display: flex; flex-direction: column; min-width: 0; }
  .d2-top { display: flex; align-items: center; gap: 18px; padding: 16px 28px; min-height: 64px; background: rgba(244,247,252,0.82); backdrop-filter: saturate(1.3) blur(8px); -webkit-backdrop-filter: saturate(1.3) blur(8px); border-bottom: 1px solid #dde4f0; position: sticky; top: 0; z-index: 10; }
  .d2-top-org { display: flex; flex-direction: column; line-height: 1.25; flex: none; }
  .d2-top-org b { font-family: var(--font-display); font-weight: 900; font-size: 15px; line-height: 1.2; color: var(--navy-900); letter-spacing: -0.01em; white-space: nowrap; }
  .d2-top-org span { font: var(--fw-medium) var(--text-xs)/1.2 var(--font-sans); color: var(--text-muted); white-space: nowrap; }
  .d2-top-right { display: flex; align-items: center; gap: 16px; flex: none; margin-left: auto; }
  .d2-greet { font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); color: var(--text-muted); white-space: nowrap; }
  .d2-ticker { flex: none; width: 320px; display: flex; align-items: center; overflow: hidden; position: relative; margin: 0 4px; -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%); }
  .d2-ticker-track { display: inline-flex; align-items: center; gap: 34px; white-space: nowrap; will-change: transform; animation: d2-marquee 38s linear infinite; }
  .d2-ticker:hover .d2-ticker-track { animation-play-state: paused; }
  .d2-ticker-item { display: inline-flex; align-items: center; gap: 10px; font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); color: var(--text-muted); }
  .d2-ticker-item::before { content: ""; flex: none; width: 5px; height: 5px; border-radius: 50%; background: var(--gold-500); }
  @keyframes d2-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) { .d2-ticker-track { animation: none; } }
  .d2-iconbtn { position: relative; border: 1px solid var(--border-subtle); background: var(--white); width: 40px; height: 40px; border-radius: var(--radius-md); color: var(--grey-600); cursor: pointer; display: grid; place-content: center; }
  .d2-iconbtn:hover { background: var(--grey-50); color: var(--navy-700); }
  .d2-iconbtn.is-alert { color: var(--gold-600); border-color: var(--gold-300); background: var(--gold-50); }
  .d2-iconbtn.is-alert:hover { background: var(--gold-100); color: var(--gold-700); }
  .d2-iconbtn.is-alert svg { transform-origin: 50% 4px; animation: d2-ring 2.6s ease-in-out infinite; }
  .d2-iconbtn.is-alert[aria-expanded="true"] svg { animation: none; }
  @keyframes d2-ring { 0%,82%,100% { transform: rotate(0); } 84% { transform: rotate(13deg); } 86% { transform: rotate(-11deg); } 88% { transform: rotate(9deg); } 90% { transform: rotate(-7deg); } 92% { transform: rotate(5deg); } 94% { transform: rotate(-3deg); } 96% { transform: rotate(0); } }
  @media (prefers-reduced-motion: reduce) { .d2-iconbtn.is-alert svg { animation: none; } }
  .d2-notif-badge { position: absolute; top: -5px; right: -5px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px; background: var(--gold-500); color: #fff; border: 2px solid #fff; font: var(--fw-bold) 11px/14px var(--font-sans); display: flex; align-items: center; justify-content: center; }
  .d2-notif { position: relative; flex: none; }
  .d2-notif-menu { position: absolute; top: calc(100% + 12px); right: 0; z-index: 50; width: 360px; background: var(--white); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden; transform-origin: top right; animation: d2-pop var(--dur-base) var(--ease-standard); }
  .d2-notif-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 18px 13px; border-bottom: 1px solid var(--border-subtle); }
  .d2-notif-head b { display: block; font: var(--fw-bold) var(--text-md)/1.2 var(--font-sans); color: var(--navy-900); }
  .d2-notif-head span { display: block; margin-top: 2px; font: var(--fw-medium) var(--text-xs)/1 var(--font-sans); color: var(--text-muted); }
  .d2-notif-list { max-height: 360px; overflow-y: auto; }
  .d2-notif-item { position: relative; display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 13px 18px; border: 0; border-bottom: 1px solid var(--border-subtle); background: transparent; text-align: left; cursor: pointer; transition: background var(--dur-fast); }
  .d2-notif-item:hover { background: var(--grey-50); }
  .d2-notif-item.is-unread { background: var(--blue-50); }
  .d2-notif-item.is-unread:hover { background: var(--blue-100); }
  .d2-notif-ic { flex: none; width: 34px; height: 34px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; }
  .d2-notif-ic.tone-blue { background: var(--blue-100); color: var(--blue-700); }
  .d2-notif-ic.tone-amber { background: var(--gold-100); color: var(--gold-700); }
  .d2-notif-ic.tone-green { background: var(--success-100); color: var(--success-700); }
  .d2-notif-ic.tone-red { background: var(--danger-100); color: var(--danger-600); }
  .d2-notif-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .d2-notif-txt b { font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans); color: var(--navy-900); }
  .d2-notif-desc { font: var(--fw-regular) var(--text-xs)/1.4 var(--font-sans); color: var(--text-muted); }
  .d2-notif-time { margin-top: 2px; font: var(--fw-medium) 11px/1 var(--font-mono); color: var(--grey-500); }
  .d2-notif-pip { position: absolute; top: 16px; right: 16px; width: 8px; height: 8px; border-radius: 50%; background: var(--gold-500); flex: none; }
  .d2-notif-empty { padding: 26px 18px; text-align: center; font: var(--font-body-sm); color: var(--text-muted); }
  .d2-notif-foot { display: block; width: 100%; padding: 13px; border: 0; background: var(--white); cursor: pointer; font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); color: var(--blue-600); transition: background var(--dur-fast); }
  .d2-notif-foot:hover { background: var(--blue-50); }
  .d2-crest { height: 34px; width: auto; display: block; }
  .d2-profile { position: relative; flex: none; }
  .d2-crestbtn { border: 0; background: transparent; padding: 2px; border-radius: var(--radius-md); cursor: pointer; line-height: 0; transition: background var(--dur-fast); }
  .d2-crestbtn:hover { background: var(--grey-50); }
  .d2-crestbtn[aria-expanded="true"] { background: var(--grey-100); box-shadow: var(--focus-ring); }
  .d2-scrim { position: fixed; inset: 0; z-index: 40; }
  .d2-profile-menu { position: absolute; top: calc(100% + 12px); right: 0; z-index: 50; width: 268px; background: var(--white); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden; transform-origin: top right; animation: d2-pop var(--dur-base) var(--ease-standard); }
  @keyframes d2-pop { from { opacity: 0; transform: translateY(-6px) scale(.97); } to { opacity: 1; transform: none; } }
  .d2-profile-id { display: flex; align-items: center; gap: 12px; padding: 16px 18px 14px; }
  .d2-profile-crest { height: 38px; width: auto; flex: none; }
  .d2-profile-id b { display: block; font: var(--fw-bold) var(--text-sm)/1.3 var(--font-sans); color: var(--navy-900); }
  .d2-profile-id span { display: block; margin-top: 2px; font: var(--fw-medium) var(--text-xs)/1 var(--font-sans); color: var(--text-muted); }
  .d2-profile-org { padding: 12px 18px; border-top: 1px solid var(--border-subtle); }
  .d2-profile-org b { display: block; font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans); color: var(--navy-800); }
  .d2-profile-org span { display: block; margin-top: 2px; font: var(--fw-medium) var(--text-xs)/1 var(--font-sans); color: var(--text-muted); }
  .d2-profile-actions { padding: 6px; border-top: 1px solid var(--border-subtle); }
  .d2-profile-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border: 0; background: transparent; border-radius: var(--radius-md); cursor: pointer; font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); color: var(--navy-800); text-align: left; transition: background var(--dur-fast); }
  .d2-profile-item:hover { background: var(--blue-50); color: var(--blue-700); }
  .d2-profile-item.danger { color: var(--danger-600); }
  .d2-profile-item.danger:hover { background: var(--danger-50); color: var(--danger-700); }
  .d2-profile-item svg { flex: none; color: var(--grey-500); }
  .d2-profile-item:hover svg { color: var(--blue-600); }

  .d2-body { padding: 18px 28px 36px; display: flex; flex-direction: column; gap: 18px; }
  .d2-headrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .d2-welcome { display: flex; flex-direction: column; gap: 2px; }
  .d2-welcome-sub { font: var(--fw-medium) var(--text-sm)/1 var(--font-sans); color: var(--text-muted); }
  .d2-welcome-name { font: var(--fw-extrabold) var(--text-lg)/1.15 var(--font-display); letter-spacing: -0.02em; color: var(--navy-900); }
  .d2-filters { display: inline-flex; gap: 4px; padding: 4px; background: var(--white); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-xs); }
  .d2-filter { border: none; background: transparent; cursor: pointer; padding: 8px 14px; border-radius: var(--radius-sm); font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); color: var(--text-muted); transition: background var(--dur-fast), color var(--dur-fast); }
  .d2-filter:hover { color: var(--navy-800); }
  .d2-filter.is-active { background: var(--blue-600); color: #fff; box-shadow: var(--shadow-sm); }

  .d2-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .kpi { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 16px 18px; display: flex; flex-direction: column; }
  .kpi__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .kpi__label { font: var(--fw-bold) var(--text-2xs)/1.2 var(--font-sans); letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-subtle); }
  .kpi__icon { flex: none; width: 34px; height: 34px; border-radius: var(--radius-md); display: grid; place-content: center; }
  .kpi__value { font: var(--fw-extrabold) 38px/1 var(--font-display); margin: 8px 0 10px; color: var(--navy-800); }
  .kpi__viznote { font: var(--fw-semibold) 10px/1 var(--font-sans); letter-spacing: 0.04em; text-transform: uppercase; color: var(--grey-400); margin-bottom: 8px; }
  .kpi__viz { min-height: 36px; display: flex; align-items: flex-end; }
  .kpi__pct { width: 100%; display: flex; align-items: center; gap: 10px; }
  .kpi__pcttrack { flex: 1; height: 8px; border-radius: var(--radius-pill); background: var(--grey-150); overflow: hidden; }
  .kpi__pctfill { height: 100%; border-radius: var(--radius-pill); background: var(--success-500); }
  .kpi__pctnum { font: var(--fw-bold) var(--text-sm)/1 var(--font-mono); color: var(--success-600); }
  .kpi__foot { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle); font: var(--fw-medium) var(--text-xs)/1 var(--font-sans); color: var(--text-subtle); }

  .d2-analysis { display: grid; grid-template-columns: 1fr 1fr 1.15fr; gap: 16px; }
  .d2-jalur { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 18px 20px; display: flex; flex-direction: column; }
  .d2-jalur-head { display: flex; align-items: center; justify-content: space-between; }
  .d2-jalur-tag { font: var(--fw-bold) var(--text-2xs)/1 var(--font-sans); letter-spacing: 0.04em; text-transform: uppercase; color: #fff; padding: 5px 10px; border-radius: var(--radius-pill); }
  .d2-jalur-count { font: var(--fw-extrabold) 30px/1 var(--font-display); color: var(--navy-800); }
  .d2-jalur-desc { font: var(--fw-medium) var(--text-sm)/1.3 var(--font-sans); color: var(--text-muted); margin: 10px 0 16px; }
  .d2-jalur-bar { height: 8px; border-radius: var(--radius-pill); background: var(--grey-150); overflow: hidden; }
  .d2-jalur-fill { height: 100%; border-radius: var(--radius-pill); min-width: 2px; }
  .d2-jalur-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font: var(--fw-medium) var(--text-xs)/1 var(--font-sans); color: var(--text-muted); }
  .d2-opd { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 16px 18px; }
  .d2-opd-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .d2-opd-head h3 { font: var(--fw-bold) var(--text-md)/1 var(--font-display); color: var(--navy-900); }
  .d2-opd-tag { font: var(--fw-semibold) var(--text-2xs)/1 var(--font-sans); color: var(--text-subtle); background: var(--grey-100); padding: 4px 9px; border-radius: var(--radius-pill); }
  .d2-opd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
  .d2-opd-item { display: flex; align-items: center; gap: 12px; }
  .d2-opd-rank { flex: none; width: 26px; height: 26px; border-radius: var(--radius-sm); background: var(--blue-50); color: var(--blue-700); display: grid; place-content: center; font: var(--fw-bold) var(--text-sm)/1 var(--font-mono); }
  .d2-opd-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .d2-opd-name { font: var(--fw-semibold) var(--text-sm)/1.2 var(--font-sans); color: var(--text-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .d2-opd-track { height: 6px; border-radius: var(--radius-pill); background: var(--grey-150); overflow: hidden; }
  .d2-opd-fill { height: 100%; border-radius: var(--radius-pill); background: var(--blue-500); }
  .d2-opd-stat { flex: none; display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2; }
  .d2-opd-stat b { font: var(--fw-extrabold) var(--text-base)/1 var(--font-display); color: var(--navy-800); }
  .d2-opd-stat span { font: var(--fw-medium) var(--text-xs)/1 var(--font-mono); color: var(--text-subtle); }
  .d2-opd-empty { font: var(--font-body-sm); color: var(--text-muted); padding: 10px 0; }

  .d2-tbl-card { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
  .d2-tbl-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 13px; }
  .d2-tbl-head h3 { font: var(--fw-bold) var(--text-lg)/1 var(--font-display); color: var(--navy-900); }
  .d2-tbl-meta { font: var(--fw-medium) var(--text-xs)/1 var(--font-sans); color: var(--text-subtle); }
  .d2-tbl-scroll { overflow-x: auto; }
  .d2-tbl { width: 100%; border-collapse: collapse; min-width: 900px; }
  .d2-tbl th:nth-child(2), .d2-tbl td:nth-child(2) { width: 30%; min-width: 220px; }
  .d2-tbl th:nth-child(3), .d2-tbl td:nth-child(3) { white-space: nowrap; }
  .d2-tbl thead th { text-align: left; padding: 11px 18px; background: linear-gradient(180deg, #3a64d8 0%, #2f5bd0 100%); border-top: none; border-bottom: none; font: var(--fw-bold) var(--text-2xs)/1 var(--font-sans); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: #ffffff; white-space: nowrap; }
  .d2-tbl tbody td { padding: 13px 18px; border-bottom: 1px solid #e2e8f4; font: var(--font-body-sm); color: var(--text-body); vertical-align: middle; }
  .d2-tbl tbody tr:nth-child(odd) td { background: #eef2fa; }
  .d2-tbl tbody tr:last-child td { border-bottom: none; }
  .d2-tbl tbody tr:hover td { background: #e1eafb; }
  .d2-tbl code { font: var(--fw-medium) var(--text-xs)/1 var(--font-mono); color: var(--navy-700); white-space: nowrap; }
  .d2-cell-opd { font-weight: var(--fw-semibold); color: var(--text-strong); }
  .d2-cell-name { font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px; }
  .d2-nip { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); }
  .d2-jpill { display: inline-flex; align-items: center; font: var(--fw-bold) var(--text-2xs)/1 var(--font-sans); padding: 5px 9px; border-radius: var(--radius-pill); }
  .d2-jpill--A { background: var(--blue-50); color: var(--blue-700); }
  .d2-jpill--B { background: var(--gold-100); color: var(--gold-700); }
  .d2-sbadge { display: inline-flex; align-items: center; gap: 6px; font: var(--fw-bold) var(--text-2xs)/1 var(--font-sans); padding: 5px 10px; border-radius: var(--radius-pill); }
  .d2-sbadge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .d2-sbadge--blue { background: var(--blue-50); color: var(--blue-700); }
  .d2-sbadge--green { background: var(--success-100); color: var(--success-700); }
  .d2-sbadge--danger { background: var(--danger-100); color: var(--danger-600); }
  .d2-cell-date { color: var(--text-body); font-family: var(--font-mono); }
  .d2-aging { font: var(--fw-semibold) var(--text-2xs)/1 var(--font-sans); color: var(--success-600); margin-top: 3px; }
  .d2-aging.is-warn { color: var(--warning-600); }
  .d2-th-act { text-align: right; }
  .d2-act { border: 1px solid var(--border-subtle); background: var(--white); width: 32px; height: 32px; border-radius: var(--radius-sm); color: var(--grey-600); cursor: pointer; display: inline-grid; place-content: center; }
  .d2-act:hover { background: var(--blue-50); color: var(--blue-700); border-color: var(--blue-300); }
  .d2-empty { padding: 40px 18px; text-align: center; font: var(--font-body-sm); color: var(--text-muted); }

  @media (max-width: 1100px) {
    .d2-kpis { grid-template-columns: repeat(2, 1fr); }
    .d2-analysis { grid-template-columns: 1fr; }
    .d2-headrow { flex-direction: column; align-items: stretch; }
    .d2-filters { align-self: flex-start; }
    .d2-ticker { display: none; }
  }
  @media (max-width: 920px) {
    .d2-side { display: none; height: 100vh; }
    .d2-root, .d2-root.side-collapsed { grid-template-columns: 1fr; zoom: 1; min-height: 100vh; }
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
/* SI-PASTI design-system primitives (ported from Claude Design handoff bundle).
   Tokens (--navy-*, --font-*, etc.) are provided by the .login-root scope in S. */

const SipUserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const SipShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
);
const SipArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
);
const SipLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const SipEye = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const SipEyeOff = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.1 9.1 0 0 0 5.39-1.61"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88M1 1l22 22"/></svg>
);

function SipLogo({ tone="light" }) {
  const wordColor = tone==="light" ? "#fff" : "var(--navy-800)";
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:10}}>
      <img src="/logo-sipasti-white.png" alt="" aria-hidden="true" style={{height:88,width:"auto",display:"block",flex:"none"}}
        onError={e=>{e.target.style.display="none";}}/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",lineHeight:1}}>
        <span style={{font:"var(--fw-extrabold) 36px/1 var(--font-display)",letterSpacing:"-0.01em",color:wordColor}}>
          SI<span style={{color:"var(--gold-500)"}}>-</span>PASTI
        </span>
        <span style={{marginTop:6,fontSize:12.5,fontWeight:500,letterSpacing:"0.02em",color:tone==="light"?"rgba(255,255,255,0.8)":"var(--on-surface-variant)"}}>
          Sistem Pemantauan Alur SKPP Terintegrasi
        </span>
      </div>
    </div>
  );
}

function SipTextField({ label, hint, error, leadingIcon=null, trailingSlot=null, required=false, type="text", style={}, onFocus, onBlur, ...rest }) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const borderColor = hasError ? "var(--danger-500)" : focused ? "var(--border-focus)" : "var(--field-border)";
  const ring = hasError ? "var(--focus-ring-danger)" : "var(--focus-ring)";
  return (
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {label && (
        <label style={{font:"var(--font-label)",color:"var(--text-strong)"}}>
          {label}{required && <span style={{color:"var(--danger-500)",marginLeft:3}}>*</span>}
        </label>
      )}
      <div style={{position:"relative",display:"flex",alignItems:"center",height:48,background:"var(--field-bg)",
        border:`1.5px solid ${borderColor}`,borderRadius:"var(--radius-md)",boxShadow:focused?ring:"var(--shadow-xs)",
        transition:"border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)"}}>
        {leadingIcon && (
          <span style={{display:"flex",alignItems:"center",paddingLeft:14,color:focused?"var(--blue-600)":"var(--grey-500)",flex:"none",transition:"color var(--dur-fast)"}}>{leadingIcon}</span>
        )}
        <input type={type} required={required} aria-invalid={hasError||undefined}
          onFocus={e=>{setFocused(true);onFocus&&onFocus(e);}}
          onBlur={e=>{setFocused(false);onBlur&&onBlur(e);}}
          style={{flex:1,minWidth:0,height:"100%",border:"none",outline:"none",background:"transparent",
            padding:leadingIcon?"0 12px 0 11px":"0 14px",font:"var(--font-body)",color:"var(--text-strong)",...style}}
          {...rest}/>
        {trailingSlot && <span style={{display:"flex",alignItems:"center",paddingRight:8,flex:"none"}}>{trailingSlot}</span>}
      </div>
      {(hint||error) && (
        <span style={{font:"var(--fw-regular) var(--text-xs)/1.4 var(--font-sans)",color:hasError?"var(--danger-600)":"var(--text-muted)"}}>{error||hint}</span>
      )}
    </div>
  );
}

function SipPasswordField(props) {
  const [visible, setVisible] = useState(false);
  return (
    <SipTextField {...props} type={visible?"text":"password"} leadingIcon={<SipLock/>}
      trailingSlot={
        <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?"Sembunyikan kata sandi":"Tampilkan kata sandi"}
          style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:36,height:36,border:"none",
            background:"transparent",color:"var(--grey-500)",cursor:"pointer",borderRadius:"var(--radius-sm)"}}
          onMouseEnter={e=>{e.currentTarget.style.color="var(--navy-700)";e.currentTarget.style.background="var(--grey-100)";}}
          onMouseLeave={e=>{e.currentTarget.style.color="var(--grey-500)";e.currentTarget.style.background="transparent";}}>
          {visible?<SipEyeOff/>:<SipEye/>}
        </button>
      }/>
  );
}

function SipCheckbox({ label, checked, onChange }) {
  return (
    <label className="sip-check" style={{display:"inline-flex",alignItems:"center",gap:9,cursor:"pointer",
      font:"var(--font-body-sm)",color:"var(--text-body)",userSelect:"none"}}>
      <span style={{position:"relative",display:"inline-flex",width:18,height:18,flex:"none"}}>
        <input type="checkbox" checked={checked} onChange={onChange}/>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.2 3.2L13 5"/></svg>
      </span>
      {label && <span>{label}</span>}
      <style>{`
        .sip-check input[type="checkbox"]{appearance:none;-webkit-appearance:none;width:18px;height:18px;margin:0;border-radius:var(--radius-xs);border:1.5px solid var(--border-strong);background:var(--white);cursor:inherit;transition:background var(--dur-fast),border-color var(--dur-fast);}
        .sip-check input[type="checkbox"]:checked{background:var(--navy-600);border-color:var(--navy-600);}
        .sip-check input[type="checkbox"]:focus-visible{box-shadow:var(--focus-ring);outline:none;}
        .sip-check svg{position:absolute;top:3px;left:3px;pointer-events:none;opacity:0;transition:opacity var(--dur-fast);}
        .sip-check input[type="checkbox"]:checked + svg{opacity:1;}
      `}</style>
    </label>
  );
}

function SipAlert({ children, title, onClose }) {
  return (
    <div role="alert" style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",background:"var(--danger-50)",
      border:"1px solid var(--danger-500)",borderLeft:"4px solid var(--danger-500)",borderRadius:"var(--radius-md)",
      color:"var(--danger-700)",font:"var(--fw-regular) var(--text-sm)/1.45 var(--font-sans)",marginBottom:4}}>
      <span aria-hidden="true" style={{flex:"none",width:20,height:20,marginTop:1,borderRadius:"50%",background:"var(--danger-600)",
        color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",font:"var(--fw-bold) 12px/1 var(--font-sans)"}}>!</span>
      <div style={{flex:1,minWidth:0}}>
        {title && <div style={{font:"var(--fw-bold) var(--text-sm)/1.3 var(--font-sans)",marginBottom:2}}>{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Tutup" style={{flex:"none",border:"none",background:"transparent",cursor:"pointer",
          color:"var(--danger-700)",opacity:0.6,font:"18px/1 var(--font-sans)",padding:2}}>×</button>
      )}
    </div>
  );
}

function SipButton({ children, loading=false, trailingIcon=null, ...rest }) {
  const bg = "var(--navy-600)", hover = "var(--navy-800)";
  const isDisabled = loading || rest.disabled;
  return (
    <button type="submit" disabled={isDisabled}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",height:52,padding:"0 26px",
        font:"var(--fw-semibold) var(--text-md)/1 var(--font-sans)",letterSpacing:"0.005em",color:"#fff",background:bg,
        border:`1px solid ${bg}`,borderRadius:"var(--radius-md)",boxShadow:isDisabled?"none":"var(--shadow-sm)",
        cursor:isDisabled?"not-allowed":"pointer",transition:"background var(--dur-fast) var(--ease-standard), transform var(--dur-fast)",whiteSpace:"nowrap"}}
      onMouseDown={e=>{if(!isDisabled)e.currentTarget.style.transform="translateY(1px)";}}
      onMouseUp={e=>{e.currentTarget.style.transform="translateY(0)";}}
      onMouseEnter={e=>{if(!isDisabled)e.currentTarget.style.background=hover;}}
      onMouseLeave={e=>{e.currentTarget.style.background=bg;e.currentTarget.style.transform="translateY(0)";}}
      {...rest}>
      {loading && (
        <span aria-hidden="true" style={{width:16,height:16,borderRadius:"50%",border:"2px solid #fff",borderTopColor:"transparent",display:"inline-block",animation:"sipasti-spin 0.6s linear infinite"}}>
          <style>{`@keyframes sipasti-spin{to{transform:rotate(360deg)}}`}</style>
        </span>
      )}
      <span style={{opacity:loading?0.85:1}}>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
}

function SipFeatureRow({ children }) {
  return (
    <li style={{display:"flex",alignItems:"flex-start",gap:11}}>
      <span style={{flex:"none",marginTop:1,width:24,height:24,borderRadius:7,background:"rgba(255,255,255,0.14)",
        color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.18)"}}><SipShield/></span>
      <span style={{font:"var(--fw-medium) 14px/1.45 var(--font-sans)",color:"rgba(255,255,255,0.9)"}}>{children}</span>
    </li>
  );
}

// Kontak WhatsApp administrator (untuk tombol "Hubungi administrator").
// Nomor 081338077908 → format internasional 6281338077908.
const ADMIN_WA = "6281338077908";
const ADMIN_WA_TEXT =
  "Halo Administrator SI-PASTI,\n\n" +
  "Saya membutuhkan bantuan terkait akun login dashboard SKPP (SI-PASTI). Mohon dibantu.\n\n" +
  "Nama Lengkap : \n" +
  "NIP / Username : \n" +
  "OPD / Instansi : \n" +
  "Kendala : \n\n" +
  "Terima kasih.";
const ADMIN_WA_URL = `https://web.whatsapp.com/send?phone=${ADMIN_WA}&text=${encodeURIComponent(ADMIN_WA_TEXT)}`;

// pos = background-position tiap foto (atur agar orang/objek penting pas terlihat)
const LOGIN_PHOTOS = [
  { src:"/photo-team-1.jpeg", pos:"center 28%", size:"cover" },
  { src:"/photo-team-2.jpeg", pos:"center 45%", size:"cover" },
  { src:"/photo-team-3.jpeg", pos:"center 40%", size:"cover" },
  { src:"/photo-team-4.jpeg", pos:"center 40%", size:"cover" },
  { src:"/photo-team-5.jpeg", pos:"center 45%", size:"cover" },
  { src:"/photo-team-6.jpeg", pos:"center center", size:"contain" },
];

// Modal "Lupa Kata Sandi" — kirim permintaan reset ke administrator.
function ForgotPasswordModal({ onClose, prefillUser = "" }) {
  const [fpUser, setFpUser] = useState(prefillUser || "");
  const [fpAlasan, setFpAlasan] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const kirim = async () => {
    if (!fpUser.trim()) { setErr("NIP / Username wajib diisi."); return; }
    setSending(true); setErr("");
    try {
      const res = await ajukanResetPassword({ username: fpUser, alasan: fpAlasan });
      if (res && res.ok) setDone(true);
      else setErr((res && res.pesan) || "Gagal mengirim permintaan.");
    } catch { setErr("Gagal terhubung ke server."); }
    setSending(false);
  };

  const overlay = { position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",
    padding:20,background:"rgba(8,18,36,0.55)",backdropFilter:"blur(3px)" };
  const card = { width:"100%",maxWidth:440,background:"#fff",borderRadius:18,overflow:"hidden",
    boxShadow:"0 24px 60px rgba(8,18,36,0.35)",fontFamily:"var(--font-sans, system-ui, sans-serif)" };
  const head = { background:"linear-gradient(135deg,#0D2137 0%,#16345a 100%)",color:"#fff",padding:"20px 24px" };
  const body = { padding:"22px 24px" };
  const labelS = { display:"block",fontSize:12.5,fontWeight:700,color:"#1e2a3a",marginBottom:7 };
  const inputS = { width:"100%",height:46,border:"1.5px solid #d6deea",borderRadius:11,padding:"0 14px",
    fontSize:14,color:"#16243a",outline:"none",boxSizing:"border-box",background:"#f8fafc" };
  const taS = { ...inputS,height:78,padding:"11px 14px",resize:"vertical",fontFamily:"inherit",lineHeight:1.45 };
  const btnPri = { flex:1,height:48,border:"none",borderRadius:11,background:"#0D2137",color:"#fff",
    fontSize:14.5,fontWeight:700,cursor:sending?"not-allowed":"pointer",opacity:sending?0.7:1 };
  const btnSec = { height:48,padding:"0 20px",border:"1.5px solid #d6deea",borderRadius:11,background:"#fff",
    color:"#3a495e",fontSize:14,fontWeight:600,cursor:"pointer" };

  return (
    <div style={overlay} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={card} onClick={e=>e.stopPropagation()}>
        <div style={head}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>🔑</span>
              <strong style={{fontSize:16,letterSpacing:"-0.3px"}}>Lupa Kata Sandi</strong>
            </div>
            <button onClick={onClose} aria-label="Tutup"
              style={{border:"none",background:"transparent",color:"rgba(255,255,255,0.75)",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <p style={{margin:"8px 0 0",fontSize:12.5,lineHeight:1.5,color:"rgba(255,255,255,0.78)"}}>
            Ajukan permintaan reset kata sandi. Administrator SI-PASTI akan memverifikasi
            dan menetapkan kata sandi baru untuk Anda.
          </p>
        </div>

        {done ? (
          <div style={{...body,textAlign:"center"}}>
            <div style={{width:58,height:58,margin:"6px auto 14px",borderRadius:"50%",background:"#e6f7ee",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>✓</div>
            <div style={{fontSize:15.5,fontWeight:800,color:"#16243a",marginBottom:6}}>Permintaan Terkirim</div>
            <p style={{fontSize:13,lineHeight:1.55,color:"#5a6b80",margin:"0 0 20px"}}>
              Permintaan reset kata sandi untuk <strong style={{color:"#16243a"}}>{fpUser.trim()}</strong> telah
              dikirim. Silakan hubungi administrator untuk konfirmasi kata sandi baru Anda.
            </p>
            <button onClick={onClose} style={{...btnPri,width:"100%"}}>Selesai</button>
          </div>
        ) : (
          <div style={body}>
            {err && (
              <div style={{display:"flex",gap:9,alignItems:"flex-start",padding:"10px 12px",marginBottom:14,
                background:"#fdecec",border:"1px solid #f3b4b4",borderRadius:10,color:"#a11212",fontSize:12.5}}>
                <span>⚠</span><span>{err}</span>
              </div>
            )}
            <div style={{marginBottom:16}}>
              <label style={labelS}>NIP / Username <span style={{color:"#d33"}}>*</span></label>
              <input style={inputS} value={fpUser} onChange={e=>setFpUser(e.target.value)}
                placeholder="Masukkan NIP atau username Anda" autoFocus/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={labelS}>Keterangan <span style={{fontWeight:400,color:"#90a0b5"}}>(opsional)</span></label>
              <textarea style={taS} value={fpAlasan} onChange={e=>setFpAlasan(e.target.value)}
                placeholder="Mis. lupa kata sandi, akun terkunci, dll."/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} style={btnSec} disabled={sending}>Batal</button>
              <button onClick={kirim} style={btnPri} disabled={sending}>
                {sending ? "Mengirim…" : "Kirim Permintaan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [fieldErr, setFieldErr] = useState({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Trik anti-autofill: field dibuat read-only saat halaman dibuka sehingga
  // browser tidak mengisinya otomatis. Saat kolom diklik (focus), read-only
  // dilepas → pengguna bisa mengetik DAN browser tetap menawarkan kredensial
  // tersimpan lewat dropdown bawaan.
  const [userRO, setUserRO] = useState(true);
  const [passRO, setPassRO] = useState(true);
  // Lupa kata sandi → kirim permintaan reset ke administrator.
  const [showForgot, setShowForgot] = useState(false);
  // Foto latar bergantian setiap 6 detik (cross-fade)
  const [photoIdx, setPhotoIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhotoIdx(i => (i + 1) % LOGIN_PHOTOS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const submit = async (e) => {
    if (e) e.preventDefault();
    setErr("");
    const fe = {};
    if (!user.trim()) fe.user = "NIP / Username wajib diisi.";
    if (!pass.trim()) fe.pass = "Kata sandi wajib diisi.";
    setFieldErr(fe);
    if (Object.keys(fe).length) return;

    setIsLoggingIn(true);
    try {
      const res = await login({ username: user.trim(), password: pass });
      if (res && res.ok) {
        localStorage.setItem("isLoggedIn","true");
        localStorage.setItem("namaStaf", res.nama);
        localStorage.setItem("roleStaf", res.role);
        onLogin({ username: user.trim(), nama: res.nama, role: res.role });
      } else {
        setErr(res.pesan || "NIP atau kata sandi yang Anda masukkan salah. Periksa kembali data Anda atau hubungi administrator.");
      }
    } catch { setErr("Gagal terhubung ke server database."); }
    finally { setIsLoggingIn(false); }
  };

  return (
    <div className="login-root">
      {/* LEFT: visual panel */}
      <aside className="login-visual">
        {LOGIN_PHOTOS.map((ph,i)=>(
          <div key={ph.src} className={"login-photo"+(i===photoIdx?" is-active":"")}
            style={{backgroundImage:`url('${ph.src}')`,backgroundPosition:ph.pos,backgroundSize:ph.size}}/>
        ))}
        <div className="login-visual__scrim"/>
        <div className="login-visual__inner">
          <div className="login-orgbar">
            <img src="/logo-ntt.png" alt="Lambang Provinsi NTT" className="login-crest"/>
            <div>
              <div className="login-org">Badan Keuangan Daerah</div>
              <div className="login-org-sub">Provinsi Nusa Tenggara Timur</div>
            </div>
          </div>

          <div className="login-hero">
            <SipLogo tone="light"/>
            <h1 className="login-welcome">Selamat datang kembali.</h1>
            <p className="login-lead">
              Pantau setiap tahap penerbitan SKPP secara <strong>terintegrasi</strong> dan transparan —
              dari pengajuan, verifikasi, hingga surat keterangan terbit.
            </p>
            <ul className="login-features">
              <SipFeatureRow>Pelacakan alur berkas SKPP secara real-time</SipFeatureRow>
              <SipFeatureRow>Verifikasi berjenjang yang akuntabel</SipFeatureRow>
              <SipFeatureRow>Penerbitan SKPP lebih cepat &amp; transparan</SipFeatureRow>
            </ul>
          </div>

          <div className="login-foot">© {new Date().getFullYear()} Badan Keuangan Daerah Provinsi NTT · SI-PASTI</div>
        </div>
      </aside>

      {/* RIGHT: form panel */}
      <main className="login-form-pane">
        <form className="login-card" onSubmit={submit} noValidate>
          <div className="login-card__head">
            <span className="login-eyebrow">Portal Internal</span>
            <h2 className="login-title">Masuk ke akun Anda</h2>
            <p className="login-subtitle">Gunakan NIP / username dan kata sandi kepegawaian untuk melanjutkan.</p>
          </div>

          {err && <SipAlert title="Gagal masuk" onClose={()=>setErr("")}>{err}</SipAlert>}

          <SipTextField
            label="NIP / Username"
            name="username"
            leadingIcon={<SipUserIcon/>}
            placeholder="Masukkan NIP atau username"
            autoComplete="username"
            readOnly={userRO}
            onFocus={()=>setUserRO(false)}
            value={user}
            onChange={e=>setUser(e.target.value)}
            error={fieldErr.user}
            disabled={isLoggingIn}
            required
          />

          <SipPasswordField
            label="Kata Sandi"
            name="password"
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            readOnly={passRO}
            onFocus={()=>setPassRO(false)}
            value={pass}
            onChange={e=>setPass(e.target.value)}
            error={fieldErr.pass}
            disabled={isLoggingIn}
            required
          />

          <div className="login-row">
            <SipCheckbox label="Ingat saya" checked={remember} onChange={e=>setRemember(e.target.checked)}/>
            <a href="#" className="login-forgot" onClick={e=>{e.preventDefault();setShowForgot(true);}}>Lupa Kata Sandi?</a>
          </div>

          <SipButton loading={isLoggingIn} trailingIcon={<SipArrow/>}>
            {isLoggingIn ? "Memverifikasi…" : "Masuk"}
          </SipButton>

          <p className="login-help">
            Belum memiliki akses? <a href={ADMIN_WA_URL} target="_blank" rel="noopener noreferrer">Hubungi administrator</a> instansi Anda.
          </p>
        </form>
      </main>

      {showForgot && <ForgotPasswordModal prefillUser={user} onClose={()=>setShowForgot(false)}/>}
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
  const roleLabel = user.role==="admin" ? "Admin" : user.role==="operator" ? "Staf Loket" : "Staf Pengampu OPD";
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

// Tampilan rapi untuk catatan Formulir Pengembalian (menggantikan dump JSON mentah).
function CatatanKembali({ data }) {
  const al = data.alasan || {};
  const rincian = (data.rincian || []).filter(r=>r.dokumen);
  const hutang  = (data.rincianHutang || []).filter(r=>r.jenis);
  const mek = data.mekanisme || {};
  const mekList = [mek.potong&&"Pemotongan hak keuangan", mek.setor&&"Penyetoran tunai (RKUD)", mek.cicilan&&"Cicilan sesuai kesepakatan"].filter(Boolean);
  const wrap = { background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"10px 12px", marginTop:6, color:"#7c2d12" };
  const hLabel = { fontSize:10, fontWeight:800, letterSpacing:"0.04em", textTransform:"uppercase", color:"#b45309", margin:"8px 0 3px" };
  const chip = { display:"inline-block", fontSize:10.5, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#fef3c7", color:"#92400e", marginRight:5, marginTop:3 };
  return (
    <div style={wrap}>
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
        <span style={{fontWeight:800,fontSize:12.5,color:"#92400e"}}>↩ Formulir Pengembalian Berkas</span>
        {data.nomorFormulir && <span style={{fontSize:10.5,fontFamily:"var(--mono)",color:"#b45309"}}>{data.nomorFormulir}</span>}
      </div>
      {data.tanggalKembali && <div style={{fontSize:11,color:"#b45309",marginTop:1}}>Tanggal pengembalian: {data.tanggalKembali}</div>}

      <div style={{marginTop:6}}>
        {al.dokumen && <span style={chip}>Dokumen kurang</span>}
        {al.hutang && <span style={chip}>Terdapat hutang</span>}
      </div>

      {rincian.length>0 && (<>
        <div style={hLabel}>Dokumen yang harus dilengkapi</div>
        <ol style={{margin:0,paddingLeft:18,fontSize:11.5,lineHeight:1.5}}>
          {rincian.map((r,i)=>(
            <li key={i}>
              <strong>{r.dokumen}</strong>
              {r.tindakan ? ` — ${r.tindakan}` : ""}
              {r.batas ? <span style={{color:"#b45309"}}> (s/d {fmtTglSingkat(r.batas)})</span> : ""}
            </li>
          ))}
        </ol>
      </>)}

      {hutang.length>0 && (<>
        <div style={hLabel}>Jenis hutang / kewajiban</div>
        <ol style={{margin:0,paddingLeft:18,fontSize:11.5,lineHeight:1.5}}>
          {hutang.map((r,i)=>(
            <li key={i}><strong>{r.jenis}</strong>{r.batas ? <span style={{color:"#b45309"}}> (s/d {fmtTglSingkat(r.batas)})</span> : ""}</li>
          ))}
        </ol>
      </>)}

      {(mekList.length>0 || mek.jumlah) && (<>
        <div style={hLabel}>Mekanisme penyelesaian hutang</div>
        <div style={{fontSize:11.5,lineHeight:1.5}}>
          {mekList.join(" · ")}
          {mek.jumlah ? <div style={{marginTop:2}}>Jumlah: <strong>Rp {fmtRibuan(mek.jumlah)}</strong></div> : null}
        </div>
      </>)}

      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:8,paddingTop:7,borderTop:"1px dashed #fde68a",fontSize:10.5,color:"#92400e"}}>
        {data.stafLoket && <div><span style={{color:"#b45309"}}>Staf Loket:</span> <strong>{data.stafLoket}</strong></div>}
        {data.pengampu?.nama && <div><span style={{color:"#b45309"}}>Pengampu OPD:</span> <strong>{data.pengampu.nama}</strong></div>}
        {data.pemohon?.nama && <div><span style={{color:"#b45309"}}>Pemohon:</span> <strong>{data.pemohon.nama}</strong></div>}
      </div>
    </div>
  );
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
        const logs = riwayat.filter(r => r.tahap === step.id);
        const log = logs.find(r => r.isKembali===true || r.isKembali==="TRUE") || logs[0];
        const pernahRet = logs.some(r => r.isKembali===true || r.isKembali==="TRUE");
        // "Dikembalikan" hanya ditampilkan selama tahap belum selesai. Begitu tahap
        // selesai (sudah dilengkapi & diproses lanjut), tampilkan sebagai selesai.
        const retNow = pernahRet && !done;
        let dot = "pending"; if(done) dot="done"; else if(retNow) dot="ret"; else if(aktif) dot="active";
        return (
          <div key={step.id} className="timeline-item">
            <div className="timeline-left">
              <div className={`t-dot ${dot}`}>{done?"✓":retNow?"↩":step.icon}</div>
              {!isLast && <div className={`t-line ${done?"done":""}`} />}
            </div>
            <div className="timeline-content" style={{paddingBottom:isLast?0:20}}>
              <div style={{fontWeight:700,fontSize:13,color:!done&&!aktif?"var(--outline)":"var(--on-surface)",marginBottom:2}}>{step.label}</div>
              <div style={{fontSize:11.5,color:"var(--on-surface-variant)",marginBottom:4}}>{step.pelaksana}</div>
              {aktif&&!done && <span className="badge badge-blue" style={{marginBottom:4,fontSize:11}}>Sedang diproses</span>}
              {done&&pernahRet && <span className="badge badge-green" style={{marginBottom:4,fontSize:11}}>✓ Telah dilengkapi &amp; selesai</span>}
              {log && <div style={{fontSize:11,color:"var(--outline)",fontFamily:"var(--mono)"}}>{log.waktu}</div>}
              {log?.catatan && (() => {
                const isRet = log.isKembali===true || log.isKembali==="TRUE";
                let parsed = null;
                try { parsed = JSON.parse(log.catatan); } catch { /* bukan JSON */ }
                if (parsed && parsed._type === "FORMULIR_KEMBALI") return <CatatanKembali data={parsed}/>;
                return (
                  <div style={{
                    background: isRet?"#fffbeb":"var(--surface-container-low)",
                    border: `1px solid ${isRet?"#fde68a":"var(--outline-variant)"}`,
                    borderRadius:8, padding:"7px 11px", fontSize:12,
                    color: isRet?"#92400e":"var(--on-surface-variant)", marginTop:6
                  }}>
                    {isRet?"⚠️ ":""}{log.catatan}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CETAK FORMULIR PENGEMBALIAN ──────────────────────────────────────────────
function cetakFormulirKembali({ p, fkData, stafLoketNama, stafLoketNIP, nomorFormulir, tanggalKembali }) {
  const al = p.alasan||"";
  const isJD = al.includes("Janda")||al.includes("Duda")||al.includes("Meninggal");
  const isBH = al.includes("Berhenti")||al.includes("Pemberhentian");
  const isPD = al.includes("Pindah");
  const isPS = al.includes("Pensiun")&&!isJD;
  const cb = v => v?"☑":"☐";
  const logoSrc = `${window.location.origin}/logo-ntt.png`;
  const td = "padding:5px 7px;border:1px solid #999";
  // Sub-tabel "Dokumen Kurang" — muncul bila alasan dokumen kurang dicentang.
  const tblDokumen = fkData.alasanDokumen ? `
  <table>
    <tr class="sh"><td colspan="4">C. RINCIAN DOKUMEN KURANG YANG HARUS DILENGKAPI</td></tr>
    <tr><th style="width:30px">No.</th><th>Dokumen Kurang</th><th>Tindakan yang Diperlukan</th><th style="width:120px">Batas Waktu Pemenuhan</th></tr>
    ${fkData.rincian.filter(r=>r.dokumen).map((r,i)=>`<tr>
      <td style="text-align:center;${td}">${i+1}</td>
      <td style="${td}">${r.dokumen||""}</td>
      <td style="${td}">${r.tindakan||""}</td>
      <td style="${td}">${fmtTglSingkat(r.batas)}</td>
    </tr>`).join("")}
  </table>` : "";
  // Sub-tabel "Jenis Hutang" — menggantikan tabel dokumen, hanya bila alasan hutang dicentang.
  const tblHutang = fkData.alasanHutang ? `
  <table>
    <tr class="sh"><td colspan="3">${fkData.alasanDokumen?"D":"C"}. RINCIAN JENIS HUTANG / KEWAJIBAN YANG HARUS DISELESAIKAN</td></tr>
    <tr><th style="width:30px">No.</th><th>Jenis Hutang</th><th style="width:120px">Batas Waktu Penyelesaian</th></tr>
    ${(fkData.rincianHutang||[]).filter(r=>r.jenis).map((r,i)=>`<tr>
      <td style="text-align:center;${td}">${i+1}</td>
      <td style="${td}">${r.jenis||""}</td>
      <td style="${td}">${fmtTglSingkat(r.batas)}</td>
    </tr>`).join("")}
  </table>` : "";
  const sectionC = tblDokumen + tblHutang;
  // Bagian mekanisme hutang hanya dimunculkan bila alasan "terdapat hutang" dicentang.
  const huruf = fkData.alasanDokumen ? "E" : "D";
  const sectionD = fkData.alasanHutang ? `
  <table><tr class="sh"><td>${huruf}. MEKANISME PENYELESAIAN HUTANG (Diisi apabila terdapat kewajiban finansial)</td></tr>
    <tr><td>${cb(fkData.mPotong)} Pemotongan dari hak keuangan pegawai (gaji terakhir, uang pensiun, dsb.)</td></tr>
    <tr><td>${cb(fkData.mSetor)} Penyetoran tunai ke Rekening Kas Umum Daerah (RKUD)</td></tr>
    <tr><td>${cb(fkData.mCicilan)} Cicilan sesuai kesepakatan (dilampiri Berita Acara Kesepakatan Pelunasan)</td></tr>
    <tr><td style="text-align:right"><b>Jumlah hutang yang harus diselesaikan:&nbsp;&nbsp; Rp ${fmtRibuan(fkData.jumlahHutang)||"___________________"}</b></td></tr>
  </table>` : "";
  // Huruf bagian "Pernyataan Pemohon" menyesuaikan jumlah bagian sebelumnya.
  const hurufPernyataan = "ABCDEFGH"[2 + (fkData.alasanDokumen?1:0) + (fkData.alasanHutang?2:0)];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Formulir Pengembalian — ${p.nama}</title>
  <style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10.5pt;margin:0;padding:20px 24px;color:#000}
    .hd{display:flex;align-items:center;gap:14px;margin-bottom:10px}
    .hd-logo{width:74px;height:74px;object-fit:contain;flex-shrink:0}
    .hd-txt{flex:1;text-align:center}.hd b{font-size:13pt}.hd p{margin:2px 0;font-size:9.5pt}
    hr{border:none;border-top:1px solid #000;margin:3px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:7px}
    td,th{border:1px solid #999;padding:5px 7px;font-size:10pt;vertical-align:top}
    .sh td{font-weight:bold;font-size:10.5pt;text-align:center;background:#e5e7eb;color:#000;border:1px solid #999}
    .lr td:first-child{font-weight:bold;background:#f0f0f0;width:35%}
    .nb{border:none!important;background:transparent!important}
    .fg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px;text-align:center}
    .sp{margin-top:55px}
    @media print{body{margin:0;padding:16px 20px}}
  </style></head><body>
  <div class="hd">
    <img class="hd-logo" src="${logoSrc}" alt="Logo Provinsi NTT"/>
    <div class="hd-txt">
      <b>PEMERINTAH PROVINSI NUSA TENGGARA TIMUR</b><br/>
      <b style="font-size:14pt">BADAN KEUANGAN DAERAH</b>
      <p>Jalan Raya El Tari Nomor 52 Kupang, Telp. –</p>
      <p>Laman : https://bakeuda.nttprov.go.id, Email : badankeuanganprovntt@gmail.com</p>
    </div>
    <div style="width:74px;flex-shrink:0"></div>
  </div>
  <hr/><hr style="margin-top:2px"/>
  <table style="border:none;margin-bottom:6px">
    <tr><td class="nb" colspan="3" style="text-align:center;font-weight:bold;font-size:12pt">FORMULIR PENGEMBALIAN BERKAS</td></tr>
    <tr><td class="nb" colspan="3" style="text-align:center">PERMOHONAN PENERBITAN SURAT KETERANGAN PENGHENTIAN PEMBAYARAN (SKPP)</td></tr>
    <tr><td class="nb" style="font-weight:bold;width:32%">Nomor Formulir</td><td class="nb" style="width:4%">:</td><td class="nb">${nomorFormulir}</td></tr>
    <tr><td class="nb" style="font-weight:bold">Tanggal Pengembalian</td><td class="nb">:</td><td class="nb">${tanggalKembali}</td></tr>
  </table>
  <table><tr class="sh"><td colspan="3">A. IDENTITAS PEMOHON</td></tr>
    <tr class="lr"><td>Nama Pegawai</td><td style="width:4%">:</td><td>${p.nama||"—"}</td></tr>
    <tr class="lr"><td>NIP</td><td>:</td><td>${p.nip||"—"}</td></tr>
    <tr class="lr"><td>Pangkat / Golongan</td><td>:</td><td>${p.pangkat||"—"}</td></tr>
    <tr class="lr"><td>Jabatan</td><td>:</td><td>${p.jabatan||"—"}</td></tr>
    <tr class="lr"><td>OPD / Instansi</td><td>:</td><td>${p.opd||"—"}</td></tr>
    <tr class="lr"><td>Nomor Register SKPP</td><td>:</td><td>${p.id||"—"}</td></tr>
    <tr class="lr"><td>Jenis SKPP</td><td>:</td><td>${cb(isPS)} Pensiun &nbsp;&nbsp; ${cb(isPD)} Pindah &nbsp;&nbsp; ${cb(isBH)} Berhenti &nbsp;&nbsp; ${cb(isJD)} Janda/Duda</td></tr>
  </table>
  <table><tr class="sh"><td>B. ALASAN PENGEMBALIAN BERKAS</td></tr>
    <tr><td>${cb(fkData.alasanDokumen)} Berkas tidak lengkap (dokumen persyaratan kurang)</td></tr>
    <tr><td>${cb(fkData.alasanHutang)} Terdapat hutang/kewajiban finansial pegawai yang belum diselesaikan</td></tr>
  </table>
  ${sectionC}
  ${sectionD}
  <table><tr class="sh"><td>${hurufPernyataan}. PERNYATAAN PEMOHON</td></tr>
    <tr><td><em>Saya yang bertanda tangan di bawah ini menyatakan telah menerima pengembalian berkas permohonan SKPP beserta penjelasan atas kekurangan/kewajiban yang harus dipenuhi sebagaimana tercantum di atas. Saya bersedia melengkapi seluruh kekurangan dan/atau menyelesaikan seluruh kewajiban finansial tersebut sebelum mengajukan kembali permohonan SKPP.</em></td></tr>
  </table>
  <p style="text-align:right;margin:4px 0">Kupang, ${tanggalKembali}</p>
  <div class="fg">
    <div><b>Staf Loket,</b><div class="sp"></div><p>Nama : ${stafLoketNama||"___________________"}<br/>NIP &nbsp;&nbsp;: ${stafLoketNIP||"___________________"}</p></div>
    <div><b>Pengampu OPD,</b><div class="sp"></div><p>Nama : ${fkData.pengampuNama||"___________________"}<br/>NIP &nbsp;&nbsp;: ${fkData.pengampuNIP||"___________________"}</p></div>
    <div><b>Pemohon / Bendahara OPD,</b><div class="sp"></div><p>Nama : ${fkData.pemohonNama||"___________________"}<br/>NIP &nbsp;&nbsp;: ${fkData.pemohonNIP||"___________________"}</p></div>
  </div>
  <hr style="margin-top:20px"/>
  <p style="font-size:9pt;font-style:italic">Formulir ini dibuat dalam 2 (dua) rangkap: lembar pertama untuk Pemohon, lembar kedua untuk arsip Bidang Perbendaharaan.</p>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`;
  const win = window.open("","_blank","width=820,height=720");
  win.document.write(html);
  win.document.close();
}

// Cetak "Daftar Periksa Verifikasi Berkas" (Lampiran 1) — logo Pemprov di kanan atas.
function cetakDaftarPeriksa({ p, dpData }) {
  const al = p.alasan||"";
  const isJD = al.includes("Janda")||al.includes("Duda")||al.includes("Meninggal");
  const isBH = al.includes("Berhenti")||al.includes("Pemberhentian");
  const isPD = al.includes("Pindah");
  const isPS = al.includes("Pensiun")&&!isJD;
  const cb = v => v?"☑":"☐";
  const logoSrc = `${window.location.origin}/logo-ntt.png`;
  const td = "padding:5px 7px;border:1px solid #999";
  const tc = "text-align:center;width:62px";
  const tgl = dpData.tanggal ? fmtTglSingkat(dpData.tanggal) : "";

  // Bagian A — checklist dokumen, hanya grup yang relevan dengan Jenis SKPP.
  const tampil = dpGrupTampil(al);
  let no = 0;
  const barisDok = DP_DOKUMEN_GRUP.map((g,gi) => {
    if (!tampil[gi]) return "";
    const head = `<tr class="gh"><td colspan="5">${g.grup}</td></tr>`;
    const rows = g.items.map((it,j) => {
      const gIndex = DP_GRUP_OFFSET[gi] + j;   // indeks state
      const num = ++no;                        // nomor cetak berurutan
      const st = dpData.dok[gIndex] || {};
      const ketCetak = st.ket || it.ket || "";
      return `<tr>
        <td style="text-align:center;${td}">${num}</td>
        <td style="${td}">${it.t}</td>
        <td style="${tc};${td}">${cb(st.status==="ada")}</td>
        <td style="${tc};${td}">${cb(st.status==="tidak")}</td>
        <td style="${td};font-style:${st.ket?'normal':'italic'}">${ketCetak}</td>
      </tr>`;
    }).join("");
    return head + rows;
  }).join("");

  // Bagian B — pengecekan hutang.
  const barisHutang = DP_HUTANG.map((h,i)=>{
    const st = dpData.hutang[i] || {};
    return `<tr>
      <td style="text-align:center;${td}">${i+1}</td>
      <td style="${td}">${h}</td>
      <td style="${tc};${td}">${cb(st.status==="ada")}</td>
      <td style="${tc};${td}">${cb(st.status==="tidak")}</td>
      <td style="${td}">${st.ket||""}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Daftar Periksa Verifikasi Berkas — ${p.nama}</title>
  <style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10pt;margin:0;padding:18px 22px;color:#000}
    .hd{display:flex;align-items:center;gap:14px;margin-bottom:8px}
    .hd-sp{width:74px;flex-shrink:0}
    .hd-logo{width:74px;height:74px;object-fit:contain;flex-shrink:0}
    .hd-txt{flex:1;text-align:center}.hd b{font-size:13pt}.hd p{margin:2px 0;font-size:9pt}
    hr{border:none;border-top:1.5px solid #000;margin:3px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:6px}
    td,th{border:1px solid #999;padding:5px 7px;font-size:9.5pt;vertical-align:top}
    th{background:#e5e7eb;text-align:center;font-weight:bold}
    .sh td{font-weight:bold;font-size:10pt;text-align:center;background:#d1d5db;color:#000}
    .gh td{font-weight:bold;font-size:9.5pt;background:#f0f0f0;font-style:italic}
    .lr td:first-child{font-weight:bold;background:#f6f6f6;width:32%}
    .nb{border:none!important;background:transparent!important}
    .sign td{vertical-align:top;height:96px}
    @media print{body{margin:0;padding:14px 18px}.pgbreak{page-break-before:always}}
  </style></head><body>
  <div class="hd">
    <img class="hd-logo" src="${logoSrc}" alt="Logo Provinsi NTT"/>
    <div class="hd-txt">
      <b>PEMERINTAH PROVINSI NUSA TENGGARA TIMUR</b><br/>
      <b style="font-size:14pt">BADAN KEUANGAN DAERAH</b>
      <p>Jalan Raya El Tari Nomor 52 Kupang</p>
      <p>Laman : https://bakeuda.nttprov.go.id, Email : badankeuanganprovntt@gmail.com</p>
    </div>
    <div class="hd-sp"></div>
  </div>
  <hr/><hr style="margin-top:2px"/>
  <table style="border:none;margin:6px 0 8px">
    <tr><td class="nb" colspan="3" style="text-align:center;font-weight:bold;font-size:11pt">DAFTAR PERIKSA VERIFIKASI BERKAS</td></tr>
    <tr><td class="nb" colspan="3" style="text-align:center;font-size:9.5pt">PERMOHONAN PENERBITAN SURAT KETERANGAN PENGHENTIAN PEMBAYARAN (SKPP)</td></tr>
  </table>
  <table>
    <tr class="lr"><td>Nama Pegawai</td><td style="width:4%">:</td><td>${p.nama||"—"}</td></tr>
    <tr class="lr"><td>NIP</td><td>:</td><td>${p.nip||"—"}</td></tr>
    <tr class="lr"><td>Pangkat / Golongan</td><td>:</td><td>${p.pangkat||"—"}</td></tr>
    <tr class="lr"><td>Jabatan</td><td>:</td><td>${p.jabatan||"—"}</td></tr>
    <tr class="lr"><td>OPD</td><td>:</td><td>${p.opd||"—"}</td></tr>
    <tr class="lr"><td>Jenis SKPP</td><td>:</td><td>${cb(isPS)} Pensiun &nbsp;&nbsp; ${cb(isPD)} Pindah &nbsp;&nbsp; ${cb(isBH)} Berhenti &nbsp;&nbsp; ${cb(isJD)} Janda/Duda</td></tr>
    <tr class="lr"><td>Nomor Register</td><td>:</td><td>${p.id||"—"}</td></tr>
    <tr class="lr"><td>Tanggal Pengajuan</td><td>:</td><td>${p.tanggalMasuk||"—"}</td></tr>
  </table>
  <table>
    <tr class="sh"><td colspan="5">A. KELENGKAPAN DOKUMEN PERSYARATAN</td></tr>
    <tr><th style="width:34px">No.</th><th>Dokumen Persyaratan</th><th style="width:62px">Ada</th><th style="width:62px">Tidak Ada</th><th style="width:150px">Keterangan</th></tr>
    ${barisDok}
  </table>
  <table>
    <tr class="sh"><td colspan="5">B. PENGECEKAN HUTANG / KEWAJIBAN FINANSIAL PEGAWAI KEPADA NEGARA / DAERAH</td></tr>
    <tr><th style="width:34px">No.</th><th>Jenis Kewajiban / Hutang</th><th style="width:62px">Ada</th><th style="width:62px">Tidak Ada</th><th style="width:150px">Keterangan / Jumlah (Rp)</th></tr>
    ${barisHutang}
    <tr><td colspan="2" style="${td};font-weight:bold;text-align:center;vertical-align:middle">KESIMPULAN PENGECEKAN HUTANG</td>
      <td colspan="3" style="${td}">${cb(dpData.kesimpulanHutang==="bebas")} Bebas Hutang / Tidak Ada Kewajiban &nbsp;&nbsp;&nbsp; ${cb(dpData.kesimpulanHutang==="hutang")} Terdapat Hutang (lihat keterangan)</td></tr>
  </table>
  <table>
    <tr class="sh"><td>C. KESIMPULAN VERIFIKASI DAN TINDAK LANJUT</td></tr>
    <tr><td>${cb(dpData.kesimpulan==="lengkap")} BERKAS LENGKAP DAN BEBAS HUTANG — Dapat diproses lebih lanjut</td></tr>
    <tr><td>${cb(dpData.kesimpulan==="kembali")} BERKAS TIDAK LENGKAP / TERDAPAT HUTANG — Dikembalikan kepada Pemohon</td></tr>
    <tr><td style="height:54px"><b>Catatan:</b> ${dpData.catatan||""}</td></tr>
  </table>
  <p style="text-align:right;margin:4px 0">${dpData.tempat||"Kupang"}, ${tgl||"_____ / _____ / _______"}</p>
  <table>
    <tr><th style="width:50%">Diterima oleh / Staf Loket</th><th>Diverifikasi oleh / Pengampu OPD</th></tr>
    <tr class="sign">
      <td><div style="margin-top:70px">Nama : ${dpData.stafLoketNama||"___________________"}<br/>NIP &nbsp;&nbsp;: ${dpData.stafLoketNIP||"___________________"}</div></td>
      <td><div style="margin-top:70px">Nama : ${dpData.pengampuNama||"___________________"}<br/>NIP &nbsp;&nbsp;: ${dpData.pengampuNIP||"___________________"}</div></td>
    </tr>
  </table>
  <p style="font-size:8.5pt;font-style:italic;margin-top:4px">Keterangan: ☑ = Centang pada kolom yang sesuai | Jalur B hanya berlaku jika SK Pangkat Pengabdian BELUM berlaku pada tanggal pensiun.</p>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`;
  const win = window.open("","_blank","width=860,height=760");
  win.document.write(html);
  win.document.close();
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ p, onClose, onUpdate, saving, onCetak, onDelete, user }) {
  const [tab, setTab] = useState("info");
  const [catatan, setCatatan] = useState("");
  const [isKembali, setIsKembali] = useState(false);
  const [nomorUrut, setNomorUrut] = useState("");
  const [showFormKembali, setShowFormKembali] = useState(false);
  // Batas waktu default = H+1 dari tanggal formulir dibuat (format yyyy-mm-dd untuk input kalender).
  const besok = (() => { const d=new Date(Date.now()+86400000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
  const [fkData, setFkData] = useState({
    alasanDokumen:false, alasanHutang:false,
    rincian:Array(5).fill(null).map(()=>({dokumen:"",dokLain:false,tindakan:"",tinLain:false,batas:besok})),
    rincianHutang:Array(4).fill(null).map(()=>({jenis:"",batas:besok})),
    mPotong:false, mSetor:false, mCicilan:false, jumlahHutang:"",
    stafLoket:"", pengampuNama:"", pengampuNIP:"", pemohonNama:"", pemohonNIP:"",
  });
  const [stafLoketList, setStafLoketList] = useState([]);
  const [pengampuList, setPengampuList] = useState([]);
  // Daftar Periksa Verifikasi (tahap A2/B2).
  const [showDaftarPeriksa, setShowDaftarPeriksa] = useState(false);
  const hariIni = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
  const [dpData, setDpData] = useState({
    dok: DP_DOKUMEN_FLAT.map(()=>({status:"",ket:""})),
    hutang: DP_HUTANG.map(()=>({status:"",ket:""})),
    kesimpulanHutang:"", kesimpulan:"", catatan:"",
    tempat:"Kupang", tanggal:hariIni,
    stafLoketNama:"", stafLoketNIP:"", stafLoketUser:"",
    // Pengampu OPD otomatis dari akun yang sedang login (NIP = username).
    pengampuUser:user?.username||"", pengampuNama:user?.nama||"", pengampuNIP:user?.username||"",
  });
  const isPenomoran = (stepId) => stepId === "A6" || stepId === "B10";
  const isVerifikasi = (stepId) => stepId === "A2" || stepId === "B2";
  const tahapan = p.jalur==="A" ? TAHAPAN_A : TAHAPAN_B;
  // Tahap aktif = tahap yang ditunjuk tahapAktif dan belum selesai.
  // Fallback: jika tahapAktif kosong/sudah selesai (mis. data lama yang
  // sempat rusak akibat bug resume), pakai tahap pertama yang belum selesai.
  const stepAktif = tahapan.find(t => t.id===p.tahapAktif && !p.tahapSelesai.includes(t.id))
    || tahapan.find(t => !p.tahapSelesai.includes(t.id));
  const prog = getProgress(p);

  return (
    <>
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
            {user?.role==="admin" && onDelete && (
              <button title="Hapus pengajuan (khusus Admin)" onClick={()=>onDelete(p)} disabled={saving}
                style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 11px",border:"1px solid #fca5a5",borderRadius:8,background:"var(--error-container)",color:"var(--error)",cursor:"pointer",fontSize:12,fontWeight:700}}>
                🗑 Hapus
              </button>
            )}
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
                    ["Tgl Masuk", fmtDate(p.tanggalMasuk)],
                    [p.status==="selesai"?"Tgl Selesai":"Est. Selesai", fmtDate(p.status==="selesai"?p.tanggalSelesai:p.estimasiSelesai)],
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
                  {isVerifikasi(stepAktif.id) ? (
                    <div style={{background:"#f0fdfa",border:"1.5px solid #99f6e4",borderRadius:12,padding:"16px 18px"}}>
                      <div style={{fontWeight:800,fontSize:13.5,color:"#0E5A59",marginBottom:6}}>📋 Verifikasi Berkas dengan Daftar Periksa</div>
                      <div style={{fontSize:12.5,color:"#0f766e",lineHeight:1.6,marginBottom:14}}>
                        Periksa kelengkapan dokumen persyaratan dan kewajiban finansial pemohon sesuai Lampiran 1.
                        Identitas pegawai terisi otomatis. Setelah selesai, <strong>Daftar Periksa langsung dicetak</strong> dan tahap verifikasi ditandai selesai.
                      </div>
                      <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",fontWeight:700,
                        opacity:!cekIzinProses(user?.role, stepAktif.pelaksana)?0.6:1}}
                        disabled={!cekIzinProses(user?.role, stepAktif.pelaksana)}
                        onClick={()=>{
                          if (stafLoketList.length===0 || pengampuList.length===0) daftarAkun().then(res=>{ if(res.ok){ setStafLoketList(res.data.filter(a=>a.role==="operator")); setPengampuList(res.data.filter(a=>a.role==="staf")); } });
                          setShowDaftarPeriksa(true);
                        }}>
                        {!cekIzinProses(user?.role, stepAktif.pelaksana) ? `🔒 Khusus: ${stepAktif.pelaksana}` : "📋 Buka Daftar Periksa Verifikasi"}
                      </button>
                    </div>
                  ) : (<>
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
                      if (isKembali) {
                        if (stafLoketList.length===0 || pengampuList.length===0) daftarAkun().then(res=>{ if(res.ok){ setStafLoketList(res.data.filter(a=>a.role==="operator")); setPengampuList(res.data.filter(a=>a.role==="staf")); } });
                        setShowFormKembali(true);
                        return;
                      }
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
                  </>)}
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
    {showFormKembali && stepAktif && (
      <FormulirKembaliModal
        p={p} user={user}
        fkData={fkData} setFkData={setFkData}
        stafLoketList={stafLoketList}
        pengampuList={pengampuList}
        saving={saving}
        onClose={()=>setShowFormKembali(false)}
        onSubmit={()=>{
          const idx = tahapan.findIndex(t=>t.id===stepAktif.id);
          const nextStepId = idx < tahapan.length-1 ? tahapan[idx+1].id : "";
          const stafNama = stafLoketList.find(s=>s.username===fkData.stafLoket)?.nama||fkData.stafLoket;
          const nomorFormulir = `FPB-${p.id}-${new Date().getFullYear()}`;
          const tanggalKembali = new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});
          const catatanStr = JSON.stringify({
            _type:"FORMULIR_KEMBALI", nomorFormulir, tanggalKembali,
            alasan:{dokumen:fkData.alasanDokumen,hutang:fkData.alasanHutang},
            rincian:fkData.rincian.filter(r=>r.dokumen),
            rincianHutang:(fkData.rincianHutang||[]).filter(r=>r.jenis),
            mekanisme:{potong:fkData.mPotong,setor:fkData.mSetor,cicilan:fkData.mCicilan,jumlah:fkData.jumlahHutang},
            stafLoket:stafNama,
            pengampu:{nama:fkData.pengampuNama,nip:fkData.pengampuNIP},
            pemohon:{nama:fkData.pemohonNama,nip:fkData.pemohonNIP},
          });
          onUpdate({pengajuanId:p.id,stepId:stepAktif.id,nextStepId,isKembali:true,catatan:catatanStr,isFinal:false});
          setShowFormKembali(false);
        }}
      />
    )}
    {showDaftarPeriksa && stepAktif && (
      <DaftarPeriksaModal
        p={p} dpData={dpData} setDpData={setDpData} stafLoketList={stafLoketList} pengampuList={pengampuList} saving={saving}
        onClose={()=>setShowDaftarPeriksa(false)}
        onCetak={()=>cetakDaftarPeriksa({p, dpData})}
        onSelesai={()=>{
          cetakDaftarPeriksa({p, dpData});
          const idx = tahapan.findIndex(t=>t.id===stepAktif.id);
          const nextStepId = idx < tahapan.length-1 ? tahapan[idx+1].id : "";
          const catatanStr = `Verifikasi berkas: berkas lengkap & bebas hutang. Daftar Periksa dicetak.${dpData.catatan?` — ${dpData.catatan}`:""}`;
          onUpdate({pengajuanId:p.id, stepId:stepAktif.id, nextStepId, isKembali:false, catatan:catatanStr, isFinal:false});
          setShowDaftarPeriksa(false);
        }}
        onKembalikan={()=>{
          cetakDaftarPeriksa({p, dpData});
          // Pindah ke alur Formulir Pengembalian untuk merinci pengembalian berkas.
          setShowDaftarPeriksa(false);
          if (stafLoketList.length===0 || pengampuList.length===0) daftarAkun().then(res=>{ if(res.ok){ setStafLoketList(res.data.filter(a=>a.role==="operator")); setPengampuList(res.data.filter(a=>a.role==="staf")); } });
          setShowFormKembali(true);
        }}
      />
    )}
    </>
  );
}

// ─── FORMULIR PENGEMBALIAN MODAL ──────────────────────────────────────────────
function FormulirKembaliModal({ p, user, fkData, setFkData, stafLoketList, pengampuList, saving, onClose, onSubmit }) {
  const nomorFormulir = `FPB-${p.id}-${new Date().getFullYear()}`;
  const tanggalKembali = new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});
  const al = p.alasan||"";
  const isJD = al.includes("Janda")||al.includes("Duda")||al.includes("Meninggal");
  const isBH = al.includes("Berhenti")||al.includes("Pemberhentian");
  const isPD = al.includes("Pindah");
  const isPS = al.includes("Pensiun")&&!isJD;

  const updRincian = (i,f,v) => setFkData(d=>({...d,rincian:d.rincian.map((r,ix)=>ix===i?{...r,[f]:v}:r)}));
  const updRincianMulti = (i,patch) => setFkData(d=>({...d,rincian:d.rincian.map((r,ix)=>ix===i?{...r,...patch}:r)}));
  const updHutang = (i,f,v) => setFkData(d=>({...d,rincianHutang:d.rincianHutang.map((r,ix)=>ix===i?{...r,[f]:v}:r)}));
  const stafNama = stafLoketList.find(s=>s.username===fkData.stafLoket)?.nama||"";
  const canSubmit = (fkData.alasanDokumen||fkData.alasanHutang) && fkData.stafLoket && fkData.pengampuNIP;

  const handleCetak = () => cetakFormulirKembali({p, fkData, stafLoketNama:stafNama, stafLoketNIP:fkData.stafLoket, nomorFormulir, tanggalKembali});

  const cellInput = {width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12,padding:"4px 2px"};
  // Sel dropdown dengan opsi "Lainnya" untuk input manual. Dikembalikan sebagai elemen (bukan komponen)
  // agar input manual tidak kehilangan fokus saat mengetik.
  const dropLain = (row,i,field,flag,options,ph) => (
    <>
      <select value={row[flag] ? "__lain__" : (options.includes(row[field]) ? row[field] : "")}
        onChange={e=>{
          if(e.target.value==="__lain__") updRincianMulti(i,{[flag]:true,[field]:""});
          else updRincianMulti(i,{[flag]:false,[field]:e.target.value});
        }}
        style={{...cellInput,cursor:"pointer"}}>
        <option value="">-- Pilih --</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
        <option value="__lain__">Lainnya (ketik manual)…</option>
      </select>
      {row[flag] && (
        <input value={row[field]} onChange={e=>updRincian(i,field,e.target.value)} placeholder={ph} autoFocus
          style={{...cellInput,marginTop:4,borderTop:"1px dashed var(--outline-variant)"}}/>
      )}
    </>
  );

  const SectionTitle = ({children}) => (
    <div style={{fontWeight:800,fontSize:11.5,color:"white",textTransform:"uppercase",letterSpacing:"0.07em",
      marginBottom:10,padding:"8px 16px",background:"#1a4b9b",borderRadius:12}}>
      {children}
    </div>
  );

  const CheckRow = ({field,label}) => (
    <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",cursor:"pointer",
      background:fkData[field]?"#EEF2FF":"var(--surface-container-low)",
      border:`1.5px solid ${fkData[field]?"#4F6BCD":"var(--outline-variant)"}`,
      borderRadius:12,marginBottom:8}}
      onClick={()=>setFkData(d=>({...d,[field]:!d[field]}))}>
      <input type="checkbox" checked={fkData[field]} readOnly style={{width:16,height:16,marginTop:1,accentColor:"#4F6BCD",flexShrink:0}}/>
      <span style={{fontSize:13,fontWeight:fkData[field]?600:400,lineHeight:1.5}}>{label}</span>
    </div>
  );

  return (
    <div className="modal-overlay" style={{zIndex:10000}}>
      <div className="modal" style={{maxWidth:820,maxHeight:"92vh",display:"flex",flexDirection:"column",borderRadius:18,overflow:"hidden"}}>
        {/* Header */}
        <div className="modal-header" style={{background:"#1a4b9b",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:700,marginBottom:2,letterSpacing:"0.05em"}}>{nomorFormulir}</div>
            <div style={{fontWeight:800,fontSize:14,color:"white",letterSpacing:"-0.3px"}}>Formulir Pengembalian Berkas</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:2}}>SKPP — {p.nama} · {tanggalKembali}</div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving} style={{color:"white",opacity:.7}}>✕</button>
        </div>

        {/* Body — scrollable */}
        <div className="modal-body" style={{overflowY:"auto",flex:1}}>

          {/* A. Identitas (auto-filled) */}
          <div style={{marginBottom:16}}>
            <SectionTitle>A. Identitas Pemohon (Otomatis)</SectionTitle>
            <div style={{background:"var(--surface-container-low)",borderRadius:14,padding:"13px 16px",border:"1px solid var(--outline-variant)"}}>
              <div className="grid-2" style={{gap:8}}>
                {[["Nama Pegawai",p.nama],["NIP",p.nip],["Pangkat / Golongan",p.pangkat],["Jabatan",p.jabatan],["OPD / Instansi",p.opd],["Nomor Register SKPP",p.id]].map(([l,v])=>(
                  <div key={l} className="info-row"><span className="info-lbl">{l}</span><span className="info-val">{v||"—"}</span></div>
                ))}
                <div className="info-row" style={{gridColumn:"1/-1"}}>
                  <span className="info-lbl">Jenis SKPP</span>
                  <span className="info-val" style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {[["Pensiun",isPS],["Pindah",isPD],["Berhenti",isBH],["Janda/Duda",isJD]].map(([lbl,chk])=>(
                      <span key={lbl} style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}>
                        <span style={{width:14,height:14,border:"1.5px solid var(--outline)",borderRadius:2,display:"inline-flex",alignItems:"center",justifyContent:"center",background:chk?"#1a4b9b":"white",flexShrink:0}}>
                          {chk&&<span style={{color:"white",fontSize:9,fontWeight:900}}>✓</span>}
                        </span>{lbl}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* B. Alasan */}
          <div style={{marginBottom:16}}>
            <SectionTitle>B. Alasan Pengembalian Berkas *</SectionTitle>
            <CheckRow field="alasanDokumen" label="Berkas tidak lengkap (dokumen persyaratan kurang)"/>
            <CheckRow field="alasanHutang" label="Terdapat hutang/kewajiban finansial pegawai yang belum diselesaikan"/>
            {!fkData.alasanDokumen&&!fkData.alasanHutang&&(
              <div style={{fontSize:11,color:"#dc2626",padding:"0 4px"}}>* Pilih minimal satu alasan pengembalian</div>
            )}
          </div>

          {/* C. Rincian Dokumen Kurang — hanya jika alasan dokumen kurang */}
          {fkData.alasanDokumen && (
            <div style={{marginBottom:16}}>
              <SectionTitle>C. Rincian Dokumen Kurang yang Harus Dilengkapi</SectionTitle>
              <div style={{overflow:"hidden",borderRadius:14,border:"1px solid var(--outline-variant)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:600}}>
                  <thead>
                    <tr style={{background:"var(--surface-container-low)"}}>
                      {["No.","Dokumen Kurang","Tindakan yang Diperlukan","Batas Waktu"].map((h,i)=>(
                        <th key={h} style={{padding:"8px 10px",fontWeight:700,textAlign:i===0?"center":"left",border:"1px solid var(--outline-variant)",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fkData.rincian.map((row,i)=>(
                      <tr key={i} style={{background:i%2===1?"var(--surface-container-low)":"white"}}>
                        <td style={{padding:"5px 8px",border:"1px solid var(--outline-variant)",textAlign:"center",fontWeight:700,width:32,color:"var(--on-surface-variant)"}}>{i+1}</td>
                        <td style={{padding:"4px 6px",border:"1px solid var(--outline-variant)"}}>{dropLain(row,i,"dokumen","dokLain",DAFTAR_DOKUMEN_SKPP,"Tulis dokumen lain…")}</td>
                        <td style={{padding:"4px 6px",border:"1px solid var(--outline-variant)"}}>{dropLain(row,i,"tindakan","tinLain",DAFTAR_TINDAKAN,"Tulis tindakan lain…")}</td>
                        <td style={{padding:"4px 6px",border:"1px solid var(--outline-variant)",width:150}}>
                          <input type="date" value={row.batas} onChange={e=>updRincian(i,"batas",e.target.value)} style={cellInput}/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C/D. Rincian Jenis Hutang — hanya jika alasan terdapat hutang */}
          {fkData.alasanHutang && (
            <div style={{marginBottom:16}}>
              <SectionTitle>{fkData.alasanDokumen?"D":"C"}. Rincian Jenis Hutang / Kewajiban yang Harus Diselesaikan</SectionTitle>
              <div style={{overflow:"hidden",borderRadius:14,border:"1px solid var(--outline-variant)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:480}}>
                  <thead>
                    <tr style={{background:"var(--surface-container-low)"}}>
                      {["No.","Jenis Hutang","Batas Waktu"].map((h,i)=>(
                        <th key={h} style={{padding:"8px 10px",fontWeight:700,textAlign:i===0?"center":"left",border:"1px solid var(--outline-variant)",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fkData.rincianHutang.map((row,i)=>(
                      <tr key={i} style={{background:i%2===1?"var(--surface-container-low)":"white"}}>
                        <td style={{padding:"5px 8px",border:"1px solid var(--outline-variant)",textAlign:"center",fontWeight:700,width:32,color:"var(--on-surface-variant)"}}>{i+1}</td>
                        <td style={{padding:"4px 6px",border:"1px solid var(--outline-variant)"}}>
                          <input value={row.jenis} onChange={e=>updHutang(i,"jenis",e.target.value)} placeholder="Tulis jenis hutang / kewajiban finansial…" style={cellInput}/>
                        </td>
                        <td style={{padding:"4px 6px",border:"1px solid var(--outline-variant)",width:150}}>
                          <input type="date" value={row.batas} onChange={e=>updHutang(i,"batas",e.target.value)} style={cellInput}/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mekanisme Hutang — only if alasanHutang */}
          {fkData.alasanHutang && (
            <div style={{marginBottom:16}}>
              <SectionTitle>{fkData.alasanDokumen?"E":"D"}. Mekanisme Penyelesaian Hutang</SectionTitle>
              <CheckRow field="mPotong" label="Pemotongan dari hak keuangan pegawai (gaji terakhir, uang pensiun, dsb.)"/>
              <CheckRow field="mSetor" label="Penyetoran tunai ke Rekening Kas Umum Daerah (RKUD)"/>
              <CheckRow field="mCicilan" label="Cicilan sesuai kesepakatan (dilampiri Berita Acara Kesepakatan Pelunasan)"/>
              <div className="form-group" style={{marginTop:10,marginBottom:0}}>
                <label className="form-label">Jumlah Hutang yang Harus Diselesaikan</label>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontWeight:700,fontSize:15,flexShrink:0}}>Rp</span>
                  <input className="form-control" style={{margin:0,textAlign:"right",fontFamily:"var(--mono)",fontWeight:700}} type="text" inputMode="numeric"
                    value={fmtRibuan(fkData.jumlahHutang)} onChange={e=>setFkData(d=>({...d,jumlahHutang:e.target.value.replace(/\D/g,"")}))}
                    placeholder="0"/>
                </div>
              </div>
            </div>
          )}

          {/* Penandatangan */}
          <div style={{marginBottom:0}}>
            <SectionTitle>Penandatangan Formulir</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              {/* Staf Loket */}
              <div style={{background:"var(--surface-container-low)",borderRadius:14,padding:"13px 15px",border:"1px solid var(--outline-variant)"}}>
                <div style={{fontWeight:700,fontSize:12,marginBottom:10,color:"var(--on-surface)",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:"#4F6BCD",display:"inline-block"}}/>Staf Loket *
                </div>
                <div className="form-group" style={{marginBottom:8}}>
                  <label className="form-label">Pilih Staf Loket</label>
                  <select className="form-control" style={{margin:0}} value={fkData.stafLoket} onChange={e=>setFkData(d=>({...d,stafLoket:e.target.value}))}>
                    <option value="">-- Pilih --</option>
                    {stafLoketList.map(s=><option key={s.username} value={s.username}>{s.nama}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">NIP</label>
                  <input className="form-control" style={{margin:0,background:"var(--surface-container)"}} value={fkData.stafLoket} readOnly/>
                </div>
                {!fkData.stafLoket&&<div style={{fontSize:11,color:"#dc2626",marginTop:4}}>* Wajib dipilih</div>}
              </div>
              {/* Pengampu OPD */}
              <div style={{background:"var(--surface-container-low)",borderRadius:14,padding:"13px 15px",border:"1px solid var(--outline-variant)"}}>
                <div style={{fontWeight:700,fontSize:12,marginBottom:10,color:"var(--on-surface)",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:"#10B981",display:"inline-block"}}/>Pengampu OPD *
                </div>
                <div className="form-group" style={{marginBottom:8}}>
                  <label className="form-label">Nama</label>
                  <select className="form-control" style={{margin:0}} value={fkData.pengampuNIP}
                    onChange={e=>{
                      const acc = pengampuList.find(a=>a.username===e.target.value);
                      setFkData(d=>({...d,pengampuNIP:e.target.value,pengampuNama:acc?.nama||""}));
                    }}>
                    <option value="">-- Pilih --</option>
                    {pengampuList.map(a=><option key={a.username} value={a.username}>{a.nama}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">NIP</label>
                  <input className="form-control" style={{margin:0,background:"var(--surface-container)"}} value={fkData.pengampuNIP}
                    readOnly/>
                </div>
                {!fkData.pengampuNIP&&<div style={{fontSize:11,color:"#dc2626",marginTop:4}}>* Wajib dipilih</div>}
              </div>
              {/* Pemohon */}
              <div style={{background:"var(--surface-container-low)",borderRadius:14,padding:"13px 15px",border:"1px solid var(--outline-variant)"}}>
                <div style={{fontWeight:700,fontSize:12,marginBottom:10,color:"var(--on-surface)",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:"#f97316",display:"inline-block"}}/>Pemohon / Bendahara OPD
                </div>
                <div className="form-group" style={{marginBottom:8}}>
                  <label className="form-label">Nama</label>
                  <input className="form-control" style={{margin:0}} value={fkData.pemohonNama}
                    onChange={e=>setFkData(d=>({...d,pemohonNama:e.target.value}))} placeholder="Opsional"/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">NIP</label>
                  <input className="form-control" style={{margin:0}} value={fkData.pemohonNIP}
                    onChange={e=>setFkData(d=>({...d,pemohonNIP:e.target.value}))} placeholder="Opsional"/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:"14px 20px",borderTop:"1px solid var(--outline-variant)",display:"flex",gap:8,justifyContent:"flex-end",flexShrink:0,background:"var(--surface-container-lowest)"}}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn" style={{background:"#f97316",color:"white",gap:6}} onClick={handleCetak} disabled={!canSubmit}>
            🖨️ Cetak Formulir
          </button>
          <button className="btn" style={{background:"#dc2626",color:"white",gap:6}} onClick={onSubmit} disabled={saving||!canSubmit}>
            {saving?"⏳ Menyimpan...":"↩ Simpan & Kembalikan Berkas"}
          </button>
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

// ─── DAFTAR PERIKSA VERIFIKASI MODAL ──────────────────────────────────────────
function DaftarPeriksaModal({ p, dpData, setDpData, stafLoketList=[], pengampuList=[], saving, onClose, onCetak, onSelesai, onKembalikan }) {
  const al = p.alasan||"";
  const isJD = al.includes("Janda")||al.includes("Duda")||al.includes("Meninggal");
  const isBH = al.includes("Berhenti")||al.includes("Pemberhentian");
  const isPD = al.includes("Pindah");
  const isPS = al.includes("Pensiun")&&!isJD;
  const jenisStr = [isPS&&"Pensiun",isPD&&"Pindah",isBH&&"Berhenti",isJD&&"Janda/Duda"].filter(Boolean).join(" · ")||"—";

  const setDok = (i,patch) => setDpData(d=>({...d,dok:d.dok.map((x,ix)=>ix===i?{...x,...patch}:x)}));
  const setHut = (i,patch) => setDpData(d=>({...d,hutang:d.hutang.map((x,ix)=>ix===i?{...x,...patch}:x)}));
  const set = (k,v) => setDpData(d=>({...d,[k]:v}));

  const pill = (active,color) => ({
    flex:"none",padding:"3px 10px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",
    border:`1.5px solid ${active?color:"var(--outline-variant,#d6deea)"}`,
    background:active?color:"#fff",color:active?"#fff":"var(--on-surface-variant,#64748b)",
  });
  const StatusToggle = ({ val, onSet }) => (
    <div style={{display:"flex",gap:5}}>
      <button type="button" style={pill(val==="ada","#0E7C7B")} onClick={()=>onSet(val==="ada"?"":"ada")}>Ada</button>
      <button type="button" style={pill(val==="tidak","#dc2626")} onClick={()=>onSet(val==="tidak"?"":"tidak")}>Tidak Ada</button>
    </div>
  );
  const ketInput = { width:"100%",border:"1px solid var(--outline-variant,#d6deea)",borderRadius:7,
    padding:"4px 8px",fontSize:11.5,outline:"none",background:"#fff",boxSizing:"border-box" };

  const tampilGrup = dpGrupTampil(al);
  let no = 0;
  const canSelesai = dpData.kesimpulan === "lengkap";
  const canKembali = dpData.kesimpulan === "kembali";

  return (
    <div className="modal-overlay" style={{zIndex:10000}}>
      <div className="modal" style={{maxWidth:820}}>
        <div className="modal-header">
          <div>
            <div style={{fontWeight:800,fontSize:14,color:"var(--primary)",letterSpacing:"-0.3px"}}>📋 Daftar Periksa Verifikasi Berkas</div>
            <div style={{fontSize:11,color:"var(--on-surface-variant)",marginTop:2}}>Verifikasi oleh Staf Pengampu OPD</div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>

        <div className="modal-body">
          {/* Identitas otomatis dari data pengajuan */}
          <div style={{background:"var(--surface-container-low,#f6f8fc)",border:"1px solid var(--outline-variant,#e2e8f0)",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
            <div className="grid-2" style={{gap:"4px 14px"}}>
              {[
                ["Nama Pegawai",p.nama],["NIP",p.nip],["Pangkat / Gol.",p.pangkat],["Jabatan",p.jabatan],
                ["OPD",p.opd],["Jenis SKPP",jenisStr],["Nomor Register",p.id],["Tanggal Pengajuan",p.tanggalMasuk],
              ].map(([l,v])=>(
                <div key={l} style={{display:"flex",gap:8,fontSize:12,padding:"2px 0"}}>
                  <span style={{minWidth:108,color:"var(--on-surface-variant)",fontWeight:600}}>{l}</span>
                  <span style={{fontWeight:700,color:"var(--on-surface)"}}>{v||"—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* A. Kelengkapan dokumen */}
          <div style={{fontWeight:800,fontSize:12.5,color:"var(--on-surface)",margin:"4px 0 8px"}}>A. Kelengkapan Dokumen Persyaratan</div>
          {DP_DOKUMEN_GRUP.map((g,gi)=> tampilGrup[gi] && (
            <div key={g.grup} style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--primary)",background:"var(--surface-container-low,#eef2fa)",padding:"5px 9px",borderRadius:6,fontStyle:"italic"}}>{g.grup}</div>
              {g.items.map((it,j)=>{
                const gIndex = DP_GRUP_OFFSET[gi] + j; const num = ++no; const st = dpData.dok[gIndex]||{};
                return (
                  <div key={gIndex} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 4px",borderBottom:"1px solid var(--outline-variant,#eef2f7)"}}>
                    <span style={{minWidth:18,fontSize:11.5,color:"var(--on-surface-variant)",fontWeight:700,marginTop:3}}>{num}.</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,lineHeight:1.4,color:"var(--on-surface)"}}>
                        {it.t} {it.ket && <span style={{fontSize:10,color:"#b45309",fontStyle:"italic"}}>({it.ket})</span>}
                      </div>
                      <input style={{...ketInput,marginTop:5}} placeholder="Keterangan (opsional)"
                        value={st.ket||""} onChange={e=>setDok(gIndex,{ket:e.target.value})}/>
                    </div>
                    <div style={{marginTop:2}}><StatusToggle val={st.status} onSet={v=>setDok(gIndex,{status:v})}/></div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* B. Pengecekan hutang */}
          <div style={{fontWeight:800,fontSize:12.5,color:"var(--on-surface)",margin:"14px 0 8px"}}>B. Pengecekan Hutang / Kewajiban Finansial</div>
          {DP_HUTANG.map((h,i)=>{
            const st = dpData.hutang[i]||{};
            return (
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 4px",borderBottom:"1px solid var(--outline-variant,#eef2f7)"}}>
                <span style={{minWidth:18,fontSize:11.5,color:"var(--on-surface-variant)",fontWeight:700,marginTop:3}}>{i+1}.</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,lineHeight:1.4,color:"var(--on-surface)"}}>{h}</div>
                  <input style={{...ketInput,marginTop:5}} placeholder="Keterangan / Jumlah (Rp)"
                    value={st.ket||""} onChange={e=>setHut(i,{ket:e.target.value})}/>
                </div>
                <div style={{marginTop:2}}><StatusToggle val={st.status} onSet={v=>setHut(i,{status:v})}/></div>
              </div>
            );
          })}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10,padding:"10px 12px",background:"var(--surface-container-low,#f6f8fc)",borderRadius:8}}>
            <span style={{fontSize:11.5,fontWeight:700,color:"var(--on-surface-variant)",alignSelf:"center"}}>Kesimpulan Hutang:</span>
            <button type="button" style={pill(dpData.kesimpulanHutang==="bebas","#0E7C7B")} onClick={()=>set("kesimpulanHutang","bebas")}>Bebas Hutang</button>
            <button type="button" style={pill(dpData.kesimpulanHutang==="hutang","#dc2626")} onClick={()=>set("kesimpulanHutang","hutang")}>Terdapat Hutang</button>
          </div>

          {/* C. Kesimpulan verifikasi */}
          <div style={{fontWeight:800,fontSize:12.5,color:"var(--on-surface)",margin:"16px 0 8px"}}>C. Kesimpulan Verifikasi & Tindak Lanjut</div>
          <div
            onClick={()=>set("kesimpulan","lengkap")}
            style={{display:"flex",gap:10,alignItems:"flex-start",padding:"11px 13px",marginBottom:8,cursor:"pointer",borderRadius:10,
              border:`1.5px solid ${dpData.kesimpulan==="lengkap"?"#0E7C7B":"var(--outline-variant,#d6deea)"}`,
              background:dpData.kesimpulan==="lengkap"?"rgba(14,124,123,0.07)":"#fff"}}>
            <input type="radio" checked={dpData.kesimpulan==="lengkap"} readOnly style={{marginTop:2}}/>
            <div><div style={{fontWeight:700,fontSize:12.5,color:"#0E5A59"}}>Berkas Lengkap & Bebas Hutang</div>
              <div style={{fontSize:11,color:"var(--on-surface-variant)"}}>Dapat diproses lebih lanjut — verifikasi diselesaikan, lanjut ke tahap berikutnya.</div></div>
          </div>
          <div
            onClick={()=>set("kesimpulan","kembali")}
            style={{display:"flex",gap:10,alignItems:"flex-start",padding:"11px 13px",marginBottom:10,cursor:"pointer",borderRadius:10,
              border:`1.5px solid ${dpData.kesimpulan==="kembali"?"#dc2626":"var(--outline-variant,#d6deea)"}`,
              background:dpData.kesimpulan==="kembali"?"rgba(220,38,38,0.06)":"#fff"}}>
            <input type="radio" checked={dpData.kesimpulan==="kembali"} readOnly style={{marginTop:2}}/>
            <div><div style={{fontWeight:700,fontSize:12.5,color:"#b91c1c"}}>Berkas Tidak Lengkap / Terdapat Hutang</div>
              <div style={{fontSize:11,color:"var(--on-surface-variant)"}}>Dikembalikan kepada pemohon — lanjut mengisi Formulir Pengembalian.</div></div>
          </div>
          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea className="form-control" value={dpData.catatan} onChange={e=>set("catatan",e.target.value)} placeholder="Catatan verifikasi (opsional)"/>
          </div>

          {/* Tanda tangan */}
          <div className="grid-2" style={{gap:14,marginTop:8}}>
            <div style={{border:"1px solid var(--outline-variant,#e2e8f0)",borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontWeight:700,fontSize:11.5,color:"var(--on-surface-variant)",marginBottom:8}}>Diterima oleh / Staf Loket</div>
              <div className="form-group" style={{marginBottom:8}}><label className="form-label">Nama</label>
                <select className="form-control" value={dpData.stafLoketUser||""}
                  onChange={e=>{
                    const u = stafLoketList.find(s=>s.username===e.target.value);
                    setDpData(d=>({...d, stafLoketUser:e.target.value, stafLoketNama:u?.nama||"", stafLoketNIP:u?.username||""}));
                  }}>
                  <option value="">— Pilih staf loket —</option>
                  {stafLoketList.map(s=> <option key={s.username} value={s.username}>{s.nama}</option>)}
                </select></div>
              <div className="form-group" style={{marginBottom:0}}><label className="form-label">NIP</label>
                <input className="form-control" value={dpData.stafLoketNIP} readOnly style={{background:"var(--surface-container-low,#f6f8fc)"}}/></div>
            </div>
            <div style={{border:"1px solid var(--outline-variant,#e2e8f0)",borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontWeight:700,fontSize:11.5,color:"var(--on-surface-variant)",marginBottom:8}}>Diverifikasi oleh / Pengampu OPD</div>
              <div className="form-group" style={{marginBottom:8}}><label className="form-label">Nama</label>
                <select className="form-control" value={dpData.pengampuUser||""}
                  onChange={e=>{
                    const u = pengampuList.find(s=>s.username===e.target.value);
                    setDpData(d=>({...d, pengampuUser:e.target.value, pengampuNama:u?.nama||"", pengampuNIP:u?.username||""}));
                  }}>
                  {!pengampuList.some(s=>s.username===dpData.pengampuUser) && dpData.pengampuNama && (
                    <option value={dpData.pengampuUser||""}>{dpData.pengampuNama}</option>
                  )}
                  {pengampuList.map(s=> <option key={s.username} value={s.username}>{s.nama}</option>)}
                </select></div>
              <div className="form-group" style={{marginBottom:0}}><label className="form-label">NIP</label>
                <input className="form-control" value={dpData.pengampuNIP} readOnly style={{background:"var(--surface-container-low,#f6f8fc)"}}/></div>
            </div>
          </div>
          <div className="grid-2" style={{gap:14,marginTop:10}}>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Tempat</label>
              <input className="form-control" value={dpData.tempat} onChange={e=>set("tempat",e.target.value)}/></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Tanggal</label>
              <input className="form-control" type="date" value={dpData.tanggal} onChange={e=>set("tanggal",e.target.value)}/></div>
          </div>
        </div>

        <div className="modal-footer" style={{flexWrap:"wrap",gap:8}}>
          <button className="btn btn-secondary" onClick={onCetak}>🖨 Cetak Daftar Periksa</button>
          {canKembali ? (
            <button className="btn" style={{background:"var(--error)",color:"#fff"}} disabled={saving} onClick={onKembalikan}>
              {saving?"⏳ Memproses…":"↩ Cetak & Kembalikan Berkas"}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={saving||!canSelesai} onClick={onSelesai}>
              {saving?"⏳ Menyimpan…":!dpData.kesimpulan?"Pilih kesimpulan dahulu":"✔ Selesai Verifikasi & Cetak"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── INPUT BARU ───────────────────────────────────────────────────────────────
function InputBaru({ onClose, onSave, onSaveBulk, saving }) {
  const [mode, setMode] = useState("tunggal");
  const [form, setForm] = useState({ nama:"", nip:"", opd:"", jabatan:"", pangkat:"", alasan:"Pensiun", jalur:"A", kasubid:DAFTAR_KASUBID[0] });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  // TMT Pindah — hanya untuk peringatan kemungkinan kelebihan gaji (tidak ikut disimpan).
  const [tmtPindah, setTmtPindah] = useState("");
  const isPindah = form.alasan === "Pindah";
  const today0 = new Date(); today0.setHours(0,0,0,0);
  const tmtDate = tmtPindah ? new Date(tmtPindah) : null;
  const pindahWarn = isPindah && tmtDate && !isNaN(tmtDate) && tmtDate < today0;
  const selisihHariPindah = pindahWarn ? Math.floor((today0 - tmtDate) / 86400000) : 0;
  const [showPindahPopup, setShowPindahPopup] = useState(false);
  // Klik simpan: jika ada potensi kelebihan gaji (Pindah & TMT terlewati), tampilkan popup konfirmasi dulu.
  const handleSimpanTunggal = () => { if (pindahWarn) setShowPindahPopup(true); else onSave(form); };
  const [bulkOPD, setBulkOPD] = useState("");
  const emptyItem = () => ({ nama:"", nip:"", jabatan:"", pangkat:"", kasubid:DAFTAR_KASUBID[0], alasan:"Pensiun", jalur:"A", tmt:"", _id:Date.now()+Math.random() });
  const [items, setItems] = useState([emptyItem()]);
  const setItem = (idx,k,v) => setItems(prev=>prev.map((it,i)=>i===idx?{...it,[k]:v}:it));
  const addItem = () => setItems(prev=>[...prev,emptyItem()]);
  const removeItem = (idx) => setItems(prev=>prev.filter((_,i)=>i!==idx));
  const duplicateItem = (idx) => setItems(prev=>{ const clone={...prev[idx],_id:Date.now()+Math.random()}; const next=[...prev]; next.splice(idx+1,0,clone); return next; });
  const bulkValid = bulkOPD && items.length>0 && items.every(it=>it.nama&&it.nip&&it.kasubid);
  // Pegawai Pindah yang TMT-nya sudah terlewati (potensi kelebihan gaji)
  const bulkPindahOffenders = items.filter(it => it.alasan==="Pindah" && it.tmt && !isNaN(new Date(it.tmt)) && new Date(it.tmt) < today0);
  const [showBulkPindahPopup, setShowBulkPindahPopup] = useState(false);
  const doSaveBulk = () => {
    // tmt hanya untuk peringatan, tidak ikut disimpan ke server
    onSaveBulk({ namaOPD:bulkOPD, items:items.map(({_id,tmt,...rest})=>rest) });
  };
  const handleSaveBulk = () => {
    if(!bulkValid) return;
    if(bulkPindahOffenders.length>0) setShowBulkPindahPopup(true);
    else doSaveBulk();
  };

  return (
    <>
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
              <SearchableSelect label="Pangkat / Golongan" value={form.pangkat} onChange={v=>set("pangkat",v)} options={DAFTAR_PANGKAT} placeholder="-- Pilih Pangkat / Golongan --"/>
              <div className="form-group"><label className="form-label">Jabatan Terakhir</label><input className="form-control" value={form.jabatan} onChange={e=>set("jabatan",e.target.value)}/></div>
            </div>
            <SearchableSelect label="OPD / Instansi *" value={form.opd} onChange={v=>set("opd",v)} options={DAFTAR_OPD} placeholder="-- Pilih OPD / Instansi --"/>
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
            {isPindah && (
              <div className="form-group" style={{marginTop:2}}>
                <label className="form-label">Tanggal TMT Pindah *</label>
                <input type="date" className="form-control" value={tmtPindah} onChange={e=>setTmtPindah(e.target.value)} style={{maxWidth:240}}/>
                <div style={{marginTop:6,fontSize:11,color:"var(--on-surface-variant)"}}>Tanggal mulai berlaku (TMT) pindah sesuai SK — dipakai untuk memeriksa kemungkinan kelebihan pembayaran gaji.</div>
              </div>
            )}
            {form.jalur==="B" && <div className="alert alert-amber"><span>ℹ️</span><span style={{fontSize:12}}>Jalur B memerlukan proses kekurangan pangkat via SIMgaji dan SP2D sebelum SKPP dibuat.</span></div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
            <button className="btn btn-primary" disabled={saving||!form.nama||!form.nip||!form.opd||!form.kasubid} onClick={handleSimpanTunggal}>
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
              <SearchableSelect label="OPD / Instansi Pengirim *" value={bulkOPD} onChange={v=>setBulkOPD(v)} options={DAFTAR_OPD} placeholder="-- Pilih OPD --"/>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:11,color:"var(--on-surface-variant)",textTransform:"uppercase",letterSpacing:"0.07em"}}>
                Daftar Pegawai <span style={{background:"var(--primary)",color:"white",borderRadius:999,padding:"2px 8px",fontSize:11,fontWeight:800,marginLeft:6}}>{items.length}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={addItem}>+ Tambah Baris</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {items.map((it,idx)=>(
                <div key={it._id} style={{border:"1.5px solid var(--outline-variant)",borderRadius:14,padding:"14px 16px",background:"var(--surface-container-lowest)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:12}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:8,fontWeight:800,fontSize:12.5,color:"var(--primary)"}}>
                      <span style={{width:24,height:24,borderRadius:"50%",background:"var(--primary-fixed)",color:"var(--primary)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--mono)",fontSize:12}}>{idx+1}</span>
                      Pegawai #{idx+1}
                    </span>
                    <div style={{display:"flex",gap:6}}>
                      <button type="button" title="Duplikat data pegawai ini" onClick={()=>duplicateItem(idx)}
                        style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 11px",border:"1px solid var(--outline-variant)",borderRadius:8,background:"white",cursor:"pointer",fontSize:11.5,fontWeight:600,color:"var(--on-surface-variant)"}}>⧉ Duplikat</button>
                      {items.length>1 && (
                        <button type="button" title="Hapus pegawai ini" onClick={()=>removeItem(idx)}
                          style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 11px",border:"1px solid #fca5a5",borderRadius:8,background:"var(--error-container)",cursor:"pointer",fontSize:11.5,fontWeight:600,color:"var(--error)"}}>✕ Hapus</button>
                      )}
                    </div>
                  </div>
                  <div className="grid-2" style={{gap:12}}>
                    <div className="form-group" style={{marginBottom:0}}>
                      <label className="form-label">Nama Lengkap *</label>
                      <input className="form-control" style={{marginBottom:0}} value={it.nama} onChange={e=>setItem(idx,"nama",e.target.value)} placeholder="Nama sesuai SK"/>
                    </div>
                    <div className="form-group" style={{marginBottom:0}}>
                      <label className="form-label">NIP *</label>
                      <input className="form-control" style={{marginBottom:0,fontFamily:"var(--mono)"}} value={it.nip} onChange={e=>setItem(idx,"nip",e.target.value)} placeholder="18 digit"/>
                    </div>
                    <div className="form-group" style={{marginBottom:0}}>
                      <label className="form-label">Jabatan</label>
                      <input className="form-control" style={{marginBottom:0}} value={it.jabatan} onChange={e=>setItem(idx,"jabatan",e.target.value)} placeholder="Jabatan terakhir"/>
                    </div>
                    <div className="form-group" style={{marginBottom:0}}>
                      <label className="form-label">Pangkat / Golongan</label>
                      <select className="form-control" style={{marginBottom:0}} value={it.pangkat} onChange={e=>setItem(idx,"pangkat",e.target.value)}>
                        <option value="">-- Pilih Pangkat / Golongan --</option>
                        {DAFTAR_PANGKAT.map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{marginBottom:0}}>
                      <label className="form-label">Kasubid Pembayaran *</label>
                      <select className="form-control" style={{marginBottom:0}} value={it.kasubid} onChange={e=>setItem(idx,"kasubid",e.target.value)}>
                        {DAFTAR_KASUBID.map((k,i)=><option key={i} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{marginBottom:0}}>
                      <label className="form-label">Keperluan SKPP</label>
                      <select className="form-control" style={{marginBottom:0}} value={it.alasan} onChange={e=>setItem(idx,"alasan",e.target.value)}>
                        {DAFTAR_KEPERLUAN.map(k=><option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{marginBottom:0}}>
                      <label className="form-label">Jalur Proses</label>
                      <select className="form-control" style={{marginBottom:0}} value={it.jalur} onChange={e=>setItem(idx,"jalur",e.target.value)}>
                        <option value="A">Jalur A – Tanpa Pangkat Pengabdian</option>
                        <option value="B">Jalur B – Ada Pangkat Pengabdian</option>
                      </select>
                    </div>
                    {it.alasan==="Pindah" && (
                      <div className="form-group" style={{marginBottom:0}}>
                        <label className="form-label">Tanggal TMT Pindah *</label>
                        <input type="date" className="form-control" style={{marginBottom:0}} value={it.tmt} onChange={e=>setItem(idx,"tmt",e.target.value)}/>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem}
              style={{marginTop:12,width:"100%",padding:"11px",border:"1.5px dashed var(--primary)",borderRadius:12,background:"var(--primary-fixed)",color:"var(--primary)",cursor:"pointer",fontWeight:700,fontSize:13}}>
              + Tambah Pegawai
            </button>
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

    {showPindahPopup && (
      <div className="modal-overlay" style={{zIndex:11000}}>
        <div className="modal" style={{maxWidth:440,borderRadius:"22px",overflow:"hidden"}}>
          <div className="modal-header" style={{background:"#fffbeb",borderBottom:"1px solid #fde68a"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:22}}>⚠️</span>
              <div style={{fontWeight:800,fontSize:14,color:"#92400e"}}>Kemungkinan Kelebihan Pembayaran Gaji</div>
            </div>
          </div>
          <div className="modal-body" style={{fontSize:13,lineHeight:1.6,color:"var(--on-surface)"}}>
            Tanggal pembuatan SKPP (hari ini) sudah melewati <strong>TMT Pindah ({fmtDate(tmtPindah)})</strong> selama <strong>{selisihHariPindah} hari</strong>.
            <div style={{marginTop:10,padding:"10px 12px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,color:"#92400e"}}>
              Pegawai berkemungkinan masih menerima pembayaran gaji setelah TMT pindah. Mohon periksa dan perhitungkan/setorkan kembali kelebihan pembayaran sebelum SKPP diterbitkan.
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={()=>setShowPindahPopup(false)} disabled={saving}>Periksa Dulu</button>
            <button className="btn btn-primary" disabled={saving} onClick={()=>{setShowPindahPopup(false);onSave(form);}}>
              {saving?"⟳ Menyimpan...":"Mengerti, Tetap Simpan"}
            </button>
          </div>
        </div>
      </div>
    )}

    {showBulkPindahPopup && (
      <div className="modal-overlay" style={{zIndex:11000}}>
        <div className="modal" style={{maxWidth:480,borderRadius:"22px",overflow:"hidden"}}>
          <div className="modal-header" style={{background:"#fffbeb",borderBottom:"1px solid #fde68a"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:22}}>⚠️</span>
              <div style={{fontWeight:800,fontSize:14,color:"#92400e"}}>Kemungkinan Kelebihan Pembayaran Gaji</div>
            </div>
          </div>
          <div className="modal-body" style={{fontSize:13,lineHeight:1.55,color:"var(--on-surface)"}}>
            <strong>{bulkPindahOffenders.length} pegawai Pindah</strong> memiliki tanggal pembuatan SKPP (hari ini) yang sudah melewati TMT Pindah:
            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}}>
              {bulkPindahOffenders.map((it,i)=>{
                const hari = Math.floor((today0 - new Date(it.tmt)) / 86400000);
                return (
                  <div key={i} style={{padding:"8px 12px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,color:"#92400e",fontSize:12}}>
                    <strong>{it.nama||"(tanpa nama)"}</strong> — TMT {fmtDate(it.tmt)} · lewat <strong>{hari} hari</strong>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:10,fontSize:12,color:"#b45309"}}>Pegawai-pegawai tersebut berkemungkinan masih menerima gaji setelah TMT pindah. Mohon periksa dan perhitungkan/setorkan kembali kelebihannya sebelum SKPP diterbitkan.</div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={()=>setShowBulkPindahPopup(false)} disabled={saving}>Periksa Dulu</button>
            <button className="btn btn-primary" disabled={saving} onClick={()=>{setShowBulkPindahPopup(false);doSaveBulk();}}>
              {saving?"⟳ Menyimpan...":"Mengerti, Tetap Simpan"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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
/* ── d2 inline icons (from SI-PASTI design handoff) ── */
function D2Ico({ d, size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  );
}
const D2ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  archive: <><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/></>,
  staff: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></>,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></>,
  cog: <><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19.1 4.9l-2.1 2.1M7 17l-2.1 2.1M19.1 19.1 17 17M7 7 4.9 4.9"/></>,
  check: <><path d="M20 6 9 17l-5-5"/></>,
  returned: <><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v2"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  report: <><path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-3"/></>,
};

/* ── d2 mini charts (pure SVG) ── */
function D2Spark({ points, color="var(--blue-500)", fill="rgba(23,99,214,0.12)" }) {
  const w=132,h=36,max=Math.max(...points,1),min=Math.min(...points);
  const span=max-min||1, step=w/(Math.max(points.length-1,1));
  const xy=points.map((p,i)=>[i*step, h-4-(p-min)/span*(h-10)]);
  const line=xy.map(p=>p.join(",")).join(" ");
  const area=`${xy[0][0]},${h} ${line} ${xy[xy.length-1][0]},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{display:"block"}}>
      <polygon points={area} fill={fill}/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xy[xy.length-1][0]} cy={xy[xy.length-1][1]} r="2.6" fill={color}/>
    </svg>
  );
}
function D2Bars({ values, color="var(--gold-500)" }) {
  const max=Math.max(...values,1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:36,width:"100%"}}>
      {values.map((v,i)=><div key={i} style={{flex:1,height:`${Math.max(12,v/max*100)}%`,background:color,borderRadius:3,opacity:0.55+0.45*(v/max)}}/>)}
    </div>
  );
}

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

  const isSelesai = d => d.status==="selesai"||getProgress(d)===100;
  const s = {
    total:   filteredData.length,
    proses:  filteredData.filter(d => !isSelesai(d) && d.status!=="kembali").length,
    selesai: filteredData.filter(d => isSelesai(d)).length,
    kembali: filteredData.filter(d => d.status==="kembali").length,
  };

  const byOPD  = filteredData.reduce((acc,p)=>{ acc[p.opd]=(acc[p.opd]||0)+1; return acc; }, {});
  const topOPD = Object.entries(byOPD).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxOPD = topOPD.length ? topOPD[0][1] : 1;
  const pctSelesai = s.total ? Math.round((s.selesai/s.total)*100) : 0;
  const recent = [...filteredData].sort((a,b)=>new Date(b.tanggalMasuk)-new Date(a.tanggalMasuk)).slice(0,6);

  // Jalur A/B (dari data terfilter)
  const jalurStat = ["A","B"].map(j => {
    const arr = filteredData.filter(p=>p.jalur===j);
    const done = arr.filter(isSelesai).length;
    return { jalur:j, tag:`Jalur ${j}`, desc: j==="A"?"Tanpa Pangkat Pengabdian":"Ada Pangkat Pengabdian",
      count:arr.length, done, color: j==="A"?"var(--blue-600)":"var(--navy-600)" };
  });

  const WAKTU_OPTS = [
    { v:"hari_ini",  l:"Hari Ini" },
    { v:"minggu_ini",l:"Minggu Ini" },
    { v:"bulan_ini", l:"Bulan Ini" },
    { v:"semua",     l:"Semua Data" },
  ];
  const labelWaktu = WAKTU_OPTS.find(o=>o.v===filterWaktu)?.l || "";

  // Deret harian untuk mini-chart (berbasis seluruh data, bukan terfilter)
  const seriesFor = (n, pred) => {
    const pts = [];
    for (let i=n-1; i>=0; i--) {
      const d=new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
      const nx=new Date(d); nx.setDate(nx.getDate()+1);
      pts.push(data.filter(p=>{ if(!p.tanggalMasuk) return false; const m=new Date(p.tanggalMasuk); return m>=d&&m<nx&&pred(p); }).length);
    }
    return pts;
  };
  const totalSeries  = seriesFor(7, ()=>true);
  const prosesSeries = seriesFor(7, p=>!isSelesai(p)&&p.status!=="kembali");
  const kembaliBars  = seriesFor(4, p=>p.status==="kembali");

  const KPIS = [
    { key:"total",   label:"Total Pengajuan", value:s.total,   icon:"clipboard", tint:"var(--blue-50)",    accent:"var(--blue-600)",    viz:"line", series:totalSeries,  note:"Tren 7 hari terakhir" },
    { key:"proses",  label:"Sedang Diproses", value:s.proses,  icon:"cog",       tint:"var(--blue-50)",    accent:"var(--navy-600)",    viz:"line", series:prosesSeries, lineColor:"var(--navy-500)", fill:"rgba(0,48,96,0.10)", note:"Tren 7 hari terakhir" },
    { key:"selesai", label:"Selesai",         value:s.selesai, icon:"check",     tint:"var(--success-50)", accent:"var(--success-500)", viz:"pct",  pct:pctSelesai, note:"Persentase selesai" },
    { key:"kembali", label:"Dikembalikan",    value:s.kembali, icon:"returned",  tint:"var(--gold-100)",   accent:"var(--gold-600)",    viz:"bar",  bars:kembaliBars, note:"Distribusi 4 hari" },
  ];

  const statusTone  = p => isSelesai(p) ? "green" : p.status==="kembali" ? "danger" : "blue";
  const statusLabel = p => isSelesai(p) ? "Selesai" : p.status==="kembali" ? "Dikembalikan" : "Diproses";

  return (
    <>
      {/* Welcome + filter waktu */}
      <div className="d2-headrow">
        <div className="d2-welcome">
          <span className="d2-welcome-sub">Selamat datang,</span>
          <h1 className="d2-welcome-name">{user?.nama || "—"}</h1>
        </div>
        <div className="d2-filters" role="tablist">
          {WAKTU_OPTS.map(opt=>(
            <button key={opt.v} role="tab" aria-selected={filterWaktu===opt.v}
              className={"d2-filter"+(filterWaktu===opt.v?" is-active":"")}
              onClick={()=>setFilterWaktu(opt.v)}>{opt.l}</button>
          ))}
        </div>
      </div>

      {/* Row 1: KPI cards */}
      <div className="d2-kpis">
        {KPIS.map(k=>(
          <div key={k.key} className="kpi">
            <div className="kpi__top">
              <span className="kpi__label">{k.label}</span>
              <span className="kpi__icon" style={{background:k.tint,color:k.accent}}><D2Ico d={D2ICONS[k.icon]} size={17}/></span>
            </div>
            <div className="kpi__value tnum">{loading?"—":k.value}</div>
            <div className="kpi__viznote">{k.note}</div>
            <div className="kpi__viz">
              {k.viz==="line" && <D2Spark points={k.series} color={k.lineColor||"var(--blue-500)"} fill={k.fill}/>}
              {k.viz==="bar" && <D2Bars values={k.bars} color={k.accent}/>}
              {k.viz==="pct" && (
                <div className="kpi__pct">
                  <div className="kpi__pcttrack"><div className="kpi__pctfill" style={{width:`${k.pct}%`}}/></div>
                  <span className="kpi__pctnum tnum">{k.pct}%</span>
                </div>
              )}
            </div>
            <div className="kpi__foot">{labelWaktu}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Jalur A/B + Top OPD */}
      <div className="d2-analysis">
        {jalurStat.map(j=>(
          <div key={j.jalur} className="d2-jalur">
            <div className="d2-jalur-head">
              <span className="d2-jalur-tag" style={{background:j.color}}>{j.tag}</span>
              <span className="d2-jalur-count tnum">{loading?"—":j.count}</span>
            </div>
            <div className="d2-jalur-desc">{j.desc}</div>
            <div className="d2-jalur-bar"><div className="d2-jalur-fill" style={{width:`${j.count?j.done/j.count*100:0}%`,background:j.color}}/></div>
            <div className="d2-jalur-meta"><span>{j.done} selesai</span><span className="tnum">{j.count?Math.round(j.done/j.count*100):0}%</span></div>
          </div>
        ))}
        <div className="d2-opd">
          <div className="d2-opd-head"><h3>Top OPD Pengajuan</h3><span className="d2-opd-tag">{topOPD.length} OPD</span></div>
          {topOPD.length===0 ? (
            <div className="d2-opd-empty">Belum ada data pada periode ini.</div>
          ) : (
            <ul className="d2-opd-list">
              {topOPD.map(([opd,jml],i)=>{
                const pct = maxOPD ? Math.round(jml/maxOPD*100) : 0;
                return (
                  <li key={opd} className="d2-opd-item">
                    <span className="d2-opd-rank tnum">{i+1}</span>
                    <div className="d2-opd-info">
                      <span className="d2-opd-name" title={opd}>{opd}</span>
                      <div className="d2-opd-track"><div className="d2-opd-fill" style={{width:`${pct}%`}}/></div>
                    </div>
                    <div className="d2-opd-stat"><b className="tnum">{jml}</b><span className="tnum">{s.total?Math.round(jml/s.total*100):0}%</span></div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Row 3: tabel */}
      <div className="d2-tbl-card">
        <div className="d2-tbl-head">
          <h3>Daftar Pengajuan Terbaru</h3>
          <span className="d2-tbl-meta">{recent.length} terbaru · {labelWaktu}</span>
        </div>
        <div className="d2-tbl-scroll">
          {loading ? (
            <div className="d2-empty">Memuat data…</div>
          ) : recent.length===0 ? (
            <div className="d2-empty">Belum ada pengajuan pada periode ini.</div>
          ) : (
            <table className="d2-tbl">
              <thead>
                <tr>
                  <th>No. Pengajuan</th><th>OPD / Nama</th><th>NIP</th><th>Jalur</th><th>Status</th><th>Tgl Masuk · Aging</th><th className="d2-th-act">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(p=>{
                  const aging = hitungHariKe(p.tanggalMasuk) ?? 0;
                  return (
                    <tr key={p.id} style={{cursor:"pointer"}} onClick={()=>onDetail && onDetail(p)}>
                      <td><code>{p.id||"—"}</code></td>
                      <td>
                        <div className="d2-cell-opd">{p.opd||"—"}</div>
                        <div className="d2-cell-name">{p.nama||"—"}</div>
                      </td>
                      <td><span className="d2-nip tnum">{p.nip||"—"}</span></td>
                      <td><span className={"d2-jpill d2-jpill--"+(p.jalur||"A")}>Jalur {p.jalur||"A"}</span></td>
                      <td><span className={"d2-sbadge d2-sbadge--"+statusTone(p)}>{statusLabel(p)}</span></td>
                      <td>
                        <div className="d2-cell-date tnum">{fmtDate(p.tanggalMasuk)}</div>
                        {!isSelesai(p) && <div className={"d2-aging"+(aging>=3?" is-warn":"")}>{aging} hari</div>}
                      </td>
                      <td className="d2-th-act">
                        <button className="d2-act" title="Lihat detail" aria-label="Lihat detail"
                          onClick={e=>{e.stopPropagation();onDetail && onDetail(p);}}>
                          <D2Ico d={D2ICONS.eye} size={16}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {s.kembali > 0 && (
        <div className="alert alert-amber" style={{marginTop:2}}>
          <IcoAlert size={16}/>
          <div><strong>Perlu Perhatian —</strong> Ada <strong>{s.kembali} pengajuan</strong> dengan berkas dikembalikan. Segera koordinasi dengan OPD terkait.</div>
        </div>
      )}
    </>
  );
}
// ─── PAGE PENGAJUAN ───────────────────────────────────────────────────────────
function PagePengajuan({ data, loading, onRefresh, onDetail, onInputBaru, onExport, user }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterJalur, setFilterJalur] = useState("semua");

  const isSelesai = p => p.status==="selesai"||getProgress(p)===100;
  const isProses  = p => !isSelesai(p) && p.status!=="kembali";
  // Basis filter (pencarian + jalur), tanpa status — dipakai untuk hitung jumlah per tab.
  const baseFiltered = data.filter(p => {
    const q = search.toLowerCase();
    const ms = !q||p.id?.toLowerCase().includes(q)||p.nama?.toLowerCase().includes(q)||p.nip?.toString().includes(q)||p.opd?.toLowerCase().includes(q);
    const mj = filterJalur==="semua"||p.jalur===filterJalur;
    return ms&&mj;
  });
  const cnt = {
    semua:   baseFiltered.length,
    proses:  baseFiltered.filter(isProses).length,
    selesai: baseFiltered.filter(isSelesai).length,
    kembali: baseFiltered.filter(p=>p.status==="kembali").length,
  };
  const matchStatus = p =>
    filterStatus==="semua" ? true :
    filterStatus==="selesai" ? isSelesai(p) :
    filterStatus==="proses" ? isProses(p) :
    p.status==="kembali";
  const filtered = baseFiltered.filter(matchStatus);

  const TABS = [
    { v:"semua",   label:"Semua",        color:"var(--primary)" },
    { v:"proses",  label:"Diproses",     color:"var(--primary)" },
    { v:"selesai", label:"Selesai",      color:"var(--success)" },
    { v:"kembali", label:"Dikembalikan", color:"var(--warning)" },
  ];

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

        {/* Tab status — pisahkan Diproses / Selesai / Dikembalikan */}
        <div style={{padding:"12px 20px 0",display:"flex",gap:6,flexWrap:"wrap"}}>
          {TABS.map(t=>{
            const aktif = filterStatus===t.v;
            return (
              <button key={t.v} onClick={()=>setFilterStatus(t.v)} style={{
                display:"inline-flex",alignItems:"center",gap:8,padding:"8px 15px",borderRadius:999,
                border:`1.5px solid ${aktif?"transparent":"var(--outline-variant)"}`,
                background:aktif?t.color:"transparent",
                color:aktif?"#fff":"var(--on-surface-variant)",
                fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap",
              }}>
                {t.label}
                <span style={{
                  minWidth:20,height:20,padding:"0 6px",borderRadius:999,fontSize:11,fontWeight:800,fontFamily:"var(--mono)",
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  background:aktif?"rgba(255,255,255,.25)":"var(--surface-container-high)",
                  color:aktif?"#fff":"var(--on-surface-variant)",
                }}>{cnt[t.v]}</span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{padding:"12px 20px",borderBottom:"1px solid var(--outline-variant)",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div className="search-wrap">
            <span className="search-icon"><IcoSearch size={15}/></span>
            <input className="search-input" placeholder="Cari nama, NIP, nomor, OPD..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
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
                      <td style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:"var(--primary)"}}>{p.id}</td>
                      <td style={{fontWeight:600,fontSize:14,maxWidth:180}}>{p.nama}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:12.5,color:"var(--outline)"}}>{p.nip}</td>
                      <td style={{fontSize:13.5,maxWidth:140,color:"var(--on-surface-variant)"}}>{p.opd}</td>
                      <td><span className="chip" style={{fontSize:12.5}}>{p.alasan}</span></td>
                      <td><span style={{fontSize:12.5,fontWeight:700,padding:"4px 11px",borderRadius:999,whiteSpace:"nowrap",background:p.jalur==="A"?"var(--primary-fixed)":"#f5f3ff",color:p.jalur==="A"?"var(--primary)":"#5b21b6"}}>Jalur {p.jalur}</span></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div className="progress-wrap" style={{flex:1,height:6}}>
                            <div className="progress-bar" style={{width:`${prog}%`,background:prog===100?"var(--success)":p.status==="kembali"?"var(--warning)":"var(--primary)"}}/>
                          </div>
                          <span style={{fontSize:12.5,fontWeight:700,color:"var(--outline)",minWidth:30,fontFamily:"var(--mono)"}}>{prog}%</span>
                        </div>
                      </td>
                      <td><SBadge p={p}/></td>
                      <td style={{fontSize:13.5,color:"var(--outline)",whiteSpace:"nowrap"}}>{fmtDate(p.tanggalMasuk)}</td>
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

// ─── LAPORAN ──────────────────────────────────────────────────────────────────
const LAPORAN_JENIS = {
  selesai: { label:"Selesai",      judul:"LAPORAN SKPP SELESAI",                 warna:"#16a34a", icon:"✅" },
  proses:  { label:"Dalam Proses", judul:"LAPORAN SKPP DALAM PROSES",            warna:"#2563eb", icon:"⏳" },
  kembali: { label:"Dikembalikan", judul:"LAPORAN SKPP DIKEMBALIKAN",            warna:"#d97706", icon:"↩" },
  semua:   { label:"Semua Status", judul:"LAPORAN GABUNGAN SEMUA STATUS SKPP",   warna:"#475569", icon:"📋" },
};

function cetakLaporan({ jenis, items }) {
  const meta = LAPORAN_JENIS[jenis] || LAPORAN_JENIS.selesai;
  const logoSrc = `${window.location.origin}/logo-ntt.png`;
  const tglCetak = new Date().toLocaleString("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}) + " WITA";
  const statusLabel = (p) => {
    if (p.status==="selesai"||getProgress(p)===100) return "Selesai";
    if (p.status==="kembali") return "Dikembalikan";
    return `Diproses (${getProgress(p)}%)`;
  };
  const ket = (p) => {
    if (jenis==="semua") return statusLabel(p);
    if (jenis==="selesai") return p.tanggalSelesai || "—";
    if (jenis==="kembali") return "Dikembalikan ke pemohon";
    const tahapan = p.jalur==="A" ? TAHAPAN_A : TAHAPAN_B;
    const step = tahapan.find(t=>t.id===p.tahapAktif);
    return `${getProgress(p)}% — ${step?step.label:"—"}`;
  };
  const ketHead = jenis==="selesai" ? "Tanggal Selesai" : jenis==="kembali" ? "Keterangan" : jenis==="semua" ? "Status" : "Tahap Berjalan";
  const rows = items.map((p,i)=>`<tr>
    <td style="text-align:center">${i+1}</td>
    <td class="mono">${p.id||"—"}</td>
    <td>${p.nama||"—"}</td>
    <td class="mono">${p.nip||"—"}</td>
    <td>${p.opd||"—"}</td>
    <td>${p.alasan||"—"}</td>
    <td style="text-align:center">${p.jalur||"—"}</td>
    <td>${p.tanggalMasuk||"—"}</td>
    <td>${ket(p)}</td>
  </tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>${meta.judul}</title>
  <style>
    @page{size:A4 landscape;margin:14mm}
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10pt;margin:0;padding:18px 22px;color:#000}
    .hd{display:flex;align-items:center;gap:14px;margin-bottom:8px}
    .hd-logo{width:70px;height:70px;object-fit:contain;flex-shrink:0}
    .hd-txt{flex:1;text-align:center}.hd b{font-size:13pt}.hd p{margin:2px 0;font-size:9pt}
    .hd-sp{width:70px;flex-shrink:0}
    hr{border:none;border-top:1.5px solid #000;margin:3px 0}
    .title{text-align:center;font-weight:bold;font-size:12pt;margin:10px 0 2px}
    .sub{text-align:center;font-size:9.5pt;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:6px}
    th,td{border:1px solid #999;padding:5px 7px;font-size:9pt;vertical-align:top}
    th{background:#e5e7eb;text-align:center;font-weight:bold}
    .mono{font-family:'Courier New',monospace;font-size:8.5pt}
    tbody tr:nth-child(even) td{background:#f6f6f6}
    .ft{margin-top:14px;display:flex;justify-content:space-between;font-size:9pt}
    .sign{margin-top:10px;text-align:right}.sign .sp{height:60px}
    @media print{body{margin:0;padding:0}}
  </style></head><body>
  <div class="hd">
    <img class="hd-logo" src="${logoSrc}" alt="Logo Provinsi NTT"/>
    <div class="hd-txt">
      <b>PEMERINTAH PROVINSI NUSA TENGGARA TIMUR</b><br/>
      <b style="font-size:14pt">BADAN KEUANGAN DAERAH</b>
      <p>Jalan Raya El Tari Nomor 52 Kupang</p>
      <p>Laman : https://bakeuda.nttprov.go.id, Email : badankeuanganprovntt@gmail.com</p>
    </div>
    <div class="hd-sp"></div>
  </div>
  <hr/><hr style="margin-top:2px"/>
  <div class="title">${meta.judul}</div>
  <div class="sub">Surat Keterangan Penghentian Pembayaran (SKPP) — Total ${items.length} pengajuan</div>
  <table>
    <thead><tr>
      <th style="width:34px">No.</th><th style="width:110px">No. Pengajuan</th><th>Nama Pegawai</th>
      <th style="width:110px">NIP</th><th>OPD</th><th>Keperluan</th><th style="width:42px">Jalur</th>
      <th style="width:90px">Tgl Masuk</th><th style="width:170px">${ketHead}</th>
    </tr></thead>
    <tbody>${rows || `<tr><td colspan="9" style="text-align:center;padding:18px">Tidak ada data</td></tr>`}</tbody>
  </table>
  <div class="ft"><div>Dicetak: ${tglCetak}</div><div>Jumlah: ${items.length} pengajuan</div></div>
  <div class="sign">
    <div>Kupang, ${new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}</div>
    <div style="margin-top:2px">Mengetahui,</div>
    <div class="sp"></div>
    <div>_______________________________</div>
  </div>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`;
  const win = window.open("","_blank","width=1000,height=720");
  win.document.write(html);
  win.document.close();
}

// Parse tanggal "DD Mon YYYY" (mis. "12 Jun 2026") menjadi Date untuk filter rentang.
const BULAN_MAP = { jan:0,feb:1,mar:2,apr:3,mei:4,jun:5,jul:6,agu:7,agt:7,ags:7,sep:8,okt:9,nov:10,des:11 };
function parseTglMasuk(s){
  if(!s) return null;
  const m = String(s).trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if(!m){ const d=new Date(s); return isNaN(d)?null:d; }
  const bln = BULAN_MAP[m[2].toLowerCase().slice(0,3)];
  if(bln===undefined) return null;
  return new Date(Number(m[3]), bln, Number(m[1]));
}

function PageLaporan({ data, loading, onDetail }) {
  const [jenis, setJenis] = useState("selesai");
  const [filterOPD, setFilterOPD] = useState("semua");
  const [filterJalur, setFilterJalur] = useState("semua");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const isSelesai = p => p.status==="selesai"||getProgress(p)===100;
  const kategori = p => isSelesai(p) ? "selesai" : p.status==="kembali" ? "kembali" : "proses";

  // Daftar OPD unik untuk dropdown filter.
  const daftarOPD = Array.from(new Set(data.map(p=>p.opd).filter(Boolean))).sort();

  const dDari = dari ? new Date(dari+"T00:00:00") : null;
  const dSampai = sampai ? new Date(sampai+"T23:59:59") : null;
  const lolosFilter = p => {
    if (filterOPD!=="semua" && p.opd!==filterOPD) return false;
    if (filterJalur!=="semua" && p.jalur!==filterJalur) return false;
    if (dDari || dSampai) {
      const t = parseTglMasuk(p.tanggalMasuk);
      if (!t) return false;
      if (dDari && t < dDari) return false;
      if (dSampai && t > dSampai) return false;
    }
    return true;
  };
  const base = data.filter(lolosFilter);

  const cnt = { selesai:0, proses:0, kembali:0 };
  base.forEach(p => { cnt[kategori(p)]++; });
  cnt.semua = base.length;
  const items = jenis==="semua" ? base : base.filter(p => kategori(p)===jenis);
  const meta = LAPORAN_JENIS[jenis];
  const adaFilter = filterOPD!=="semua" || filterJalur!=="semua" || dari || sampai;

  return (
    <div>
      {/* Kartu ringkasan / pemilih jenis laporan */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
        {Object.entries(LAPORAN_JENIS).map(([k,m])=>{
          const aktif = jenis===k;
          return (
            <button key={k} onClick={()=>setJenis(k)} style={{
              textAlign:"left",cursor:"pointer",borderRadius:16,padding:"16px 18px",
              border:`2px solid ${aktif?m.warna:"var(--outline-variant)"}`,
              background:aktif?`${m.warna}12`:"var(--surface-container-lowest)",
              transition:"all .15s",display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:700,color:"var(--on-surface-variant)"}}>{m.icon} SKPP {m.label}</span>
              </div>
              <div style={{fontSize:30,fontWeight:800,fontFamily:"var(--mono)",color:m.warna,lineHeight:1}}>{cnt[k]}</div>
              <div style={{fontSize:11.5,color:"var(--outline)"}}>pengajuan</div>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="card-header-title">{meta.judul}</div>
            <span className="chip chip-blue" style={{fontSize:11}}>{items.length} entri</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>exportCSV(items)} disabled={items.length===0} style={{gap:6}}>
              <IcoDownload size={14}/> Export CSV
            </button>
            <button className="btn btn-primary btn-sm" onClick={()=>cetakLaporan({jenis,items})} disabled={items.length===0} style={{gap:6}}>
              <IcoPrint size={14}/> Cetak Laporan
            </button>
          </div>
        </div>

        {/* Filter: OPD, Jalur, rentang tanggal masuk */}
        <div style={{padding:"12px 20px",borderBottom:"1px solid var(--outline-variant)",display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:200}}>
            <label style={{fontSize:11,fontWeight:700,color:"var(--on-surface-variant)"}}>OPD / Instansi</label>
            <select className="form-control" style={{width:"auto",fontSize:13}} value={filterOPD} onChange={e=>setFilterOPD(e.target.value)}>
              <option value="semua">Semua OPD</option>
              {daftarOPD.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <label style={{fontSize:11,fontWeight:700,color:"var(--on-surface-variant)"}}>Jalur</label>
            <select className="form-control" style={{width:"auto",fontSize:13}} value={filterJalur} onChange={e=>setFilterJalur(e.target.value)}>
              <option value="semua">Semua Jalur</option>
              <option value="A">Jalur A</option>
              <option value="B">Jalur B</option>
            </select>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <label style={{fontSize:11,fontWeight:700,color:"var(--on-surface-variant)"}}>Tgl Masuk — Dari</label>
            <input type="date" className="form-control" style={{width:"auto",fontSize:13}} value={dari} onChange={e=>setDari(e.target.value)}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <label style={{fontSize:11,fontWeight:700,color:"var(--on-surface-variant)"}}>Sampai</label>
            <input type="date" className="form-control" style={{width:"auto",fontSize:13}} value={sampai} onChange={e=>setSampai(e.target.value)}/>
          </div>
          {adaFilter && (
            <button className="btn btn-ghost btn-sm" onClick={()=>{setFilterOPD("semua");setFilterJalur("semua");setDari("");setSampai("");}}>
              ✕ Reset Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-box"><div className="spinner"/><span>Memuat data...</span></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{width:40}}>No.</th><th>No. Pengajuan</th><th>Nama Pegawai</th><th>NIP</th><th>OPD</th>
                  <th>Keperluan</th><th>Jalur</th>
                  <th>{jenis==="selesai"?"Tgl Selesai":jenis==="kembali"||jenis==="semua"?"Status":"Tahap Berjalan"}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p,i)=>{
                  const tahapan = p.jalur==="A" ? TAHAPAN_A : TAHAPAN_B;
                  const step = tahapan.find(t=>t.id===p.tahapAktif);
                  return (
                    <tr key={p.id} className="tr-clickable" onClick={()=>onDetail(p)}>
                      <td style={{textAlign:"center",color:"var(--outline)",fontFamily:"var(--mono)"}}>{i+1}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:"var(--primary)"}}>{p.id}</td>
                      <td style={{fontWeight:600,fontSize:14,maxWidth:180}}>{p.nama}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:12.5,color:"var(--outline)"}}>{p.nip}</td>
                      <td style={{fontSize:13.5,maxWidth:160,color:"var(--on-surface-variant)"}}>{p.opd}</td>
                      <td><span className="chip" style={{fontSize:12.5}}>{p.alasan}</span></td>
                      <td><span style={{fontSize:12.5,fontWeight:700,padding:"4px 11px",borderRadius:999,whiteSpace:"nowrap",background:p.jalur==="A"?"var(--primary-fixed)":"#f5f3ff",color:p.jalur==="A"?"var(--primary)":"#5b21b6"}}>Jalur {p.jalur}</span></td>
                      <td style={{fontSize:13,color:"var(--on-surface-variant)"}}>
                        {jenis==="selesai" ? <span style={{color:"var(--success)",fontWeight:700}}>{fmtDate(p.tanggalSelesai)}</span>
                          : jenis==="kembali"||jenis==="semua" ? <SBadge p={p}/>
                          : <span style={{fontSize:12.5}}>{getProgress(p)}% · {step?step.label:"—"}</span>}
                      </td>
                    </tr>
                  );
                })}
                {items.length===0 && (
                  <tr><td colSpan={8}>
                    <div className="empty-box">
                      <div className="empty-icon">{meta.icon}</div>
                      <div className="empty-text">{jenis==="semua"?"Belum ada data SKPP":`Belum ada SKPP ${meta.label.toLowerCase()}`}</div>
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
                  <td style={{fontSize:12,color:"var(--outline)"}}>{fmtDate(p.tanggalMasuk)}</td>
                  <td style={{fontSize:12,color:"var(--success)",fontWeight:600}}>{fmtDate(p.tanggalSelesai)}</td>
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
      const res = await daftarAkun();
      if (res && res.ok) setUsers(res.data || []);
      else setErrLoad((res && res.pesan) || "Gagal memuat daftar akun.");
    } catch { setErrLoad("Gagal terhubung ke server."); }
    setLoading(false);
  }, []);
  useEffect(() => { muat(); }, [muat]);

  // ── Permintaan reset kata sandi (dari halaman login) ──
  const [resetReqs, setResetReqs] = useState([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [reqResolving, setReqResolving] = useState(null); // id permintaan yang sedang ditindaklanjuti via reset
  const muatReq = useCallback(async () => {
    setLoadingReq(true);
    try {
      const res = await daftarPermintaanReset();
      if (res && res.ok) setResetReqs(res.data || []);
    } catch { /* abaikan */ }
    setLoadingReq(false);
  }, []);
  useEffect(() => { muatReq(); }, [muatReq]);
  const reqPending = resetReqs.filter(r=>r.status==="pending");

  const tandaiSelesaiReq = async (r) => {
    try {
      const res = await tandaiResetSelesai({ id: r.id });
      if (res && res.ok) { onToast("Permintaan ditandai selesai."); muatReq(); }
      else onToast((res && res.pesan) || "Gagal memperbarui permintaan.");
    } catch { onToast("Gagal terhubung ke server."); }
  };
  const hapusReq = async (r) => {
    if (!confirm(`Hapus permintaan reset dari "${r.username}"?`)) return;
    try {
      const res = await hapusPermintaanReset({ id: r.id });
      if (res && res.ok) { onToast("Permintaan dihapus."); muatReq(); }
      else onToast((res && res.pesan) || "Gagal menghapus permintaan.");
    } catch { onToast("Gagal terhubung ke server."); }
  };

  const jmlAdmin = users.filter(u=>u.role==="admin").length;

  // ── Tambah akun ──
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username:"", password:"", nama:"", role:"staf" });
  const [savingAdd, setSavingAdd] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const simpanAkun = async () => {
    if (!form.username.trim() || !form.password || !form.nama.trim()) return onToast("Username, password, dan nama wajib diisi.");
    if (form.password.length < 6 || !/[A-Z]/.test(form.password)) return onToast("Password minimal 6 karakter & 1 huruf kapital.");
    setSavingAdd(true);
    try {
      const res = await tambahAkun({ username: form.username.trim(), password: form.password, nama: form.nama.trim(), role: form.role });
      if (res && res.ok) {
        onToast(res.pesan || "Akun berhasil ditambahkan.");
        setForm({username:"",password:"",nama:"",role:"staf"});
        setShowForm(false);
        muat();
      } else onToast((res && res.pesan) || "Gagal menambah akun.");
    } catch { onToast("Gagal terhubung ke server."); }
    setSavingAdd(false);
  };

  // ── Edit akun ──
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ nama:"", role:"staf" });
  const [savingEdit, setSavingEdit] = useState(false);
  const bukaEdit = (u) => { setEditTarget(u); setEditForm({ nama: u.nama, role: u.role }); };
  const simpanEdit = async () => {
    if (!editForm.nama.trim()) return onToast("Nama tidak boleh kosong.");
    setSavingEdit(true);
    try {
      const res = await editAkun({ username: editTarget.username, nama: editForm.nama.trim(), role: editForm.role });
      if (res && res.ok) { onToast(res.pesan || "Akun diperbarui."); setEditTarget(null); muat(); }
      else onToast((res && res.pesan) || "Gagal memperbarui akun.");
    } catch { onToast("Gagal terhubung ke server."); }
    setSavingEdit(false);
  };

  // ── Hapus akun ──
  const hapus = async (u) => {
    if (!confirm(`Hapus akun "${u.username}"? Tindakan ini permanen.`)) return;
    try {
      const res = await hapusAkun({ username: u.username });
      if (res && res.ok) { onToast(res.pesan || "Akun dihapus."); muat(); }
      else onToast((res && res.pesan) || "Gagal menghapus akun.");
    } catch { onToast("Gagal terhubung ke server."); }
  };

  // ── Reset kata sandi ──
  const [resetTarget, setResetTarget] = useState(null);
  const [rp, setRp] = useState({ baru:"", konfirmasi:"" });
  const [showRp, setShowRp] = useState(false);
  const [savingRp, setSavingRp] = useState(false);
  const bukaReset = (u) => { setReqResolving(null); setResetTarget(u); setRp({baru:"",konfirmasi:""}); setShowRp(false); };
  // Buka modal reset dari sebuah permintaan: cari nama dari daftar akun bila ada.
  const bukaResetDariReq = (r) => {
    const u = users.find(x=>x.username===r.username) || { username:r.username, nama:r.username };
    setReqResolving(r.id); setResetTarget(u); setRp({baru:"",konfirmasi:""}); setShowRp(false);
  };
  const simpanReset = async () => {
    if (!rp.baru) return onToast("Kata sandi baru wajib diisi.");
    if (rp.baru.length < 6 || !/[A-Z]/.test(rp.baru)) return onToast("Kata sandi minimal 6 karakter & 1 huruf kapital.");
    if (rp.baru !== rp.konfirmasi) return onToast("Konfirmasi kata sandi tidak cocok.");
    setSavingRp(true);
    try {
      const res = await resetPassword({ username: resetTarget.username, passwordBaru: rp.baru });
      if (res && res.ok) {
        // Bila reset ini menindaklanjuti sebuah permintaan, tandai selesai.
        if (reqResolving) { await tandaiResetSelesai({ id: reqResolving }); muatReq(); }
        onToast(res.pesan || "Kata sandi berhasil direset.");
        setResetTarget(null); setReqResolving(null);
      }
      else onToast((res && res.pesan) || "Gagal mereset kata sandi.");
    } catch { onToast("Gagal terhubung ke server."); }
    setSavingRp(false);
  };

  return (
    <>
    {/* ── Permintaan Reset Kata Sandi ── */}
    <div className="card" style={{marginBottom:18}}>
      <div className="card-header">
        <div className="card-header-title" style={{display:"flex",alignItems:"center",gap:9}}>
          🔑 Permintaan Reset Kata Sandi
          {reqPending.length>0 && (
            <span className="badge badge-gold" style={{fontSize:11}}>{reqPending.length} menunggu</span>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={muatReq} disabled={loadingReq}>↻ Muat Ulang</button>
      </div>
      <div className="table-wrap" style={{padding:"0 0 16px"}}>
        <table>
          <thead><tr><th>NIP / Username</th><th>Keterangan</th><th>Waktu</th><th>Status</th><th style={{textAlign:"right"}}>Aksi</th></tr></thead>
          <tbody>
            {loadingReq ? (
              <tr><td colSpan={5}><div className="empty-box"><div className="empty-text">Memuat permintaan…</div></div></td></tr>
            ) : resetReqs.length===0 ? (
              <tr><td colSpan={5}><div className="empty-box"><div className="empty-icon">✅</div><div className="empty-text">Tidak ada permintaan reset</div></div></td></tr>
            ) : resetReqs.map((r)=>(
              <tr key={r.id} style={r.status==="pending"?{background:"rgba(201,168,76,0.07)"}:{opacity:0.7}}>
                <td style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:600}}>{r.username}</td>
                <td style={{fontSize:12.5,color:"var(--text-body, #3a495e)"}}>{r.alasan||<span style={{opacity:0.5}}>—</span>}</td>
                <td style={{fontSize:11.5,whiteSpace:"nowrap"}}>{r.waktu||""}</td>
                <td>
                  {r.status==="pending"
                    ? <span className="badge badge-gold">Menunggu</span>
                    : <span className="badge badge-blue">Selesai</span>}
                </td>
                <td>
                  <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    {r.status==="pending" && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={()=>bukaResetDariReq(r)}>Reset Sandi</button>
                        <button className="btn btn-secondary btn-sm" onClick={()=>tandaiSelesaiReq(r)}>Tandai Selesai</button>
                      </>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={()=>hapusReq(r)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

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
          <thead><tr><th>Nama Lengkap</th><th>Username</th><th>Role</th><th style={{textAlign:"right"}}>Aksi</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}><div className="empty-box"><div className="empty-text">Memuat akun…</div></div></td></tr>
            ) : users.length===0 && !errLoad ? (
              <tr><td colSpan={4}><div className="empty-box"><div className="empty-icon">👥</div><div className="empty-text">Belum ada akun</div></div></td></tr>
            ) : users.map((u,i)=>(
              <tr key={u.id||u.username||i}>
                <td style={{fontWeight:600}}>{u.nama}</td>
                <td style={{fontFamily:"var(--mono)",fontSize:12}}>{u.username}</td>
                <td><span className={`badge ${u.role==="admin"?"role-admin badge-purple":u.role==="operator"?"role-operator badge-gold":"role-staf badge-blue"}`}>{u.role==="admin"?"Admin":u.role==="operator"?"Staf Loket":"Staf Pengampu OPD"}</span></td>
                <td>
                  <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>bukaEdit(u)}>Edit</button>
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
        <div className="modal-overlay">
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
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={form.role} onChange={e=>set("role",e.target.value)}>
                  <option value="staf">Staf Pengampu OPD</option>
                  <option value="operator">Staf Loket</option>
                  <option value="admin">Admin</option>
                </select>
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

      {/* Modal Edit Akun */}
      {editTarget && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setEditTarget(null);}}>
          <div className="modal" style={{maxWidth:440}}>
            <div className="modal-header">
              <div style={{fontWeight:800,fontSize:14,color:"var(--primary)",letterSpacing:"-0.4px"}}>Edit Akun</div>
              <button className="modal-close" onClick={()=>setEditTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-control" value={editTarget.username} disabled style={{opacity:0.6}}/>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input className="form-control" value={editForm.nama} onChange={e=>setEditForm(f=>({...f,nama:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}>
                  <option value="staf">Staf Pengampu OPD</option>
                  <option value="operator">Staf Loket</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setEditTarget(null)}>Batal</button>
              <button className="btn btn-primary" onClick={simpanEdit} disabled={savingEdit}>{savingEdit?"Menyimpan…":"Simpan Perubahan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
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
    foto:    saved.foto    ?? user?.foto ?? "",
    jabatan: saved.jabatan ?? "",
    unit:    saved.unit    ?? "",
    hp:      saved.hp      ?? "",
    email:   saved.email   ?? "",
    tglLahir:saved.tglLahir ?? "",
    pangkat: saved.pangkat ?? "",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const [saving, setSaving] = useState(false);
  const fotoInputRef = useRef(null);
  // Pilih & kompres foto profil menjadi data URL kecil (256px) agar muat di penyimpanan lokal.
  const onPickFoto = (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) { onToast("File harus berupa gambar."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size/img.width, size/img.height);
        const w = img.width*scale, h = img.height*scale;
        ctx.drawImage(img, (size-w)/2, (size-h)/2, w, h);
        set("foto", canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

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
        const res = await profil({ username: user?.username });
        if (aktif && res && res.ok && res.data) {
          const d = res.data;
          setForm(f => ({
            ...f,
            nama:    d.nama     ?? f.nama,
            jabatan: d.jabatan  ?? f.jabatan,
            unit:    d.unit     ?? f.unit,
            hp:      d.hp       ?? f.hp,
            email:   d.email    ?? f.email,
            tglLahir:d.tglLahir ?? f.tglLahir,
            pangkat: d.pangkat  ?? f.pangkat,
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
      onUpdateUser?.({ nama: form.nama.trim(), foto: form.foto || "" });
      // Sinkron ke backend; bila action belum tersedia, data tetap aman di perangkat
      let serverOk = false;
      try {
        const res = await updateProfil({ username: user?.username, data: form });
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
      const res = await gantiPassword({ username: user?.username, passwordLama: pwd.lama, passwordBaru: pwd.baru });
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
    foto: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
    jabatan: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    unit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>,
    hp:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
    email:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>,
    tgl:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    pangkat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">Profil</div>
      </div>
      <div className="card-body">
        {/* Foto profil */}
        <div className="profil-row">
          <div className="profil-row-label">{ico.foto} Foto Profil</div>
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{width:72,height:72,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"var(--primary)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,border:"2px solid var(--outline-variant)"}}>
              {form.foto
                ? <img src={form.foto} alt="Foto profil" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : (form.nama||"U").split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase()}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <input ref={fotoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>onPickFoto(e.target.files?.[0])}/>
              <button type="button" className="btn btn-secondary btn-sm" onClick={()=>fotoInputRef.current?.click()}>📷 Ganti Foto</button>
              {form.foto && <button type="button" className="btn btn-ghost btn-sm" onClick={()=>set("foto","")}>Hapus</button>}
            </div>
          </div>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.nama} Nama</div>
          <input className="form-control" style={{marginBottom:0}} value={form.nama} onChange={e=>set("nama", e.target.value)} placeholder="Nama lengkap & gelar"/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.jabatan} Jabatan</div>
          <input className="form-control" style={{marginBottom:0}} value={form.jabatan} onChange={e=>set("jabatan", e.target.value)} placeholder="Jabatan saat ini"/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.unit} Unit / Bidang</div>
          <input className="form-control" style={{marginBottom:0}} value={form.unit} onChange={e=>set("unit", e.target.value)} placeholder="Mis. Bidang Perbendaharaan"/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.pangkat} Pangkat dan Golongan</div>
          <div style={{marginTop:-8, marginBottom:-16}}>
            <SearchableSelect value={form.pangkat} onChange={v=>set("pangkat", v)} options={DAFTAR_PANGKAT} placeholder="-- Pilih Pangkat / Golongan --"/>
          </div>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.hp} No. HP / WhatsApp</div>
          <input className="form-control" style={{marginBottom:0}} value={form.hp} onChange={e=>set("hp", e.target.value.replace(/[^0-9+]/g,""))} placeholder="Mis. 0812xxxxxxx" inputMode="tel"/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.email} Email</div>
          <input className="form-control" style={{marginBottom:0}} type="email" value={form.email} onChange={e=>set("email", e.target.value)} placeholder="nama@contoh.go.id"/>
        </div>
        <div className="profil-row">
          <div className="profil-row-label">{ico.tgl} Tanggal Lahir</div>
          <input className="form-control" style={{marginBottom:0}} type="date" value={form.tglLahir} onChange={e=>set("tglLahir", e.target.value)}/>
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

// ─── DASHBOARD SHELL (d2) — sidebar + motto ticker ───────────────────────────
function D2Sidebar({ user, active, onChange, counts, onLogout, collapsed, onToggleCollapse }) {
  const rail = collapsed; // saat diciutkan tampil rail ikon statis
  const initials = (user?.nama||"U").split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
  const roleLabel = user?.role==="admin" ? "Admin" : user?.role==="operator" ? "Staf Loket" : "Staf Pengampu OPD";
  const main = [
    { key:"dashboard", label:"Dashboard",            ic:"grid" },
    { key:"pengajuan", label:"Daftar Pengajuan",     ic:"list", badge:counts?.proses },
    // Input Pengajuan Baru tidak ditampilkan untuk role Staf Pengampu OPD.
    ...(user?.role==="staf" ? [] : [{ key:"input", label:"Input Pengajuan Baru", ic:"plus" }]),
    { key:"riwayat",   label:"Riwayat & Arsip",      ic:"archive" },
    { key:"laporan",   label:"Laporan",              ic:"report" },
  ];
  return (
    <aside className={"d2-side"+(rail?" d2-rail":"")}>
      <div className="d2-brand">
        <span className="d2-logo-btn" data-tip="Buka panel samping"
          onClick={collapsed ? onToggleCollapse : undefined}>
          <img src="/logo-sipasti.png" alt="" className="d2-mark" onError={e=>{e.target.style.display="none";}}/>
        </span>
        <div className="d2-brand-txt">
          <b>SI-PASTI</b>
          <span>Sistem Pemantauan Alur SKPP Terintegrasi</span>
        </div>
        <button className="d2-collapse-btn" onClick={onToggleCollapse}
          data-tip={collapsed?"Buka panel samping":"Tutup panel samping"} aria-label={collapsed?"Buka panel samping":"Tutup panel samping"}>
          <D2Ico d={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>} size={18}/>
        </button>
      </div>
      <div className="d2-admin">
        <div className="d2-admin-av" style={user?.foto?{padding:0,overflow:"hidden"}:undefined}>
          {user?.foto ? <img src={user.foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : initials}
        </div>
        <div className="d2-admin-txt">
          <b title={user?.nama}>{user?.nama||"Pengguna"}</b>
          <span className="d2-admin-role">{roleLabel}</span>
        </div>
      </div>
      <div className="d2-navwrap">
        <div className="d2-navlabel">Menu Utama</div>
        {main.map(n=>(
          <button key={n.key} data-tip={n.label} className={"d2-navitem"+(active===n.key?" is-active":"")} onClick={()=>onChange(n.key)}>
            <span className="d2-navic"><D2Ico d={D2ICONS[n.ic]} size={19}/></span>
            <span className="d2-navtxt">{n.label}</span>
            {n.badge>0 && <span className="d2-navbadge tnum">{n.badge}</span>}
          </button>
        ))}
        {user?.role==="admin" && (
          <>
            <div className="d2-navlabel" style={{marginTop:18}}>Administrasi</div>
            <button data-tip="Manajemen Staf" className={"d2-navitem"+(active==="users"?" is-active":"")} onClick={()=>onChange("users")}>
              <span className="d2-navic"><D2Ico d={D2ICONS.staff} size={19}/></span>
              <span className="d2-navtxt">Manajemen Staf</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

function D2Ticker() {
  const items = MOTIVASI_LIST.concat(MOTIVASI_LIST);
  return (
    <div className="d2-ticker" aria-label="Motivasi kerja">
      <div className="d2-ticker-track">
        {items.map((m,i)=><span key={i} className="d2-ticker-item" aria-hidden={i>=MOTIVASI_LIST.length}>{m}</span>)}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [sideCollapsed, setSideCollapsed] = useState(false);
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

  // ── Batas waktu sesi (idle timeout) ──
  const [idleWarn, setIdleWarn] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(IDLE_WARNING_SECONDS);
  const idleResetRef = useRef(() => {});
  useEffect(() => {
    if (!user) return;
    const IDLE_MS = IDLE_LIMIT_MINUTES * 60 * 1000;
    const WARN_MS = IDLE_WARNING_SECONDS * 1000;
    // Pakai waktu nyata (timestamp), bukan akumulasi timer, supaya tetap akurat
    // walau tab di-background (browser menahan setTimeout/setInterval saat idle).
    let lastAct = Date.now();
    let warning = false;        // true saat popup peringatan sedang tampil
    let ticker = null;

    const endSession = () => {
      if (ticker) clearInterval(ticker);
      setIdleWarn(false);
      localStorage.removeItem("isLoggedIn");
      setUser(null);
    };

    // Dipanggil tombol "Tetap Masuk": mulai ulang hitungan dari sekarang.
    const reset = () => {
      lastAct = Date.now();
      warning = false;
      setIdleWarn(false);
      setIdleCountdown(IDLE_WARNING_SECONDS);
    };
    idleResetRef.current = reset;

    // Evaluasi status idle berdasarkan selisih waktu nyata sejak aktivitas terakhir.
    const tick = () => {
      const idleFor = Date.now() - lastAct;
      if (idleFor >= IDLE_MS + WARN_MS) { endSession(); return; } // total 15 mnt + 60 dtk -> logout
      if (idleFor >= IDLE_MS) {
        warning = true;
        setIdleWarn(true);
        setIdleCountdown(Math.max(1, Math.ceil((IDLE_MS + WARN_MS - idleFor) / 1000)));
      }
    };

    // Aktivitas hanya menunda peringatan SEBELUM muncul. Saat peringatan sudah
    // tampil, aktivitas diabaikan — peringatan hanya hilang lewat tombol.
    const onActivity = () => { if (!warning) lastAct = Date.now(); };
    // Saat tab kembali aktif, langsung evaluasi (atasi penundaan timer di background).
    const onVisible = () => { if (!document.hidden) tick(); };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    ticker = setInterval(tick, 1000);
    return () => {
      if (ticker) clearInterval(ticker);
      events.forEach(e => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [user]);

  // Tutup popup notif / profil saat klik di luar areanya
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pulihkan sesi login yang tersimpan saat aplikasi dibuka (tahan refresh).
  useEffect(() => {
    let aktif = true;
    (async () => {
      try {
        const s = await sesiSaatIni();
        if (aktif && s) {
          let foto = "";
          try { foto = (JSON.parse(localStorage.getItem(`skpp_profil_${s.username}`)||"{}").foto) || ""; } catch {}
          setUser({ ...s, foto });
        }
      } finally {
        if (aktif) setBooting(false);
      }
    })();
    return () => { aktif = false; };
  }, []);

  const handleLogout = useCallback(async () => {
    try { await logout(); } catch {}
    setUser(null);
    setPage("dashboard");
  }, []);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""), 3200); };

  const load = useCallback(async () => {
    setLoading(true); setErrLoad("");
    try {
      const res = await daftarSemua();
      if(res.ok) setData(res.data.map(norm));
      else setErrLoad(res.pesan||"Gagal memuat data.");
    } catch { setErrLoad("Gagal terhubung ke server."); }
    setLoading(false);
  }, []);

  useEffect(() => { if(user) load(); }, [user, load]);

  const handleInputBaru = async (formData) => {
    setSaving(true);
    try {
      const res = await inputBaru({ data: formData });
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
      const res = await inputBulk({ data: bulkData });
      if(res.ok) {
        showToast(`✓ ${res.jumlah} pengajuan bulk berhasil disimpan`);
        setShowInput(false);
        await load();
        setPage("pengajuan");
        if(res.kodeAkses) {
          setTimeout(() => {
            setKodeAksesModal({ isBulk:true, grupId:res.grupId, kode:res.kodeAkses, jumlah:res.jumlah, daftarId:res.daftarId, namaOPD:bulkData.namaOPD, items:bulkData.items });
          }, 400);
        }
      } else alert("Gagal: "+res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const handleUpdate = async (updateData) => {
    setSaving(true);
    try {
      const res = await updateTahap({ data: updateData });
      if(res.ok) {
        showToast(updateData.isKembali?"↩ Berkas dikembalikan":updateData.isResume?"✅ Proses berhasil dilanjutkan kembali":"✓ Tahap berhasil diperbarui");
        await load();
        if(updateData.nextStepId==="") {
          try {
            const tanggalSelesai = new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
            const mark = await setSelesai({ id: updateData.pengajuanId, tanggalSelesai });
            if(mark.ok) { showToast("✓ Pengajuan ditandai Selesai pada server"); await load(); }
          } catch(e) { console.warn("Gagal menandai selesai:",e); }
        }
        const refreshed = await detail({ id: updateData.pengajuanId });
        if(refreshed.ok) setSelected(norm(refreshed.data));
      } else alert("Gagal: "+res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const handleDeletePengajuan = async (p) => {
    if (user?.role !== "admin") return;
    if (!window.confirm(`Hapus pengajuan ${p.id} (${p.nama})?\n\nTindakan ini permanen dan akan menghapus data beserta riwayatnya. Lanjutkan?`)) return;
    setSaving(true);
    try {
      const res = await hapusPengajuan({ id: p.id });
      if (res.ok) {
        showToast(`🗑 Pengajuan ${p.id} dihapus`);
        setSelected(null);
        // Hapus langsung dari tampilan (optimistic), lalu sinkron ulang dari server.
        setData(prev => prev.filter(d => d.id !== p.id));
        await load();
      } else alert("Gagal: " + res.pesan);
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

  if (booting) return <><style>{S}</style><div style={{minHeight:"100vh"}}/></>;

  if (!user) return (
    <>
      <style>{S}</style>
      <Login onLogin={u => {
        let foto = "";
        try { foto = (JSON.parse(localStorage.getItem(`skpp_profil_${u.username}`)||"{}").foto) || ""; } catch {}
        setUser({ ...u, foto });
        setPage("dashboard");
      }} />
    </>
  );

  return (
    <>
      <style>{S}</style>
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}
      <div className={"d2-root"+(sideCollapsed?" side-collapsed":"")}>
        <D2Sidebar user={user} active={page} onChange={setPage} counts={counts} onLogout={handleLogout}
          collapsed={sideCollapsed} onToggleCollapse={()=>setSideCollapsed(v=>!v)}/>
        <div className="d2-main">
          <header className="d2-top">
            <div className="d2-top-org">
              <b>Pemerintah Provinsi Nusa Tenggara Timur</b>
              <span>Badan Keuangan Daerah — Bidang Perbendaharaan</span>
            </div>
            <div className="d2-top-right">
              {errLoad && (
                <div className="alert alert-red" style={{margin:0,padding:"6px 12px",fontSize:12}}>
                  <IcoAlert size={14}/><span>{errLoad}</span>
                  <button className="btn btn-secondary btn-sm" style={{marginLeft:8}} onClick={load}>Coba Lagi</button>
                </div>
              )}
              <span className="d2-greet">{(()=>{const h=new Date().getHours();return h<11?"Selamat Pagi":h<15?"Selamat Siang":h<18?"Selamat Sore":"Selamat Malam";})()}</span>
              <D2Ticker/>
              {(()=>{
                const SEMUA_TAHAPAN = [...TAHAPAN_A, ...TAHAPAN_B];
                const notifUser = data.filter(d => {
                  if (d.status !== "proses") return false;
                  const step = SEMUA_TAHAPAN.find(t => t.id === d.tahapAktif);
                  if (!step) return false;
                  return cekIzinProses(user.role, step.pelaksana);
                });
                const cnt = notifUser.length;
                return (
                  <div className="d2-notif" ref={notifRef}>
                    <button className={`d2-iconbtn${cnt>0?" is-alert":""}`} aria-expanded={showNotif}
                      aria-label={`Notifikasi${cnt>0?`, ${cnt} belum dibaca`:""}`}
                      onClick={()=>{setShowNotif(v=>!v);setShowProfile(false);}}>
                      <D2Ico d={D2ICONS.bell}/>
                      {cnt>0 && <span className="d2-notif-badge">{cnt}</span>}
                    </button>
                    {showNotif && (
                      <>
                        <div className="d2-scrim" onClick={()=>setShowNotif(false)}/>
                        <div className="d2-notif-menu" role="menu">
                          <div className="d2-notif-head">
                            <div>
                              <b>Notifikasi</b>
                              <span>{cnt>0?`${cnt} pengajuan menunggu tindakan Anda`:"Tidak ada tindakan tertunda"}</span>
                            </div>
                          </div>
                          <div className="d2-notif-list">
                            {cnt===0 ? (
                              <div className="d2-notif-empty">Tidak ada notifikasi untukmu saat ini.</div>
                            ) : notifUser.slice(0,8).map(d=>{
                              const step = SEMUA_TAHAPAN.find(t=>t.id===d.tahapAktif);
                              return (
                                <button key={d.id} className="d2-notif-item is-unread" role="menuitem"
                                  onClick={()=>{setSelected(d);setShowNotif(false);}}>
                                  <span className="d2-notif-ic tone-blue"><D2Ico d={D2ICONS.doc} size={17}/></span>
                                  <span className="d2-notif-txt">
                                    <b>{d.nama}</b>
                                    <span className="d2-notif-desc">{d.id} · {step?.label||"Menunggu tindakan"}</span>
                                  </span>
                                  <span className="d2-notif-pip" aria-hidden="true"/>
                                </button>
                              );
                            })}
                          </div>
                          <button className="d2-notif-foot" onClick={()=>{setShowNotif(false);setPage("pengajuan");}}>Lihat semua pengajuan</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
              <div className="d2-profile" ref={profileRef}>
                <button className="d2-crestbtn" aria-label="Menu profil" aria-expanded={showProfile}
                  onClick={()=>{setShowProfile(v=>!v);setShowNotif(false);}}>
                  <img src="/logo-ntt.png" alt="Lambang NTT" className="d2-crest" onError={e=>{e.target.style.display="none";}}/>
                </button>
                {showProfile && (
                  <>
                    <div className="d2-scrim" onClick={()=>setShowProfile(false)}/>
                    <div className="d2-profile-menu" role="menu">
                      <div className="d2-profile-id">
                        <img src="/logo-ntt.png" alt="" className="d2-profile-crest" onError={e=>{e.target.style.display="none";}}/>
                        <div>
                          <b>{user?.nama||"Pengguna"}</b>
                          <span>{user?.role==="admin"?"Administrator":user?.role==="operator"?"Staf Loket":"Staf Pengampu OPD"}</span>
                        </div>
                      </div>
                      <div className="d2-profile-org">
                        <b>Provinsi Nusa Tenggara Timur</b>
                        <span>Tahun {new Date().getFullYear()}</span>
                      </div>
                      <div className="d2-profile-actions">
                        <button className="d2-profile-item" role="menuitem" onClick={()=>{setShowProfile(false);setPage("profil");}}>
                          <D2Ico d={D2ICONS.user} size={19}/><span>Profil</span>
                        </button>
                        <button className="d2-profile-item danger" role="menuitem" onClick={()=>{setShowProfile(false);handleLogout();}}>
                          <D2Ico d={D2ICONS.logout} size={19}/><span>Keluar</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="d2-body">
            {page==="dashboard" && <PageDashboard data={data} loading={loading} user={user} onDetail={setSelected}/>}
            {page==="pengajuan" && <PagePengajuan data={data} loading={loading} onRefresh={load} onDetail={setSelected} onInputBaru={()=>setShowInput(true)} onExport={exportCSV} user={user}/>}
            {page==="input"     && <div className="card card-body"><PagePengajuan data={[]} loading={false} onRefresh={()=>{}} onDetail={()=>{}} onInputBaru={()=>setShowInput(true)} onExport={()=>{}} user={user}/></div>}
            {page==="riwayat"   && <PageRiwayat data={data} loading={loading} onDetail={setSelected}/>}
            {page==="laporan"   && <PageLaporan data={data} loading={loading} onDetail={setSelected}/>}
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
          onCetak={()=>cetakTandaTerima(selected)} onDelete={handleDeletePengajuan} user={user}/>
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
              {kodeAksesModal.isBulk ? (
                <button className="btn btn-primary" style={{gap:6}} onClick={()=>cetakTandaTerimaBulk({namaOPD:kodeAksesModal.namaOPD,kode:kodeAksesModal.kode,grupId:kodeAksesModal.grupId,items:kodeAksesModal.items,daftarId:kodeAksesModal.daftarId})}>
                  <IcoPrint size={14}/> Cetak Tanda Terima
                </button>
              ) : (
                <button className="btn btn-primary" style={{gap:6}} onClick={()=>{cetakTandaTerima({...kodeAksesModal.data,kodeAkses:kodeAksesModal.kode});setKodeAksesModal(null);}}>
                  <IcoPrint size={14}/> Cetak Tanda Terima
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Peringatan sesi akan berakhir karena tidak ada aktivitas */}
      {idleWarn && (
        <div className="modal-overlay" style={{zIndex:12000}}>
          <div className="modal" style={{maxWidth:420,borderRadius:"22px",overflow:"hidden"}}>
            <div className="modal-header" style={{background:"#fffbeb",borderBottom:"1px solid #fde68a"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>⏰</span>
                <div style={{fontWeight:800,fontSize:14,color:"#92400e"}}>Sesi Akan Berakhir</div>
              </div>
            </div>
            <div className="modal-body" style={{fontSize:13,lineHeight:1.6,color:"var(--on-surface)",textAlign:"center"}}>
              Anda tidak aktif selama beberapa waktu. Demi keamanan, sesi akan
              berakhir otomatis dalam:
              <div style={{margin:"14px 0",fontFamily:"var(--mono)",fontSize:40,fontWeight:800,color:idleCountdown<=10?"var(--error)":"var(--primary)"}}>
                {idleCountdown}<span style={{fontSize:16,fontWeight:500,marginLeft:6}}>detik</span>
              </div>
              Klik <strong>Tetap Masuk</strong> untuk melanjutkan, atau biarkan untuk keluar.
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>{ setIdleWarn(false); localStorage.removeItem("isLoggedIn"); setUser(null); }}>Keluar Sekarang</button>
              <button className="btn btn-primary" onClick={()=>idleResetRef.current()}>Tetap Masuk</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}