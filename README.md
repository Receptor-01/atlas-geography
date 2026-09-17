# Atlas

Atlas is a geography trainer for learning national flags, country shapes, and capital cities, available as a desktop app and a browser game.

## Browser version

Use Node.js 24, then run `npm ci`, `npm run build:web`, and `npm run preview:web`.
The generated `dist-web/` directory contains only public browser assets. It reuses the desktop game's code and loads bundled geography data from the same website. No accounts, database, payment service, or external API is required. Preferences and quiz progress remain in this browser on this device; they do not sync with the desktop app. The first web version requires a connection to load and does not install an offline service worker.

### Publish on Cloudflare

Create a new Workers application connected to `Receptor-01/atlas-geography`:

- Project name: `atlas-geography`
- Production branch: `main`
- Build command: `npm run build:web && node scripts/check-web.mjs`
- Deploy command: `npx wrangler deploy`
- Root directory: leave blank
- Node version: 24
- Optional build environment variable: `ELECTRON_SKIP_BINARY_DOWNLOAD=1`

Cloudflare uses `wrangler.jsonc` to publish `dist-web/`. Keep the other storefront Workers separate. The public workers.dev address is shown after deployment. Later pushes to main rebuild the web version; the existing Windows release workflow remains available.

The web data adapter and responsive overrides live in `web/`. The build copies a specific list of browser libraries, fonts, flags, data, and upstream license notices; it never publishes the full repository or Electron preload/main process.

## Download for Windows

Open the [Atlas Releases page](https://github.com/Receptor-01/atlas-geography/releases) and download one of these files:

- **Atlas Setup:** recommended for most people. Open it and follow the installation prompts.
- **Atlas Portable:** runs without installation. Download it and double-click it whenever you want to play.

Atlas is fully self-contained after download. It does not need an internet connection, account, or separate copy of Node.js.

The first public builds are not code-signed. Windows may therefore show an **Unknown publisher** or Microsoft Defender SmartScreen warning even when the file came from the official Atlas release page. Code signing is planned for a future release.

## Play

- **Flag:** identify a country from its flag.
- **Shape:** identify a country from its outline.
- **Capital:** match a capital city to its country.
- **Active mode:** answer each question yourself.
- **Standby mode:** let Atlas run automatically for passive learning.

Progress and preferences remain on your computer.

## Run from source

Install [Node.js](https://nodejs.org/), then run:

```text
npm ci
npm start
```

## Build the Windows app

```text
npm ci
npm run check
npm run dist
```

Installers are written to `dist/`. Production releases should be code-signed before distribution.

## Security

Please see [SECURITY.md](SECURITY.md) for the security model and responsible disclosure instructions.

## License

Atlas is released under the [MIT License](LICENSE).
