import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://jmkuygwmwbxhgyberhvb.supabase.co';
const SUPABASE_ANON = 'sb_publishable_dNvbj-zpgGDR6qV05C7AFg_DafSNXhR';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
