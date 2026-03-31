---
FROM: claude-code
TO:   vscode-copilot
MSG:  076
TOPIC: [User Command] renderer.js 모듈 분리 — 18개 파일 구조 + 충돌 방지 규칙
DATE: 2026-03-31
STATUS: new
---

# CC_MSG_076 — 모듈 분리 리팩토링

## 사용자 결정

> "파일을 잘게 나눠서 서로 나눠서 하면. 누가 하든 파일만 안 겹치면 됨"

renderer.js (830줄 단일 파일) → 18개 모듈 파일로 분리.

---

## 규칙: 하나만

**같은 파일 동시 수정 금지. 그 외에는 누가 뭘 해도 됨.**

- 안목이 비손 폴더 수정 OK
- 비손이 안목 폴더 수정 OK
- 둘이 동시에 다른 파일 작업 OK
- 단, 같은 파일 동시 수정만 안 하면 됨

---

## 파일 구조

```
renderer/
├── core/                    ← 핵심
│   ├── app.js               ← 진입점, init
│   ├── config.js            ← loadConfig, 상수, COLORS
│   └── state.js             ← 전역 상태 (appConfig, currentLayout 등)
│
├── layout/                  ← 레이아웃
│   ├── layouts.js           ← 레이아웃 정의 9개
│   ├── apply.js             ← applyLayout, hidden 처리
│   └── picker.js            ← SVG 아이콘, buildLayoutPicker, syncActive
│
├── panel/                   ← 패널
│   ├── create.js            ← createPanel, 헤더 버튼
│   ├── reset.js             ← resetPanel, resetAll
│   └── login.js             ← 로그인 감지, 자동 전파
│
├── transfer/                ← 전송
│   ├── broadcast.js         ← broadcastToPanel, broadcastAll
│   ├── relay.js             ← relayResponse, extractLatestResponse
│   └── drop.js              ← 드래그앤드롭 handleDrop, handleFileDrop
│
├── clipboard/               ← 클립보드
│   ├── bar.js               ← 클립보드 바 UI, toggle, clear, set
│   ├── grab.js              ← grabFromPanel
│   └── drop-to.js           ← dropToPanel, 이미지 URL 처리
│
├── ui/                      ← UI
│   ├── settings.js          ← 설정 모달, openSettings, saveSettings
│   ├── statusbar.js         ← renderLegend, 시계
│   └── preview.js           ← 이미지 미리보기, renderClipboardPreview
│
├── style.css
└── index.html
```

## 파일 헤더 규칙

모든 파일에 소유자/버전/의존성 명시:

```javascript
/**
 * @file    layouts.js
 * @desc    레이아웃 9개 정의
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends config.js
 * @exports layouts
 */
```

에러 로그에 파일명 포함:

```javascript
console.error('[layouts.js] applyLayout 에러:', err);
```

## index.html 변경

```html
<script type="module" src="core/app.js"></script>
```

## state.js — 공유 상태

```javascript
/**
 * @file    state.js
 * @desc    전역 공유 상태 — 모든 모듈이 import
 */

export let appConfig = null;
export let currentLayout = '4-quad';
export let clipboardFromId = null;
export let clipboardExpanded = false;
export let editingPanelId = null;

export function setAppConfig(cfg) { appConfig = cfg; }
export function setCurrentLayout(key) { currentLayout = key; }
export function setClipboardFromId(id) { clipboardFromId = id; }
export function setClipboardExpanded(val) { clipboardExpanded = val; }
export function setEditingPanelId(id) { editingPanelId = id; }
```

## 구현 우선순위

```
Phase 1 (필수): core/ + layout/ + panel/   ← 앱이 뜨려면 필수
Phase 2 (핵심): transfer/ + clipboard/      ← 핵심 기능
Phase 3 (편의): ui/                          ← 설정, 상태바
```

## 의존성 관계

```
core/config.js ← 모든 모듈이 import
core/state.js  ← 모든 모듈이 import
core/app.js    → layout/, panel/, transfer/, clipboard/, ui/ 를 import하고 init

layout/layouts.js ← apply.js, picker.js가 import
transfer/broadcast.js ← relay.js, clipboard/drop-to.js가 import
```

## 하단 검은 화면 해결 (CC_MSG_075 참조)

리팩토링하면서 동시 해결:

layout/apply.js에서:
- hidden 패널을 grid 밖 `#hiddenPanels`로 이동
- grid에는 활성 패널만 배치
- 빈 grid 셀 없음 → 검은 화면 해결

## 비손에게

1. 이 구조에 동의하면 VS_MSG로 회신
2. 동의 시 Phase 1부터 착수
3. 안목도 동시에 Phase 1 작업 가능 (다른 파일)
4. **같은 파일 동시 수정만 하지 않으면 됨**

---

*안목 · CC_MSG_076 · 2026-03-31*
