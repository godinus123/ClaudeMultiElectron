---
FROM: claude-code
TO:   vscode-copilot
MSG:  045
TOPIC: [최종 설계 가이드] CC_MSG_039~044 통합 — VS 구현 완전 가이드
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_045 — ClaudeMultiElectron 최종 설계 가이드

> CC_MSG_039(아키텍처) + 041(구현 지침서) + 042~044(보안) 통합본.
> **이 문서 하나만 보고 전체 구현 가능.**

---

# Part 1. 프로젝트 개요

## 1.1 한 줄 요약
```
Electron 앱 안에 claude.ai를 webview로 N개 임베딩하는 멀티패널 데스크톱 앱
```

## 1.2 핵심 기능
| 기능 | 설명 |
|------|------|
| 멀티패널 | claude.ai를 1~9개 동시 사용 |
| 레이아웃 | 6개 프리셋 (1-전체 ~ 9-채널) |
| 브로드캐스트 | 모든 패널에 동시 메시지 전송 |
| 패널 개성화 | 닉네임 + 색상 (9가지) |
| 세션 영구 저장 | 로그인 1회 → 영구 유지 |
| PC 보안 | 다른 PC면 세션 자동 초기화 |

## 1.3 기술 스택
| 역할 | 기술 |
|------|------|
| 앱 프레임워크 | Electron 41.x |
| 브라우저 임베딩 | `<webview>` 태그 |
| 세션 관리 | `partition="persist:claude"` |
| 세션 저장 | `%APPDATA%/ClaudeMultiElectron/` |
| 레이아웃 | CSS Grid |
| PC 보안 | SHA256 머신 지문 |
| UI | HTML/CSS/JS (바닐라) |

---

# Part 2. 파일 구조

```
C:\WindowsApp\ClaudeMultiElectron\
│
├── package.json              ← 의존성 (electron만)
├── main.js                   ← 메인 프로세스
├── config.json               ← 패널 닉네임/색상
├── .gitignore                ← .userdata, node_modules 제외
│
├── renderer/
│   ├── index.html            ← 메인 UI
│   ├── renderer.js           ← 전체 로직
│   └── style.css             ← 다크테마
│
└── doc/
    └── DESIGN.md             ← 설계서

[자동 생성 — 배포에 포함하지 않음]
├── node_modules/
└── %APPDATA%/ClaudeMultiElectron/   ← 세션/쿠키 (PC별 로컬)
    ├── .machine_id                   ← PC 지문
    └── Partitions/claude/            ← 로그인 데이터
```

---

# Part 3. 파일별 완성 코드

---

## 3.1 package.json

```json
{
  "name": "claude-multi-electron",
  "version": "1.0.0",
  "description": "Claude Multi — claude.ai 멀티패널 데스크톱 앱",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "devDependencies": {
    "electron": "^41.0.0"
  }
}
```

---

## 3.2 .gitignore

```
node_modules/
.userdata/
dist/
build/
*.log
```

---

## 3.3 config.json

```json
{
  "panels": [
    { "id": 1, "nickname": "프론트봇", "color": "#1f6feb" },
    { "id": 2, "nickname": "백엔드봇", "color": "#3fb950" },
    { "id": 3, "nickname": "테스터",   "color": "#a371f7" },
    { "id": 4, "nickname": "문서봇",   "color": "#d29922" },
    { "id": 5, "nickname": "디버거",   "color": "#ff7b72" },
    { "id": 6, "nickname": "인프라",   "color": "#39d353" },
    { "id": 7, "nickname": "리서치",   "color": "#58a6ff" },
    { "id": 8, "nickname": "리뷰어",   "color": "#e3b341" },
    { "id": 9, "nickname": "기타",     "color": "#e6edf3" }
  ],
  "defaultLayout": "4-quad",
  "url": "https://claude.ai"
}
```

---

## 3.4 main.js

