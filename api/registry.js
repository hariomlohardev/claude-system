import { supaHeaders } from './_lib/supabase.js';
export default async function handler(req, res) {
  try {
    const { url, headers } = supaHeaders();
    const q = `${url}/rest/v1/systems?select=*&order=name.asc`;
    const r = await fetch(q, { headers });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    // shape like registry/index.json for CLI compat
    res.status(200).json({ generatedAt: new Date().toISOString(), systems: data.map(s => ({
      name: s.name, displayName: s.display_name, version: s.version,
      description: s.description, keywords: s.keywords, category: s.category,
      author: s.author, license: s.license, repository: s.repository,
      bugs: s.bugs_url ? { url: s.bugs_url } : undefined,
      homepage: s.homepage, permissions: s.permissions, path: s.path,
      downloads: s.downloads
    }))});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}