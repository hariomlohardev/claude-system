import { supaHeaders } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }
  const name = req.query.name?.toString();
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    return res.status(400).json({ error: 'missing or invalid name' });
  }
  try {
    const { url, headers } = supaHeaders();
    // Try RPC increment_downloads
    const rpcUrl = `${url}/rest/v1/rpc/increment_downloads`;
    const rpcRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sys_name: name }),
    });
    if (rpcRes.ok) {
      // Fetch updated downloads for response
      const sel = await fetch(`${url}/rest/v1/systems?name=eq.${name}&select=name,downloads`, { headers });
      const data = sel.ok ? await sel.json() : [];
      const downloads = data[0]?.downloads ?? null;
      return res.status(200).json({ name, downloads, via: 'rpc' });
    }
    // Fallback: try direct PATCH if RPC not yet created (requires RLS allow)
    const patchUrl = `${url}/rest/v1/systems?name=eq.${name}`;
    // First get current downloads
    const curRes = await fetch(patchUrl + '&select=downloads', { headers });
    if (curRes.ok) {
      const cur = await curRes.json();
      const current = cur[0]?.downloads ?? 0;
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ downloads: current + 1 }),
      });
      if (patchRes.ok) {
        const updated = await patchRes.json();
        return res.status(200).json({ name, downloads: updated[0]?.downloads ?? current + 1, via: 'patch' });
      }
    }
    const txt = await rpcRes.text();
    return res.status(500).json({ error: `increment failed: ${rpcRes.status} ${txt}` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
