/**
 * @file    app.js
 * @desc    진입점 — 모든 모듈을 import하고 init
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 */

import { loadConfig } from './config.js';
import { setAppConfig } from './state.js';
import { layouts } from '../layout/layouts.js';
import { applyLayout } from '../layout/apply.js';
import { buildLayoutPicker, syncActiveLayoutIcon } from '../layout/picker.js';
import { renderPanels } from '../panel/create.js';
import { resetAll } from '../panel/reset.js';
import { broadcastAll, populateBcTarget } from '../transfer/broadcast.js';
import { setupClipboardBar, refreshDropButtons, clearClipboard } from '../clipboard/bar.js';
import { renderLegend, startClock } from '../ui/statusbar.js';

async function init() {
  const config = await loadConfig();
  setAppConfig(config);

  const layoutSelect = document.getElementById('layout');
  if (layouts[config.defaultLayout] && layoutSelect) {
    layoutSelect.value = config.defaultLayout;
  }

  buildLayoutPicker();
  renderPanels();
  populateBcTarget();
  applyLayout(layoutSelect ? layoutSelect.value : '4-quad');
  syncActiveLayoutIcon();
  refreshDropButtons();
  clearClipboard();
  setupClipboardBar();
  startClock();

  // 이벤트 바인딩
  if (layoutSelect) {
    layoutSelect.addEventListener('change', e => {
      applyLayout(e.target.value);
      syncActiveLayoutIcon();
    });
  }

  document.getElementById('resetAllBtn')?.addEventListener('click', resetAll);
  document.getElementById('broadcastBtn')?.addEventListener('click', broadcastAll);
  document.getElementById('broadcastInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); broadcastAll(); }
  });
}

init();
