const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    onSystemInfo: (callback) => ipcRenderer.on('system-info', (event, info) => callback(info))
  }
);