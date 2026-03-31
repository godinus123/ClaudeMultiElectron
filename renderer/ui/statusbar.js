/**
 * @file    statusbar.js
 * @desc    상태바 레전드 + 시계
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends state.js, layouts.js
 * @exports renderLegend, startClock
 */

import { appConfig } from '../core/state.js';
import { layouts } from '../layout/layouts.js';

export function renderLegend() {
  const statusLegend = document.getElementById('statusLegend');
  const layoutSelect = document.getElementById('layout');
  if (!statusLegend || !appConfig) return;
  const l = layouts[layoutSelect?.value] || layouts['4-quad'];
  statusLegend.innerHTML = '';
  appConfig.panels.slice(0, l.show).forEach((p, i) => {
    if (i > 0) statusLegend.appendChild(document.createTextNode('\u00A0\u00A0'));
    const span = document.createElement('span');
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = p.color;
    span.appendChild(dot);
    span.appendChild(document.createTextNode(p.name));
    statusLegend.appendChild(span);
  });
}

let clockIntervalId = null;

export function startClock() {
  if (clockIntervalId) clearInterval(clockIntervalId);
  const clock = document.getElementById('clock');
  const layoutPicker = document.getElementById('layoutPicker');
  clockIntervalId = setInterval(() => {
    const activeBtn = layoutPicker ? layoutPicker.querySelector('.layout-icon.active') : null;
    const key = activeBtn ? activeBtn.dataset.layout : '4-quad';
    const l = layouts[key] || layouts['4-quad'];
    clock.textContent = l.show + '패널 │ ' + key + ' │ ' + new Date().toLocaleString('ko-KR');
  }, 1000);
}
