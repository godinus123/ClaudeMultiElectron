/**
 * @file    reset.js
 * @desc    패널 초기화
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends state.js
 * @exports resetPanel, resetAll
 */

import { appConfig } from '../core/state.js';

export function resetPanel(id) {
  const grid = document.getElementById('grid');
  const panel = [...grid.querySelectorAll('.panel')].find(x => Number(x.dataset.id) === id);
  if (!panel) return;
  const wv = panel.querySelector('webview');
  if (!wv) return;
  if (!window.confirm('현재 대화가 초기화됩니다. 계속하시겠습니까?')) return;
  wv.loadURL(appConfig.url);
}

export function resetAll() {
  if (!window.confirm('전체 패널 대화가 초기화됩니다. 계속하시겠습니까?')) return;
  document.querySelectorAll('webview').forEach(wv => wv.loadURL(appConfig.url));
}
