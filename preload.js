const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atlasData', {
  loadGeography: () => ipcRenderer.invoke('atlas:load-geography')
});
