import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://phxyrferpnylgbbghgsn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "skpp-admin-auth",
  },
});
