// Apps Script example: HTTP POST handler for SKPP backend
// Deploy as Web App (execute as: Me, Who has access: Anyone with the link)
// Expected POST body: JSON string, e.g. { action: 'setSelesai', id: 'SKPP-2026-0001', tanggalSelesai: '25 Mei 2026' }

function doPost(e) {
  try {
    const payload = e.postData && e.postData.type === 'application/json' ? JSON.parse(e.postData.contents) : JSON.parse(e.postData.contents || '{}');
    const action = payload.action;
    if (!action) return jsonResponse({ ok: false, pesan: 'Missing action' });

    if (action === 'setSelesai') {
      return handleSetSelesai(payload);
    }

    if (action === 'updateTahap') {
      // Optional: existing updateTahap logic
      return handleUpdateTahap(payload);
    }

    if (action === 'daftarSemua') {
      return jsonResponse({ ok: true, data: getAllData() });
    }

    return jsonResponse({ ok: false, pesan: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, pesan: String(err) });
  }
}

function handleSetSelesai(payload) {
  const id = payload.id;
  const tanggalSelesai = payload.tanggalSelesai || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy");
  if (!id) return jsonResponse({ ok: false, pesan: 'Missing id' });

  const sheet = getSheet();
  const header = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const idCol = header.indexOf('id') + 1;
  const statusCol = header.indexOf('status') + 1;
  const tanggalSelesaiCol = header.indexOf('tanggalSelesai') + 1;
  const riwayatCol = header.indexOf('riwayat') + 1; // riwayat as JSON string

  if (!idCol) return jsonResponse({ ok: false, pesan: 'Column id not found' });
  if (!statusCol) return jsonResponse({ ok: false, pesan: 'Column status not found' });

  const data = sheet.getRange(2, idCol, sheet.getLastRow()-1, 1).getValues().map(r=>r[0]);
  const rowIndex = data.indexOf(id);
  if (rowIndex === -1) return jsonResponse({ ok: false, pesan: 'ID not found' });
  const row = rowIndex + 2;

  // Update status and tanggalSelesai
  sheet.getRange(row, statusCol).setValue('selesai');
  if (tanggalSelesaiCol) sheet.getRange(row, tanggalSelesaiCol).setValue(tanggalSelesai);

  // Append to riwayat (if column exists) with a simple object
  if (riwayatCol) {
    const cur = sheet.getRange(row, riwayatCol).getValue() || '';
    let arr = [];
    try { arr = cur ? JSON.parse(cur) : []; } catch(e) { arr = []; }
    arr.push({ waktu: new Date().toISOString(), catatan: 'Menandai selesai via API', tindakan: 'selesai' });
    sheet.getRange(row, riwayatCol).setValue(JSON.stringify(arr));
  }

  return jsonResponse({ ok: true, pesan: 'Status updated to selesai', id, tanggalSelesai });
}

function handleUpdateTahap(payload) {
  // Minimal implementation: you might already have this in your Apps Script.
  // This stub simply returns ok to let the client proceed.
  // Extend this to update tahapSelesai, tahapAktif, riwayat, etc.
  return jsonResponse({ ok: true, pesan: 'updateTahap received (no-op in example)' });
}

function getSheet() {
  const ss = SpreadsheetApp.openById('10DAZXtZhj8DM4KIjqvIk3E1ESRa5GTSRxjMFjsw2PWo');
  return ss.getSheetByName('Pengajuan') || ss.getSheets()[0];
}

function getAllData() {
  const sheet = getSheet();
  const vals = sheet.getDataRange().getValues();
  const header = vals.shift();
  return vals.map(row => {
    const obj = {};
    header.forEach((h,i)=>{ obj[h]=row[i]; });
    return obj;
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
