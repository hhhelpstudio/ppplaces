import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON_KEY);

// Guest mode (Section 7.2 of the PRD): every visitor gets a real Supabase
// session via anonymous auth, so RLS-protected writes (trips/days/stops)
// work from the very first visit, with no signup screen in the way. This can
// be upgraded to a real account later via supabase.auth.linkIdentity/updateUser
// without losing any data, since the auth.uid() stays the same.
export async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}
