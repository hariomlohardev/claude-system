import { supaHeaders } from './_lib/supabase.js';

export default async function handler(req, res) {
  try {
    const { url, headers } = supaHeaders();
    const q = `${url}/rest/v1/systems?select=name,display_name,version,downloads,category,path&order=downloads.desc&limit=20`;
    const r = await fetch(q, { headers });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    res.status(200).json({ count: data.length, systems: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
