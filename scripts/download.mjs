// Downloads every lusion.co / lusion.dev URL listed in a file (one per line) into ./site, keeping the path.
// Pages ("/about/") are saved as about/index.html. Other hosts are skipped and printed.
// Usage: node scripts/download.mjs urls.txt
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';
const list = [...new Set(readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean))];
const skipped = new Set();
const jobs = [];
for (const raw of list) {
  let u;
  try { u = new URL(raw); } catch { continue; }
  if (u.hostname !== 'lusion.co' && u.hostname !== 'lusion.dev') { skipped.add(u.hostname); continue; } // lusion.dev = their asset CDN, same paths
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  else if (!/\.[a-z0-9]+$/i.test(p.split('/').pop())) p += '/index.html';
  jobs.push({ url: u.origin + u.pathname, file: join(root, p) });
}
let ok = 0, fail = 0, bytes = 0;
async function worker() {
  while (jobs.length) {
    const j = jobs.shift();
    try {
      await stat(j.file); ok++; continue; // already have it
    } catch {}
    try {
      const r = await fetch(j.url, { headers: { 'user-agent': UA } });
      if (!r.ok) throw new Error(r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      // Netlify answers missing files with the home page (200); don't save that as an asset
      if (!j.file.endsWith('.html') && buf.subarray(0, 15).toString().startsWith('<!DOCTYPE html')) throw new Error('missing (html fallback)');
      await mkdir(dirname(j.file), { recursive: true });
      await writeFile(j.file, buf);
      ok++; bytes += buf.length;
    } catch (e) { fail++; console.log('FAIL', j.url, e.message); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`ok ${ok}, failed ${fail}, new ${(bytes / 1e6).toFixed(1)} MB; other hosts skipped: ${[...skipped].join(', ')}`);
