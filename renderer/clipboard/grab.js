/**
 * @file    grab.js
 * @desc    패널에서 응답 잡기 → 클립보드에 저장
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends relay.js, bar.js
 * @exports grabFromPanel
 */

import { appConfig } from '../core/state.js';
import { extractLatestResponseFromPanel } from '../transfer/relay.js';
import { setClipboardContent } from './bar.js';

export async function grabFromPanel(panelId) {
  const def = appConfig.panels.find(p => p.id === panelId);
  if (!def) return;
  const text = await extractLatestResponseFromPanel(panelId);
  if (!text) {
    const source = document.getElementById('clipboardSource');
    if (source) source.textContent = `[${panelId} 응답 없음]`;
    return;
  }
  setClipboardContent(panelId, def.name, text.slice(0, 20000));
}
