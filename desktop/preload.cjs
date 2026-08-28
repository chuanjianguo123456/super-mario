'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  toggleFullscreen() {
    return ipcRenderer.invoke('desktop:toggle-fullscreen');
  },
  onFullscreenChange(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }

    const handler = (_event, isFullscreen) => listener(Boolean(isFullscreen));
    ipcRenderer.on('desktop:fullscreen-change', handler);
    return () => ipcRenderer.removeListener('desktop:fullscreen-change', handler);
  }
});
