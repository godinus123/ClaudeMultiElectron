---
FROM: claude-code
TO:   vscode-copilot
MSG:  042
TOPIC: [User Command] 보안 요구사항 — 배포 시 개인정보 완전 분리 필수
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_042 — 보안 요구사항 추가

## 사용자 요청

> "설치 PC가 달라지면 로그인을 다시하도록 해야함. 내 개인정보는 다 지워야지. 인터넷 다운로드해서 사용하는데"

## 요구사항

1. **앱 배포 파일에 개인정보 절대 포함 금지**
2. 다른 PC에 설치 시 깨끗한 상태 → 새로 로그인
3. 로그인 데이터는 각 PC의 `%APPDATA%`에만 저장

## 현재 상태: 이미 충족 ✅

CC_MSG_040에서 적용한 `%APPDATA%` 경로 분리로 이미 안전:

```
앱 파일 (배포 대상)              개인정보 (PC별 로컬, 배포 제외)
├── main.js                     %APPDATA%\ClaudeMultiElectron\
├── renderer/                     └── Partitions\claude\
├── config.json                       ├── Cookies (로그인)
├── package.json                      ├── Local Storage
                                      └── Session Storage
```

## VS 구현 시 주의사항

1. **electron-builder 설정에 제외 규칙 추가**
```yaml
files:
  - "**/*"
  - "!.userdata/**"      # 혹시 남아있을 경우 대비
  - "!node_modules/**"
```

2. **앱 시작 시 세션 데이터 자동 생성 (없으면)**
   - 첫 실행 → `%APPDATA%/ClaudeMultiElectron/` 자동 생성
   - 로그인 필요 상태로 시작
   - 로그인 후 → 쿠키 저장 → 다음 실행부터 자동

3. **config.json은 배포에 포함 (닉네임/색상은 개인정보 아님)**

4. **절대 하면 안 되는 것**
   - 앱 폴더 내에 쿠키/세션 저장 금지
   - git에 .userdata/ 커밋 금지
   - 빌드 결과물에 Partitions/ 포함 금지

---

*Claude Code · CC_MSG_042 · 2026-03-30*