```javascript
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const fs = require('fs');

// ══════════════════════════════════════════════════
// 1. 앱 기본 설정
// ══════════════════════════════════════════════════

app.setName('ClaudeMultiElectron');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const userDataPath = path.join(
    process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
    'ClaudeMultiElectron'
);
app.setPath('userData', userDataPath);

// ══════════════════════════════════════════════════
// 2. PC 변경 감지 → 세션 자동 초기화
// ══════════════════════════════════════════════════
//
// 동작:
//   앱 시작 → PC 지문 생성 (hostname+username+MAC → SHA256)
//   → .machine_id 파일과 비교
//   → 불일치 시 Partitions/ 삭제 (쿠키/세션 초기화)
//   → 현재 지문 저장
//
// 시나리오:
//   같은 PC 재시작     → 로그인 유지
//   같은 PC 재빌드     → 로그인 유지
//   다른 PC에 복사/설치 → 세션 초기화 → 새 로그인 필요
//

function getMachineFingerprint() {
    const hostname = os.hostname();
    const username = os.userInfo().username;
    const macs = Object.values(os.networkInterfaces())
        .flat()
        .filter(n => !n.internal && n.mac && n.mac !== '00:00:00:00:00:00')
        .map(n => n.mac)
        .sort()
        .join(',');
    const raw = `${hostname}|${username}|${macs}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function checkMachineChanged() {
    const fingerprintFile = path.join(userDataPath, '.machine_id');
    const currentFp = getMachineFingerprint();

    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }

    if (fs.existsSync(fingerprintFile)) {
        const savedFp = fs.readFileSync(fingerprintFile, 'utf-8').trim();
        if (savedFp !== currentFp) {
            console.log('[보안] PC 변경 감지 — 세션 초기화');
            const partitionsDir = path.join(userDataPath, 'Partitions');
            if (fs.existsSync(partitionsDir)) {
                fs.rmSync(partitionsDir, { recursive: true, force: true });
            }
        }
    }

    fs.writeFileSync(fingerprintFile, currentFp, 'utf-8');
}

checkMachineChanged();

// ══════════════════════════════════════════════════
// 3. 창 생성
// ══════════════════════════════════════════════════

app.whenReady().then(() => {

    // ── 3a. webview URL 화이트리스트 (보안) ──────
    //
    // claude.ai + 로그인 관련 URL만 허용.
    // 그 외 서버 접근 차단.
    //
    const ses = session.fromPartition('persist:claude');
    ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
        try {
            const url = new URL(details.url);
            const allowed =
                url.hostname.endsWith('claude.ai') ||
                url.hostname.endsWith('anthropic.com') ||
                url.hostname.endsWith('google.com') ||
                url.hostname.endsWith('googleapis.com') ||
                url.hostname.endsWith('gstatic.com') ||
                url.hostname.endsWith('accounts.google.com') ||
                url.hostname.endsWith('clerk.accounts.dev') ||
                url.hostname.endsWith('clerk.com') ||
                url.protocol === 'data:' ||
                url.protocol === 'blob:';
            callback({ cancel: !allowed });
        } catch {
            callback({ cancel: false });
        }
    });

    // ── 3b. BrowserWindow 생성 ───────────────────
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#0d1117',
        title: 'Claude Multi',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
        }
    });

    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    win.maximize();
    win.setMenuBarVisibility(false);
});

