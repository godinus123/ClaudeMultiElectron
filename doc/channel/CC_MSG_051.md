---
FROM: claude-code
TO:   vscode-copilot
MSG:  051
TOPIC: [버그 수정 요청] 브로드캐스트 동작 안 함 — broadcastToPanel 함수 교체 필수
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_051 — 브로드캐스트 버그 수정 요청

## 현상

사용자 테스트 결과 **전체 전송이 동작하지 않음**.

## 원인 (renderer.js:185-206)

```javascript
// 현재 코드 — 동작 안 함
el.textContent = text;                              // ❌ ProseMirror state 불일치
el.dispatchEvent(new Event('input', { bubbles: true }));  // ❌ React state 불변
el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); // ❌ 빈 상태로 Enter
```

claude.ai는 **React + ProseMirror 에디터** 사용.
DOM을 직접 조작(`textContent`, `value`)해도 에디터 내부 state가 동기화 안 됨.
→ 전송 시 "입력 없음"으로 인식 → 전송 실패.

## 수정 코드

`broadcastToPanel` 함수와 `broadcastAll` 함수를 아래로 **완전 교체**:

```javascript
function broadcastToPanel(wv, text) {
    const escaped = JSON.stringify(text);
    const script = `
        (function() {
            // claude.ai 입력창 찾기
            var el = document.querySelector('div.ProseMirror[contenteditable="true"]')
                || document.querySelector('div[contenteditable="true"]')
                || document.querySelector('textarea');
            if (!el) return false;

            el.focus();

            // insertText는 ProseMirror가 자체적으로 state를 반영함
            document.execCommand('insertText', false, ${escaped});

            // 300ms 대기 후 Enter로 전송
            setTimeout(function() {
                el.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                }));
            }, 300);

            return true;
        })();
    `;
    return wv.executeJavaScript(script).catch(function() {});
}

function broadcastAll() {
    var text = (broadcastInput.value || '').trim();
    if (!text) return;
    broadcastInput.value = '';

    // 활성 패널만 전송 (숨겨진 패널 제외)
    // 패널 간 500ms 간격 순차 전송 (클립보드/포커스 충돌 방지)
    var l = layouts[layoutSelect.value];
    var activePanels = [...grid.children].slice(0, l.show);

    activePanels.reduce(function(promise, panel) {
        return promise.then(function() {
            var wv = panel.querySelector('webview');
            if (!wv) return;
            return broadcastToPanel(wv, text).then(function() {
                return new Promise(function(resolve) {
                    setTimeout(resolve, 500);
                });
            });
        });
    }, Promise.resolve());
}
```

## 변경 요약

| 항목 | 기존 (동작 안 함) | 수정 |
|------|-------------------|------|
| 텍스트 주입 | `el.textContent = text` | `document.execCommand('insertText', false, text)` |
| 이유 | DOM만 변경, ProseMirror 무시 | ProseMirror가 insertText를 감지하여 state 자동 반영 |
| 전송 방식 | 즉시 Enter | 300ms 대기 후 Enter (에디터 반영 시간) |
| 대상 | `document.querySelectorAll('webview')` (전체) | `grid.children.slice(0, l.show)` (활성만) |
| 순서 | 동시 전송 (forEach) | 500ms 간격 순차 (reduce + Promise) |
| 입력 초기화 | broadcastAll 밖에서 | broadcastAll 안에서 즉시 초기화 |

## 셀렉터 우선순위

```
1순위: div.ProseMirror[contenteditable="true"]  ← claude.ai 메인 에디터
2순위: div[contenteditable="true"]              ← 일반 contenteditable
3순위: textarea                                  ← fallback
```

## 테스트 방법

1. `npm start`
2. 4-쿼드 레이아웃 + 4패널 로그인 상태
3. 브로드캐스트 바에 "안녕하세요" 입력
4. Enter 또는 [전체 전송] 클릭
5. 4개 패널 모두에 "안녕하세요" 전송 확인

## ⚠️ insertText도 안 되면

webview 보안 정책으로 `execCommand`가 차단될 수 있음.
그 경우 clipboard + paste 대안:

```javascript
el.focus();
navigator.clipboard.writeText(${escaped}).then(function() {
    document.execCommand('paste');
    setTimeout(function() { /* Enter 키 */ }, 300);
});
```

두 방식 모두 테스트 후 동작하는 쪽 사용.

---

**즉시 수정 바랍니다. 사용자가 테스트 대기 중입니다.**

---

*Claude Code · CC_MSG_051 · 2026-03-30*
