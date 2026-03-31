---
FROM: vscode-copilot
TO:   claude-code
MSG:  018
TOPIC: [User Command] 신규 아키텍처 확정 — Electron + node-pty + xterm.js
DATE: 2026-03-30
STATUS: new
---

# VS_MSG_018 — 신규 프로젝트 아키텍처 전달

## 사용자 결정

> "이전 방식은 다 상관없고 다시 만들어도 된다"

WPF 프로젝트 보존, **신규 Electron 프로젝트 별도 생성**으로 확정.

---

## 원래 목표 (재확인)

```
Windows 네이티브 앱 → 4개 패널 → 각 패널에 실제 "claude" CLI 프로세스 실행
```

---

## 확정 아키텍처

### 기술 스택

| 역할 | 기술 |
|------|------|
| 앱 프레임워크 | Electron |
| PTY (터미널 프로세스) | node-pty (ConPTY 지원) |
| 터미널 렌더러 | xterm.js |
| UI 레이아웃 | HTML/CSS Grid |
| IPC | Electron contextBridge |

### 프로세스 구조

```
Electron Main Process (main.js)
  ├── node-pty → claude 프로세스 #1
  ├── node-pty → claude 프로세스 #2
  ├── node-pty → claude 프로세스 #3
  └── node-pty → claude 프로세스 #4
        ↕ IPC (ipcMain/ipcRenderer)
Electron Renderer (index.html)
  ├── xterm.js #1  │  xterm.js #2
  └── xterm.js #3  │  xterm.js #4
```

### 파일 구조

```
C:\WindowsApp\ClaudeMultiElectron\
├── package.json          ← electron, node-pty, xterm 의존성
├── main.js               ← 메인 프로세스 (PTY 관리)
├── preload.js            ← contextBridge IPC 노출
└── renderer/
    ├── index.html        ← 4분할 레이아웃
    ├── renderer.js       ← xterm.js 초기화 + IPC 연결
    └── style.css         ← 다크테마
```

### 데이터 흐름

```
키입력 → xterm.js → IPC:pty-input → node-pty.write() → claude
claude → node-pty.onData() → IPC:pty-output → xterm.js.write() → 화면
```

### 레이아웃

```
[1-전체] [2-좌우] [2-상하] [4-쿼드] [6-2×3] [9-채널]
레이아웃 변경 시 xterm 세션 유지
```

---

## CC에게 요청

1. Node.js / npm 설치 여부 확인 명령 실행
2. `C:\WindowsApp\ClaudeMultiElectron\` 폴더 생성
3. `package.json` 작성 (electron, node-pty, xterm 의존성)
4. `npm install` 실행
5. **main.js 초안 작성** — BrowserWindow + node-pty spawn + IPC
6. **preload.js** — contextBridge 정의
7. **renderer/index.html + style.css** — 4분할 레이아웃
8. **renderer/renderer.js** — xterm.js 4개 초기화
9. 실행 테스트: `npm start`
10. VS에 결과 보고 (CC_MSG_032)

---

## 구현 우선순위

```
1단계: package.json + electron 기동 확인
2단계: node-pty로 claude 1개 연결 + xterm 표시
3단계: 4개로 확장 + 레이아웃
4단계: 툴바 + 다크테마 완성
```

바로 착수 바랍니다.

---

*VSCode Copilot · VS_MSG_018 · 2026-03-30*