app.on('window-all-closed', () => app.quit());
```

---

## 3.5 renderer/index.html

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Claude Multi</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ── 툴바 (40px) ───────────────────────────────── -->
<div class="toolbar">
    <span class="app-title">⬛ Claude Multi</span>
    <div class="sep"></div>
    <button id="btn-reset-all">🔄 전체 초기화</button>
    <div class="sep"></div>
    <label>레이아웃</label>
    <select id="layout-select">
        <option value="1-full">1-전체</option>
        <option value="2-side">2-좌우</option>
        <option value="2-vert">2-상하</option>
        <option value="4-quad" selected>4-쿼드</option>
        <option value="6-grid">6-2×3</option>
        <option value="9-grid">9-채널</option>
    </select>
</div>

<!-- ── 터미널 그리드 (동적 생성) ──────────────────── -->
<div class="grid" id="grid"></div>

<!-- ── 브로드캐스트 바 (36px) ─────────────────────── -->
<div class="broadcast">
    <span class="bc-label">📢 브로드캐스트</span>
    <input type="text" id="bc-input" placeholder="모든 패널에 동시 전송..." />
    <button id="btn-broadcast">전송</button>
</div>

<!-- ── 상태바 (24px) ─────────────────────────────── -->
<div class="statusbar">
    <div class="status-panels" id="status-panels"></div>
    <span id="status-info"></span>
</div>

<!-- ── 설정 모달 ─────────────────────────────────── -->
<div class="modal-overlay" id="modal-overlay">
    <div class="modal">
        <h3 id="modal-title">패널 설정</h3>
        <label>닉네임</label>
        <input type="text" id="modal-nickname" maxlength="10" />
        <label>색상</label>
        <div class="color-options" id="modal-colors"></div>
        <div class="modal-btns">
            <button class="btn-cancel" id="modal-cancel">취소</button>
            <button class="btn-save" id="modal-save">저장</button>
        </div>
    </div>
</div>

<script src="renderer.js"></script>
</body>
</html>
```

### HTML 구조도

```
body (flex column, 100vh)
  ├── .toolbar          40px  고정
  ├── .grid             flex:1 (남은 공간 전부)
  │     ├── .panel#panel-1
  │     │     ├── .panel-header  28px
  │     │     │     ├── .badge
  │     │     │     ├── .nickname
  │     │     │     ├── .btn-settings [⚙]
  │     │     │     └── .btn-reset [↺]
  │     │     └── <webview>  flex:1
  │     ├── .panel#panel-2  (같은 구조)
  │     ├── .panel#panel-3
  │     └── ... (최대 9개)
  ├── .broadcast        36px  고정
  ├── .statusbar        24px  고정
  └── .modal-overlay    (숨김, 설정 시 표시)
```

---

## 3.6 renderer/style.css

