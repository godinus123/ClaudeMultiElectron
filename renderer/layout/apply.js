/**
 * @file    apply.js
 * @desc    레이아웃 적용 — grid + hidden 패널 관리
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends layouts.js
 * @exports applyLayout
 */

import { layouts } from './layouts.js';
import { currentLayout, setCurrentLayout } from '../core/state.js';
import { renderLegend } from '../ui/statusbar.js';

// 현재 grid에 표시된 패널 순서 (ID 배열)
let panelOrder = [];

export function getPanelOrder() { return panelOrder; }

// 스몰 패널 클릭 → 액티브(인덱스 0)와 스왑
export function swapWithActive(panelId) {
  const activeIdx = 0;
  const clickedIdx = panelOrder.indexOf(panelId);
  if (clickedIdx <= 0) return; // 이미 액티브이거나 못 찾음

  // 순서 스왑
  const temp = panelOrder[activeIdx];
  panelOrder[activeIdx] = panelOrder[clickedIdx];
  panelOrder[clickedIdx] = temp;

  // 현재 레이아웃 재적용
  applyLayoutWithOrder(currentLayout);
}

export function applyLayout(key) {
  const l = layouts[key];
  if (!l) return;
  setCurrentLayout(key);

  const grid = document.getElementById('grid');
  const hiddenContainer = document.getElementById('hiddenPanels');

  // 모든 패널 수집 (grid + hidden 양쪽)
  const allPanels = [...grid.querySelectorAll('.panel'), ...hiddenContainer.querySelectorAll('.panel')];
  allPanels.sort((a, b) => Number(a.dataset.id) - Number(b.dataset.id));

  // 패널 순서 초기화 (레이아웃 변경 시)
  panelOrder = allPanels.map(p => Number(p.dataset.id));

  applyLayoutWithOrder(key);
}

function applyLayoutWithOrder(key) {
  const l = layouts[key];
  if (!l) return;

  const grid = document.getElementById('grid');
  const hiddenContainer = document.getElementById('hiddenPanels');

  // 모든 패널을 panelOrder 순서로 정렬
  const allPanels = [...grid.querySelectorAll('.panel'), ...hiddenContainer.querySelectorAll('.panel')];
  const panelMap = {};
  allPanels.forEach(p => { panelMap[Number(p.dataset.id)] = p; });

  const ordered = panelOrder.map(id => panelMap[id]).filter(Boolean);

  grid.style.gridTemplateColumns = l.cols;
  grid.style.gridTemplateRows = l.rows;

  ordered.forEach((panel, index) => {
    panel.style.gridRow = '';
    panel.style.gridColumn = '';
    if (panel.parentNode) panel.parentNode.removeChild(panel);

    if (index < l.show) {
      grid.appendChild(panel);
    } else {
      hiddenContainer.appendChild(panel);
    }
  });

  // span 처리
  if (l.span) {
    const gridPanels = [...grid.querySelectorAll('.panel')];
    for (const [idx, type] of Object.entries(l.span)) {
      const panel = gridPanels[Number(idx)];
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

  renderLegend();
}
