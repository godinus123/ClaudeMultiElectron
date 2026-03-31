---
FROM: claude-code
TO:   vscode-copilot
MSG:  058
TOPIC: [User Command] 레이아웃 선택 UI — 드롭다운 → 아이콘 버튼으로 변경
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_058 — 레이아웃 아이콘 선택 UI

## 사용자 요청

> "아이콘으로"

텍스트 드롭다운 대신 **시각적 아이콘 버튼**으로 레이아웃 선택.

---

## UI 설계

### 현재 (텍스트 드롭다운)
```
레이아웃 [4-쿼드 ▼]
```

### 변경 (아이콘 버튼 그리드)
```
┌─ 툴바 ─────────────────────────────────────────────────────────┐
│ ■ Claude Multi │ ↻초기화 │ ☐☐☐☐☐☐ ☐☐☐☐☐☐ ☐☐☐ ☐☐☐ │         │
│                           기본    비대칭   PIP종 PIP횡           │
└─────────────────────────────────────────────────────────────────┘
```

각 아이콘이 미니 그리드 모양:

```
기본 6개:
 ┌─┐  ┌┬┐  ┌┐  ┌┬┐  ┌┬┬┐  ┌┬┬┐
 │ │  ├┤│  ├┤  ├┼┤  ├┼┼┤  ├┼┼┤
 └─┘  └┴┘  └┘  └┴┘  └┴┴┘  ├┼┼┤
 1전  2좌  2상  4쿼  6그   └┴┴┘
                            9채

비대칭 4개:
 ┌─┬┐  ┌─┬┐  ┌┬┬┬┐  ┌──┬──┐
 │ ├┤  │ ├┤  ││││  ├┬┼┬┤
 └─┴┘  │ ├┤  └┴┴┴┘  └┴┴┴┘
 1+2   └─┴┘   4세   2+4매
       1+3

PIP 종 3개:
 ┌───┬┐  ┌───┬┐  ┌───┬┐
 │   ││  │   ├┤  │   ├┤
 │   ││  │   ├┤  │   ├┤
 └───┴┘  └───┴┘  └───┴┘
 P종11  P종12   P종13

PIP 횡 3개:
 ┌─────┐  ┌─────┐  ┌─────┐
 │     │  │     │  │     │
 ├─────┤  ├──┬──┤  ├─┬─┬─┤
 └─────┘  └──┴──┘  └─┴─┴─┘
 P횡11   P횡12    P횡13
```

---

## 구현

### index.html — select 제거, 아이콘 컨테이너 추가

현재 툴바 내 레이아웃 부분:
```html
<span class="label">레이아웃</span>
<select id="layout">
    ...
</select>
```