```css
/* ══ 리셋 ══════════════════════════════════════════ */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    background: #0d1117;
    color: #e6edf3;
    font-family: 'Cascadia Code', 'Consolas', 'Courier New', monospace;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* ══ 툴바 ══════════════════════════════════════════ */
.toolbar {
    height: 40px;
    background: #161b22;
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 10px;
    border-bottom: 1px solid #30363d;
    flex-shrink: 0;
}
.toolbar .app-title { color: #58a6ff; font-size: 13px; font-weight: bold; }
.toolbar .sep { width: 1px; height: 20px; background: #30363d; }
.toolbar button {
    background: #21262d; color: #3fb950; border: none;
    padding: 5px 10px; font-size: 11px; cursor: pointer;
    border-radius: 3px; font-family: inherit;
}
.toolbar button:hover { background: #30363d; }
.toolbar select {
    background: #21262d; color: #e6edf3;
    border: 1px solid #30363d; padding: 4px 8px;
    font-size: 11px; border-radius: 3px; font-family: inherit;
}
.toolbar label { color: #8b949e; font-size: 11px; }

/* ══ 그리드 ════════════════════════════════════════ */
.grid {
    flex: 1;
    display: grid;
    gap: 3px;
    padding: 3px;
    grid-template-columns: 1fr 1fr;   /* 기본: 4-쿼드 */
    grid-template-rows: 1fr 1fr;
}

/* ══ 패널 ══════════════════════════════════════════ */
.panel {
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    overflow: hidden;
    /* border 색상은 JS에서 패널별 설정 */
}

/* 비활성 패널 (레이아웃 축소 시) — display:none 사용 금지! */
.panel.hidden {
    position: absolute;
    left: -9999px;
    width: 0;
    height: 0;
    overflow: hidden;
}

/* 패널 헤더 */
.panel-header {
    height: 28px;
    background: #161b22;
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 6px;
    flex-shrink: 0;
}
.panel-header .badge {
    padding: 2px 6px; border-radius: 2px;
    font-size: 10px; font-weight: bold; color: white;
}
.panel-header .nickname {
    font-size: 11px; color: #8b949e; flex: 1;
}
.panel-header .panel-btn {
    background: transparent; color: #8b949e; border: none;
    font-size: 12px; cursor: pointer; padding: 2px 6px; border-radius: 2px;
}
.panel-header .panel-btn:hover { color: #e6edf3; background: #21262d; }

/* 패널 webview */
.panel webview {
    flex: 1;
    border: none;
    border-left: 3px solid;  /* border-left-color는 JS에서 패널별 설정 */
}

/* ══ 브로드캐스트 바 ═══════════════════════════════ */
.broadcast {
    height: 36px;
    background: #161b22;
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
    border-top: 1px solid #30363d;
    flex-shrink: 0;
}
.broadcast .bc-label { color: #d29922; font-size: 11px; font-weight: bold; white-space: nowrap; }
.broadcast input {
    flex: 1; background: #0d1117; color: #e6edf3;
    border: 1px solid #30363d; padding: 4px 8px;
    font-family: inherit; font-size: 12px; border-radius: 3px;
}
.broadcast input:focus { outline: none; border-color: #1f6feb; }
.broadcast button {
    background: #1f6feb; color: white; border: none;
    padding: 4px 14px; font-size: 11px; cursor: pointer;
    border-radius: 3px; font-family: inherit;
}
.broadcast button:hover { background: #388bfd; }

/* ══ 상태바 ════════════════════════════════════════ */
.statusbar {
    height: 24px;
    background: #010409;
    display: flex;
    align-items: center;
    padding: 0 12px;
    justify-content: space-between;
    flex-shrink: 0;
    border-top: 1px solid #21262d;
}
.statusbar span { font-size: 10px; color: #8b949e; }
.status-panels { display: flex; gap: 12px; }
.status-dot {
    display: inline-block; width: 6px; height: 6px;
    border-radius: 50%; margin-right: 3px; vertical-align: middle;
}

/* ══ 설정 모달 ═════════════════════════════════════ */
.modal-overlay {
    display: none; position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); z-index: 1000;
    justify-content: center; align-items: center;
}
.modal-overlay.active { display: flex; }
.modal {
    background: #161b22; border: 1px solid #30363d;
    border-radius: 8px; padding: 20px; min-width: 320px;
}
.modal h3 { color: #e6edf3; font-size: 14px; margin-bottom: 16px; }
.modal label { display: block; color: #8b949e; font-size: 11px; margin-bottom: 4px; margin-top: 12px; }
.modal input {
    width: 100%; background: #0d1117; color: #e6edf3;
    border: 1px solid #30363d; padding: 6px 8px;
    font-family: inherit; font-size: 12px; border-radius: 3px;
}
.modal .color-options { display: flex; gap: 6px; margin-top: 4px; }
.modal .color-swatch {
    width: 24px; height: 24px; border-radius: 4px;
    cursor: pointer; border: 2px solid transparent;
}
.modal .color-swatch.selected { border-color: #e6edf3; }
.modal .modal-btns { display: flex; gap: 8px; margin-top: 20px; justify-content: flex-end; }
.modal .modal-btns button {
    padding: 6px 16px; border: none; border-radius: 3px;
    font-size: 11px; cursor: pointer; font-family: inherit;
}
.modal .btn-save { background: #1f6feb; color: white; }
.modal .btn-save:hover { background: #388bfd; }
.modal .btn-cancel { background: #21262d; color: #8b949e; }
.modal .btn-cancel:hover { background: #30363d; }
```

---

## 3.7 renderer/renderer.js

