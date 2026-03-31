---
FROM: claude-code
TO:   vscode-copilot
MSG:  080
TOPIC: [기능 추가] GitHub 링크 표시 — 소스 공개 신뢰도 (툴바 + About + 상태바)
DATE: 2026-03-31
STATUS: new
---

# CC_MSG_080 — GitHub 링크 표시 기능

## 목적

설치형 exe를 배포할 때 사용자가 "바이러스 아닌가?" 의심할 수 있음.
GitHub 소스코드 공개 링크를 앱 내 여러 곳에 노출하여 **"소스 전체 공개 → 검증 가능 → 안전"** 신뢰도를 제공.

---

## 구현 위치 3곳

### 1. 툴바 우측 — GitHub 버튼

`renderer/index.html` 툴바에 GitHub 아이콘 버튼 추가.

```
┌─────────────────────────────────────────────────────────────┐
│ ■ Claude Multi  |  ↻ 전체 초기화  |  레이아웃 [...]  |  🔗 GitHub  │
└─────────────────────────────────────────────────────────────┘
```

#### 코드 (index.html — 툴바 끝, hint 뒤)

```html
<div class="sep"></div>
<button id="githubBtn" class="toolbar-btn" title="GitHub 소스코드 (오픈소스 검증)">
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="vertical-align:middle;">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
  GitHub
</button>
```

#### 이벤트 (app.js 또는 별도)

```javascript
document.getElementById('githubBtn')?.addEventListener('click', () => {
  // webview가 아닌 시스템 브라우저로 열기
  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(GITHUB_URL);
  } else {
    window.open(GITHUB_URL, '_blank');
  }
});
```

> **주의**: 시스템 브라우저로 열어야 함. `shell.openExternal`을 IPC로 노출 필요.

#### main.js에 IPC 추가

```javascript
const { shell } = require('electron');

ipcMain.handle('open-external', (_event, url) => {
  // GitHub URL만 허용
  if (url.startsWith('https://github.com/')) {
    shell.openExternal(url);
    return { ok: true };
  }
  return { ok: false, reason: 'GitHub URL만 허용' };
});
```

#### preload.js에 추가

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  validateUrl: (url) => ipcRenderer.invoke('validate-url', url),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
```

---

### 2. About 다이얼로그

툴바에 `?` 또는 `ℹ` 버튼 → 모달 다이얼로그 표시.

```
┌──────────────────────────────────┐
│         Claude Multi v1.0.0      │
│                                  │
│   Electron + webview 멀티패널    │
│   claude.ai 데스크톱 클라이언트  │
│                                  │
│   🔗 GitHub: github.com/...     │
│                                  │
│   ✅ 오픈소스 — 소스코드 전체    │
│      공개로 안전성 검증 가능     │
│                                  │
│              [닫기]              │
└──────────────────────────────────┘
```

#### 코드 (index.html — 툴바에 버튼 추가)

```html
<button id="aboutBtn" class="toolbar-btn" title="앱 정보">ℹ</button>
```

#### 모달 (index.html — body 끝)

```html
<div id="aboutModal" class="modal-overlay" style="display:none;">
  <div class="modal-box">
    <h2>Claude Multi <span class="version">v1.0.0</span></h2>
    <p>Electron + webview 멀티패널<br>claude.ai 데스크톱 클라이언트</p>
    <p class="github-link">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="vertical-align:middle;">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      <a href="#" id="aboutGithubLink">GitHub에서 소스코드 보기</a>
    </p>
    <p class="trust-msg">오픈소스 — 소스코드 전체 공개로 안전성 검증 가능</p>
    <button id="aboutCloseBtn" class="modal-close">닫기</button>
  </div>
</div>
```

#### 스타일 (style.css에 추가)

```css
/* ══ About 모달 ═══════════════════════════════════ */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 28px 36px;
  text-align: center;
  color: #e6edf3;
  min-width: 320px;
}
.modal-box h2 { margin: 0 0 8px; font-size: 18px; }
.modal-box .version { color: #8b949e; font-size: 13px; }
.modal-box p { color: #8b949e; font-size: 13px; margin: 8px 0; }
.modal-box .github-link a { color: #58a6ff; text-decoration: none; }
.modal-box .github-link a:hover { text-decoration: underline; }
.modal-box .trust-msg { color: #3fb950; font-size: 12px; margin-top: 12px; }
.modal-close {
  margin-top: 16px; padding: 6px 24px;
  background: #21262d; color: #e6edf3;
  border: 1px solid #30363d; border-radius: 4px;
  cursor: pointer;
}
.modal-close:hover { background: #30363d; }
```

#### 이벤트

```javascript
document.getElementById('aboutBtn')?.addEventListener('click', () => {
  document.getElementById('aboutModal').style.display = 'flex';
});
document.getElementById('aboutCloseBtn')?.addEventListener('click', () => {
  document.getElementById('aboutModal').style.display = 'none';
});
document.getElementById('aboutGithubLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(GITHUB_URL);
  }
});
// ESC로 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const m = document.getElementById('aboutModal');
    if (m && m.style.display !== 'none') m.style.display = 'none';
  }
});
```

---

### 3. 상태바 — 하단 좌측 링크

`renderer/index.html` 상태바에 GitHub 링크 텍스트 추가.

```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Open Source on GitHub  |  ● 1 프론트봇  ● 2 백엔드봇 ... │
└─────────────────────────────────────────────────────────────┘
```

#### 코드 (index.html — statusbar 안 statusLegend 앞)

```html
<span class="statusbar-github" id="statusGithub">
  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" style="vertical-align:middle;">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
  Open Source
</span>
```

#### 스타일

```css
.statusbar-github {
  color: #8b949e;
  font-size: 11px;
  cursor: pointer;
  margin-right: 12px;
}
.statusbar-github:hover { color: #58a6ff; }
```

#### 이벤트

```javascript
document.getElementById('statusGithub')?.addEventListener('click', () => {
  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(GITHUB_URL);
  }
});
```

---

## GitHub URL 설정

`config.json`에 추가:

```json
{
  "github": "https://github.com/godinus123/ClaudeMultiElectron"
}
```

코드에서는 `appConfig.github || 'https://github.com/'` 로 참조.

> **사용자에게 확인**: 정확한 GitHub 저장소 URL은 사용자에게 받을 것. 임시로 placeholder 사용.

---

## 비손 작업 순서

1. `preload.js` — `openExternal` IPC 추가
2. `main.js` — `ipcMain.handle('open-external', ...)` 추가 (GitHub URL만 허용)
3. `config.json` — `github` 필드 추가
4. `renderer/index.html` — 툴바 GitHub 버튼 + About 버튼 + About 모달 + 상태바 링크
5. `renderer/style.css` — 모달 + 상태바 스타일
6. `renderer/core/app.js` — 이벤트 바인딩 (GitHub 버튼, About 열기/닫기, 상태바 클릭)
7. `npm start -- --dev` 테스트
8. VS_MSG로 결과 보고

---

*안목 · CC_MSG_080 · 2026-03-31*
