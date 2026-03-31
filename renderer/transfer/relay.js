/**
 * @file    relay.js
 * @desc    응답 전달 + 응답 추출
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends broadcast.js
 * @exports relayResponse, extractLatestResponseFromPanel
 */

import { broadcastToPanel } from './broadcast.js';

const extractScript = `
  (function() {
    var candidates = [
      '[data-is-streaming="false"]',
      '.font-claude-message',
      '[class*="message"] .contents',
      '[class*="message"]'
    ];
    for (var i = 0; i < candidates.length; i++) {
      var list = document.querySelectorAll(candidates[i]);
      if (list && list.length > 0) {
        for (var j = list.length - 1; j >= 0; j--) {
          var txt = (list[j].innerText || list[j].textContent || '').trim();
          if (txt) return txt;
        }
      }
    }
    return '';
  })();
`;

export async function extractLatestResponseFromPanel(panelId) {
  const grid = document.getElementById('grid');
  const hidden = document.getElementById('hiddenPanels');
  const all = [...grid.querySelectorAll('.panel'), ...hidden.querySelectorAll('.panel')];
  const panel = all.find(p => p.dataset.id === String(panelId));
  if (!panel) return '';
  const wv = panel.querySelector('webview');
  if (!wv) return '';
  try {
    const text = await wv.executeJavaScript(extractScript);
    return String(text || '').trim();
  } catch {
    return '';
  }
}

export async function relayResponse(fromPanelId, toPanelId) {
  const text = await extractLatestResponseFromPanel(fromPanelId);
  if (!text) {
    window.alert('패널 ' + fromPanelId + '에서 응답을 찾을 수 없습니다.');
    return;
  }
  const grid = document.getElementById('grid');
  const toPanel = [...grid.querySelectorAll('.panel')].find(p => p.dataset.id === String(toPanelId));
  if (!toPanel) return;
  const toWv = toPanel.querySelector('webview');
  if (!toWv) return;
  const payload = `[패널${fromPanelId} 응답 전달]\n${text.slice(0, 8000)}`;
  await broadcastToPanel(toWv, payload);
}
