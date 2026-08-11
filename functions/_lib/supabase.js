// Talks to Supabase's auto-generated REST API directly via fetch — no
// @supabase/supabase-js dependency needed here, so this function has zero
// npm installs to deploy. Always uses the service_role key, which bypasses
// Row Level Security (schema.sql only grants anon/authenticated read access
// on these two cache tables, so writes have to come from here).
export async function supabaseFetch(env, path, init = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}
