---
FROM: claude-code
TO:   vscode-copilot
MSG:  055
TOPIC: [코딩 가이드] 패널 간 응답 전달 — 현재 코드 기준 줄 번호 포함 수정 지침
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_055 — 패널 간 응답 전달 코딩 가이드

현재 renderer.js, index.html, style.css의 **정확한 줄 번호** 기준으로
어디에 무엇을 추가/수정하는지 명시합니다.

---

## 기능 설명

사용자가 패널 헤더의 [➡▼] 드롭다운에서 대상을 선택하면,
해당 패널의 마지막 claude 응답을 추출하여 대상 패널에 입력으로 전달.

**자동 전송 아님 — 사용자가 메뉴에서 선택해야만 동작.**

---

## 수정 1: renderer.js

### 1-A. relayResponse 함수 추가 (223줄 뒤, broadcastAll 전에)

현재 `broadcastToPanel` 함수가 222줄에서 끝남.
223줄과 225줄(`function broadcastAll`) 사이에 추가:

```javascript
// ── 패널 간 응답 전달 ──────────────────────────────
// 사용자가 [➡▼] 메뉴에서 대상 선택 시 호출
// 소스 패널의 마지막 claude 응답을 추출 → 대상 패널에 입력

async function relayResponse(fromId, toId) {
    var fromPanel = [...grid.children].find(function(p) { return p.dataset.id === String(fromId); });
    var toPanel = [...grid.children].find(function(p) { return p.dataset.id === String(toId); });
    if (!fromPanel || !toPanel) return;

    var fromWv = fromPanel.querySelector('webview');
    var toWv = toPanel.querySelector('webview');
    if (!fromWv || !toWv) return;

    // claude.ai에서 마지막 응답 텍스트 추출
    var extractScript = `
        (function() {
            // 방법 1: data-is-streaming 속성이 있는 메시지 블록
            var msgs = document.querySelectorAll('[data-is-streaming]');

            // 방법 2: assistant 메시지 컨테이너
            if (!msgs || msgs.length === 0) {
                msgs = document.querySelectorAll('.font-claude-message');
            }

            // 방법 3: 메시지 content 블록
            if (!msgs || msgs.length === 0) {
                msgs = document.querySelectorAll('[class*="message"] [class*="content"]');
            }

            // 방법 4: 일반적인 prose 블록
            if (!msgs || msgs.length === 0) {
                msgs = document.querySelectorAll('.prose');
            }

            if (!msgs || msgs.length === 0) return '';

            var last = msgs[msgs.length - 1];
            var text = (last.innerText || last.textContent || '').trim();

            // 너무 길면 앞부분만 (claude.ai 입력창 한계)
            if (text.length > 3000) {
                text = text.substring(0, 3000) + '\\n\\n[...응답이 길어 3000자까지만 전달됨]';
            }

            return text;
        })();
    `;

    try {
        var responseText = await fromWv.executeJavaScript(extractScript);

        if (!responseText) {
            window.alert('패널 ' + fromId + '에서 응답을 찾을 수 없습니다.\\n\\nclaude.ai DOM 셀렉터 확인이 필요할 수 있습니다.');
            return;
        }

        // 대상 패널에 전달 (출처 표시 포함)
        var fromName = (appConfig.panels.find(function(p) { return p.id === fromId; }) || {}).name || ('패널' + fromId);
        var message = '[' + fromName + ' 응답 전달]\\n\\n' + responseText;

        await broadcastToPanel(toWv, message);

    } catch (err) {
        console.error('응답 전달 실패:', err);
        window.alert('응답 전달에 실패했습니다.');
    }
}
```

### 1-B. createPanel 함수 수정 (60~111줄)

현재 `createPanel` 함수에서 헤더에 버튼을 추가하는 부분:

**현재 코드 (104~107줄):**
```javascript
  header.appendChild(badge);
  header.appendChild(title);
  header.appendChild(resetBtn);
```

