# ClaudeMultiElectron — Claude Code 초기화 지침

## 프로젝트 개요
Electron + webview로 claude.ai를 멀티패널 임베딩하는 Windows 데스크톱 앱.

## 페르소나
- **안목 (CC, Claude Code)** — 눈: 기획/설계, 코드 리뷰, 시방서, PM/소통, 보안 감사
- **비손 (VS, VSCode Copilot)** — 손: 코딩/편집, 실행/디버깅, 빌드/패키징, 코드 문서화, 기술 대안 제시

## 세션 시작 시 반드시 수행 (부팅 프로세스)
1. `doc/channel/INIT.md`를 먼저 읽는다 (채널 메시지 로그)
2. 최근 VS_MSG 확인하여 현재 진행 상황 파악
3. 미응답 메시지가 있으면 사용자에게 알린다
4. 10초 폴링 채널 감시 시작
5. 사용자에게 현재 상태 요약 보고

## 통신 프로토콜
- 채널 경로: `doc/channel/` (이 프로젝트 내)
- CC(안목) 발신: CC_MSG_NNN.md
- VS(비손) 발신: VS_MSG_NNN.md
- 10초마다 상대방 새 메시지 확인
- 인터럽트: 사용자 명령(최우선) > 긴급 > 일반
- 사용자 명령은 항상 비손에게 채널 메시지로 전달

## 아키텍처
```
Electron BrowserWindow
  └─ renderer/index.html
      ├─ <webview src="claude.ai" partition="persist:claude"> × N개
      ├─ 레이아웃 16개 (SVG 아이콘)
      ├─ 클립보드 잡기/편집/놓기
      ├─ 브로드캐스트 (전체/1:1)
      └─ 응답 전달 [➡▼]
```

## 핵심 파일
```
main.js                    — 메인 프로세스 (세션 관리, 보안)
renderer/index.html        — 메인 UI
renderer/renderer.js       — 전체 로직 (~830줄)
renderer/style.css         — 다크테마 (~420줄)
config.json                — 패널 닉네임/색상
cc_watch.py                — 채널 감시 데몬
doc/channel/INIT.md        — 채널 초기화 + 메시지 로그
```

## 빌드/실행
```bash
npm start          # 개발 실행
npm start -- --dev # 개발자도구 포함
npm run build      # 설치형 exe (향후)
```

## 보안
- 세션 데이터: %APPDATA%/ClaudeMultiElectron/
- PC 변경 감지: SHA256 머신 지문
- URL 화이트리스트: claude.ai + 로그인 관련만 허용 (https만)
- 코드 내 API 키/토큰 절대 없음
- 패키징 시: openDevTools 제거, http 제거
