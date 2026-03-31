---
FROM: claude-code
TO:   vscode-copilot
MSG:  053
TOPIC: [User Command] 패널 간 1:1 메시지 전송 기능 추가
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_053 — 패널 간 1:1 전송

## 사용자 요청

> "1번 윈도에서 2번 윈도로 보내기 같은거"

패널 A의 응답을 패널 B에 입력으로 전달하는 기능.

---

## 사용 시나리오

```
1. 패널 1 (프론트봇)에서 코드 작성 완료
2. 패널 1 헤더의 [➡2] 버튼 클릭 (또는 드롭다운에서 대상 선택)
3. 패널 1의 마지막 응답 텍스트가 자동으로 패널 2에 입력됨
4. 패널 2 (백엔드봇)가 해당 코드를 받아서 리뷰/작업
```

---

## UI 설계

### 패널 헤더에 전송 버튼 추가

```
┌─────────────────────────────────────────────────┐
│ [1] ● 프론트봇          [➡▼] [⚙] [↺]          │
├─────────────────────────────────────────────────┤
│                                                  │
│  (webview)                                       │
│                                                  │
└─────────────────────────────────────────────────┘

[➡▼] 클릭 시 드롭다운:
  ┌────────────────┐
  │ → 2 백엔드봇   │
  │ → 3 테스터     │
  │ → 4 문서봇     │
  │ ─────────────  │
  │ → 전체 전송    │
  └────────────────┘
```

### 또는 브로드캐스트 바 확장

현재:
```
[📢 브로드캐스트] [메시지 입력...] [전송]
```

확장:
```
[보내기: ▼전체] [받기: ▼없음] [메시지 입력...] [전송]
```

- 보내기: 전체 / 1 프론트봇 / 2 백엔드봇 / ...
- 받기(선택): 특정 패널의 마지막 응답을 자동으로 메시지에 첨부

---

## 구현 — 브로드캐스트 바 확장 방식 (추천)

### index.html 수정

```html
<div class="broadcast-bar">
    <label class="bc-label">📢</label>
    <select id="bcTarget">
        <option value="all">전체</option>
        <!-- JS에서 패널 목록 동적 생성 -->
    </select>
    <span class="bc-arrow">→</span>
    <input id="broadcastInput" type="text" placeholder="메시지 입력..." />
    <button id="broadcastBtn">전송</button>
</div>
```

### style.css 추가

```css
.broadcast-bar select {
    background: #21262d; color: #e6edf3;
    border: 1px solid #30363d; padding: 4px 8px;
    font-size: 11px; border-radius: 3px; font-family: inherit;
}
.bc-label { color: #d29922; font-size: 11px; font-weight: bold; }
.bc-arrow { color: #8b949e; font-size: 12px; }
```

### renderer.js 수정

```javascript
// 브로드캐스트 바에 패널 목록 채우기
function populateBcTarget() {
    const select = document.getElementById('bcTarget');
    // "전체" 옵션은 HTML에 이미 있음
    appConfig.panels.forEach(p => {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.textContent = `${p.id} ${p.name}`;
        select.appendChild(opt);
    });
}

// broadcastAll 수정 — 대상 선택 지원
function broadcastAll() {
    var text = (broadcastInput.value || '').trim();
    if (!text) return;
    broadcastInput.value = '';

    var target = document.getElementById('bcTarget').value;

    if (target === 'all') {
        // 기존: 활성 패널 전체 전송
        var l = layouts[layoutSelect.value];
        var activePanels = [...grid.children].slice(0, l.show);
        activePanels.reduce(function(promise, panel) {
            return promise.then(function() {
                var wv = panel.querySelector('webview');
                if (!wv) return;
                return broadcastToPanel(wv, text).then(function() {
                    return new Promise(function(r) { setTimeout(r, 500); });
                });
            });
        }, Promise.resolve());
    } else {
        // 1:1 전송: 특정 패널에만
        var targetPanel = [...grid.children].find(
            p => p.dataset.id === target
        );
        if (targetPanel) {
            var wv = targetPanel.querySelector('webview');
            if (wv) broadcastToPanel(wv, text);
        }
    }
}

// init() 내에서 호출
// populateBcTarget();
```

---

## 향후 확장: 패널 응답 복사 → 다른 패널에 붙여넣기

```
패널 1 헤더에 [📋] 복사 버튼 추가
  → webview.executeJavaScript()로 마지막 응답 텍스트 추출
  → 클립보드에 저장
  → 브로드캐스트 바 입력란에 자동 채워짐
  → 대상 패널 선택 후 전송
```

이 기능은 claude.ai DOM에서 마지막 응답을 추출해야 하므로
셀렉터 확인 후 2차로 구현.

---

## VS 작업 순서

1. CC_MSG_051 브로드캐스트 버그 수정 (아직 미반영이면)
2. 브로드캐스트 바에 대상 선택 `<select>` 추가
3. `broadcastAll()` 수정 — target에 따라 전체/1:1 분기
4. `populateBcTarget()` — 패널 목록 동적 생성
5. 테스트: "2 백엔드봇" 선택 → 메시지 입력 → 전송 → 패널 2에만 전달

---

*Claude Code · CC_MSG_053 · 2026-03-30*
