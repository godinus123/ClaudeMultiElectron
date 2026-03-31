# ClaudeMultiElectron 설계서

> 최종 업데이트: 2026-03-30

---

## 1. 프로젝트 목적

Windows 데스크톱 앱에서 claude.ai를 4~9개 패널로 동시 운용.
각 패널은 독립 크롬 브라우저(webview)로 claude.ai를 직접 로드.

---

## 2. 확정 아키텍처

### 방식: webview 임베딩 (최종 확정)

```
Electron BrowserWindow
  └─ index.html
      ├─ <webview src="claude.ai" partition="persist:claude">  패널1
      ├─ <webview src="claude.ai" partition="persist:claude">  패널2
      ├─ <webview src="claude.ai" partition="persist:claude">  패널3
      └─ <webview src="claude.ai" partition="persist:claude">  패널4
```

### 기각된 안
- ❌ node-pty + xterm.js (claude CLI 터미널)
- ❌ Anthropic API 직접 호출 + 자체 채팅 UI
- ❌ WPF (이전 프로젝트)

### 확정 이유
- 개발 난이도 최소 (webview 태그만으로 완성)
- claude.ai 풀 기능 사용 (마크다운, 코드, 아티팩트 등)
- API 비용 없음 (Pro 구독만)
- 로그인 1회 → 영구 유지 (`persist:claude` 세션 공유)

---

## 3. 기술 스택

| 역할 | 기술 |
|------|------|
| 앱 프레임워크 | Electron 41.x |
| 브라우저 임베딩 | `<webview>` 태그 |
| 세션 관리 | `partition="persist:claude"` (공유) |
| 레이아웃 | CSS Grid |
| UI | HTML/CSS/JS (바닐라) |

---

## 4. 파일 구조

```
C:\WindowsApp\ClaudeMultiElectron\
├── package.json              ← electron 의존성만
├── main.js                   ← BrowserWindow 생성
├── preload.js                ← contextBridge (필요 시)
├── renderer/
│   ├── index.html            ← 메인 UI (webview 그리드)
│   ├── renderer.js           ← 레이아웃 전환 + 설정 로직
│   └── style.css             ← 다크테마
├── config.json               ← 패널 닉네임/색상 저장
└── doc/
    └── DESIGN.md             ← 이 파일
```

---

## 5. 패널 개성화

### 5.1 색상

| 패널 | 닉네임 | 색상 | HEX |
|------|--------|------|-----|
| 1 | 프론트봇 | 파랑 | `#1f6feb` |
| 2 | 백엔드봇 | 초록 | `#3fb950` |
| 3 | 테스터 | 보라 | `#a371f7` |
| 4 | 문서봇 | 주황 | `#d29922` |
| 5 | (확장) | 빨강 | `#ff7b72` |
| 6 | (확장) | 청록 | `#39d353` |
| 7 | (확장) | 하늘 | `#58a6ff` |
| 8 | (확장) | 노랑 | `#e3b341` |
| 9 | (확장) | 흰색 | `#e6edf3` |

### 5.2 적용 범위
- 패널 헤더 뱃지 배경
- 좌측 3px 컬러 바
- 패널 테두리 (50% 투명도)
- 상태바 닉네임 옆 색상 점

### 5.3 닉네임
- 기본값: "패널 N"
- 사용자가 [⚙] 버튼으로 변경 가능
- config.json에 저장 → 앱 재시작 후 유지

---

## 6. 레이아웃

| 이름 | CSS Grid | 패널 수 |
|------|----------|---------|
| 1-전체 | 1fr / 1fr | 1 |
| 2-좌우 | 1fr 1fr / 1fr | 2 |
| 2-상하 | 1fr / 1fr 1fr | 2 |
| 4-쿼드 | 1fr 1fr / 1fr 1fr | 4 |
| 6-2×3 | 1fr 1fr 1fr / 1fr 1fr | 6 |
| 9-채널 | 1fr 1fr 1fr / 1fr 1fr 1fr | 9 |

레이아웃 변경 시 webview 세션 유지 (DOM에서 제거하지 않음).

---

## 7. 세션 관리

- `partition="persist:claude"` — 4개 패널 공유
- 한 번 로그인 → 전체 패널 적용
- 앱 종료 후 재시작해도 로그인 유지
- 쿠키/localStorage 디스크 저장: `userData/Partitions/claude/`

---

## 8. 디스플레이 (세션 유지)

레이아웃 축소 시 (예: 4-쿼드 → 1-전체):
- 숨겨진 패널: `position: absolute; left: -9999px`
- webview는 DOM에 유지 → 세션/스크롤 상태 보존
- 복귀 시 Grid로 재배치

---

## 9. 브로드캐스트 바

```
┌─ 📢 브로드캐스트 ──────────────────────────────────┐
│ [모든 패널에 동시 전송...                    ] [전송] │
└───────────────────────────────────────────────────┘
```

- 입력한 텍스트를 모든 활성 패널의 webview에 동시 전송
- `webview.executeJavaScript()`로 claude.ai 입력창에 텍스트 삽입 + 전송
- 주의: claude.ai DOM 구조에 의존 → 유지보수 필요

---

## 10. 다크테마 색상 팔레트

| 용도 | HEX |
|------|-----|
| 배경 (메인) | `#0d1117` |
| 배경 (헤더/툴바) | `#161b22` |
| 배경 (버튼) | `#21262d` |
| 테두리 | `#30363d` |
| 텍스트 (주) | `#e6edf3` |
| 텍스트 (보조) | `#8b949e` |
| 액센트 (파란) | `#1f6feb` |
| 상태 (활성) | `#3fb950` |
| 상태 (경고) | `#d29922` |
| 상태 (오류) | `#ff7b72` |

---

## 11. 구현 Phase

| Phase | 내용 | 담당 |
|-------|------|------|
| ✅ 0 | webview 임베딩 PoC 테스트 | CC (완료) |
| 1 | 파일 구조 정리 + package.json 정리 | VS |
| 2 | 6개 레이아웃 완성 + 세션 유지 | VS |
| 3 | 브로드캐스트 바 구현 | VS |
| 4 | 닉네임/색상 설정 UI + config.json | VS |
| 5 | 패키징 (electron-builder) | VS+CC |

---

## 12. 역할 분담

| 역할 | 담당 |
|------|------|
| 코드 편집 | VS (편집권) |
| 코드 리뷰 | CC |
| 빌드/실행 테스트 | CC |
| 사용자 명령 전달 | CC |
