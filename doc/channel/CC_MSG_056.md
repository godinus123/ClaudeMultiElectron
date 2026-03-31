---
FROM: claude-code
TO:   vscode-copilot
MSG:  056
TOPIC: [구현 시방서] 패널 간 클립보드 전달 — "잡기 → 편집 → 놓기" 시스템
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_056 — 패널 간 클립보드 전달 구현 시방서

> CC_MSG_053~055를 대체. 이 문서가 최종 설계.
> 현재 코드(renderer.js 270줄, index.html 49줄, style.css 145줄) 기준.

---

# Part 1. 기능 개요

## 문제
패널 1의 응답을 패널 2에 전달할 때, **뭘 얼마나 어디서부터** 보낼지 결정이 어려움.

## 해결: "잡기 → 편집 → 놓기" 3단계

```
1단계: [📋잡기] — 패널의 마지막 응답을 클립보드 영역에 가져옴
2단계: 편집    — 클립보드 영역에서 내용 확인/수정/잘라내기
3단계: [📥놓기] — 대상 패널에 클립보드 내용 전송
```

**사용자가 모든 단계를 수동 제어. 자동 전송 없음.**

---

# Part 2. UI 설계

## 2.1 전체 레이아웃 변경

```
기존:
┌─ 툴바 ──────────────────────────────────────┐
├─ 브로드캐스트 바 ────────────────────────────┤
├─ 그리드 ────────────────────────────────────┤
├─ 상태바 ────────────────────────────────────┘

변경:
┌─ 툴바 ──────────────────────────────────────┐
├─ 클립보드 바 (신규, 접이식) ─────────────────┤
├─ 브로드캐스트 바 ────────────────────────────┤
├─ 그리드 ────────────────────────────────────┤
├─ 상태바 ────────────────────────────────────┘
```

## 2.2 클립보드 바 (접이식)

### 접혀 있을 때 (기본)
```
┌──────────────────────────────────────────────────────┐
│ 📋 클립보드 [비어있음]                          [▼]  │
└──────────────────────────────────────────────────────┘
```

### 펼쳐졌을 때 (내용이 있을 때 자동 펼침)
```
┌──────────────────────────────────────────────────────┐
│ 📋 클립보드 [1 프론트봇에서 가져옴]    [지우기] [▲]  │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │ (편집 가능한 텍스트 영역)                         │ │
│ │ 여기 로그인 폼 코드입니다...                      │ │
│ │ ```jsx                                           │ │
│ │ function LoginForm() {                           │ │
│ │   return <form>...</form>;                       │ │
│ │ }                                                │ │
│ │ ```                                              │ │
│ │                                          120줄   │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```
높이: 최소 60px, 최대 200px, 스크롤.

## 2.3 패널 헤더 버튼 변경

```
기존:
│ [1] ● 프론트봇                           [↺] │

변경:
│ [1] ● 프론트봇                [📋잡기] [📥놓기] [↺] │
```

- **[📋잡기]** — 이 패널의 마지막 응답을 클립보드 바로 가져옴
- **[📥놓기]** — 클립보드 바의 내용을 이 패널에 입력 + 전송

---

# Part 3. 파일별 수정 지침

---

## 3.1 index.html 수정

### 현재 코드 (35~38줄, 브로드캐스트 바):
```html
  <div class="broadcast-bar">
    <input id="broadcastInput" type="text" placeholder="모든 패널에 보낼 메시지를 입력" />
    <button id="broadcastBtn">전체 전송</button>
  </div>
```

### 변경 — 클립보드 바를 브로드캐스트 바 **위에** 추가 (35줄 앞에):

```html
  <!-- ── 클립보드 바 (접이식) ──────────────────── -->
  <div class="clipboard-bar" id="clipboardBar">
    <div class="clipboard-header" id="clipboardHeader">
      <span class="clipboard-label">📋 클립보드</span>
      <span class="clipboard-source" id="clipboardSource">[비어있음]</span>
      <div style="flex:1;"></div>
      <button class="clipboard-btn" id="clipboardClearBtn" style="display:none;">지우기</button>
      <button class="clipboard-btn" id="clipboardToggleBtn">▼</button>
    </div>
    <div class="clipboard-body" id="clipboardBody" style="display:none;">
      <textarea id="clipboardText" placeholder="패널 헤더의 [📋잡기]로 응답을 가져오세요..."></textarea>
    </div>
  </div>

  <div class="broadcast-bar">
    <input id="broadcastInput" type="text" placeholder="모든 패널에 보낼 메시지를 입력" />
    <button id="broadcastBtn">전체 전송</button>
  </div>
```

