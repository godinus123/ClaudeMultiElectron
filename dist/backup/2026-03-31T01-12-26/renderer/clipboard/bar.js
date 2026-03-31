/**
 * @file    bar.js
 * @desc    클립보드 바 UI — toggle, clear, set
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @exports toggleClipboard, clearClipboard, setClipboardContent, refreshDropButtons, hasClipboardText, setupClipboardBar
 */

import { clipboardExpanded, setClipboardExpanded, setClipboardFromId } from '../core/state.js';
import { renderClipboardPreview } from '../ui/preview.js';

export function hasClipboardText() {
  const el = document.getElementById('clipboardText');
  return Boolean((el?.value || '').trim());
}

export function refreshDropButtons() {
  const enabled = hasClipboardText();
  document.querySelectorAll('.panel-drop').forEach(btn => {
    if (enabled) { btn.classList.remove('disabled'); btn.removeAttribute('disabled'); }
    else { btn.classList.add('disabled'); btn.setAttribute('disabled', 'disabled'); }
  });
}

export function toggleClipboard() {
  const body = document.getElementById('clipboardBody');
  const btn = document.getElementById('clipboardToggleBtn');
  const expanded = body.style.display !== 'none';
  body.style.display = expanded ? 'none' : 'block';
  btn.textContent = expanded ? '▼' : '▲';
  setClipboardExpanded(!expanded);
}

export function clearClipboard() {
  setClipboardFromId(null);
  const source = document.getElementById('clipboardSource');
  const text = document.getElementById('clipboardText');
  const clearBtn = document.getElementById('clipboardClearBtn');
  const body = document.getElementById('clipboardBody');
  const toggleBtn = document.getElementById('clipboardToggleBtn');
  if (source) source.textContent = '[비어있음]';
  if (text) text.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (body) body.style.display = 'none';
  if (toggleBtn) toggleBtn.textContent = '▼';
  setClipboardExpanded(false);
  refreshDropButtons();
}

export function setClipboardContent(fromPanelId, panelName, text) {
  setClipboardFromId(fromPanelId);
  const source = document.getElementById('clipboardSource');
  const textEl = document.getElementById('clipboardText');
  const clearBtn = document.getElementById('clipboardClearBtn');
  const body = document.getElementById('clipboardBody');
  const toggleBtn = document.getElementById('clipboardToggleBtn');
  if (source) source.textContent = `[${fromPanelId} ${panelName}에서 가져옴]`;
  if (textEl) textEl.value = text || '';
  if (clearBtn) clearBtn.style.display = 'inline-block';
  if (body) body.style.display = 'block';
  if (toggleBtn) toggleBtn.textContent = '▲';
  setClipboardExpanded(true);
  refreshDropButtons();
}

export function setupClipboardBar() {
  const header = document.getElementById('clipboardHeader');
  const clearBtn = document.getElementById('clipboardClearBtn');
  const textEl = document.getElementById('clipboardText');
  const clipboardBar = document.getElementById('clipboardBar');
  const dropOverlay = document.getElementById('clipboardDropOverlay');

  if (header) {
    header.addEventListener('click', e => {
      if (e.target === clearBtn) return;
      toggleClipboard();
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', e => { e.stopPropagation(); clearClipboard(); });
  }
  if (textEl) {
    textEl.addEventListener('input', () => { refreshDropButtons(); renderClipboardPreview(); });
    textEl.addEventListener('paste', () => { setTimeout(renderClipboardPreview, 10); });
  }

  // 클립보드 바 드래그앤드롭
  if (clipboardBar && dropOverlay && textEl) {
    clipboardBar.addEventListener('dragenter', e => { e.preventDefault(); dropOverlay.classList.add('visible'); });
    clipboardBar.addEventListener('dragover', e => { e.preventDefault(); dropOverlay.classList.add('visible'); e.dataTransfer.dropEffect = 'copy'; });
    clipboardBar.addEventListener('dragleave', e => { e.preventDefault(); dropOverlay.classList.remove('visible'); });
    dropOverlay.addEventListener('drop', async e => {
      e.preventDefault(); e.stopPropagation(); dropOverlay.classList.remove('visible');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('text/')) {
          const reader = new FileReader();
          reader.onload = () => { textEl.value = reader.result; renderClipboardPreview(); refreshDropButtons(); };
          reader.readAsText(file, 'utf-8');
        } else {
          textEl.value = '[파일: ' + file.name + ']';
          renderClipboardPreview(); refreshDropButtons();
        }
        return;
      }
      let text = e.dataTransfer.getData('text/plain');
      if (!text) {
        const html = e.dataTransfer.getData('text/html');
        if (html) { const tmp = document.createElement('div'); tmp.innerHTML = html; text = tmp.textContent || ''; }
      }
      if (text && text.trim()) { textEl.value = text.trim(); renderClipboardPreview(); refreshDropButtons(); }
    });
  }
}
