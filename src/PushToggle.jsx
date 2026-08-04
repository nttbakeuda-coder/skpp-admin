import { useEffect, useState } from "react";
import { statusPush, aktifkanPush, matikanPush, pushDidukung } from "./push";

// Item menu profil: aktif/matikan notifikasi desktop (Web Push) untuk
// perangkat/browser ini. Mengelola statusnya sendiri.
export function PushToggle({ onToast }) {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => statusPush().then(setSt);
  useEffect(() => { refresh(); }, []);

  if (!pushDidukung()) return null; // browser tak mendukung -> sembunyikan

  const aktif = !!st?.aktif;
  const label = busy ? "Memproses…" : aktif ? "Matikan Notifikasi Desktop" : "Aktifkan Notifikasi Desktop";

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const r = aktif ? await matikanPush() : await aktifkanPush();
    setBusy(false);
    if (onToast) onToast(r.ok ? (aktif ? "Notifikasi desktop dimatikan." : "Notifikasi desktop aktif untuk perangkat ini.") : r.error);
    refresh();
  }

  return (
    <button className="d2-profile-item" role="menuitem" onClick={toggle} disabled={busy}
      style={aktif ? { color: "#f97316" } : undefined}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span>{label}</span>
    </button>
  );
}
