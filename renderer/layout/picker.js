/**
 * @file    picker.js
 * @desc    레이아웃 SVG 아이콘 피커
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends layouts.js, apply.js
 * @exports buildLayoutPicker, syncActiveLayoutIcon
 */

import { layouts, layoutIconGroups, layoutSvgMap } from './layouts.js';
import { applyLayout } from './apply.js';

export function buildLayoutPicker() {
  const picker = document.getElementById('layoutPicker');
  const select = document.getElementById('layout');
  if (!picker) return;
  picker.innerHTML = '';

  layoutIconGroups.forEach((group, gi) => {
    group.forEach(([key, title]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'layout-icon';
      btn.dataset.layout = key;
      btn.title = title;
      btn.innerHTML = layoutSvgMap[key] || '';
      btn.addEventListener('click', () => {
        if (select) select.value = key;
        applyLayout(key);
        syncActiveLayoutIcon();
      });
      picker.appendChild(btn);
    });

    if (gi < layoutIconGroups.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'layout-sep';
      picker.appendChild(sep);
    }
  });
}

export function syncActiveLayoutIcon() {
  const picker = document.getElementById('layoutPicker');
  const select = document.getElementById('layout');
  if (!picker || !select) return;
  const current = select.value;
  picker.querySelectorAll('.layout-icon').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layout === current);
  });
}
