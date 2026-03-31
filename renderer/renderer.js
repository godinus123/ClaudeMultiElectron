const defaultPanelDefs = [
  { id: 1, name: '프론트봇', color: '#1f6feb' },
  { id: 2, name: '백엔드봇', color: '#3fb950' },
  { id: 3, name: '테스터', color: '#a371f7' },
  { id: 4, name: '문서봇', color: '#d29922' },
  { id: 5, name: '디버그봇', color: '#ff7b72' },
  { id: 6, name: '인프라봇', color: '#39d353' },
  { id: 7, name: '리서치봇', color: '#58a6ff' },
  { id: 8, name: '리뷰봇', color: '#e3b341' },
  { id: 9, name: '기타봇', color: '#e6edf3' },
];

const layouts = {
  '1-full':     { cols: '1fr',             rows: '1fr',             show: 1 },
  '2-side':     { cols: '1fr 1fr',         rows: '1fr',             show: 2 },
  '2-vert':     { cols: '1fr',             rows: '1fr 1fr',         show: 2 },
  '4-quad':     { cols: '1fr 1fr',         rows: '1fr 1fr',         show: 4 },
  '6-grid':     { cols: '1fr 1fr 1fr',     rows: '1fr 1fr',         show: 6 },
  '9-grid':     { cols: '1fr 1fr 1fr',     rows: '1fr 1fr 1fr',     show: 9 },
  '1+3-right':  { cols: '3fr 1fr',         rows: '1fr 1fr 1fr',     show: 4, span: { 0: 'row' } },
  '1+3-bottom': { cols: '1fr 1fr 1fr',     rows: '3fr 1fr',         show: 4, span: { 0: 'col3' } },
  '3+1-left':   { cols: '1fr 3fr',         rows: '1fr 1fr 1fr',     show: 4, span: { 0: 'row-at-col2' } },
};

const defaultConfig = {
  panels: defaultPanelDefs,
  defaultLayout: '4-quad',
  url: 'https://claude.ai',
};

let appConfig = { ...defaultConfig };

const grid = document.getElementById('grid');
const layoutPicker = document.getElementById('layoutPicker');
const layoutSelect = document.getElementById('layout');
const resetAllBtn = document.getElementById('resetAllBtn');
const bcTarget = document.getElementById('bcTarget');
const broadcastInput = document.getElementById('broadcastInput');
const broadcastBtn = document.getElementById('broadcastBtn');
const statusLegend = document.getElementById('statusLegend');
const clock = document.getElementById('clock');
const clipboardBar = document.getElementById('clipboardBar');
const clipboardHeader = document.getElementById('clipboardHeader');
const clipboardSource = document.getElementById('clipboardSource');
const clipboardBody = document.getElementById('clipboardBody');
const clipboardText = document.getElementById('clipboardText');
const clipboardClearBtn = document.getElementById('clipboardClearBtn');
const clipboardToggleBtn = document.getElementById('clipboardToggleBtn');

let clipboardFromId = null;
let clipboardExpanded = false;
let editingPanelId = null;

const COLORS = [
  '#1f6feb', '#3fb950', '#a371f7', '#d29922',
  '#ff7b72', '#39d353', '#58a6ff', '#e3b341', '#e6edf3'
];

const clipboardDropOverlay = document.getElementById('clipboardDropOverlay');

const layoutIconGroups = [
  [
    ['4-quad', '4-쿼드'],
    ['1-full', '1-전체'],
    ['2-side', '2-좌우'],
    ['2-vert', '2-상하'],
    ['6-grid', '6-2x3'],
    ['9-grid', '9-채널'],
  ],
  [
    ['1+3-right', '액티브+우3'],
    ['1+3-bottom', '액티브+하3'],
    ['3+1-left', '좌3+액티브'],
  ],
];

