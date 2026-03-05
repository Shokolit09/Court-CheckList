const { app, BrowserWindow, screen, Notification, ipcMain, dialog } = require('electron');

let mainWindow;

// ===== מניעת הפעלה כפולה =====
// אם כבר יש עותק פתוח, מביא אותו לפוקוס במקום לפתוח עותק נוסף
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // עותק נוסף כבר רץ - סוגרים את זה
  app.quit();
} else {
  // כשמנסים לפתוח עותק נוסף - מביאים את החלון הקיים לפוקוס
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // ===== טיפול בשגיאות =====
  // תופס שגיאות לא צפויות ומציג הודעה למשתמש במקום קריסה שקטה
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    dialog.showErrorBox(
      'שגיאה בצ\'קליסט בית משפט',
      'אירעה שגיאה לא צפויה באפליקציה.\n\n' +
      'פרטי השגיאה:\n' + error.message + '\n\n' +
      'מומלץ לסגור ולפתוח מחדש את האפליקציה.\n' +
      'אם הבעיה חוזרת, יש לפנות לתמיכה טכנית.'
    );
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });

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
      dialog.showErrorBox(
        'שגיאה בטעינת האפליקציה',
        'לא ניתן לטעון את קובץ האפליקציה.\n\n' +
        'יש לוודא שהקובץ index.html קיים בתיקיית ההתקנה.\n' +
        'אם הבעיה נמשכת, יש להתקין מחדש את האפליקציה.'
      );
    });

    mainWindow.setMenu(null);

    // טיפול בשגיאות בתוך הדף (renderer process)
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('Render process gone:', details);
      dialog.showErrorBox(
        'שגיאה בצ\'קליסט בית משפט',
        'אירעה שגיאה בתצוגת האפליקציה.\n\n' +
        'האפליקציה תטען מחדש אוטומטית.'
      );
      mainWindow.loadFile('index.html').catch(() => {});
    });

    mainWindow.webContents.on('unresponsive', () => {
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        title: 'האפליקציה לא מגיבה',
        message: 'נראה שהאפליקציה תקועה.\nהאם לטעון מחדש?',
        buttons: ['טען מחדש', 'המתן'],
        defaultId: 0
      });
      if (response === 0) {
        mainWindow.reload();
      }
    });

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
}
