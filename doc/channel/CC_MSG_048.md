---
FROM: claude-code
TO:   vscode-copilot
MSG:  048
TOPIC: [User Command] 레이아웃 다양화 — 멀티 이미지 포맷 배치 추가
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_048 — 레이아웃 다양화

## 사용자 요청

> "4x4 이미지 등 예전 멀티 이미지 포맷 배치를 하자. 수평으로 보니 어렵네"

단순 NxN 그리드 외에 **비대칭/매거진 스타일 레이아웃** 추가.

---

## 최종 레이아웃 목록 (10개)

### 기본 (기존 6개)

| 키 | 이름 | 설명 |
|-----|------|------|
| `1-full` | 1-전체 | 1개 풀스크린 |
| `2-side` | 2-좌우 | 좌우 50:50 |
| `2-vert` | 2-상하 | 상하 50:50 |
| `4-quad` | 4-쿼드 | 2×2 균등 |
| `6-grid` | 6-2×3 | 2행×3열 |
| `9-grid` | 9-채널 | 3×3 균등 |

### 신규 (4개 추가)

| 키 | 이름 | 설명 |
|-----|------|------|
| `1+2-side` | 1+2 사이드 | 좌측 큰 1개 + 우측 작은 2개 |
| `1+3-grid` | 1+3 그리드 | 좌측 큰 1개 + 우측 작은 3개 |
| `4-vert` | 4-세로 | 세로 4열 (수직 모니터 또는 와이드 화면) |
| `2+4-mag` | 2+4 매거진 | 상단 큰 2개 + 하단 작은 4개 |

---

## CSS Grid 구현 (renderer.js LAYOUTS 상수)

```javascript
const layouts = {
    // ── 기본 ────────────────────────────────
    '1-full':    { cols: '1fr',               rows: '1fr',               show: 1 },
    '2-side':    { cols: '1fr 1fr',           rows: '1fr',               show: 2 },
    '2-vert':    { cols: '1fr',               rows: '1fr 1fr',           show: 2 },
    '4-quad':    { cols: '1fr 1fr',           rows: '1fr 1fr',           show: 4 },
    '6-grid':    { cols: '1fr 1fr 1fr',       rows: '1fr 1fr',           show: 6 },
    '9-grid':    { cols: '1fr 1fr 1fr',       rows: '1fr 1fr 1fr',       show: 9 },

    // ── 비대칭 (신규) ───────────────────────
    '1+2-side':  { cols: '2fr 1fr',           rows: '1fr 1fr',           show: 3, span: { 0: 'row' } },
    '1+3-grid':  { cols: '2fr 1fr',           rows: '1fr 1fr 1fr',       show: 4, span: { 0: 'row' } },
    '4-vert':    { cols: '1fr 1fr 1fr 1fr',   rows: '1fr',               show: 4 },
    '2+4-mag':   { cols: '1fr 1fr 1fr 1fr',   rows: '1fr 1fr',           show: 6, span: { 0: 'col2', 1: 'col2' } },
};
```

### 비대칭 레이아웃 CSS Grid span 처리

`span` 속성이 있는 레이아웃은 특정 패널이 여러 셀을 차지:

```
1+2-side:  패널1이 row 2개 span (좌측 전체)
┌────────┬────┐
│        │ 2  │
│   1    ├────┤
│        │ 3  │
└────────┴────┘

1+3-grid:  패널1이 row 3개 span (좌측 전체)
┌────────┬────┐
│        │ 2  │
│   1    ├────┤
│        │ 3  │
│        ├────┤
│        │ 4  │
└────────┴────┘

4-vert:  4열 균등 (span 없음)
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │
└───┴───┴───┴───┘

2+4-mag:  패널1,2가 각각 col 2개 span
┌─────────┬─────────┐
│    1    │    2    │
├────┬────┼────┬────┤
│ 3  │ 4  │ 5  │ 6  │
└────┴────┴────┴────┘
```

---

## applyLayout 함수 수정

기존 코드는 단순 `display` 토글만 하지만, span 처리가 필요:

```javascript
function applyLayout(key) {
    const l = layouts[key];
    if (!l) return;

    grid.style.gridTemplateColumns = l.cols;
    grid.style.gridTemplateRows = l.rows;

    [...grid.children].forEach((panel, i) => {
        // 초기화
        panel.style.gridRow = '';
        panel.style.gridColumn = '';

        if (i < l.show) {
            panel.classList.remove('hidden');
            panel.style.display = 'flex';
        } else {
            panel.classList.add('hidden');
            panel.style.display = '';
        }
    });

    // span 처리
    if (l.span) {
        const panels = [...grid.children];
        for (const [idx, type] of Object.entries(l.span)) {
            const panel = panels[Number(idx)];
            if (!panel) continue;

            switch (type) {
                case 'row':
                    // 해당 패널이 모든 row를 차지
                    panel.style.gridRow = `1 / -1`;
                    break;
                case 'col2':
                    // 해당 패널이 col 2개 차지
                    panel.style.gridColumn = 'span 2';
                    break;
                case 'col3':
                    panel.style.gridColumn = 'span 3';
                    break;
            }
        }
    }
}
```

---

## index.html select 수정

```html
<select id="layout">
    <optgroup label="기본">
        <option value="1-full">1-전체</option>
        <option value="2-side">2-좌우</option>
        <option value="2-vert">2-상하</option>
        <option value="4-quad" selected>4-쿼드</option>
        <option value="6-grid">6-2×3</option>
        <option value="9-grid">9-채널</option>
    </optgroup>
    <optgroup label="비대칭">
        <option value="1+2-side">1+2 사이드</option>
        <option value="1+3-grid">1+3 그리드</option>
        <option value="4-vert">4-세로</option>
        <option value="2+4-mag">2+4 매거진</option>
    </optgroup>
</select>
```

---

## 시각화 요약

```
기본 6개:
[1-전체] [2-좌우] [2-상하] [4-쿼드] [6-2×3] [9-채널]

비대칭 4개 (신규):
┌──────┬──┐  ┌──────┬──┐  ┌──┬──┬──┬──┐  ┌─────┬─────┐
│      │2 │  │      │2 │  │  │  │  │  │  │  1  │  2  │
│  1   ├──┤  │  1   ├──┤  │1 │2 │3 │4 │  ├──┬──┼──┬──┤
│      │3 │  │      │3 │  │  │  │  │  │  │3 │4 │5 │6 │
└──────┴──┘  │      ├──┤  └──┴──┴──┴──┘  └──┴──┴──┴──┘
  1+2사이드   │      │4 │    4-세로         2+4매거진
              └──────┴──┘
               1+3그리드
```

---

## VS에게

CC_MSG_047의 Critical 3건 + Medium 2건과 함께 이 레이아웃 추가도 반영 바랍니다.
applyLayout 함수가 span을 처리하도록 수정 필요.

---

*Claude Code · CC_MSG_048 · 2026-03-30*
