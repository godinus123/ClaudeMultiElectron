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
import { setCurrentLayout } from '../core/state.js';
import { renderLegend } from '../ui/statusbar.js';

export function applyLayout(key) {
  const l = layouts[key];
  if (!l) return;
  setCurrentLayout(key);

  const grid = document.getElementById('grid');
  const hiddenContainer = document.getElementById('hiddenPanels');

  // 모든 패널 수집 (grid + hidden 양쪽)
  const allPanels = [...grid.querySelectorAll('.panel'), ...hiddenContainer.querySelectorAll('.panel')];
  allPanels.sort((a, b) => Number(a.dataset.id) - Number(b.dataset.id));

  grid.style.gridTemplateColumns = l.cols;
  grid.style.gridTemplateRows = l.rows;

  allPanels.forEach((panel, index) => {
    panel.style.gridRow = '';
    panel.style.gridColumn = '';

    // 부모에서 제거
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
