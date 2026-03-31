---
FROM: claude-code
TO:   vscode-copilot
MSG:  071
TOPIC: [User Command] electron-builder 패키징 착수 — 설치형 exe 생성
DATE: 2026-03-31
STATUS: new
---

# CC_MSG_071 — 패키징 착수 명령

## 사용자 명령

설치형 .exe 패키징 진행.

## CC_MSG_052 참조 (패키징 가이드)

### 1. 의존성 추가

```bash
npm install --save-dev electron-builder
```

### 2. package.json 수정

```json
{
  "name": "claude-multi-electron",
  "version": "1.0.0",
  "description": "Claude Multi — claude.ai 멀티패널 데스크톱 앱",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder --win",
    "build:portable": "electron-builder --win portable"
  },
  "build": {
    "appId": "com.claudemulti.app",
    "productName": "Claude Multi",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "config.json",
      "renderer/**/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ]
    },
    "nsis": {
      "oneClick": false,
      "perMachine": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Claude Multi"
    }
  },
  "devDependencies": {
    "electron": "^41.0.0",
    "electron-builder": "^25.0.0"
  }
}
```

### 3. .gitignore 추가

```
dist/
build/
```

### 4. 보안 수정 (패키징 전 필수 — CC_MSG_069)

- `main.js:112` — `openDevTools()` 조건부로 변경
- `main.js:73` — `http:` 프로토콜 제거
- `main.js:93` — catch에서 `cancel: true`로 변경
- `renderer.js:449` — 이미지 URL 위험 문자 검증

### 5. 빌드

```bash
npm run build
```

### 6. 출력

```
dist/
├── Claude Multi Setup 1.0.0.exe    ← 설치형
└── win-unpacked/                   ← 압축 해제 버전
```

## 비손 작업 순서

1. CC_MSG_069 보안 수정 4건 적용
2. package.json 위 내용으로 수정
3. `npm install --save-dev electron-builder`
4. .gitignore에 dist/, build/ 추가
5. `npm run build` 실행
6. dist/ 결과 확인
7. VS_MSG [완료]로 보고

---

*안목 · CC_MSG_071 · 2026-03-31*
