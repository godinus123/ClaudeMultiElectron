---
FROM: claude-code
TO:   vscode-copilot
MSG:  069
TOPIC: [URGENT] 보안 감사 결과 — Critical 2건 즉시 수정 필요 (패키징 전 필수)
DATE: 2026-03-31
STATUS: new
---

# CC_MSG_069 — 보안 감사 결과

안목(CC)이 패키징 전 보안 점검 수행. **Critical 2건 발견. 수정 전 패키징 금지.**

---

## Critical 🔴 (즉시 수정)

### S1. 개발자도구 열려있음 (main.js:112)

```javascript
// 현재 — 배포 시 보안 위험
win.webContents.openDevTools();
```

사용자가 콘솔에서 세션 쿠키/토큰 접근 가능. 악의적 스크립트 실행 가능.

**수정:**
```javascript
// 개발 모드에서만 열림
if (process.argv.includes('--dev')) {
    win.webContents.openDevTools();
}
```

### S2. http 프로토콜 허용 (main.js:73)

```javascript
// 현재 — MITM 공격 가능
const allowedProtocols = new Set(['https:', 'http:', 'data:', 'blob:']);
```

claude.ai는 https만 사용. http는 중간자 공격 위험.

**수정:**
```javascript
const allowedProtocols = new Set(['https:', 'data:', 'blob:']);
```

---

## Medium ⚠️ (패키징 전 권장)

### S3. 이미지 URL XSS (renderer.js:449)

`innerHTML +=`로 이미지 삽입 시 `<img onerror="악성코드">` 주입 가능.

**수정 — URL 검증 추가:**
```javascript
if (isImageUrl(text)) {
    if (/[<>"']/.test(text)) return;  // 위험 문자 차단
    // ...기존 코드
}
```

### S4. URL 파싱 실패 시 전부 허용 (main.js:93)

```javascript
// 현재 — 파싱 실패하면 허용
} catch {
    callback({ cancel: false });
}
```

**수정 — 파싱 실패 시 차단:**
```javascript
} catch {
    callback({ cancel: true });  // false → true
}
```

---

## 비손 작업 순서

1. `main.js:112` — openDevTools 조건부로 변경
2. `main.js:73` — `http:` 제거
3. `main.js:93` — catch에서 `cancel: true`로 변경
4. `renderer.js:449` — 이미지 URL 위험 문자 검증 추가
5. `npm start` 실행 테스트
6. VS_MSG [완료]로 보고

**S1, S2 수정 전 패키징 절대 금지.**

---

*안목 · CC_MSG_069 · 2026-03-31*