const layoutSvgMap = {
  '1-full':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="14" rx="1"/></svg>',
  '2-side':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="8" height="14" rx="1"/><rect x="11" y="1" width="8" height="14" rx="1"/></svg>',
  '2-vert':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="6" rx="1"/><rect x="1" y="9" width="18" height="6" rx="1"/></svg>',
  '4-quad':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="8" height="6" rx="1"/><rect x="11" y="1" width="8" height="6" rx="1"/><rect x="1" y="9" width="8" height="6" rx="1"/><rect x="11" y="9" width="8" height="6" rx="1"/></svg>',
  '6-grid':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="5" height="6" rx="1"/><rect x="8" y="1" width="5" height="6" rx="1"/><rect x="15" y="1" width="4" height="6" rx="1"/><rect x="1" y="9" width="5" height="6" rx="1"/><rect x="8" y="9" width="5" height="6" rx="1"/><rect x="15" y="9" width="4" height="6" rx="1"/></svg>',
  '9-grid':     '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="5" height="4" rx=".5"/><rect x="8" y="1" width="5" height="4" rx=".5"/><rect x="15" y="1" width="4" height="4" rx=".5"/><rect x="1" y="6" width="5" height="4" rx=".5"/><rect x="8" y="6" width="5" height="4" rx=".5"/><rect x="15" y="6" width="4" height="4" rx=".5"/><rect x="1" y="11" width="5" height="4" rx=".5"/><rect x="8" y="11" width="5" height="4" rx=".5"/><rect x="15" y="11" width="4" height="4" rx=".5"/></svg>',
  '1+3-right':  '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="13" height="14" rx="1"/><rect x="15" y="1" width="4" height="4" rx=".5"/><rect x="15" y="6" width="4" height="4" rx=".5"/><rect x="15" y="11" width="4" height="4" rx=".5"/></svg>',
  '1+3-bottom': '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="18" height="9" rx="1"/><rect x="1" y="11" width="5" height="4" rx=".5"/><rect x="8" y="11" width="5" height="4" rx=".5"/><rect x="15" y="11" width="4" height="4" rx=".5"/></svg>',
  '3+1-left':   '<svg viewBox="0 0 20 16"><rect x="1" y="1" width="4" height="4" rx=".5"/><rect x="1" y="6" width="4" height="4" rx=".5"/><rect x="1" y="11" width="4" height="4" rx=".5"/><rect x="6" y="1" width="13" height="14" rx="1"/></svg>',
};

async function loadConfig() {
  try {
    const res = await fetch('../config.json', { cache: 'no-store' });
    if (!res.ok) return;
    const cfg = await res.json();
    const panels = Array.isArray(cfg.panels) && cfg.panels.length > 0
      ? cfg.panels.map((p) => ({ id: p.id, name: p.name || p.nickname || `패널 ${p.id}`, color: p.color }))
      : defaultConfig.panels;
    appConfig = {
      panels,
      defaultLayout: typeof cfg.defaultLayout === 'string' ? cfg.defaultLayout : defaultConfig.defaultLayout,
      url: typeof cfg.url === 'string' ? cfg.url : defaultConfig.url,
    };
  } catch {
    // fallback to defaults
  }
}

function createPanel(def) {
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

  const resetBtn = document.createElement('button');
  resetBtn.className = 'panel-btn';
  resetBtn.textContent = '↺';
  resetBtn.addEventListener('click', () => resetPanel(def.id));

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
  dropBtn.className = 'panel-drop';
  dropBtn.textContent = '📥놓기';
  dropBtn.addEventListener('click', () => dropToPanel(def.id));

  const relaySelect = document.createElement('select');
  relaySelect.className = 'panel-relay';
  relaySelect.title = '응답 전달';

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '➡';
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  relaySelect.appendChild(defaultOpt);

  appConfig.panels.forEach((target) => {
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

  let wasOnLoginPage = false;
  wv.addEventListener('did-navigate', (e) => {
    const url = String(e.url || '');
    if (url.includes('login') || url.includes('oauth') || url.includes('accounts.google')) {
      wasOnLoginPage = true;
    }

    if (wasOnLoginPage && /claude\.ai\/?($|\?)/.test(url)) {
      wasOnLoginPage = false;
      setTimeout(() => {
        document.querySelectorAll('webview').forEach((other) => {
          if (other !== wv) other.reload();
        });
      }, 1000);
    }
  });

  // ── 드롭 존 힌트 텍스트 (헤더 내) ──
  var dropHint = document.createElement('span');
  dropHint.className = 'drop-hint';

  // ── 드롭 오버레이 (패널 전체 덮음) ──
  var dropOverlay = document.createElement('div');
  dropOverlay.className = 'drop-overlay';
  dropOverlay.innerHTML = '<div class="drop-overlay-text">📥 여기에 놓기<br><span style="font-size:11px;color:#8b949e;">텍스트, 파일, 이미지</span></div>';

  // 오버레이에 드래그 이벤트 (오버레이가 보일 때 드롭 받음)
  dropOverlay.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  });

  dropOverlay.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dropOverlay.classList.remove('visible');
  });

  dropOverlay.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dropOverlay.classList.remove('visible');
    handleDrop(e.dataTransfer, def.id, wv, dropHint);
  });

  // 패널 전체에 dragenter 감지 (webview 위에서도)
  panel.addEventListener('dragenter', function(e) {
    e.preventDefault();
    dropOverlay.classList.add('visible');
  });

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

