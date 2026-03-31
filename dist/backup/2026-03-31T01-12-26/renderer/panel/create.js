/**
 * @file    create.js
 * @desc    패널 생성 + 헤더 버튼
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends state.js, config.js
 * @exports createPanel, renderPanels
 */

import { appConfig } from '../core/state.js';
import { resetPanel } from './reset.js';
import { setupLoginDetect } from './login.js';
import { grabFromPanel } from '../clipboard/grab.js';
import { dropToPanel } from '../clipboard/drop-to.js';
import { relayResponse } from '../transfer/relay.js';
import { handleDrop } from '../transfer/drop.js';
import { openSettings } from '../ui/settings.js';
import { renderLegend } from '../ui/statusbar.js';

export function createPanel(def) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.dataset.id = String(def.id);
  panel.style.borderColor = def.color;

  const header = document.createElement('div');
  header.className = 'panel-header';

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = String(def.id);
  badge.style.background = def.color;

  const title = document.createElement('span');
  title.className = 'panel-title';
  title.textContent = def.name;

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'panel-btn';
  settingsBtn.textContent = '⚙';
  settingsBtn.title = '패널 설정';
  settingsBtn.addEventListener('click', () => openSettings(def.id));

  const grabBtn = document.createElement('button');
  grabBtn.className = 'panel-grab';
  grabBtn.textContent = '📋잡기';
  grabBtn.addEventListener('click', () => grabFromPanel(def.id));

  const dropBtn = document.createElement('button');
  dropBtn.className = 'panel-drop disabled';
  dropBtn.textContent = '📥놓기';
  dropBtn.addEventListener('click', () => dropToPanel(def.id));

  const resetBtn = document.createElement('button');
  resetBtn.className = 'panel-btn';
  resetBtn.textContent = '↺';
  resetBtn.addEventListener('click', () => resetPanel(def.id));

  const relaySelect = document.createElement('select');
  relaySelect.className = 'panel-relay';
  relaySelect.title = '응답 전달';

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '➡';
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  relaySelect.appendChild(defaultOpt);

  appConfig.panels.forEach(target => {
    if (target.id === def.id) return;
    const opt = document.createElement('option');
    opt.value = String(target.id);
    opt.textContent = `→ ${target.id} ${target.name}`;
    relaySelect.appendChild(opt);
  });

  relaySelect.addEventListener('change', () => {
    const targetId = Number(relaySelect.value);
    if (targetId) {
      relayResponse(def.id, targetId);
      relaySelect.selectedIndex = 0;
    }
  });

  const wv = document.createElement('webview');
  wv.src = appConfig.url;
  wv.setAttribute('partition', 'persist:claude');
  wv.style.borderLeftColor = def.color;

  setupLoginDetect(wv);

  // 드롭 존
  const dropHint = document.createElement('span');
  dropHint.className = 'drop-hint';

  const dropOverlay = document.createElement('div');
  dropOverlay.className = 'drop-overlay';
  dropOverlay.innerHTML = '<div class="drop-overlay-text">📥 여기에 놓기</div>';

  dropOverlay.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; });
  dropOverlay.addEventListener('dragleave', e => { e.preventDefault(); e.stopPropagation(); dropOverlay.classList.remove('visible'); });
  dropOverlay.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); dropOverlay.classList.remove('visible'); handleDrop(e.dataTransfer, def.id, wv, dropHint); });
  panel.addEventListener('dragenter', e => { e.preventDefault(); dropOverlay.classList.add('visible'); });

  header.appendChild(badge);
  header.appendChild(title);
  header.appendChild(dropHint);
  header.appendChild(settingsBtn);
  header.appendChild(grabBtn);
  header.appendChild(dropBtn);
  header.appendChild(relaySelect);
  header.appendChild(resetBtn);
  panel.appendChild(header);
  panel.appendChild(dropOverlay);
  panel.appendChild(wv);
  return panel;
}

export function renderPanels() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  appConfig.panels.forEach(def => grid.appendChild(createPanel(def)));
  renderLegend();
}