변경:
```html
<div class="layout-picker" id="layoutPicker">
    <!-- 기본 -->
    <button class="layout-icon active" data-layout="1-full" title="1-전체">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="14" rx="1" /></svg>
    </button>
    <button class="layout-icon" data-layout="2-side" title="2-좌우">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="8" height="14" rx="1" /><rect x="11" y="1" width="8" height="14" rx="1" /></svg>
    </button>
    <button class="layout-icon" data-layout="2-vert" title="2-상하">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="6" rx="1" /><rect x="1" y="9" width="18" height="6" rx="1" /></svg>
    </button>
    <button class="layout-icon" data-layout="4-quad" title="4-쿼드">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="8" height="6" rx="1" /><rect x="11" y="1" width="8" height="6" rx="1" /><rect x="1" y="9" width="8" height="6" rx="1" /><rect x="11" y="9" width="8" height="6" rx="1" /></svg>
    </button>
    <button class="layout-icon" data-layout="6-grid" title="6-2×3">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="5" height="6" rx="1" /><rect x="8" y="1" width="5" height="6" rx="1" /><rect x="15" y="1" width="4" height="6" rx="1" /><rect x="1" y="9" width="5" height="6" rx="1" /><rect x="8" y="9" width="5" height="6" rx="1" /><rect x="15" y="9" width="4" height="6" rx="1" /></svg>
    </button>
    <button class="layout-icon" data-layout="9-grid" title="9-채널">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="5" height="4" rx="0.5" /><rect x="8" y="1" width="5" height="4" rx="0.5" /><rect x="15" y="1" width="4" height="4" rx="0.5" /><rect x="1" y="6" width="5" height="4" rx="0.5" /><rect x="8" y="6" width="5" height="4" rx="0.5" /><rect x="15" y="6" width="4" height="4" rx="0.5" /><rect x="1" y="11" width="5" height="4" rx="0.5" /><rect x="8" y="11" width="5" height="4" rx="0.5" /><rect x="15" y="11" width="4" height="4" rx="0.5" /></svg>
    </button>

    <span class="layout-sep"></span>

    <!-- 비대칭 -->
    <button class="layout-icon" data-layout="1+2-side" title="1+2 사이드">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="12" height="14" rx="1" /><rect x="15" y="1" width="4" height="6" rx="1" /><rect x="15" y="9" width="4" height="6" rx="1" /></svg>
    </button>
    <button class="layout-icon" data-layout="1+3-grid" title="1+3 그리드">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="12" height="14" rx="1" /><rect x="15" y="1" width="4" height="4" rx="0.5" /><rect x="15" y="6" width="4" height="4" rx="0.5" /><rect x="15" y="11" width="4" height="4" rx="0.5" /></svg>
    </button>
    <button class="layout-icon" data-layout="4-vert" title="4-세로">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="4" height="14" rx="1" /><rect x="6" y="1" width="4" height="14" rx="1" /><rect x="11" y="1" width="4" height="14" rx="1" /><rect x="16" y="1" width="3" height="14" rx="1" /></svg>
    </button>
    <button class="layout-icon" data-layout="2+4-mag" title="2+4 매거진">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="9" height="8" rx="1" /><rect x="11" y="1" width="8" height="8" rx="1" /><rect x="1" y="11" width="4" height="4" rx="0.5" /><rect x="6" y="11" width="4" height="4" rx="0.5" /><rect x="11" y="11" width="4" height="4" rx="0.5" /><rect x="16" y="11" width="3" height="4" rx="0.5" /></svg>
    </button>

    <span class="layout-sep"></span>

    <!-- PIP 종방향 -->
    <button class="layout-icon" data-layout="pip-v-1+1" title="PIP 종 1+1">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="14" height="14" rx="1" /><rect x="16" y="1" width="3" height="14" rx="1" /></svg>
    </button>
    <button class="layout-icon" data-layout="pip-v-1+2" title="PIP 종 1+2">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="14" height="14" rx="1" /><rect x="16" y="1" width="3" height="6" rx="0.5" /><rect x="16" y="9" width="3" height="6" rx="0.5" /></svg>
    </button>
    <button class="layout-icon" data-layout="pip-v-1+3" title="PIP 종 1+3">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="14" height="14" rx="1" /><rect x="16" y="1" width="3" height="4" rx="0.5" /><rect x="16" y="6" width="3" height="4" rx="0.5" /><rect x="16" y="11" width="3" height="4" rx="0.5" /></svg>
    </button>

    <span class="layout-sep"></span>

    <!-- PIP 횡방향 -->
    <button class="layout-icon" data-layout="pip-h-1+1" title="PIP 횡 1+1">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="10" rx="1" /><rect x="1" y="13" width="18" height="2" rx="0.5" /></svg>
    </button>
    <button class="layout-icon" data-layout="pip-h-1+2" title="PIP 횡 1+2">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="10" rx="1" /><rect x="1" y="13" width="8" height="2" rx="0.5" /><rect x="11" y="13" width="8" height="2" rx="0.5" /></svg>
    </button>
    <button class="layout-icon" data-layout="pip-h-1+3" title="PIP 횡 1+3">
        <svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="10" rx="1" /><rect x="1" y="13" width="5" height="2" rx="0.5" /><rect x="8" y="13" width="5" height="2" rx="0.5" /><rect x="15" y="13" width="4" height="2" rx="0.5" /></svg>
    </button>
</div>
```

---

### style.css 추가

