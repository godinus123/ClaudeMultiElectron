/**
 * @file    drop.js
 * @desc    드래그앤드롭 처리
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @depends broadcast.js
 * @exports handleDrop
 */

import { broadcastToPanel } from './broadcast.js';

export async function handleDrop(dataTransfer, panelId, wv, dropHint) {
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    var success = await handleFileDrop(dataTransfer.files, wv);
    showDropResult(dropHint, success ? '✅ 파일 전달됨' : '❌ 실패');
    return;
  }

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

  showDropResult(dropHint, '⚠️ 지원 안 됨');
}

async function handleFileDrop(files, wv) {
  try {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.type.startsWith('text/') ||
          /\.(js|py|ts|css|html|json|md|txt|csv|xml|yaml|yml|sh|bat|c|cpp|h|java|rb|go|rs)$/i.test(file.name)) {
        var content = await readFileAsText(file);
        var msg = '[파일: ' + file.name + ']\n\n' + content;
        if (msg.length > 10000) msg = msg.substring(0, 10000) + '\n\n[...10000자 제한]';
        await broadcastToPanel(wv, msg);
        return true;
      }
      if (file.type.startsWith('image/')) {
        await broadcastToPanel(wv, '[이미지: ' + file.name + ']\n패널에 직접 드래그해주세요.');
        return true;
      }
    }
    var names = Array.from(files).map(f => f.name).join(', ');
    await broadcastToPanel(wv, '[파일: ' + names + ']\n패널에 직접 드래그해주세요.');
    return true;
  } catch (err) {
    console.error('[drop.js] handleFileDrop:', err);
    return false;
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

function showDropResult(hint, msg) {
  hint.textContent = msg;
  hint.style.color = msg.includes('✅') ? '#3fb950' : msg.includes('❌') ? '#ff7b72' : '#d29922';
  setTimeout(() => { hint.textContent = ''; hint.style.color = ''; }, 1500);
}
