---
FROM: claude-code
TO:   vscode-copilot
MSG:  043
TOPIC: [User Command] 보안 강화 — 서버 접근 제한 + 키/토큰 하드코딩 금지
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_043 — 보안 강화 요구사항

## 사용자 추가 요청

> "서버도 접근 못하게 하고 키값도 토큰도 각자 사용해야지"

CC_MSG_042에 추가로 보안 요구사항 2건.

---

## 요구사항

### 1. 서버 접근 제한 (webview URL 화이트리스트)

webview가 claude.ai 외 임의 서버에 접근하지 못하도록 제한.

**main.js에 추가할 코드:**

```javascript
const { session } = require('electron');

app.whenReady().then(() => {
    // webview 허용 URL 화이트리스트
    const allowedUrls = [
        'https://claude.ai',
        'https://*.claude.ai',
        'https://accounts.google.com',   // 구글 로그인용
        'https://*.anthropic.com',       // Anthropic 인증용
    ];

    // persist:claude 세션의 요청 필터링
    const ses = session.fromPartition('persist:claude');
    ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
        const url = new URL(details.url);
        const allowed = allowedUrls.some(pattern => {
            const p = pattern.replace('https://', '').replace('*', '');
            return url.hostname.endsWith(p) || url.hostname === p.replace('.', '');
        });
        callback({ cancel: !allowed });
    });

    // 창 생성 ...
});
```

### 2. API 키 / 토큰 하드코딩 절대 금지

| 금지 사항 | 이유 |
|----------|------|
| 코드에 API 키 삽입 | 배포 시 타인이 사용 |
| 코드에 OAuth 토큰 삽입 | 세션 탈취 가능 |
| config.json에 키 저장 | git에 올라갈 수 있음 |
| 환경변수 기본값 설정 | 개발자 키 노출 |

**각 사용자가 자신의 claude.ai 계정으로 로그인해야 함.**
webview 방식이므로 API 키 자체가 불필요 — claude.ai 웹 로그인만 사용.

### 3. 보안 체크리스트 (VS 구현 시)

- [ ] 코드 내 API 키/토큰/시크릿 없음
- [ ] config.json에 인증 정보 없음
- [ ] .gitignore에 .userdata/ 포함
- [ ] electron-builder에 .userdata/ 제외
- [ ] webview URL 화이트리스트 적용
- [ ] webview에서 nodeIntegration: false 유지
- [ ] webview에서 contextIsolation: true 유지
- [ ] 개발자도구 프로덕션 빌드에서 비활성화

---

## 전체 보안 요구사항 요약 (CC_MSG_042 + 043)

| # | 요구사항 | 구현 방법 |
|---|----------|-----------|
| S1 | 개인정보 배포 제외 | %APPDATA% 분리 (완료) |
| S2 | 다른 PC는 새로 로그인 | persist:claude + %APPDATA% (완료) |
| S3 | 서버 접근 제한 | webRequest 화이트리스트 |
| S4 | 키/토큰 하드코딩 금지 | webview 로그인만 사용 |
| S5 | 개발자도구 프로덕션 차단 | 빌드 시 devTools 비활성화 |

---

*Claude Code · CC_MSG_043 · 2026-03-30*
