import { cp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist-web');
// Only this fixed, generated output directory is ever removed.
if (path.dirname(out) !== path.resolve(root) || path.basename(out) !== 'dist-web') throw new Error('Invalid build directory');
await mkdir(out, { recursive: true });
// Preserve the root directory: Windows preview servers can hold it open.
for (const entry of await readdir(out)) {
  const target = path.resolve(out, entry);
  if (path.dirname(target) !== out) throw new Error('Invalid output entry');
  await rm(target, { recursive: true, force: true });
}
async function copy(source, target = source) {
  await mkdir(path.dirname(path.join(out, target)), { recursive: true });
  await cp(path.join(root, source), path.join(out, target), { recursive: true });
}
for (const file of ['styles.css', 'refinements.css', 'assets', 'LICENSE']) await copy(file);
for (const file of ['web-data.js', 'web.css', '_headers']) await copy(`web/${file}`, file);
for (const pkg of ['@fontsource/barlow-condensed', '@fontsource/jetbrains-mono']) {
  await copy(`node_modules/${pkg}`, `vendor/${pkg}`);
}
for (const file of ['d3/dist/d3.min.js', 'topojson-client/dist/topojson-client.min.js', 'flag-icons/flags/4x3']) {
  await copy(`node_modules/${file}`, `vendor/${file}`);
}
const data = {
  topology: 'world-atlas/countries-50m.json',
  cities: 'city-timezones/data/cityMap.json',
  countries: 'world-countries/countries.json',
  populations: 'country-json/src/country-by-population.json'
};
for (const [name, source] of Object.entries(data)) await copy(`node_modules/${source}`, `data/${name}.json`);
// Keep upstream notices with the redistributable data and libraries.
for (const pkg of ['d3', 'topojson-client', 'flag-icons', 'world-atlas', 'city-timezones', 'world-countries', 'country-json']) {
  const files = await readdir(path.join(root, 'node_modules', pkg));
  for (const file of files.filter(name => /^(license|copying|notice)/i.test(name))) await copy(`node_modules/${pkg}/${file}`, `licenses/${pkg}/${file}`);
}
let html = await readFile(path.join(root, 'index.html'), 'utf8');
html = html.replaceAll('node_modules/', 'vendor/')
  .replace("connect-src 'none'", "connect-src 'self'")
  .replace('<title>ATLAS</title>', '<title>Atlas — Flags, Shapes & Capitals</title><meta name="description" content="Play Atlas: a free geography game for learning country flags, shapes, and capitals. No account needed."><link rel="icon" href="assets/atlas-command.ico">')
  .replace('</head>', '<link rel="stylesheet" href="web.css"></head>')
  .replace('<div class="difficulty-rail">', '<label class="web-difficulty-label" for="difficultySlider">Answer choices</label><div class="difficulty-rail">')
  .replace('<script src="app.js"></script>', '<script src="web-data.js"></script><script src="app.js"></script>')
  .replace('Move your pointer to the side of the window to reveal the difficulty slider.', 'Use the difficulty slider beside the game (above it on phones).')
  .replace('</body>', '<noscript>Atlas needs JavaScript enabled to run the geography game.</noscript></body>');
await writeFile(path.join(out, 'index.html'), html);
await writeFile(path.join(out, 'app.js'), (await readFile(path.join(root, 'app.js'), 'utf8')).replaceAll('node_modules/', 'vendor/'));
await writeFile(path.join(out, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Atlas — Page not found</title><h1>Page not found</h1><a href="/">Play Atlas</a></html>');
console.log('Atlas web build ready in dist-web/');