```css
/* ══ 레이아웃 아이콘 피커 ═══════════════════════════ */
.layout-picker {
    display: flex;
    align-items: center;
    gap: 2px;
}

.layout-icon {
    width: 28px;
    height: 22px;
    padding: 2px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
.layout-icon svg {
    width: 20px;
    height: 16px;
    fill: none;
    stroke: #484f58;
    stroke-width: 0.8;
}
.layout-icon:hover svg {
    stroke: #8b949e;
}
.layout-icon:hover {
    background: #21262d;
    border-color: #30363d;
}

/* 활성 레이아웃 */
.layout-icon.active {
    background: #21262d;
    border-color: #1f6feb;
}
.layout-icon.active svg {
    stroke: #58a6ff;
    fill: rgba(31, 111, 235, 0.15);
}

/* 구분선 */
.layout-sep {
    width: 1px;
    height: 16px;
    background: #30363d;
    margin: 0 4px;
}

/* 마우스 오버 시 이름 툴팁은 title 속성으로 자동 표시 */
```

---

### renderer.js 수정

#### 1. DOM 참조 변경 (35줄)

```javascript
// 기존 삭제:
// const layoutSelect = document.getElementById('layout');

// 신규:
const layoutPicker = document.getElementById('layoutPicker');
```

#### 2. 레이아웃 아이콘 이벤트 (init 함수 내)

기존:
```javascript
layoutSelect.addEventListener('change', (e) => applyLayout(e.target.value));
```

변경:
```javascript
// 레이아웃 아이콘 클릭
layoutPicker.addEventListener('click', function(e) {
    var btn = e.target.closest('.layout-icon');
    if (!btn) return;
    var layout = btn.dataset.layout;
    if (!layout || !layouts[layout]) return;

    // active 클래스 전환
    layoutPicker.querySelectorAll('.layout-icon').forEach(function(b) {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    applyLayout(layout);
});
```

#### 3. applyLayout 기본값 (init 함수 내)

기존:
```javascript
if (layouts[appConfig.defaultLayout]) {
    layoutSelect.value = appConfig.defaultLayout;
}
```

변경:
```javascript
// 기본 레이아웃 아이콘 활성화
var defaultBtn = layoutPicker.querySelector('[data-layout="' + appConfig.defaultLayout + '"]');
if (defaultBtn) {
    layoutPicker.querySelectorAll('.layout-icon').forEach(function(b) { b.classList.remove('active'); });
    defaultBtn.classList.add('active');
}
```

#### 4. broadcastAll에서 layoutSelect 참조 제거

기존 (230줄):
```javascript
const l = layouts[layoutSelect.value] || layouts['4-quad'];
```

변경:
```javascript
var activeBtn = layoutPicker.querySelector('.layout-icon.active');
var currentKey = activeBtn ? activeBtn.dataset.layout : '4-quad';
var l = layouts[currentKey] || layouts['4-quad'];
```

#### 5. 시계에서도 동일 변경 (267줄)

기존:
```javascript
clock.textContent = new Date().toLocaleString('ko-KR');
```

변경:
```javascript
var activeBtn = layoutPicker.querySelector('.layout-icon.active');
var currentKey = activeBtn ? activeBtn.dataset.layout : '4-quad';
var l = layouts[currentKey] || layouts['4-quad'];
clock.textContent = l.show + '패널 │ ' + currentKey + ' │ ' + new Date().toLocaleString('ko-KR');
```

---

## 수정 요약

| 파일 | 내용 |
|------|------|
| index.html | `<select>` 제거 → `<div class="layout-picker">` + 16개 SVG 버튼 |
| style.css | `.layout-picker`, `.layout-icon`, `.layout-icon.active`, `.layout-sep` 추가 |
| renderer.js | `layoutSelect` → `layoutPicker` 참조 변경 + 클릭 이벤트 + active 클래스 |

---

## 테스트

- [ ] 16개 아이콘 모두 표시
- [ ] 마우스 오버 → 하이라이트 + 툴팁 (title)
- [ ] 클릭 → 파란 테두리 (active) + 레이아웃 변경
- [ ] 기본 4-쿼드 아이콘이 초기 active
- [ ] 브로드캐스트 + 시계가 현재 레이아웃 정확히 참조

---

## CC_MSG_056 (클립보드) + CC_MSG_057 (PIP) + CC_MSG_058 (아이콘) 통합 순서

1. CC_MSG_057 — layouts 상수에 PIP 6개 추가
2. CC_MSG_058 — select → 아이콘 피커 교체 (이 문서)
3. CC_MSG_056 — 클립보드 잡기/놓기 추가

1+2는 같이 해야 함 (select 제거하면서 PIP도 반영).
3은 독립적으로 가능.

---

*Claude Code · CC_MSG_058 · 2026-03-30*
