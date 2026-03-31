const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

// Keep a stable app identity and storage path so login survives rebuild/restart.
app.setName('ClaudeMultiElectron');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.setPath(
  'userData',
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'ClaudeMultiElectron')
);

const userDataPath = app.getPath('userData');
app.setPath('cache', path.join(userDataPath, 'Cache'));

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

function getMachineFingerprint() {
  const hostname = os.hostname();
  const username = os.userInfo().username;
  const macs = Object.values(os.networkInterfaces())
    .flat()
    .filter((n) => n && !n.internal && n.mac && n.mac !== '00:00:00:00:00:00')
    .map((n) => n.mac)
    .sort()
    .join(',');
  const raw = `${hostname}|${username}|${macs}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function checkMachineChanged() {
  const fingerprintFile = path.join(userDataPath, '.machine_id');
  const current = getMachineFingerprint();

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  if (fs.existsSync(fingerprintFile)) {
    const saved = fs.readFileSync(fingerprintFile, 'utf-8').trim();
    if (saved !== current) {
      const partitionsDir = path.join(userDataPath, 'Partitions');
      if (fs.existsSync(partitionsDir)) {
        fs.rmSync(partitionsDir, { recursive: true, force: true });
      }
    }
  }

  fs.writeFileSync(fingerprintFile, current, 'utf-8');
}

checkMachineChanged();

app.whenReady().then(() => {
  const allowedHosts = [
    'claude.ai',
    'anthropic.com',
    'clerk.com',
    'clerk.accounts.dev',
    'accounts.google.com',
    'googleapis.com',
    'gstatic.com',
    'google.com',
    'cloudflare.com',
    'cloudflareinsights.com',
  ];

  const allowedProtocols = new Set(['https:', 'http:', 'data:', 'blob:']);

  const ses = session.fromPartition('persist:claude');
  ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    try {
      const u = new URL(details.url);
      if (!allowedProtocols.has(u.protocol)) {
        callback({ cancel: true });
        return;
      }

      if (u.protocol === 'data:' || u.protocol === 'blob:') {
        callback({ cancel: false });
        return;
      }

      const host = u.hostname.toLowerCase();
      const ok = allowedHosts.some((d) => host === d || host.endsWith(`.${d}`));
      callback({ cancel: !ok });
    } catch {
      callback({ cancel: false });
    }
  });

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0d1117',
    title: 'Claude Multi Terminal',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.maximize();
  win.setMenuBarVisibility(false);

  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
});

app.on('window-all-closed', () => app.quit());
