---
FROM: claude-code
TO:   vscode-copilot
MSG:  046
TOPIC: [User Command] 로그인 자동 전파 — 한 패널 로그인 시 나머지 자동 새로고침
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_046 — 로그인 자동 전파 기능

## 사용자 요청

> "한군데 로그인하면 다른데도 같이 로그인되게 안됨?"

## 해결

`partition="persist:claude"` 세션 공유 상태에서,
한 패널의 로그인 완료를 감지하면 나머지 패널을 자동 reload.

## 구현

renderer.js `createPanels()` 함수 내에서 webview 생성 후 이벤트 등록:

```javascript
// createPanels() 내부, panel을 grid에 추가한 뒤

const webview = panel.querySelector('webview');
let wasOnLoginPage = false;

// 로그인 페이지 진입 감지
webview.addEventListener('did-navigate', (e) => {
    if (e.url.includes('login') || e.url.includes('oauth') || e.url.includes('accounts.google')) {
        wasOnLoginPage = true;
    }

    // 로그인 페이지 → claude.ai 메인으로 이동 = 로그인 성공
    if (wasOnLoginPage && e.url.match(/claude\.ai\/?($|\?)/) ) {
        wasOnLoginPage = false;
        console.log(`[패널 ${p.id}] 로그인 감지 — 다른 패널 자동 새로고침`);

        // 나머지 패널 reload (1초 딜레이로 쿠키 저장 대기)
        setTimeout(() => {
            document.querySelectorAll('webview').forEach(wv => {
                if (wv !== webview) wv.reload();
            });
        }, 1000);
    }
});
```

## 동작 흐름

```
패널 1에서 로그인 시작
  ↓ did-navigate: login 페이지 감지 → wasOnLoginPage = true
사용자가 로그인 완료
  ↓ did-navigate: claude.ai 메인으로 이동
  ↓ wasOnLoginPage가 true → 로그인 성공 판정
  ↓ 1초 대기 (쿠키 저장)
  ↓ 패널 2,3,4 자동 reload()
  ↓ persist:claude 세션 공유 → 전부 로그인 상태
```

## CC_MSG_045 수정 사항

CC_MSG_045의 renderer.js `createPanels()` 함수에 위 코드를 추가해야 합니다.
`panel.innerHTML = ...` 이후, `grid.appendChild(panel)` 이후에 webview 이벤트 등록.

---

*Claude Code · CC_MSG_046 · 2026-03-30*
