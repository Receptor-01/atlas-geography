const { app, BrowserWindow, ipcMain, session } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const { pathToFileURL } = require('url');

const DATA_FILES = Object.freeze([
  ['world-atlas', 'countries-50m.json'],
  ['city-timezones', 'data', 'cityMap.json'],
  ['world-countries', 'countries.json'],
  ['country-json', 'src', 'country-by-population.json']
]);

let geography;
ipcMain.handle('atlas:load-geography', async event => {
  const appUrl = pathToFileURL(path.join(__dirname, 'index.html')).toString();
  if (event.senderFrame.url !== appUrl || event.senderFrame !== event.senderFrame.top) throw new Error('Untrusted data request');
  if (!geography) geography = Promise.all(DATA_FILES.map(parts =>
    fs.readFile(path.join(__dirname, 'node_modules', ...parts), 'utf8').then(JSON.parse)
  )).then(([topology, cities, countries, populations]) => ({ topology, cities, countries, populations }));
  return geography;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1380, height: 900, minWidth: 940, minHeight: 680,
    backgroundColor: '#05090b', title: 'ATLAS',
    icon: path.join(__dirname, 'assets', 'atlas-command.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged,
      spellcheck: false
    }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.loadFile('index.html');
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
