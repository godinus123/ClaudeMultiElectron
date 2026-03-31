/**
 * @file    main.js
 * @desc    Electron 메인 프로세스 — 앱 설정, 보안, 윈도우 관리
 * @owner   안목
 * @version 1.1.0
 * @date    2026-03-31
 *
 * 블록 구조:
 *   1. 의존성 로드
 *   2. 앱 기본 설정 (이름, 경로, 단일 인스턴스)
 *   3. PC 변경 감지 → 세션 초기화
 *   4. 앱 준비 → 보안(화이트리스트) + 윈도우 생성
 */

// ══════════════════════════════════════════════════════
// 1. 의존성
// ══════════════════════════════════════════════════════

const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

// ══════════════════════════════════════════════════════
// 2. 앱 기본 설정
// ══════════════════════════════════════════════════════

app.setName('ClaudeMultiElectron');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const userDataPath = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'ClaudeMultiElectron'
);
app.setPath('userData', userDataPath);
app.setPath('cache', path.join(userDataPath, 'Cache'));

// 중복 실행 방지
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

// ══════════════════════════════════════════════════════
// 3. PC 변경 감지 — 다른 PC면 세션 자동 초기화
//    hostname + username + MAC → SHA256 → .machine_id 비교
// ══════════════════════════════════════════════════════

function getMachineFingerprint() {
  const raw = [
    os.hostname(),
    os.userInfo().username,
    Object.values(os.networkInterfaces())
      .flat()
      .filter(n => n && !n.internal && n.mac && n.mac !== '00:00:00:00:00:00')
      .map(n => n.mac)
      .sort()
      .join(',')
  ].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function checkMachineChanged() {
  const fpFile = path.join(userDataPath, '.machine_id');
  const current = getMachineFingerprint();

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  if (fs.existsSync(fpFile)) {
    const saved = fs.readFileSync(fpFile, 'utf-8').trim();
    if (saved !== current) {
      // PC 변경 감지 → 로그인 세션 삭제
      const partitionsDir = path.join(userDataPath, 'Partitions');
      if (fs.existsSync(partitionsDir)) {
        fs.rmSync(partitionsDir, { recursive: true, force: true });
      }
    }
  }

  fs.writeFileSync(fpFile, current, 'utf-8');
}

checkMachineChanged();

// ----- 파일 로그 설정 (diagnostics) -----
const logDir = path.join(userDataPath, 'logs');
try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) { /* ignore */ }
const logFile = path.join(logDir, 'main.log');
function logMain(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {
    // best-effort logging — don't throw
    try { console.error('logMain error', e); } catch {}
  }
}

process.on('uncaughtException', (err) => {
  logMain('uncaughtException: ' + (err && err.stack ? err.stack : String(err)));
});
process.on('unhandledRejection', (r) => {
  logMain('unhandledRejection: ' + String(r));
});
// -------------------------------------------

// ══════════════════════════════════════════════════════
// 4. 앱 준비 → 보안 + 윈도우 생성
// ══════════════════════════════════════════════════════

app.whenReady().then(() => {

  // ── 4a. URL 화이트리스트 (릴리즈 모드) ──────────
  // --dev 모드에서는 비활성 → 주소창 자유 이동

  const allowedHosts = [
    'claude.ai', 'anthropic.com',
    'clerk.com', 'clerk.accounts.dev',
    'accounts.google.com', 'googleapis.com', 'gstatic.com', 'google.com',
    'cloudflare.com', 'cloudflareinsights.com',
  ];
  const allowedProtocols = new Set(['https:', 'data:', 'blob:']);
  const ses = session.fromPartition('persist:claude');

  if (!process.argv.includes('--dev')) {
    ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
      try {
        const u = new URL(details.url);
        if (!allowedProtocols.has(u.protocol)) { logMain(`blocked protocol ${details.url}`); return cb({ cancel: true }); }
        if (u.protocol === 'data:' || u.protocol === 'blob:') return cb({ cancel: false });
        const host = u.hostname.toLowerCase();
        const ok = allowedHosts.some(d => host === d || host.endsWith('.' + d));
        if (!ok) logMain(`blocked host ${details.url}`);
        cb({ cancel: !ok });
      } catch (err) {
        logMain(`webRequest parse error ${details.url} -> ${String(err)}`);
        cb({ cancel: true });
      }
    });
  }

  // ── 4b-0. IPC: config.json 로드 (asar 안전) ─────

  ipcMain.handle('load-config', () => {
    try {
      const cfgPath = path.join(__dirname, 'config.json');
      const raw = fs.readFileSync(cfgPath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      logMain('load-config failed: ' + (err.message || err));
      return null;
    }
  });

  // ── 4b. IPC: URL 검증 (renderer → main) ─────────

  ipcMain.handle('validate-url', (_event, url) => {
    try {
      const u = new URL(url);
      if (!allowedProtocols.has(u.protocol)) {
        logMain(`nav-blocked protocol: ${url}`);
        return { allowed: false, reason: `허용되지 않은 프로토콜: ${u.protocol}` };
      }
      if (u.protocol === 'data:' || u.protocol === 'blob:') {
        return { allowed: true };
      }
      const host = u.hostname.toLowerCase();
      const ok = allowedHosts.some(d => host === d || host.endsWith('.' + d));
      if (!ok) logMain(`nav-blocked host: ${url}`);
      return ok
        ? { allowed: true }
        : { allowed: false, reason: `허용되지 않은 도메인: ${host}` };
    } catch {
      return { allowed: false, reason: 'URL 파싱 실패' };
    }
  });

  // ── 4b-2. IPC: 외부 브라우저 열기 (GitHub 등) ───

  ipcMain.handle('open-external', (_event, url) => {
    if (typeof url === 'string' && url.startsWith('https://github.com/')) {
      shell.openExternal(url);
      return { ok: true };
    }
    logMain(`open-external blocked: ${url}`);
    return { ok: false, reason: 'GitHub URL만 허용' };
  });

  // ── 4c. 윈도우 생성 ────────────────────────────

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0d1117',
    title: 'ClaudeMulti',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  try {
    logMain('creating main window');
    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  } catch (e) {
    logMain('loadFile error: ' + (e && e.stack ? e.stack : String(e)));
    throw e;
  }

  // 새 창 열림 차단 — HTML 뷰어 창 방지 (메인 윈도우)
  win.webContents.setWindowOpenHandler(({ url }) => {
    logMain(`blocked window.open (main): ${url}`);
    return { action: 'deny' };
  });

  // 모든 webContents(webview 포함) 새 창 차단
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      logMain(`blocked window.open (webview): ${url}`);
      return { action: 'deny' };
    });
    // 메인 윈도우의 외부 네비게이션 차단 (webview는 허용)
    contents.on('will-navigate', (navEvent, navUrl) => {
      if (contents.getType() !== 'webview') {
        navEvent.preventDefault();
        logMain(`blocked navigation (non-webview): ${navUrl}`);
      }
    });
  });

  win.webContents.on('crashed', () => {
    logMain('webContents crashed — reloading');
    try { win.loadFile(path.join(__dirname, 'renderer', 'index.html')); } catch {}
  });
  win.webContents.on('render-process-gone', (_ev, details) => {
    logMain('render-process-gone: ' + JSON.stringify(details));
    if (details.reason !== 'clean-exit') {
      try { win.loadFile(path.join(__dirname, 'renderer', 'index.html')); } catch {}
    }
  });

  win.maximize();
  win.setMenuBarVisibility(false);

  // 개발자도구: --dev 모드에서만
  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
});

app.on('window-all-closed', () => { logMain('window-all-closed'); app.quit(); });
