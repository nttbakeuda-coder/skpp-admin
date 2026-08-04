import { PDFDocument } from "pdf-lib";
import { cariPosisiLabel } from "./pdfCheck";

const CM = 72 / 2.54; // 1 cm dalam satuan poin PDF (72pt = 1 inch)
const LEBAR_FOTO = 4 * CM;
const TINGGI_FOTO = 6 * CM;
const JARAK_KE_LABEL = 0.4 * CM;
// Naikkan sedikit dari baseline teks label supaya bagian ATAS foto kira-kira
// sejajar bagian ATAS teks (transform[5] dari pdf.js = baseline, bukan puncak
// huruf) -- bukan ilmu pasti, hanya perkiraan tinggi huruf normal ukuran ~10pt.
const NAIK_DARI_BASELINE = 8;
const LABEL_TTD = "KUASA BENDAHARA UMUM DAERAH";

// Tempel foto pemohon (4x6cm) ke Draft SKPP, di sisi KIRI kolom tanda tangan
// Kuasa BUD. Posisi dicari otomatis dari lokasi teks "KUASA BENDAHARA UMUM
// DAERAH" pada PDF (lihat cariPosisiLabel), bukan koordinat tetap -- supaya
// tetap akurat walau ada sedikit variasi tata letak antar draft SKPP.
// Kembalikan { ok, bytes } atau { ok:false, pesan }.
export async function tempelFotoKeDraft({ pdfFile, fotoFile, fotoContentType }) {
  const posisi = await cariPosisiLabel(pdfFile, LABEL_TTD);
  if (!posisi) {
    return {
      ok: false,
      pesan: `Tidak menemukan teks "${LABEL_TTD}" pada berkas ini — posisi tanda tangan Kuasa BUD tidak dapat ditentukan otomatis. Periksa apakah berkas ini memang Draft SKPP yang benar.`,
    };
  }

  const pdfBytes = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const fotoBytes = await fotoFile.arrayBuffer();
  const tipe = fotoContentType || fotoFile.type || "";
  const image = /png/i.test(tipe) ? await pdfDoc.embedPng(fotoBytes) : await pdfDoc.embedJpg(fotoBytes);

  const halaman = pdfDoc.getPages()[posisi.page - 1];
  const yAtas = posisi.y + NAIK_DARI_BASELINE;
  const x = posisi.x - JARAK_KE_LABEL - LEBAR_FOTO;
  const y = yAtas - TINGGI_FOTO;
  halaman.drawImage(image, { x, y, width: LEBAR_FOTO, height: TINGGI_FOTO });

  const bytes = await pdfDoc.save();
  return { ok: true, bytes };
}