function renderPanels() {
  grid.innerHTML = '';
  appConfig.panels.forEach((def) => grid.appendChild(createPanel(def)));
  renderLegend();
}

function renderLegend() {
  var l = layouts[layoutSelect.value] || layouts['4-quad'];
  statusLegend.innerHTML = appConfig.panels
    .slice(0, l.show)
    .map((p) => `<span><span class="dot" style="background:${p.color}"></span>${p.name}</span>`)
    .join('&nbsp;&nbsp;');
}

function applyLayout(key) {
  const l = layouts[key];
  if (!l) return;
  grid.style.gridTemplateColumns = l.cols;
  grid.style.gridTemplateRows = l.rows;

  [...grid.children].forEach((panel, index) => {
    panel.style.gridRow = '';
    panel.style.gridColumn = '';

    if (index < l.show) {
      panel.classList.remove('hidden');
      panel.style.display = 'flex';
    } else {
      panel.classList.add('hidden');
      panel.style.display = '';
    }
  });

  if (l.span) {
    const panels = [...grid.children];
    for (const [idx, type] of Object.entries(l.span)) {
      const panel = panels[Number(idx)];
      if (!panel) continue;
      switch (type) {
        case 'row':
          panel.style.gridRow = '1 / -1';
          break;
        case 'col2':
          panel.style.gridColumn = 'span 2';
          break;
        case 'col3':
          panel.style.gridColumn = 'span 3';
          break;
        case 'row-at-col2':
          panel.style.gridColumn = '2';
          panel.style.gridRow = '1 / -1';
          break;
      }
    }
  }

  renderLegend();
}

function resetPanel(id) {
  const panel = [...grid.children].find((x) => Number(x.dataset.id) === id);
  if (!panel) return;
  const wv = panel.querySelector('webview');
  if (!wv) return;

  const ok = window.confirm('현재 대화가 초기화됩니다. 계속하시겠습니까?');
  if (!ok) return;
  wv.loadURL(appConfig.url);
}

function resetAll() {
  const ok = window.confirm('전체 패널 대화가 초기화됩니다. 계속하시겠습니까?');
  if (!ok) return;

  document.querySelectorAll('webview').forEach((wv) => {
    wv.loadURL(appConfig.url);
  });
}

function setClipboardExpanded(expanded) {
  clipboardExpanded = expanded;
  if (!clipboardBody || !clipboardToggleBtn) return;
  clipboardBody.style.display = expanded ? 'block' : 'none';
  clipboardToggleBtn.textContent = expanded ? '▲' : '▼';
}

function isImageUrl(url) {
  return /^https?:\/\/.+\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

function renderClipboardPreview() {
  if (!clipboardBody || !clipboardText) return;
  var val = clipboardText.value.trim();
  var preview = clipboardBody.querySelector('.clipboard-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'clipboard-preview';
    clipboardBody.insertBefore(preview, clipboardText.nextSibling);
  }
  preview.innerHTML = '';
  if (isImageUrl(val)) {
    preview.innerHTML = '<img src="' + val + '" style="max-width:180px;max-height:120px;border:1px solid #30363d;margin:6px 0;">';
  }
}

function hasClipboardText() {
  return Boolean((clipboardText?.value || '').trim());
}

function refreshDropButtons() {
  const enabled = hasClipboardText();
  document.querySelectorAll('.panel-drop').forEach((btn) => {
    if (enabled) {
      btn.classList.remove('disabled');
      btn.removeAttribute('disabled');
    } else {
      btn.classList.add('disabled');
      btn.setAttribute('disabled', 'disabled');
    }
  });
}

// ══════════════════════════════════════════════════════
// 설정 모달
// ══════════════════════════════════════════════════════

function openSettings(panelId) {
  editingPanelId = panelId;
  var p = appConfig.panels.find(function(x) { return x.id === panelId; });
  if (!p) return;

  var overlay = document.getElementById('settingsOverlay');
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
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeSettings();
    });
  }

  document.getElementById('modalTitle').textContent = '패널 ' + panelId + ' 설정';
  document.getElementById('modalNickname').value = p.name;

  var colorsDiv = document.getElementById('modalColors');
  colorsDiv.innerHTML = '';
  COLORS.forEach(function(c) {
    var swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (c === p.color ? ' selected' : '');
    swatch.style.background = c;
    swatch.dataset.color = c;
    swatch.addEventListener('click', function() {
      colorsDiv.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('selected'); });
      swatch.classList.add('selected');
    });
    colorsDiv.appendChild(swatch);
  });

  overlay.classList.add('active');
}

