const { app, BrowserWindow, Tray, ipcMain, powerSaveBlocker } = require('electron');
const path = require('path');

let tray = null;
let trayWindow = null;
let powerSaveId = null;
let sessionEndTime = null;
let sessionTimer = null;

app.on('ready', () => {
  createTray();
  createTrayWindow();
});

function createTray() {
  tray = new Tray('icon.png');
  tray.on('click', () => {
    // Toggle the tray window on click
    if (trayWindow.isVisible()) {
      trayWindow.hide();
    } else {
      showTrayWindow();
    }
  });
}

function createTrayWindow() {
  trayWindow = new BrowserWindow({
    width: 300,
    height: 200,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'app', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  });
  trayWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  trayWindow.on('blur', () => {
    trayWindow.hide();
  });
}

function showTrayWindow() {
  const windowBounds = trayWindow.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  trayWindow.setPosition(x, y, false);
  trayWindow.show();
}

// IPC event to start a new session. Starts the power save blocker.
ipcMain.on('start-timer', (event, timeString) => {
  startSession(timeString);
});

// IPC event to add time to the current running session.
ipcMain.on('add-time', (event, timeString) => {
  extendSession(timeString);
});

// IPC event to end the session. Stops the power save blocker.
ipcMain.on('stop-timer', (event) => {
  endSession()
});

const startSession = (timeString) => {
  console.log("Starting Session!");

  sessionEndTime = new Date(Date.now() + timeString * 1000);

  if (powerSaveId === null) {
    powerSaveId = powerSaveBlocker.start('prevent-display-sleep');
    logSleepDisabled();
  }

  startSessionTimer();
}

const extendSession = (timeString) => {
  console.log("Extending (or Starting) Session!");

  if (sessionEndTime) {
    sessionEndTime.setMinutes(sessionEndTime.getMinutes() + (timeString / 60));
    startSessionTimer();
    logSleepDisabled();
  } else {
    startSession(timeString);
  }
}

const endSession = () => {
  console.log("Ending session!");

  if (powerSaveId !== null && powerSaveBlocker.isStarted(powerSaveId)) {
    console.log(`Sleeping Disabled: ${!powerSaveBlocker.isStarted(powerSaveId)}`);

    powerSaveBlocker.stop(powerSaveId);
    powerSaveId = null;
  }

  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }

  sessionEndTime = null;
}

// Start the sesson timer. Updates the renderer process with the current
// remaining session time
const startSessionTimer = () => {
  // Clear any existing timer
  if (sessionTimer) {
    clearInterval(sessionTimer);
  }

  // Set up a new timer
  sessionTimer = setInterval(() => {
    const now = new Date();
    const timeLeft = sessionEndTime - now;
    
    trayWindow.webContents.send('update-timer', timeLeft);
    
    if (now >= sessionEndTime) {
      endSession();
    }
  }, 1000);
}

const logSleepDisabled = () => {
  console.log(`Sleeping Disabled: ${powerSaveBlocker.isStarted(powerSaveId)}`);
  console.log(`Sleeping Will Be Disabled Until: ${sessionEndTime}`)
}

// Quit the app when all windows are closed (macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create the tray when the app is activated (macOS)
app.on('activate', () => {
  if (tray === null) {
    createTray();
  }
});