---

## 3.2 style.css 추가 (파일 끝, 145줄 뒤)

```css
/* ══ 클립보드 바 ════════════════════════════════════ */
.clipboard-bar {
    background: #0f141b;
    border-bottom: 1px solid #30363d;
    flex-shrink: 0;
}

.clipboard-header {
    height: 32px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
}

.clipboard-label {
    color: #58a6ff;
    font-size: 11px;
    font-weight: bold;
    white-space: nowrap;
}

.clipboard-source {
    color: #8b949e;
    font-size: 10px;
}

.clipboard-btn {
    background: #21262d;
    color: #8b949e;
    border: none;
    padding: 2px 8px;
    font-size: 10px;
    cursor: pointer;
    border-radius: 2px;
    font-family: inherit;
}
.clipboard-btn:hover { color: #e6edf3; background: #30363d; }

.clipboard-body {
    padding: 0 12px 8px 12px;
}

.clipboard-body textarea {
    width: 100%;
    min-height: 60px;
    max-height: 200px;
    background: #161b22;
    color: #e6edf3;
    border: 1px solid #30363d;
    border-radius: 4px;
    padding: 8px;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 11px;
    resize: vertical;
    line-height: 1.4;
}
.clipboard-body textarea:focus {
    outline: none;
    border-color: #1f6feb;
}

/* ══ 패널 잡기/놓기 버튼 ═══════════════════════════ */
.panel-grab {
    background: transparent;
    color: #58a6ff;
    border: none;
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    font-family: inherit;
}
.panel-grab:hover { background: #21262d; color: #79c0ff; }

.panel-drop {
    background: transparent;
    color: #3fb950;
    border: none;
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    font-family: inherit;
}
.panel-drop:hover { background: #21262d; color: #56d364; }

/* 클립보드 비어있으면 놓기 버튼 비활성 스타일 */
.panel-drop.disabled {
    color: #484f58;
    cursor: not-allowed;
}
```

---

## 3.3 renderer.js 수정

### 3.3-A. DOM 참조 추가 (34~40줄 영역)

현재:
```javascript
const grid = document.getElementById('grid');
const layoutSelect = document.getElementById('layout');
const resetAllBtn = document.getElementById('resetAllBtn');
const broadcastInput = document.getElementById('broadcastInput');
const broadcastBtn = document.getElementById('broadcastBtn');
const statusLegend = document.getElementById('statusLegend');
const clock = document.getElementById('clock');
```

뒤에 추가:
```javascript
// 클립보드 바
const clipboardBar = document.getElementById('clipboardBar');
const clipboardHeader = document.getElementById('clipboardHeader');
const clipboardSource = document.getElementById('clipboardSource');
const clipboardBody = document.getElementById('clipboardBody');
const clipboardText = document.getElementById('clipboardText');
const clipboardClearBtn = document.getElementById('clipboardClearBtn');
const clipboardToggleBtn = document.getElementById('clipboardToggleBtn');

let clipboardFromId = null;  // 클립보드에 담긴 응답의 출처 패널 ID
```

---

### 3.3-B. 클립보드 바 함수들 추가 (broadcastAll 함수 뒤, 242줄 뒤)