function saveSettings() {
  var p = appConfig.panels.find(function(x) { return x.id === editingPanelId; });
  if (!p) return;

  var newName = document.getElementById('modalNickname').value.trim() || '패널 ' + p.id;
  var sel = document.querySelector('.color-swatch.selected');
  var newColor = sel ? sel.dataset.color : p.color;

  p.name = newName;
  p.color = newColor;

  // DOM 반영
  var panel = document.getElementById('panel-' + p.id) ||
    [...grid.children].find(function(el) { return el.dataset.id === String(p.id); });
  if (panel) {
    panel.style.borderColor = newColor;
    panel.querySelector('.badge').style.background = newColor;
    panel.querySelector('.panel-title').textContent = newName;
    var wv = panel.querySelector('webview');
    if (wv) wv.style.borderLeftColor = newColor;
  }

  renderLegend();
  closeSettings();
}

function closeSettings() {
  var overlay = document.getElementById('settingsOverlay');
  if (overlay) overlay.classList.remove('active');
  editingPanelId = null;
}

function clearClipboard() {
  clipboardFromId = null;
  if (clipboardSource) clipboardSource.textContent = '[비어있음]';
  if (clipboardText) clipboardText.value = '';
  if (clipboardClearBtn) clipboardClearBtn.style.display = 'none';
  setClipboardExpanded(false);
  refreshDropButtons();
}

function setClipboardContent(fromPanelId, panelName, text) {
  clipboardFromId = fromPanelId;
  if (clipboardSource) clipboardSource.textContent = `[${fromPanelId} ${panelName}에서 가져옴]`;
  if (clipboardText) clipboardText.value = text || '';
  if (clipboardClearBtn) clipboardClearBtn.style.display = 'inline-block';
  setClipboardExpanded(true);
  refreshDropButtons();
}

async function extractLatestResponseFromPanel(panelId) {
  const panel = [...grid.children].find((p) => p.dataset.id === String(panelId));
  if (!panel) return '';
  const wv = panel.querySelector('webview');
  if (!wv) return '';

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

  try {
    const responseText = await wv.executeJavaScript(extractScript);
    return String(responseText || '').trim();
  } catch {
    return '';
  }
}

async function grabFromPanel(panelId) {
  const def = appConfig.panels.find((p) => p.id === panelId);
  const text = await extractLatestResponseFromPanel(panelId);
  if (!text) {
    if (clipboardSource) clipboardSource.textContent = `[${panelId} 응답 없음]`;
    return;
  }

  const maxLen = 20000;
  setClipboardContent(panelId, def?.name || `패널${panelId}`, text.slice(0, maxLen));
}

async function dropToPanel(panelId) {
  const text = (clipboardText?.value || '').trim();
  if (!text) return;

  const panel = [...grid.children].find((p) => p.dataset.id === String(panelId));
  if (!panel) return;
  const wv = panel.querySelector('webview');
  if (!wv) return;

  // 이미지 URL이면 <img src=...>로, 아니면 텍스트 그대로
  if (isImageUrl(text)) {
    const html = `<img src=\"${text}\" style=\"max-width:100%;\">`;
    const script = `
      (function() {
        var el = document.querySelector('div.ProseMirror[contenteditable="true"]')
          || document.querySelector('div[contenteditable="true"]')
          || document.querySelector('textarea');
        if (!el) return false;
        el.focus();
        if (el.nodeName === 'DIV') {
          el.innerHTML += ${JSON.stringify(html)};
        } else if ('value' in el) {
          el.value += ${JSON.stringify(text)};
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      })();
    `;
    await wv.executeJavaScript(script).catch(() => {});
  } else {
    await broadcastToPanel(wv, text);
  }
}