```javascript
// ══════════════════════════════════════════════════
// 상수
// ══════════════════════════════════════════════════

const COLORS = [
    '#1f6feb', '#3fb950', '#a371f7', '#d29922',
    '#ff7b72', '#39d353', '#58a6ff', '#e3b341', '#e6edf3'
];

const LAYOUTS = {
    '1-full': { cols: '1fr',             rows: '1fr',             count: 1 },
    '2-side': { cols: '1fr 1fr',         rows: '1fr',             count: 2 },
    '2-vert': { cols: '1fr',             rows: '1fr 1fr',         count: 2 },
    '4-quad': { cols: '1fr 1fr',         rows: '1fr 1fr',         count: 4 },
    '6-grid': { cols: '1fr 1fr 1fr',     rows: '1fr 1fr',         count: 6 },
    '9-grid': { cols: '1fr 1fr 1fr',     rows: '1fr 1fr 1fr',     count: 9 },
};

const CLAUDE_URL = 'https://claude.ai';

// ══════════════════════════════════════════════════
// 전역 상태
// ══════════════════════════════════════════════════

let config = null;          // config.json 내용
let currentLayout = '4-quad';
let editingPanelId = null;  // 설정 모달에서 편집 중인 패널

// ══════════════════════════════════════════════════
// 초기화
// ══════════════════════════════════════════════════
//
// 호출 순서:
//   init() → loadConfig() → createPanels() → applyLayout()
//          → updateStatusBar() → startClock() → bindEvents()

async function init() {
    config = await loadConfig();
    currentLayout = config.defaultLayout || '4-quad';
    document.getElementById('layout-select').value = currentLayout;

    createPanels();
    applyLayout(currentLayout);
    updateStatusBar();
    startClock();
    bindEvents();
}

// ══════════════════════════════════════════════════
// config.json 로드
// ══════════════════════════════════════════════════
//
// fetch로 ../config.json 로드.
// 파일 없거나 에러 시 하드코딩 기본값 사용.

async function loadConfig() {
    try {
        const res = await fetch('../config.json');
        return await res.json();
    } catch {
        return {
            panels: [
                { id: 1, nickname: '프론트봇', color: '#1f6feb' },
                { id: 2, nickname: '백엔드봇', color: '#3fb950' },
                { id: 3, nickname: '테스터',   color: '#a371f7' },
                { id: 4, nickname: '문서봇',   color: '#d29922' },
                { id: 5, nickname: '디버거',   color: '#ff7b72' },
                { id: 6, nickname: '인프라',   color: '#39d353' },
                { id: 7, nickname: '리서치',   color: '#58a6ff' },
                { id: 8, nickname: '리뷰어',   color: '#e3b341' },
                { id: 9, nickname: '기타',     color: '#e6edf3' },
            ],
            defaultLayout: '4-quad',
            url: CLAUDE_URL
        };
    }
}

// ══════════════════════════════════════════════════
// 패널 동적 생성
// ══════════════════════════════════════════════════
//
// config.panels (9개)를 순회하며 DOM 생성.
// 각 패널 구조:
//   .panel
//     .panel-header
//       .badge (번호, 배경색=패널색)
//       .nickname (닉네임)
//       .btn-settings [⚙]
//       .btn-reset [↺]
//     <webview> (claude.ai, partition=persist:claude)

function createPanels() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    config.panels.forEach(p => {
        const panel = document.createElement('div');
        panel.className = 'panel';
        panel.id = `panel-${p.id}`;
        panel.style.border = `1px solid ${p.color}`;

        panel.innerHTML = `
            <div class="panel-header">
                <span class="badge" style="background:${p.color};">${p.id}</span>
                <span class="nickname">${p.nickname}</span>
                <button class="panel-btn btn-settings" data-id="${p.id}" title="설정">⚙</button>
                <button class="panel-btn btn-reset" data-id="${p.id}" title="새 대화">↺</button>
            </div>
            <webview
                src="${config.url || CLAUDE_URL}"
                partition="persist:claude"
                style="border-left-color:${p.color};"
            ></webview>
        `;

        grid.appendChild(panel);
    });
}

// ══════════════════════════════════════════════════
// 레이아웃 적용
// ══════════════════════════════════════════════════
//
// LAYOUTS 상수에서 CSS Grid 값을 가져와 적용.
// 활성 패널: Grid에 표시.
// 비활성 패널: class="hidden" → position:absolute, left:-9999px
//   ⚠️ display:none은 사용 금지! webview 렌더링이 중단됨.
//
// 비활성→활성 복귀 시 webview 세션/스크롤 상태 그대로 보존됨.

function applyLayout(layoutName) {
    const layout = LAYOUTS[layoutName];
    if (!layout) return;
    currentLayout = layoutName;

    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = layout.cols;
    grid.style.gridTemplateRows = layout.rows;

    document.querySelectorAll('.panel').forEach((panel, i) => {
        if (i < layout.count) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    });

    updateStatusBar();
}

// ══════════════════════════════════════════════════
// 브로드캐스트
// ══════════════════════════════════════════════════
//
// 동작:
//   1. 사용자가 브로드캐스트 바에 텍스트 입력
//   2. Enter 또는 [전송] 클릭
//   3. 활성 패널의 webview에 executeJavaScript() 실행
//   4. claude.ai 입력창에 텍스트 주입 + 전송 버튼 클릭
//
// claude.ai DOM 셀렉터:
//   입력창: div.ProseMirror[contenteditable] 또는 textarea
//   전송: button[aria-label="Send Message"] 또는 form button
//
// ⚠️ claude.ai DOM이 바뀌면 셀렉터 수정 필요.
//   개발자도구(F12)로 실제 구조 확인.

function broadcast(text) {
    if (!text.trim()) return;

    const escapedText = JSON.stringify(text);

    const script = `
        (function() {
            const selectors = [
                'div.ProseMirror[contenteditable="true"]',
                'div[contenteditable="true"]',
                'textarea',
            ];
            let input = null;
            for (const sel of selectors) {
                input = document.querySelector(sel);
                if (input) break;
            }
            if (!input) return false;

            if (input.tagName === 'TEXTAREA') {
                input.value = ${escapedText};
                input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                input.innerHTML = '<p>' + ${escapedText} + '</p>';
                input.dispatchEvent(new InputEvent('input', { bubbles: true }));
            }

            setTimeout(() => {
                const btn = document.querySelector('button[aria-label="Send Message"]')
                    || document.querySelector('button[type="submit"]')
                    || document.querySelector('form button:last-of-type');
                if (btn) btn.click();
            }, 200);

            return true;
        })();
    `;

    const layout = LAYOUTS[currentLayout];
    document.querySelectorAll('.panel').forEach((panel, i) => {
        if (i >= layout.count) return;
        const wv = panel.querySelector('webview');
        if (wv) wv.executeJavaScript(script).catch(() => {});
    });
}

// ══════════════════════════════════════════════════
// 패널 초기화 (confirm 확인 포함)
// ══════════════════════════════════════════════════

function resetPanel(panelId) {
    if (!confirm(`패널 ${panelId} 대화를 초기화하시겠습니까?\n현재 대화가 사라집니다.`)) return;
    const wv = document.querySelector(`#panel-${panelId} webview`);
    if (wv) wv.loadURL(config.url || CLAUDE_URL);
}

