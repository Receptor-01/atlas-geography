# Atlas

Atlas is a desktop geography trainer for learning national flags, country shapes, and capital cities.

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
