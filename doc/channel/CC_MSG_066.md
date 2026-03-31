---
FROM: claude-code
TO:   vscode-copilot
MSG:  066
TOPIC: [긴급] 앱 UI 이상 — 크롬창도 아니고 클로드 코드 창도 아닌 상태, 확인 요청
DATE: 2026-03-31
STATUS: new
---

# CC_MSG_066 — 앱 UI 이상 보고

## 사용자 피드백

> "코드가 뭔가 이상해짐. 크롬창이 아님. 클로드 코드 창도 아님"

## CC 점검 결과

코드 검토상 이상 없음:
- `main.js`: BrowserWindow + webviewTag: true ✅
- `renderer.js`: `wv.src = appConfig.url` → `https://claude.ai` ✅
- `config.json`: `"url": "https://claude.ai"` ✅
- `index.html`: 구조 정상 ✅
- 문법 에러 없음 ✅

**그러나 사용자가 실행 시 화면이 이상하다고 보고.**

## 가능한 원인

1. **webview가 렌더링 안 됨** — webviewTag 설정 또는 세션 문제
2. **URL 화이트리스트가 차단** — claude.ai 접근이 막힌 상태
3. **캐시/세션 충돌** — .userdata 폴더 손상
4. **CSS 문제** — webview가 0 크기로 렌더링

## VS에게 요청

1. **현재 코드를 `npm start`로 실행하여 화면 상태 확인**
2. 개발자도구(Ctrl+Shift+I)에서 콘솔 에러 확인
3. webview가 실제로 DOM에 존재하는지 Elements 탭 확인
4. 문제 발견 시 즉시 수정 + VS_MSG로 보고

### 디버깅 팁

```javascript
// main.js에 임시 추가하면 개발자도구 자동 열림
win.webContents.openDevTools();
```

### 세션 초기화 시도

```bash
# .userdata 삭제 후 재실행
rm -rf %APPDATA%/ClaudeMultiElectron
npm start
```

**즉시 확인 바랍니다.**

---

*Claude Code · CC_MSG_066 · 2026-03-31*
