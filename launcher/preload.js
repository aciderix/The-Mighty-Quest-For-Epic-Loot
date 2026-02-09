const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mqfel', {
  // Auth
  loginWithGoogle: () => ipcRenderer.invoke('auth:google'),
  onAuthSuccess: (callback) => ipcRenderer.on('auth:success', (_, data) => callback(data)),
  
  // Game
  launchGame: (data) => ipcRenderer.invoke('game:launch', data),
  
  // Window
  close: () => ipcRenderer.invoke('app:close'),
  minimize: () => ipcRenderer.invoke('app:minimize')
});