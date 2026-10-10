import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Service-role client: it bypasses row-level security, so it must never leave the server.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
