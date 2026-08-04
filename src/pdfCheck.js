import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Ekstrak seluruh teks dari file PDF, murni di sisi klien (tidak diunggah ke
// server manapun hanya untuk dibaca). Dipakai utk verifikasi otomatis nama/NIP
// pada Draft SKPP sebelum staf melanjutkan ke tahap berikutnya.
export async function extractPdfText(file) {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str || "").join(" ") + " ";
  }
  return text;
}

// Ambil nama inti tanpa gelar -- potong di koma pertama (gelar akademik/
// profesi biasanya ditulis setelah koma, mis. "Budi Santoso, S.E., M.M."),
// lalu buang gelar depan umum (Dr., Ir., Drs., dst).
export function namaTanpaGelar(nama) {
  let n = (nama || "").split(",")[0].trim();
  n = n.replace(/^(Dr\.|Prof\.|Ir\.|Drs\.|Dra\.|H\.|Hj\.)\s+/i, "");
  return n;
}

function normalisasi(s) {
  return (s || "").toUpperCase().replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

// Jarak Levenshtein sederhana -- dipakai utk toleransi typo/OCR per kata.
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function kemiripan(a, b) {
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// Cocokkan nama (tanpa gelar) terhadap teks PDF per-kata, toleran typo/OCR.
// Skor = proporsi kata nama yang ditemukan (persis atau ≥80% mirip) di teks
// PDF. Dianggap cocok bila skor ≥ 90% (tidak perlu 100%, sesuai kebijakan).
export function cocokkanNama(namaPengajuan, teksPdf) {
  const kataNama = normalisasi(namaTanpaGelar(namaPengajuan)).split(" ").filter(Boolean);
  if (!kataNama.length) return { match: false, skor: 0 };
  const kataPdf = normalisasi(teksPdf).split(" ").filter(Boolean);
  let cocok = 0;
  for (const kn of kataNama) {
    const adaCocok = kataPdf.some((kp) => kp === kn || kemiripan(kn, kp) >= 0.8);
    if (adaCocok) cocok++;
  }
  const skor = cocok / kataNama.length;
  return { match: skor >= 0.9, skor };
}

// Cocokkan NIP (deret angka) terhadap teks PDF -- exact match, bukan fuzzy.
export function cocokkanNip(nipPengajuan, teksPdf) {
  const nip = (nipPengajuan || "").replace(/\D/g, "");
  if (!nip) return false;
  const digitPdf = (teksPdf || "").replace(/\D/g, "");
  return digitPdf.includes(nip);
}

// Cari posisi (titik PDF, asal kiri-bawah halaman) sebuah baris teks di dalam
// PDF berdasarkan potongan label (mis. "KUASA BENDAHARA UMUM DAERAH").
// Dipakai utk menempatkan foto secara OTOMATIS relatif ke posisi label ini
// (bukan koordinat tetap), supaya tetap akurat walau ada sedikit variasi tata
// letak antar draft SKPP. Item teks yang sebaris (y hampir sama) digabung
// dulu jadi satu baris, krn label bisa terpecah jadi beberapa "item" PDF.
// Kembalikan { page, x, y, pageWidth, pageHeight } (1-indexed page) atau null.
export async function cariPosisiLabel(file, label) {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const target = normalisasi(label);
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const baris = [];
    let cur = null;
    for (const it of content.items) {
      const y = it.transform[5];
      if (cur && Math.abs(cur.y - y) < 2) {
        cur.text += it.str;
      } else {
        cur = { text: it.str, x: it.transform[4], y };
        baris.push(cur);
      }
    }
    const cocok = baris.find((b) => normalisasi(b.text).includes(target));
    if (cocok) return { page: i, x: cocok.x, y: cocok.y, pageWidth: viewport.width, pageHeight: viewport.height };
  }
  return null;
}