function broadcastToPanel(wv, text) {
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
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        }));
      }, 300);

      return true;
    })();
  `;
  return wv.executeJavaScript(script).catch(() => {});
}

function broadcastAll() {
  const text = (broadcastInput.value || '').trim();
  if (!text) return;
  broadcastInput.value = '';

  const target = bcTarget ? bcTarget.value : 'all';

  if (target !== 'all') {
    const targetPanel = [...grid.children].find((p) => p.dataset.id === target);
    if (targetPanel) {
      const wv = targetPanel.querySelector('webview');
      if (wv) {
        broadcastToPanel(wv, text);
      }
    }
    return;
  }

  const l = layouts[layoutSelect.value] || layouts['4-quad'];
  const activePanels = [...grid.children].slice(0, l.show);

  activePanels.reduce((promise, panel) => {
    return promise.then(() => {
      const wv = panel.querySelector('webview');
      if (!wv) return;
      return broadcastToPanel(wv, text).then(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );
    });
  }, Promise.resolve());
}

async function relayResponse(fromPanelId, toPanelId) {
  const responseText = await extractLatestResponseFromPanel(fromPanelId);
  if (!responseText) {
    window.alert('패널 ' + fromPanelId + '에서 응답을 찾을 수 없습니다.\n\nclaude 응답이 있는 상태에서 시도해주세요.');
    return;
  }

  const toPanel = [...grid.children].find((p) => p.dataset.id === String(toPanelId));
  if (!toPanel) return;
  const toWv = toPanel.querySelector('webview');
  if (!toWv) return;

  const maxLen = 8000;
  const payload = `[패널${fromPanelId} 응답 전달]\n${responseText.slice(0, maxLen)}`;
  await broadcastToPanel(toWv, payload);
}

// ══════════════════════════════════════════════════════
// 드래그 앤 드롭 처리
// ══════════════════════════════════════════════════════

async function handleDrop(dataTransfer, panelId, wv, dropHint) {
  // 1. 파일이 있으면 파일 처리
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    var success = await handleFileDrop(dataTransfer.files, wv);
    showDropResult(dropHint, success ? '✅ 파일 전달됨' : '❌ 파일 전달 실패');
    return;
  }

  // 2. 텍스트 처리
  var text = dataTransfer.getData('text/plain');
  if (!text) {
    var html = dataTransfer.getData('text/html');
    if (html) {
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      text = tmp.textContent || tmp.innerText || '';
    }
  }

  if (text && text.trim()) {
    await broadcastToPanel(wv, text.trim());
    showDropResult(dropHint, '✅ 텍스트 전달됨');
    return;
  }

  // 3. 못 알아먹음
  showDropResult(dropHint, '⚠️ 지원 안 됨');
}

async function handleFileDrop(files, wv) {
  try {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // 텍스트 계열 파일 — 내용 읽어서 전달
      if (file.type.startsWith('text/') ||
          /\.(js|py|ts|css|html|json|md|txt|csv|xml|yaml|yml|sh|bat|c|cpp|h|java|rb|go|rs|swift|kt)$/i.test(file.name)) {
        var content = await readFileAsText(file);
        var message = '[파일: ' + file.name + ']\n\n' + content;
        if (message.length > 10000) {
          message = message.substring(0, 10000) + '\n\n[...파일이 길어 10000자까지만 전달됨]';
        }
        await broadcastToPanel(wv, message);
        return true;
      }

      // 이미지 — 파일명 안내 (webview에 직접 업로드는 제한적)
      if (file.type.startsWith('image/')) {
        await broadcastToPanel(wv, '[이미지 파일: ' + file.name + ']\n이미지는 패널에 직접 드래그해주세요.');
        return true;
      }
    }

    // 기타 파일
    var names = Array.from(files).map(function(f) { return f.name; }).join(', ');
    await broadcastToPanel(wv, '[파일 드롭: ' + names + ']\n이 파일은 패널에 직접 드래그해주세요.');
    return true;
  } catch (err) {
    console.error('파일 드롭 처리 실패:', err);
    return false;
  }
}

function readFileAsText(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result); };
    reader.onerror = function() { reject(reader.error); };
    reader.readAsText(file, 'utf-8');
  });
}

function showDropResult(dropHint, message) {
  dropHint.textContent = message;
  if (message.includes('✅')) {
    dropHint.style.color = '#3fb950';
  } else if (message.includes('❌')) {
    dropHint.style.color = '#ff7b72';
  } else {
    dropHint.style.color = '#d29922';
  }
  setTimeout(function() {
    dropHint.textContent = '';
    dropHint.style.color = '';
  }, 1500);
}

function populateBcTarget() {
  if (!bcTarget) return;
  bcTarget.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = '전체';
  bcTarget.appendChild(allOpt);

  appConfig.panels.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = String(p.id);
    opt.textContent = `${p.id} ${p.name}`;
    bcTarget.appendChild(opt);
  });
}

function buildLayoutPicker() {
  if (!layoutPicker) return;
  layoutPicker.innerHTML = '';

  layoutIconGroups.forEach((group, groupIndex) => {
    group.forEach(([key, title]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'layout-icon';
      btn.dataset.layout = key;
      btn.title = title;
      btn.innerHTML = layoutSvgMap[key] || '';
      btn.addEventListener('click', () => {
        layoutSelect.value = key;
        applyLayout(key);
        syncActiveLayoutIcon();
      });
      layoutPicker.appendChild(btn);
    });

    if (groupIndex < layoutIconGroups.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'layout-sep';
      layoutPicker.appendChild(sep);
    }
  });
}

function syncActiveLayoutIcon() {
  if (!layoutPicker) return;
  const current = layoutSelect.value;
  layoutPicker.querySelectorAll('.layout-icon').forEach((btn) => {
    if (btn.dataset.layout === current) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

async function init() {
  await loadConfig();

  if (layouts[appConfig.defaultLayout]) {
    layoutSelect.value = appConfig.defaultLayout;
  }

  buildLayoutPicker();
  renderPanels();
  populateBcTarget();
  applyLayout(layoutSelect.value);
  syncActiveLayoutIcon();
  refreshDropButtons();
  setClipboardExpanded(false);

  layoutSelect.addEventListener('change', (e) => {
    applyLayout(e.target.value);
    syncActiveLayoutIcon();
  });

  if (clipboardHeader && clipboardToggleBtn) {
    clipboardHeader.addEventListener('click', (e) => {
      if (e.target === clipboardClearBtn) return;
      setClipboardExpanded(!clipboardExpanded);
    });
  }

  if (clipboardClearBtn) {
    clipboardClearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearClipboard();
    });
  }

  if (clipboardText) {
    clipboardText.addEventListener('input', function() {
      refreshDropButtons();
      renderClipboardPreview();
    });
    clipboardText.addEventListener('paste', function() {
      setTimeout(renderClipboardPreview, 10);
    });
  }

  // 클립보드 바 드래그앤드롭 지원
  if (clipboardBar && clipboardDropOverlay && clipboardText) {
    clipboardBar.addEventListener('dragenter', function(e) {
      e.preventDefault();
      clipboardDropOverlay.classList.add('visible');
    });
    clipboardBar.addEventListener('dragover', function(e) {
      e.preventDefault();
      clipboardDropOverlay.classList.add('visible');
      e.dataTransfer.dropEffect = 'copy';
    });
    clipboardBar.addEventListener('dragleave', function(e) {
      e.preventDefault();
      clipboardDropOverlay.classList.remove('visible');
    });
    clipboardDropOverlay.addEventListener('drop', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      clipboardDropOverlay.classList.remove('visible');
      // 파일 우선, 아니면 텍스트
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('text/')) {
          const content = await readFileAsText(file);
          clipboardText.value = content;
          renderClipboardPreview();
          refreshDropButtons();
        } else if (file.type.startsWith('image/')) {
          // 이미지 파일은 임시 URL 생성 (미리보기만, 실제 전송은 안내)
          const url = URL.createObjectURL(file);
          clipboardText.value = url;
          renderClipboardPreview();
          refreshDropButtons();
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        } else {
          clipboardText.value = '[파일: ' + file.name + ']';
          renderClipboardPreview();
          refreshDropButtons();
        }
        return;
      }
      let text = e.dataTransfer.getData('text/plain');
      if (!text) {
        let html = e.dataTransfer.getData('text/html');
        if (html) {
          let tmp = document.createElement('div');
          tmp.innerHTML = html;
          text = tmp.textContent || tmp.innerText || '';
        }
      }
      if (text && text.trim()) {
        clipboardText.value = text.trim();
        renderClipboardPreview();
        refreshDropButtons();
      }
    });
  }

  resetAllBtn.addEventListener('click', resetAll);
  broadcastBtn.addEventListener('click', broadcastAll);
  broadcastInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      broadcastAll();
    }
  });
}

init();

setInterval(() => {
  var activeBtn = layoutPicker ? layoutPicker.querySelector('.layout-icon.active') : null;
  var currentKey = activeBtn ? activeBtn.dataset.layout : '4-quad';
  var l = layouts[currentKey] || layouts['4-quad'];
  clock.textContent = l.show + '패널 │ ' + currentKey + ' │ ' + new Date().toLocaleString('ko-KR');
}, 1000);
