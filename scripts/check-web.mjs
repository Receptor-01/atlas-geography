import assert from 'node:assert/strict';
import { readFile, access, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const out = fileURLToPath(new URL('../dist-web/', import.meta.url));
const html = await readFile(path.join(out, 'index.html'), 'utf8');
assert(html.includes("connect-src 'self'"));
assert(!html.includes('node_modules/'));
assert(html.indexOf('web-data.js') < html.indexOf('src="app.js"'));
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) await access(path.join(out, match[1]));
const countries = JSON.parse(await readFile(path.join(out, 'data/countries.json'), 'utf8'));
assert(countries.length > 190, 'Country metadata must be bundled');
for (const country of countries.filter(c => (c.unMember || ['VA','PS','TW'].includes(c.cca2)) && c.capital?.length && c.ccn3 && c.cca2 !== 'TV')) {
  await access(path.join(out, `vendor/flag-icons/flags/4x3/${country.cca2.toLowerCase()}.svg`));
}
const topology = JSON.parse(await readFile(path.join(out, 'data/topology.json'), 'utf8'));
assert(topology.objects.countries.geometries.length > 190);
const files = await readdir(out, { recursive:true });
assert(!files.some(file => /(^|[\\/])(main\.js|preload\.js|package-lock\.json|\.env)$/.test(file)), 'Server and development files must not be published');
for (const file of files) { const info = await stat(path.join(out, file)); assert(info.size < 25 * 1024 * 1024, `Asset too large: ${file}`); }
console.log('Web package verified: country flags, maps, entry points, and isolated public output.');