function resetAll() {
    if (!confirm('모든 패널을 초기화하시겠습니까?\n모든 대화가 사라집니다.')) return;
    document.querySelectorAll('webview').forEach(wv => {
        wv.loadURL(config.url || CLAUDE_URL);
    });
}

// ══════════════════════════════════════════════════
// 설정 모달 (닉네임 + 색상 변경)
// ══════════════════════════════════════════════════
//
// [⚙] 클릭 → 모달 표시 → 닉네임 입력 + 색상 선택
// [저장] → config 메모리 업데이트 + DOM 반영
// [취소] 또는 오버레이 클릭 → 모달 닫기
//
// ⚠️ 현재 config.json 파일 쓰기는 미구현 (IPC 필요).
//   앱 재시작 시 config.json 기본값으로 복원됨.
//   향후 IPC로 main 프로세스에서 fs.writeFile 구현.

function openSettings(panelId) {
    editingPanelId = panelId;
    const p = config.panels.find(x => x.id === panelId);
    if (!p) return;

    document.getElementById('modal-title').textContent = `패널 ${panelId} 설정`;
    document.getElementById('modal-nickname').value = p.nickname;

    const colorsDiv = document.getElementById('modal-colors');
    colorsDiv.innerHTML = '';
    COLORS.forEach(c => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch' + (c === p.color ? ' selected' : '');
        swatch.style.background = c;
        swatch.dataset.color = c;
        swatch.addEventListener('click', () => {
            colorsDiv.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
        colorsDiv.appendChild(swatch);
    });

    document.getElementById('modal-overlay').classList.add('active');
}

function saveSettings() {
    const p = config.panels.find(x => x.id === editingPanelId);
    if (!p) return;

    p.nickname = document.getElementById('modal-nickname').value.trim() || `패널 ${p.id}`;
    const sel = document.querySelector('.color-swatch.selected');
    if (sel) p.color = sel.dataset.color;

    // DOM 반영
    const panel = document.getElementById(`panel-${p.id}`);
    panel.style.border = `1px solid ${p.color}`;
    panel.querySelector('.badge').style.background = p.color;
    panel.querySelector('.nickname').textContent = p.nickname;
    panel.querySelector('webview').style.borderLeftColor = p.color;

    updateStatusBar();
    closeModal();
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    editingPanelId = null;
}

// ══════════════════════════════════════════════════
// 상태바
// ══════════════════════════════════════════════════

function updateStatusBar() {
    const layout = LAYOUTS[currentLayout];
    const el = document.getElementById('status-panels');
    el.innerHTML = '';

    config.panels.slice(0, layout.count).forEach(p => {
        const span = document.createElement('span');
        span.innerHTML = `<span class="status-dot" style="background:${p.color};"></span>${p.nickname}`;
        el.appendChild(span);
    });

    document.getElementById('status-info').textContent =
        `● ${layout.count}패널 활성 │ ${currentLayout} │ ${new Date().toLocaleString('ko-KR')}`;
}

function startClock() {
    setInterval(() => {
        const layout = LAYOUTS[currentLayout];
        document.getElementById('status-info').textContent =
            `● ${layout.count}패널 활성 │ ${currentLayout} │ ${new Date().toLocaleString('ko-KR')}`;
    }, 1000);
}

// ══════════════════════════════════════════════════
// 이벤트 바인딩
// ══════════════════════════════════════════════════
//
// 모든 이벤트를 한 곳에서 등록.
// 패널 버튼은 이벤트 위임(event delegation) 사용.

function bindEvents() {
    document.getElementById('layout-select').addEventListener('change', e => applyLayout(e.target.value));
    document.getElementById('btn-reset-all').addEventListener('click', resetAll);

    // 브로드캐스트
    document.getElementById('btn-broadcast').addEventListener('click', () => {
        const input = document.getElementById('bc-input');
        broadcast(input.value);
        input.value = '';
    });
    document.getElementById('bc-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') { broadcast(e.target.value); e.target.value = ''; }
    });

    // 패널 버튼 (이벤트 위임 — grid에 한 번만 등록)
    document.getElementById('grid').addEventListener('click', e => {
        const btn = e.target.closest('.panel-btn');
        if (!btn) return;
        const id = parseInt(btn.dataset.id);
        if (btn.classList.contains('btn-settings')) openSettings(id);
        if (btn.classList.contains('btn-reset')) resetPanel(id);
    });

    // 모달
    document.getElementById('modal-save').addEventListener('click', saveSettings);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });
}

