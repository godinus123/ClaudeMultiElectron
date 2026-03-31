/**
 * @file    settings.js
 * @desc    설정 모달 — 닉네임/색상 변경
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends state.js, config.js
 * @exports openSettings
 */

import { appConfig, setEditingPanelId, editingPanelId } from '../core/state.js';
import { COLORS } from '../core/config.js';
import { renderLegend } from './statusbar.js';

export function openSettings(panelId) {
  closeSettings();
  setEditingPanelId(panelId);
  const p = appConfig.panels.find(x => x.id === panelId);
  if (!p) return;

  let overlay = document.getElementById('settingsOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'settingsOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 id="modalTitle">패널 설정</h3>
        <label>닉네임</label>
        <input type="text" id="modalNickname" maxlength="10" />
        <label>색상</label>
        <div class="color-options" id="modalColors"></div>
        <div class="modal-btns">
          <button class="btn-cancel" id="modalCancel">취소</button>
          <button class="btn-save" id="modalSave">저장</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('modalSave').addEventListener('click', saveSettings);
    document.getElementById('modalCancel').addEventListener('click', closeSettings);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSettings(); });
  }

  document.getElementById('modalTitle').textContent = '패널 ' + panelId + ' 설정';
  document.getElementById('modalNickname').value = p.name;

  const colorsDiv = document.getElementById('modalColors');
  colorsDiv.innerHTML = '';
  COLORS.forEach(c => {
    if (!/^#[0-9a-fA-F]{3,8}$/.test(c)) return;
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (c === p.color ? ' selected' : '');
    swatch.style.background = c;
    swatch.dataset.color = c;
    swatch.addEventListener('click', () => {
      colorsDiv.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
    });
    colorsDiv.appendChild(swatch);
  });

  overlay.classList.add('active');
}

function saveSettings() {
  const p = appConfig.panels.find(x => x.id === editingPanelId);
  if (!p) return;

  p.name = document.getElementById('modalNickname').value.trim() || '패널 ' + p.id;
  const sel = document.querySelector('.color-swatch.selected');
  if (sel && COLORS.includes(sel.dataset.color)) p.color = sel.dataset.color;

  // DOM 반영
  const allPanels = [...document.querySelectorAll('.panel')];
  const panel = allPanels.find(el => el.dataset.id === String(p.id));
  if (panel) {
    panel.style.borderColor = p.color;
    panel.querySelector('.badge').style.background = p.color;
    panel.querySelector('.panel-title').textContent = p.name;
    const wv = panel.querySelector('webview');
    if (wv) wv.style.borderLeftColor = p.color;
  }

  renderLegend();
  closeSettings();
}

function closeSettings() {
  const overlay = document.getElementById('settingsOverlay');
  if (overlay) overlay.classList.remove('active');
  setEditingPanelId(null);
}
