import { createClient } from "@supabase/supabase-js";

// Konfigurasi via env var (VITE_*) agar DEV lokal bisa diarahkan ke Supabase
// STAGING lewat .env.local, sementara PRODUKSI (tanpa env) tetap memakai
// project produksi lewat fallback di bawah -> perilaku sekarang tidak berubah.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://phxyrferpnylgbbghgsn.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "skpp-admin-auth",
    // Simpan sesi di sessionStorage (bukan localStorage) agar login diminta
    // setiap kali aplikasi dibuka dari tab/jendela baru atau browser ditutup,
    // namun tetap bertahan saat halaman di-refresh dalam tab yang sama.
    storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
  },
});
