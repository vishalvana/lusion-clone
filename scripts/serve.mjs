// Zero-dependency static server for the mirrored site.
// Usage: node scripts/serve.mjs [port] [--fill]
//   --fill  when a file is missing, download it from the original (lusion.dev CDN, then lusion.co), save it into
//           ./site and serve it. Browse every page once with --fill to complete the mirror; run without it offline.
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const args = process.argv.slice(2);
const fill = args.includes('--fill');
const port = Number(args.find((a) => /^\d+$/.test(a)) || 4179);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.ktx2': 'image/ktx2',
  '.buf': 'application/octet-stream', '.xml': 'application/xml', '.txt': 'text/plain',
};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';

async function fetchOriginal(path, file) {
  const isPage = file.endsWith('.html');
  for (const host of isPage ? ['https://lusion.co'] : ['https://lusion.dev', 'https://lusion.co']) {
    const r = await fetch(host + (isPage ? path.replace(/index\.html$/, '') : path), { headers: { 'user-agent': UA } });
    if (!r.ok) continue;
    const buf = Buffer.from(await r.arrayBuffer());
    // Netlify answers missing files with the home page (200); that is not the asset
    if (!isPage && buf.subarray(0, 15).toString().startsWith('<!DOCTYPE html')) continue;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, buf);
    console.log('filled', path, `(${(buf.length / 1024).toFixed(0)} KB from ${host})`);
    return buf;
  }
  return null;
}

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  let file = join(root, path);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    if ((await stat(file)).isDirectory()) { file = join(file, 'index.html'); path += '/index.html'; }
  } catch {}
  let body = await readFile(file).catch(() => null);
  if (!body && !extname(file)) { // "/about" -> about/index.html
    file = join(file, 'index.html');
    path += '/index.html';
    body = await readFile(file).catch(() => null);
  }
  if (!body && fill) body = await fetchOriginal(path, file).catch(() => null);
  if (!body) {
    console.log('404', path);
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found: ' + path);
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  res.end(body);
}).listen(port, () => console.log(`Lusion mirror: http://localhost:${port}/${fill ? '  (fill mode: missing files are downloaded)' : ''}`));