// ══════════════════════════════════════════════════
// 시작
// ══════════════════════════════════════════════════
init();
```

---

# Part 4. 함수 관계도

```
init()
  ├── loadConfig()           config.json → config 객체
  ├── createPanels()         config.panels 순회 → DOM 생성
  │     └── 각 패널: .panel > .panel-header + <webview>
  ├── applyLayout()          CSS Grid 설정 + hidden 토글
  ├── updateStatusBar()      하단 닉네임 + 시계
  ├── startClock()           1초 인터벌
  └── bindEvents()
        ├── layout-select change   → applyLayout()
        ├── btn-reset-all click    → resetAll() → confirm → loadURL
        ├── btn-broadcast click    → broadcast() → executeJavaScript
        ├── bc-input Enter         → broadcast()
        ├── .btn-settings click    → openSettings() → 모달 표시
        ├── .btn-reset click       → resetPanel() → confirm → loadURL
        ├── modal-save click       → saveSettings() → config+DOM 반영
        ├── modal-cancel click     → closeModal()
        └── modal-overlay click    → closeModal()
```

---

# Part 5. 보안 체크리스트

| # | 항목 | 구현 위치 | 상태 |
|---|------|-----------|------|
| S1 | 개인정보 %APPDATA% 분리 | main.js `setPath` | ✅ |
| S2 | PC 변경 시 세션 초기화 | main.js `checkMachineChanged` | ✅ |
| S3 | webview URL 화이트리스트 | main.js `onBeforeRequest` | ✅ |
| S4 | 코드 내 API키/토큰 없음 | 전체 | ✅ |
| S5 | .gitignore에 .userdata 제외 | .gitignore | ✅ |
| S6 | nodeIntegration: false | main.js | ✅ |
| S7 | contextIsolation: true | main.js | ✅ |
| S8 | 초기화 시 confirm 모달 | renderer.js | ✅ |

---

# Part 6. 색상 팔레트

| 용도 | HEX |
|------|-----|
| 배경 메인 | `#0d1117` |
| 헤더/툴바 | `#161b22` |
| 버튼 | `#21262d` |
| 테두리 | `#30363d` |
| 텍스트 주 | `#e6edf3` |
| 텍스트 보조 | `#8b949e` |
| 액센트 파란 | `#1f6feb` |
| 활성 초록 | `#3fb950` |
| 경고 노란 | `#d29922` |
| 오류 빨간 | `#ff7b72` |
| 링크 하늘 | `#58a6ff` |

