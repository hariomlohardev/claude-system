export function supaHeaders() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY');
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}` } };
}