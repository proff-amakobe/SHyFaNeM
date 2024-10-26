const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');



contextBridge.exposeInMainWorld('electron', {
  createFolder: (params) => ipcRenderer.invoke('create-folder', params),
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
  getHyperledgerVersion: () => ipcRenderer.invoke('get-hyperledger-version')
});

console.log('Electron API exposed successfully');