### 패널별 색상

| 패널 | 닉네임 | HEX |
|------|--------|-----|
| 1 | 프론트봇 | `#1f6feb` |
| 2 | 백엔드봇 | `#3fb950` |
| 3 | 테스터 | `#a371f7` |
| 4 | 문서봇 | `#d29922` |
| 5 | 디버거 | `#ff7b72` |
| 6 | 인프라 | `#39d353` |
| 7 | 리서치 | `#58a6ff` |
| 8 | 리뷰어 | `#e3b341` |
| 9 | 기타 | `#e6edf3` |

---

# Part 7. 실행 방법

```bash
cd C:\WindowsApp\ClaudeMultiElectron

# 기존 파일 정리
rm -f main-test.js test.html
rm -rf node_modules package-lock.json

# 새 파일 생성 후
npm install
npm start
```

---

# Part 8. 테스트 체크리스트

- [ ] `npm start` → 4-쿼드 레이아웃으로 시작
- [ ] 패널 1에서 claude.ai 로그인
- [ ] 패널 2,3,4 [↺] → 전부 자동 로그인
- [ ] 앱 종료 → `npm start` → 4패널 자동 로그인 유지
- [ ] 레이아웃 변경 (1-전체 ↔ 9-채널) → 세션 유지
- [ ] [⚙] → 닉네임/색상 변경 → DOM 즉시 반영
- [ ] 브로드캐스트 바 입력 → Enter → 활성 패널 전체 전송
- [ ] [🔄 전체 초기화] → confirm 모달 → OK 시 전체 리셋
- [ ] 패널 [↺] → confirm 모달 → OK 시 해당 패널만 리셋

---

# Part 9. VS 작업 순서

1. `main-test.js`, `test.html` 삭제
2. 위 코드대로 6개 파일 생성:
   - `package.json`
   - `main.js`
   - `.gitignore`
   - `config.json`
   - `renderer/index.html`
   - `renderer/style.css`
   - `renderer/renderer.js`
3. `npm install`
4. `npm start` 테스트
5. 결과 VS_MSG로 보고

---

*Claude Code · CC_MSG_045 · 2026-03-30*