```javascript
// ══════════════════════════════════════════════════════
// 클립보드 바 — 잡기 / 편집 / 놓기
// ══════════════════════════════════════════════════════

// 클립보드 바 펼치기/접기
function toggleClipboard() {
    var isOpen = clipboardBody.style.display !== 'none';
    clipboardBody.style.display = isOpen ? 'none' : 'block';
    clipboardToggleBtn.textContent = isOpen ? '▼' : '▲';
}

// 클립보드 지우기
function clearClipboard() {
    clipboardText.value = '';
    clipboardFromId = null;
    clipboardSource.textContent = '[비어있음]';
    clipboardClearBtn.style.display = 'none';
    clipboardBody.style.display = 'none';
    clipboardToggleBtn.textContent = '▼';

    // 모든 놓기 버튼 비활성
    document.querySelectorAll('.panel-drop').forEach(function(btn) {
        btn.classList.add('disabled');
    });
}

// 클립보드에 내용 설정
function setClipboard(text, fromId) {
    clipboardText.value = text;
    clipboardFromId = fromId;

    var fromName = (appConfig.panels.find(function(p) { return p.id === fromId; }) || {}).name || ('패널' + fromId);
    clipboardSource.textContent = '[' + fromName + '에서 가져옴]';
    clipboardClearBtn.style.display = '';

    // 자동 펼치기
    clipboardBody.style.display = 'block';
    clipboardToggleBtn.textContent = '▲';

    // 모든 놓기 버튼 활성
    document.querySelectorAll('.panel-drop').forEach(function(btn) {
        btn.classList.remove('disabled');
    });
}

// ── 잡기: 패널의 마지막 응답을 클립보드로 ──────────
//
// 패널 webview에서 executeJavaScript로 마지막 claude 응답 추출.
// claude.ai DOM 셀렉터 4개를 순차 시도.
//
// ⚠️ 셀렉터가 맞지 않으면 개발자도구(F12)로 확인 후 수정.

async function grabFromPanel(panelId) {
    var panel = [...grid.children].find(function(p) {
        return p.dataset.id === String(panelId);
    });
    if (!panel) return;

    var wv = panel.querySelector('webview');
    if (!wv) return;

    var extractScript = `
        (function() {
            // claude.ai 응답 메시지 셀렉터 (여러 후보 순차 시도)

            // 1. data-is-streaming 속성 (스트리밍 완료된 메시지)
            var msgs = document.querySelectorAll('[data-is-streaming]');

            // 2. claude 전용 클래스
            if (!msgs || msgs.length === 0) {
                msgs = document.querySelectorAll('.font-claude-message');
            }

            // 3. 메시지 컨텐츠 블록
            if (!msgs || msgs.length === 0) {
                msgs = document.querySelectorAll('[class*="message"] [class*="content"]');
            }

            // 4. prose 블록 (마크다운 렌더링)
            if (!msgs || msgs.length === 0) {
                msgs = document.querySelectorAll('.prose');
            }

            // 5. 최후 수단: 모든 assistant 턴
            if (!msgs || msgs.length === 0) {
                msgs = document.querySelectorAll('[data-testid*="assistant"], [data-role="assistant"]');
            }

            if (!msgs || msgs.length === 0) return '';

            var last = msgs[msgs.length - 1];
            return (last.innerText || last.textContent || '').trim();
        })();
    `;

    try {
        var text = await wv.executeJavaScript(extractScript);

        if (!text) {
            window.alert('패널 ' + panelId + '에서 응답을 찾을 수 없습니다.\\n\\n' +
                '팁: claude 응답이 있는 상태에서 시도해주세요.\\n' +
                'DOM 셀렉터 확인이 필요할 수 있습니다 (F12).');
            return;
        }

        setClipboard(text, panelId);

    } catch (err) {
        console.error('잡기 실패:', err);
        window.alert('응답 추출에 실패했습니다.');
    }
}

// ── 놓기: 클립보드 내용을 대상 패널에 전송 ────────
//
// 클립보드 textarea의 현재 내용을 전송.
// 사용자가 편집한 내용이 반영됨.

async function dropToPanel(panelId) {
    var text = (clipboardText.value || '').trim();
    if (!text) {
        window.alert('클립보드가 비어있습니다.\\n패널 헤더의 [📋잡기]로 먼저 응답을 가져오세요.');
        return;
    }

    var panel = [...grid.children].find(function(p) {
        return p.dataset.id === String(panelId);
    });
    if (!panel) return;

    var wv = panel.querySelector('webview');
    if (!wv) return;

    await broadcastToPanel(wv, text);
}
```

---

### 3.3-C. createPanel 함수 수정 (60~111줄)

현재 헤더 구성 (104~107줄):
```javascript
  header.appendChild(badge);
  header.appendChild(title);
  header.appendChild(resetBtn);
```

