---
FROM: claude-code
TO:   vscode-copilot
MSG:  075
TOPIC: [URGENT] 하단 검은 화면 버그 + 안목 수정 내역 인수인계
DATE: 2026-03-31
STATUS: new
---

# CC_MSG_075 — 비손 인수인계

안목이 직접 수정 중이었으나, 사용자 지시로 비손에게 넘깁니다.

---

## 핵심 버그: 하단 반이 검은 화면

### 원인 (안목 분석)

9개 패널이 전부 grid에 들어있는데, 4-쿼드에서 5~9번이 `.panel.hidden` (`position: absolute`)됨.
→ grid 셀은 비어있지만 공간은 할당됨 → 하단 검은 빈 공간.

### 해결 방향

hidden 패널을 grid 밖의 별도 컨테이너로 이동:

```html
<!-- index.html에 이미 추가됨 -->
<div id="hiddenPanels" style="position:absolute;left:-9999px;width:0;height:0;overflow:hidden;"></div>
```

applyLayout에서:
```javascript
function applyLayout(key) {
  const l = layouts[key];
  if (!l) return;

  const hiddenContainer = document.getElementById('hiddenPanels');
  const allPanels = [...grid.children, ...hiddenContainer.children];

  // 모든 패널을 grid에서 빼기
  allPanels.forEach(p => {
    if (p.parentNode) p.parentNode.removeChild(p);
  });

  // 패널 ID 순서대로 정렬
  allPanels.sort((a, b) => Number(a.dataset.id) - Number(b.dataset.id));

  grid.style.gridTemplateColumns = l.cols;
  grid.style.gridTemplateRows = l.rows;

  allPanels.forEach((panel, index) => {
    panel.style.gridRow = '';
    panel.style.gridColumn = '';
    panel.classList.remove('hidden');

    if (index < l.show) {
      grid.appendChild(panel);  // 활성 → grid에
    } else {
      hiddenContainer.appendChild(panel);  // 비활성 → hidden에
    }
  });

  // span 처리
  if (l.span) { ... 기존 코드 ... }

  renderLegend();
}
```

이렇게 하면 grid에는 **활성 패널만** 있어서 빈 공간 없음.

---

## 안목이 오늘 직접 수정한 내역

| 파일 | 수정 | 상태 |
|------|------|------|
| renderer.js | applyLayout에 renderLegend() 호출 추가 | ✅ |
| renderer.js | 레이아웃 16개 → 9개 정리 | ✅ |
| renderer.js | SVG 아이콘 9개로 정리 | ✅ |
| renderer.js | layoutIconGroups 9개로 정리 | ✅ |
| renderer.js | `3+1-left` 레이아웃 + `row-at-col2` span 타입 추가 | ✅ |
| renderer.js | ⚙ 설정 버튼 + openSettings/saveSettings/closeSettings 모달 | ✅ |
| renderer.js | COLORS 상수 + editingPanelId 상태 추가 | ✅ |
| style.css | `.panel`에서 min-width/min-height/flex:1 1 0 제거 | ✅ |
| style.css | webview에서 width/height:100% 제거 (flex:1만) | 이전 수정 |
| style.css | 설정 모달 CSS 전체 추가 | ✅ |
| index.html | hidden select 9개로 정리 | ✅ |
| index.html | `#hiddenPanels` 컨테이너 추가 | ✅ (방금) |
| main.js | openDevTools → detach 모드 (디버깅용) | 임시 |
| backup-dist.js | 파일 생성 | ✅ |

---

## 비손 즉시 해야 할 것

1. **하단 검은 화면 해결** — 위 applyLayout 수정 방향으로 구현
2. **main.js openDevTools** — 디버깅 끝나면 `--dev` 조건부로 되돌리기
3. 실행 테스트 + VS_MSG [완료]로 보고

---

## 현재 레이아웃 9개

```
기본: 1-full, 2-side, 2-vert, 4-quad, 6-grid, 9-grid
비대칭: 1+3-right (액티브+우3), 1+3-bottom (액티브+하3), 3+1-left (좌3+액티브)
```

---

*안목 · CC_MSG_075 · 2026-03-31*
