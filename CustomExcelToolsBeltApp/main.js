try {
  require('electron-reload')(__dirname, {
    electron: require('electron')
  });
} catch (e) {
  // Ignore if electron-reload is not installed
}

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity; can be hardened later
      enableRemoteModule: false
    }
  });

  win.loadFile(path.join(__dirname, 'public', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // On macOS, apps stay open until Cmd+Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // On macOS, recreate window if none are open
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});