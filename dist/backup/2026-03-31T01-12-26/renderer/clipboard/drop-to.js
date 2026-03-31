/**
 * @file    drop-to.js
 * @desc    클립보드 내용을 대상 패널에 전달
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends broadcast.js
 * @exports dropToPanel
 */

import { broadcastToPanel } from '../transfer/broadcast.js';

export async function dropToPanel(panelId) {
  const textEl = document.getElementById('clipboardText');
  const text = (textEl?.value || '').trim();
  if (!text) return;

  const grid = document.getElementById('grid');
  const panel = [...grid.querySelectorAll('.panel')].find(p => p.dataset.id === String(panelId));
  if (!panel) return;
  const wv = panel.querySelector('webview');
  if (!wv) return;

  await broadcastToPanel(wv, text);
}