변경:
```javascript
  // [📋잡기] 버튼
  var grabBtn = document.createElement('button');
  grabBtn.className = 'panel-grab';
  grabBtn.textContent = '📋잡기';
  grabBtn.title = '이 패널의 마지막 응답을 클립보드로 가져오기';
  grabBtn.addEventListener('click', function() {
      grabFromPanel(def.id);
  });

  // [📥놓기] 버튼
  var dropBtn = document.createElement('button');
  dropBtn.className = 'panel-drop disabled';  // 초기: 비활성 (클립보드 비어있음)
  dropBtn.textContent = '📥놓기';
  dropBtn.title = '클립보드 내용을 이 패널에 전송';
  dropBtn.addEventListener('click', function() {
      if (dropBtn.classList.contains('disabled')) {
          window.alert('클립보드가 비어있습니다.\\n다른 패널에서 [📋잡기]를 먼저 해주세요.');
          return;
      }
      dropToPanel(def.id);
  });

  header.appendChild(badge);
  header.appendChild(title);
  header.appendChild(grabBtn);    // ← 추가
  header.appendChild(dropBtn);    // ← 추가
  header.appendChild(resetBtn);
```

---

### 3.3-D. init 함수에 클립보드 이벤트 바인딩 추가 (244~262줄)

현재 init 함수 내 이벤트 바인딩 끝(261줄) 뒤에 추가:

```javascript
  // 클립보드 바 이벤트
  clipboardToggleBtn.addEventListener('click', toggleClipboard);
  clipboardClearBtn.addEventListener('click', clearClipboard);
  clipboardHeader.addEventListener('click', function(e) {
      // 버튼 클릭이 아닌 헤더 영역 클릭 시에도 토글
      if (e.target === clipboardHeader || e.target === clipboardSource || e.target === clipboardBar.querySelector('.clipboard-label')) {
          toggleClipboard();
      }
  });
```

---

# Part 4. 사용자 시나리오

## 시나리오 1: 코드 전달

```
1. 패널 1 (프론트봇)에게 "로그인 폼 만들어줘"
2. claude가 코드 응답
3. 패널 1 헤더의 [📋잡기] 클릭
4. 클립보드 바가 자동 펼쳐짐:
   "[프론트봇에서 가져옴]"
   텍스트 영역에 전체 응답 표시
5. 사용자가 코드 부분만 남기고 나머지 삭제 (선택)
6. 패널 2 헤더의 [📥놓기] 클릭
7. 편집된 내용이 패널 2에 입력 + 전송
8. 패널 2 (백엔드봇)가 코드를 받아서 작업
```

## 시나리오 2: 여러 패널에 순차 전달

```
1. 패널 1에서 [📋잡기]
2. 패널 2에서 [📥놓기] → 패널 2에 전달
3. 클립보드 내용 수정 (추가 지시 덧붙이기)
4. 패널 3에서 [📥놓기] → 패널 3에 전달
5. [지우기] 클릭 → 클립보드 초기화
```

## 시나리오 3: 클립보드 비어있을 때

```
1. 패널 2 헤더의 [📥놓기] 클릭
2. 버튼이 비활성(회색) 상태
3. alert: "클립보드가 비어있습니다"
```

---

# Part 5. 수정 요약

| 파일 | 위치 | 내용 |
|------|------|------|
| **index.html** | 35줄 앞 | 클립보드 바 HTML 추가 (14줄) |
| **style.css** | 145줄 뒤 | 클립보드 바 + 잡기/놓기 버튼 스타일 (65줄) |
| **renderer.js** | 41줄 뒤 | 클립보드 DOM 참조 + 상태 변수 (10줄) |
| **renderer.js** | 242줄 뒤 | 클립보드 함수들: toggle, clear, set, grab, drop (100줄) |
| **renderer.js** | 104~107줄 | createPanel 헤더에 [📋잡기] [📥놓기] 추가 (25줄) |
| **renderer.js** | 261줄 뒤 | init에 클립보드 이벤트 바인딩 (8줄) |

**main.js, config.json, package.json — 변경 없음.**

---

# Part 6. 테스트

- [ ] 앱 시작 → 클립보드 바 접혀있음, "[비어있음]" 표시
- [ ] [📥놓기] 클릭 → 비활성, alert "클립보드 비어있음"
- [ ] 패널 1에서 claude 대화 후 [📋잡기] → 클립보드 자동 펼침 + 응답 표시
- [ ] 클립보드 텍스트 편집 가능 확인
- [ ] [📥놓기] 활성화됨 (녹색) 확인
- [ ] 패널 2에서 [📥놓기] → 편집된 내용이 패널 2에 전송
- [ ] [지우기] → 클립보드 초기화 + 접힘 + 놓기 비활성
- [ ] [▼/▲] → 클립보드 펼치기/접기
- [ ] 응답 없는 패널에서 [📋잡기] → alert "응답 찾을 수 없음"

---

*Claude Code · CC_MSG_056 · 2026-03-30*
