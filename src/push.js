import { supabase } from "./supabaseClient";

// ── WEB PUSH (klien) ────────────────────────────────────────────────────────
// Kunci publik VAPID — AMAN di frontend (publik). Diisi lewat env
// VITE_VAPID_PUBLIC_KEY (lihat .env / PUSH_SETUP.md). Kosong = fitur nonaktif.
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

export const pushDidukung = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const pushDikonfigurasi = () => !!VAPID_PUBLIC;

// Ubah kunci VAPID base64url -> Uint8Array (format applicationServerKey).
function urlB64ToUint8(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function daftarSW() {
  return navigator.serviceWorker.register("/sw.js");
}

// Status saat ini: { didukung, dikonfigurasi, izin, aktif }.
export async function statusPush() {
  const base = { didukung: pushDidukung(), dikonfigurasi: pushDikonfigurasi(), izin: null, aktif: false };
  if (!base.didukung) return base;
  base.izin = Notification.permission; // 'default' | 'granted' | 'denied'
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    base.aktif = !!sub;
  } catch { /* abaikan */ }
  return base;
}

// Aktifkan: minta izin -> subscribe -> simpan ke Supabase. return {ok,error?}.
export async function aktifkanPush() {
  if (!pushDidukung()) return { ok: false, error: "Browser ini tidak mendukung notifikasi push." };
  if (!pushDikonfigurasi()) return { ok: false, error: "Kunci VAPID belum dikonfigurasi (VITE_VAPID_PUBLIC_KEY)." };
  try {
    const izin = await Notification.requestPermission();
    if (izin !== "granted") return { ok: false, error: "Izin notifikasi tidak diberikan." };
    const reg = await daftarSW();
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8(VAPID_PUBLIC),
      });
    }
    const j = sub.toJSON();
    const { data, error } = await supabase.rpc("simpan_langganan_push", {
      p_endpoint: j.endpoint,
      p_p256dh: j.keys?.p256dh,
      p_auth: j.keys?.auth,
      p_ua: navigator.userAgent,
    });
    if (error || !(data && data.ok)) {
      return { ok: false, error: (error && error.message) || (data && data.error) || "Gagal menyimpan langganan." };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Gagal mengaktifkan notifikasi: " + (e?.message || e) };
  }
}

// Matikan: unsubscribe + hapus dari Supabase.
export async function matikanPush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await supabase.rpc("hapus_langganan_push", { p_endpoint: endpoint });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Gagal menonaktifkan: " + (e?.message || e) };
  }
}
