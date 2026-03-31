/**
 * @file    preload.js
 * @desc    BrowserWindow preload — renderer ↔ main IPC 브리지
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  validateUrl: (url) => ipcRenderer.invoke('validate-url', url),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
