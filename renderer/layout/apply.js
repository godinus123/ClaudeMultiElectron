/**
 * @file    apply.js
 * @desc    레이아웃 적용 — CSS order로 패널 순서 변경 (DOM 이동 없음)
 * @owner   안목
 * @version 2.0.0
 * @date    2026-03-31
 * @depends layouts.js
 * @exports applyLayout, swapWithActive, getPanelOrder
 */

import { layouts } from './layouts.js';
import { currentLayout, setCurrentLayout } from '../core/state.js';
import { renderLegend } from '../ui/statusbar.js';

// 패널 표시 순서 (ID 배열) — CSS order로 시각적 순서 제어
let panelOrder = [];

export function getPanelOrder() { return panelOrder; }

// 스몰 패널 클릭 → 액티브(인덱스 0)와 스왑
export function swapWithActive(panelId) {
  const activeIdx = 0;
  const clickedIdx = panelOrder.indexOf(panelId);
  if (clickedIdx <= 0) return;

  // 순서 스왑
  const temp = panelOrder[activeIdx];
  panelOrder[activeIdx] = panelOrder[clickedIdx];
  panelOrder[clickedIdx] = temp;

  // CSS order만 변경 (DOM 이동 없음 → webview 리로드 안 됨)
  applyOrder();
  applySpan();
  renderLegend();
}

export function applyLayout(key) {
  const l = layouts[key];
  if (!l) return;
  setCurrentLayout(key);
  const grid = document.getElementById('grid');
  const hiddenContainer = document.getElementById('hiddenPanels');

  // 수동으로 DOM 이동: 활성 패널만 grid에 남기고 나머지는 hiddenContainer로 이동
  // 1) 모든 패널을 grid와 hiddenContainer에서 수집
  const panelsInGrid = [...grid.querySelectorAll('.panel')];
  const panelsInHidden = hiddenContainer ? [...hiddenContainer.querySelectorAll('.panel')] : [];
  const allPanels = panelsInGrid.concat(panelsInHidden);

  // 2) panelOrder 유지 또는 초기화
  allPanels.sort((a, b) => Number(a.dataset.id) - Number(b.dataset.id));
  if (panelOrder.length === 0) {
    panelOrder = allPanels.map(p => Number(p.dataset.id));
  } else {
    const allIds = new Set(allPanels.map(p => Number(p.dataset.id)));
    panelOrder = panelOrder.filter(id => allIds.has(id));
    const existingIds = new Set(panelOrder);
    allPanels.forEach(p => {
      const id = Number(p.dataset.id);
      if (!existingIds.has(id)) {
        panelOrder.push(id);
        existingIds.add(id);
      }
    });
  }

  // 3) 그리드 템플릿 설정
  grid.style.gridTemplateColumns = l.cols;
  grid.style.gridTemplateRows = l.rows;

  // 4) DOM 배치: panelOrder 기준으로 처음 l.show 개는 grid에, 나머지는 hiddenContainer로 이동
  const ordered = panelOrder.map(id => allPanels.find(p => Number(p.dataset.id) === id)).filter(Boolean);
  ordered.forEach((panel, index) => {
    panel.style.order = '';
    panel.style.gridRow = '';
    panel.style.gridColumn = '';
    panel.style.visibility = '';
    panel.style.position = '';
    panel.style.width = '';
    panel.style.height = '';
    panel.style.overflow = '';

    if (index < l.show) {
      grid.appendChild(panel);
    } else {
      if (hiddenContainer) hiddenContainer.appendChild(panel);
    }
  });

  applyOrder();
  applySpan();
  renderLegend();
}

// CSS order로 시각적 순서 + visibility로 숨김 처리
function applyOrder() {
  const l = layouts[currentLayout];
  if (!l) return;
  const grid = document.getElementById('grid');
  const visiblePanels = [...grid.querySelectorAll('.panel')];
  const panelMap = {};
  visiblePanels.forEach(p => { panelMap[Number(p.dataset.id)] = p; });

  // visiblePanels 순서대로 order 부여
  panelOrder.forEach((id, index) => {
    const panel = panelMap[id];
    if (!panel) return;
    panel.style.order = String(index);
  });
}

// span 처리 (비대칭 레이아웃)
function applySpan() {
  const l = layouts[currentLayout];
  if (!l || !l.span) return;

  const grid = document.getElementById('grid');
  const allPanels = [...grid.querySelectorAll('.panel')];
  const panelMap = {};
  allPanels.forEach(p => { panelMap[Number(p.dataset.id)] = p; });

  // order 순서대로 span 적용
  const ordered = panelOrder.map(id => panelMap[id]).filter(Boolean);

  for (const [idx, type] of Object.entries(l.span)) {
    const panel = ordered[Number(idx)];
    if (!panel) continue;
    switch (type) {
      case 'row':
        panel.style.gridRow = '1 / -1';
        break;
      case 'col2':
        panel.style.gridColumn = 'span 2';
        break;
      case 'col3':
        panel.style.gridColumn = 'span 3';
        break;
      case 'row-at-col2':
        panel.style.gridColumn = '2';
        panel.style.gridRow = '1 / -1';
        break;
    }
  }
}
