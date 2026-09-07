const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;

// Determine environment
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function startEmbeddedServer() {
  return new Promise((resolve) => {
    try {
      const appPath = app.getAppPath();
      const possiblePaths = [
        path.join(appPath, 'dist', 'server.cjs'),
        path.join(__dirname, '../dist/server.cjs'),
        path.join(__dirname, 'dist/server.cjs'),
        path.join(process.resourcesPath, 'app', 'dist', 'server.cjs'),
      ];

      let serverPath = possiblePaths.find((p) => fs.existsSync(p));

      if (serverPath) {
        process.env.PORT = '3000';
        process.env.NODE_ENV = 'production';
        try {
          require(serverPath);
          console.log('[Electron] Embedded server started successfully from:', serverPath);
        } catch (serverErr) {
          console.error('[Electron] Error requiring server.cjs:', serverErr);
        }
      } else {
        console.warn('[Electron] server.cjs not found in standard paths, checked:', possiblePaths);
      }

      // Check if server is answering (allow up to 10s for initial startup)
      let retries = 0;
      const checkServer = () => {
        const req = http.get('http://localhost:3000/api/health', (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else if (retries < 50) {
            retries++;
            setTimeout(checkServer, 200);
          } else {
            resolve(false);
          }
        });
        req.on('error', () => {
          if (retries < 50) {
            retries++;
            setTimeout(checkServer, 200);
          } else {
            resolve(false);
          }
        });
        req.setTimeout(1000, () => {
          req.destroy();
          if (retries < 50) {
            retries++;
            setTimeout(checkServer, 200);
          } else {
            resolve(false);
          }
        });
      };

      setTimeout(checkServer, 200);
    } catch (err) {
      console.error('[Electron] Failed to initialize embedded server:', err);
      resolve(false);
    }
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'ATM Sensor Barcode Label Manager - Zebra ZT230',
    backgroundColor: '#030712',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: false,
  });

  // Create Application Menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload Application',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload(),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          label: 'Developer Tools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Printer',
      submenu: [
        {
          label: 'Zebra ZT230 Status',
          click: () => {
            mainWindow.webContents.send('menu-action', 'open-settings');
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'User Documentation & Zebra Guide',
          click: () => {
            mainWindow.webContents.send('menu-action', 'open-help');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // External links open in user default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const appPath = app.getAppPath();
  const indexHtmlPath = path.join(appPath, 'dist', 'index.html');

  // Handle load failure fallback
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
    console.warn(`[Electron] Failed to load URL (code ${errorCode}: ${errorDesc}). Falling back to local index.html...`);
    if (fs.existsSync(indexHtmlPath)) {
      mainWindow.loadFile(indexHtmlPath);
    }
  });

  // Start internal server if in production mode
  let serverReady = false;
  if (!isDev) {
    serverReady = await startEmbeddedServer();
  }

  if (serverReady) {
    mainWindow.loadURL('http://localhost:3000');
  } else if (fs.existsSync(indexHtmlPath)) {
    mainWindow.loadFile(indexHtmlPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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
