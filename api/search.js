import { supaHeaders } from './_lib/supabase.js';
export default async function handler(req, res) {
  const q = (req.query.q || req.query.query || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'missing ?q=' });
  try {
    const { url, headers } = supaHeaders();
    // use search_vector + ilike fallback for typo tolerance
    const qs = encodeURIComponent(q);
    const or = `search_vector.plfts.${qs},name.ilike.*${qs}*,display_name.ilike.*${qs}*`;
    const fetchUrl = `${url}/rest/v1/systems?select=*&or=(${or})&order=name.asc`;
    const r = await fetch(fetchUrl, { headers });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    res.status(200).json({ query: q, count: data.length, systems: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