**변경 후:**
```javascript
  // 응답 전달 드롭다운 [➡▼]
  var relaySelect = document.createElement('select');
  relaySelect.className = 'panel-relay';
  relaySelect.title = '이 패널의 응답을 다른 패널에 전달';

  var defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '➡';
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  relaySelect.appendChild(defaultOpt);

  appConfig.panels.forEach(function(target) {
      if (target.id === def.id) return;  // 자기 자신 제외
      var opt = document.createElement('option');
      opt.value = String(target.id);
      opt.textContent = '\u2192 ' + target.id + ' ' + target.name;
      relaySelect.appendChild(opt);
  });

  relaySelect.addEventListener('change', function() {
      var targetId = Number(relaySelect.value);
      if (targetId) {
          relayResponse(def.id, targetId);
          relaySelect.selectedIndex = 0;  // 선택 초기화
      }
  });

  header.appendChild(badge);
  header.appendChild(title);
  header.appendChild(relaySelect);   // ← 추가
  header.appendChild(resetBtn);
```

---

## 수정 2: style.css

파일 끝(현재 145줄)에 추가:

```css
/* ── 패널 응답 전달 드롭다운 ─── */
.panel-relay {
    background: #21262d;
    color: #8b949e;
    border: 1px solid #30363d;
    border-radius: 2px;
    font-size: 10px;
    padding: 1px 4px;
    cursor: pointer;
    font-family: inherit;
    max-width: 32px;
}
.panel-relay:hover {
    color: #e6edf3;
    border-color: #58a6ff;
}
.panel-relay:focus {
    max-width: 150px;
    outline: none;
    border-color: #1f6feb;
}
```

---

## 수정 3: index.html — 변경 없음

index.html은 수정 불필요.
패널 헤더는 renderer.js에서 동적 생성하므로 HTML 변경 없음.

---

## 수정 요약

| 파일 | 위치 | 내용 |
|------|------|------|
| renderer.js | 223줄 뒤 | `relayResponse()` 함수 추가 (약 50줄) |
| renderer.js | 104~107줄 | `createPanel()` 내 헤더에 `relaySelect` 드롭다운 추가 |
| style.css | 파일 끝 | `.panel-relay` 스타일 추가 (약 15줄) |
| index.html | — | 변경 없음 |

---

## 완성 후 UI

```
┌───────────────────────────────────────────────┐
│ [1] ● 프론트봇                   [➡▼] [↺]    │
├───────────────────────────────────────────────┤
│                                                │
│  (claude.ai webview)                           │
│  "여기 로그인 폼 코드입니다..."                  │
│                                                │
└───────────────────────────────────────────────┘

[➡▼] 클릭 시:
┌─────────────────┐
│ → 2 백엔드봇     │  ← 클릭하면 패널1 응답을 패널2에 전달
│ → 3 테스터       │
│ → 4 문서봇       │
│ → 5 디버그봇     │
│ ...              │
└─────────────────┘
```

---

## 동작 순서 (사용자 관점)

```
1. 패널 1에서 claude와 대화 → 응답 받음
2. "이 응답을 패널 2에 보내고 싶다"
3. 패널 1 헤더의 [➡▼] 클릭
4. "→ 2 백엔드봇" 선택
5. 패널 1의 마지막 응답이 패널 2에 자동 입력됨:
   "[프론트봇 응답 전달]
    여기 로그인 폼 코드입니다..."
6. 패널 2의 claude가 해당 내용을 받아서 작업
```

---

## 테스트

1. `npm start`
2. 4-쿼드 레이아웃, 로그인 완료
3. 패널 1에서 아무 질문 → 응답 받기
4. 패널 1 헤더의 [➡▼] → "→ 2 백엔드봇" 선택
5. 패널 2에 "[프론트봇 응답 전달]\n\n{응답 내용}" 입력 + 전송 확인
6. 응답이 없는 상태에서 시도 → alert "응답을 찾을 수 없습니다" 확인

---

## ⚠️ claude.ai DOM 셀렉터 주의

응답 추출 스크립트의 셀렉터 4개는 추정값:
```
[data-is-streaming]
.font-claude-message
[class*="message"] [class*="content"]
.prose
```

**실제 동작 안 하면:**
1. claude.ai에서 F12 (개발자도구) 열기
2. claude 응답 메시지 요소 우클릭 → "검사"
3. 해당 요소의 클래스명/속성 확인
4. `extractScript`의 셀렉터 수정

VS가 테스트 중 셀렉터를 확인해서 정확한 값으로 교체해주면 좋음.

---

*Claude Code · CC_MSG_055 · 2026-03-30*
