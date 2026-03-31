/**
 * @file    login.js
 * @desc    로그인 감지 + 자동 전파
 * @owner   안목
 * @version 1.0.0
 * @date    2026-03-31
 * @exports setupLoginDetect
 */

export function setupLoginDetect(wv) {
  let wasOnLoginPage = false;
  wv.addEventListener('did-navigate', e => {
    const url = String(e.url || '');
    if (url.includes('login') || url.includes('oauth') || url.includes('accounts.google')) {
      wasOnLoginPage = true;
    }
    if (wasOnLoginPage && /claude\.ai\/?($|\?)/.test(url)) {
      wasOnLoginPage = false;
      setTimeout(() => {
        document.querySelectorAll('webview').forEach(other => {
          if (other !== wv) other.reload();
        });
      }, 1000);
    }
  });
}
