const { app, BrowserWindow, screen, Notification, ipcMain } = require('electron');

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 420,
    height: height,
    x: width - 420,
    y: 0,
    frame: true,
    alwaysOnTop: true,
    resizable: false,
    minimizable: true,
    maximizable: false,
    closable: false,
    skipTaskbar: false,
    title: 'צ\'קליסט בית משפט',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html').catch(err => {
    console.error('Failed to load index.html:', err);
  });

  mainWindow.setMenu(null);

  // Listen for timer notification from renderer
  ipcMain.on('show-notification', (event, message) => {
    new Notification({
      title: 'צ\'קליסט בית משפט',
      body: message,
      silent: true
    }).show();
  });

  // Show and focus window when notification needs to appear
  ipcMain.on('show-window', () => {
    if (mainWindow) {
      mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Auto start with Windows
app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath('exe')
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});