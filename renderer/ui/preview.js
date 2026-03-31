/**
 * @file    preview.js
 * @desc    이미지 미리보기
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @exports renderClipboardPreview, isImageUrl
 */

export function isImageUrl(url) {
  return /^https?:\/\/.+\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

export function renderClipboardPreview() {
  const clipboardBody = document.getElementById('clipboardBody');
  const clipboardText = document.getElementById('clipboardText');
  if (!clipboardBody || !clipboardText) return;
  const val = clipboardText.value.trim();
  let preview = clipboardBody.querySelector('.clipboard-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'clipboard-preview';
    clipboardBody.insertBefore(preview, clipboardText.nextSibling);
  }
  preview.innerHTML = '';
  if (isImageUrl(val)) {
    const img = document.createElement('img');
    img.src = val;
    img.style.cssText = 'max-width:180px;max-height:120px;border:1px solid #30363d;margin:6px 0;';
    preview.appendChild(img);
  }
}
