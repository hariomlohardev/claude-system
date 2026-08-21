import { supaHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const name = req.query.name?.toString();
  if (!name) return res.status(400).json({ error: 'missing name' });
  try {
    const { url, headers } = supaHeaders();
    const sysUrl = `${url}/rest/v1/systems?name=eq.${name}&select=*`;
    const sysRes = await fetch(sysUrl, { headers });
    if (!sysRes.ok) throw new Error(await sysRes.text());
    const sysData = await sysRes.json();
    if (!sysData.length) return res.status(404).json({ error: `System "${name}" not found` });
    const system = sysData[0];
    const verUrl = `${url}/rest/v1/system_versions?system_name=eq.${name}&order=published_at.desc&select=version,downloads,published_at`;
    const verRes = await fetch(verUrl, { headers });
    const versions = verRes.ok ? await verRes.json() : [];
    res.status(200).json({ system, versions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
