/**
 * @file    broadcast.js
 * @desc    브로드캐스트 전송 (전체/1:1)
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @exports broadcastToPanel, broadcastAll, populateBcTarget
 */

import { appConfig } from '../core/state.js';
import { layouts } from '../layout/layouts.js';

export function broadcastToPanel(wv, text) {
  // 권고: 길이 제한만 적용 (최대 50000자)
  try { if (typeof text !== 'string') text = String(text); } catch (e) { text = ''; }
  const MAX_LEN = 50000;
  const SUFFIX = '\n\n[...글자 제한]';
  if (text.length > MAX_LEN) text = text.substring(0, MAX_LEN - SUFFIX.length) + SUFFIX;
  const escaped = JSON.stringify(text);
  const script = `
    (function() {
      var el = document.querySelector('div.ProseMirror[contenteditable="true"]')
        || document.querySelector('div[contenteditable="true"]')
        || document.querySelector('textarea');
      if (!el) return false;
      el.focus();
      try {
        document.execCommand('insertText', false, ${escaped});
      } catch (_) {
        if ('value' in el) {
          el.value = ${escaped};
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.textContent = ${escaped};
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      setTimeout(function() {
        el.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true
        }));
      }, 300);
      return true;
    })();
  `;
  return wv.executeJavaScript(script).catch(err => {
    console.error('broadcastToPanel error:', err);
    return false;
  });
}

export async function broadcastAll() {
  const bcTarget = document.getElementById('bcTarget');
  const broadcastInput = document.getElementById('broadcastInput');
  const text = (broadcastInput.value || '').trim();
  if (!text) return;
  broadcastInput.value = '';

  const target = bcTarget ? bcTarget.value : 'all';
  const grid = document.getElementById('grid');

  if (target !== 'all') {
    const hidden = document.getElementById('hiddenPanels');
    const all = [...grid.querySelectorAll('.panel')];
    if (hidden) all.push(...hidden.querySelectorAll('.panel'));
    const panel = all.find(p => p.dataset.id === target);
    if (panel) {
      const wv = panel.querySelector('webview');
      if (wv) await broadcastToPanel(wv, text);
    }
    return;
  }

  const layoutSelect = document.getElementById('layout');
  const l = layouts[layoutSelect.value] || layouts['4-quad'];
  const activePanels = [...grid.querySelectorAll('.panel')].slice(0, l.show);

  await activePanels.reduce((promise, panel) => {
    return promise.then(() => {
      const wv = panel.querySelector('webview');
      if (!wv) return;
      return broadcastToPanel(wv, text).then(() => new Promise(r => setTimeout(r, 500)));
    });
  }, Promise.resolve());
}

export function populateBcTarget() {
  const bcTarget = document.getElementById('bcTarget');
  if (!bcTarget) return;
  bcTarget.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = '전체';
  bcTarget.appendChild(allOpt);

  appConfig.panels.forEach(p => {
    const opt = document.createElement('option');
    opt.value = String(p.id);
    opt.textContent = `${p.id} ${p.name}`;
    bcTarget.appendChild(opt);
  });
}
