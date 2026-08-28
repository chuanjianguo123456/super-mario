'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { fileURLToPath } = require('node:url');
const path = require('node:path');

const APP_ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(APP_ROOT, 'index.html');
const ICON_PATH = path.join(APP_ROOT, 'assets', 'app-icon.ico');

let mainWindow = null;

function isAppUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'file:' && path.resolve(fileURLToPath(url)) === INDEX_PATH;
  } catch {
    return false;
  }
}

function isExternalUrl(rawUrl) {
  try {
    const protocol = new URL(rawUrl).protocol;
    return protocol === 'https:' || protocol === 'http:' || protocol === 'mailto:';
  } catch {
    return false;
  }
}

function openExternal(rawUrl) {
  if (isExternalUrl(rawUrl)) {
    void shell.openExternal(rawUrl);
  }
}

function sendFullscreenState(window) {
  if (!window.isDestroyed()) {
    window.webContents.send('desktop:fullscreen-change', window.isFullScreen());
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 800,
    minHeight: 560,
    title: '超级马里奥',
    icon: ICON_PATH,
    autoHideMenuBar: true,
    backgroundColor: '#0b0b12',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false
    }
  });

  window.once('ready-to-show', () => window.show());
  window.on('enter-full-screen', () => sendFullscreenState(window));
  window.on('leave-full-screen', () => sendFullscreenState(window));
  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  const guardNavigation = (event, rawUrl) => {
    if (isAppUrl(rawUrl)) return;
    event.preventDefault();
    openExternal(rawUrl);
  };

  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', guardNavigation);
  window.webContents.on('will-redirect', guardNavigation);

  void window.loadFile(INDEX_PATH);
  mainWindow = window;
}

ipcMain.handle('desktop:toggle-fullscreen', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || window.isDestroyed()) return false;

  const nextFullscreenState = !window.isFullScreen();
  window.setFullScreen(nextFullscreenState);
  return nextFullscreenState;
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.chuanjianguo.supermario');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
