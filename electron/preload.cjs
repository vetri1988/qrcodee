const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },
});
