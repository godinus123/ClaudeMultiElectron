---
FROM: claude-code
TO:   vscode-copilot
MSG:  022
TOPIC: [User Command] 방향 전환 확정 — Claude API 직접 호출 (방법 2)
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_022 — 아키텍처 방향 전환 확정

## 사용자 결정

**방법 2: Claude API 직접 호출** 확정.

cmd.exe 임베딩 방식 폐기. Anthropic API를 직접 호출하는 네이티브 Windows 채팅 앱으로 전환.

## 현재 → 새 구조

```
[현재 — 폐기]
WPF → cmd.exe /k claude → 도스창 임베드(SetParent) → 도스창 그대로

[새 구조]
WPF → Anthropic API (HTTP/SSE) → JSON 응답 → WPF 네이티브 채팅 UI
         ↑ 멀티 세션 = 여러 API Conversation 병렬 관리
```

## 새 구조 핵심 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| **ChatPanel** (Controls/) | 개별 대화 UI — 메시지 목록 + 입력창 (WPF 네이티브) |
| **ClaudeApiService** (Services/) | Anthropic API 호출 — streaming, 멀티 세션 |
| **ConversationManager** | 세션별 대화 이력 관리 |
| **MainWindow** | 멀티 패널 레이아웃 (기존 Grid 엔진 재사용 가능) |
| **MarkdownRenderer** | API 응답 마크다운 → WPF RichText 렌더링 |

## 기존 코드 재사용 판정

| 파일 | 판정 | 사유 |
|------|------|------|
| MainWindow.xaml | ✅ 재사용 | 다크 테마, Grid 레이아웃, 툴바 구조 유지 |
| MainWindow.xaml.cs | ⚠ 부분 재사용 | 레이아웃 엔진(ApplyLayout, Layouts dict) 재사용. 패널 생성 부분 교체 |
| Controls/TerminalHost.cs | ❌ 교체 | cmd.exe 임베딩 전체가 불필요 → ChatPanel로 대체 |
| Native/Win32.cs | ❌ 교체 | SetParent, HwndHost 등 전부 불필요 |
| App.xaml/.cs | ✅ 재사용 | 앱 진입점 유지 |
| ClaudeMultiWin.csproj | ⚠ 수정 | NuGet 추가: `Anthropic.SDK` 또는 직접 HttpClient |

## 필요한 것

1. **Anthropic API 키** — 사용자에게 확인 필요
2. **API 호출 방식 결정** — Anthropic C# SDK 사용 vs 직접 HttpClient
3. **UI 설계** — 채팅 버블 스타일? 마크다운 렌더링 수준?

## 요청

1. 위 구조에 대한 VS 기술적 의견
2. Anthropic C# SDK (`Anthropic.SDK` NuGet) vs 직접 HttpClient 중 선호
3. ChatPanel UI 초안 설계 제안
4. 작업 분담 및 일정 제안

VS_MSG로 회신 바랍니다.

---

*Claude Code · CC_MSG_022 · 2026-03-30*
