# Git & GitHub + VS Code 연동 가이드

## 1. Git 설치

### 다운로드
- https://git-scm.com/downloads/win 접속
- **64-bit Git for Windows Setup** 다운로드 및 실행
- 설치 시 **"Git from the command line and also from 3rd-party software"** 선택 확인
- 설치 완료 후 VS Code 재시작

### 설치 확인
```bash
git --version
```

### 초기 설정
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## 2. GitHub 저장소 생성

1. https://github.com 에서 로그인
2. 우측 상단 **`+`** → **New repository**
3. 저장소 이름 입력 (예: `ClaudeMultiElectron`)
4. **Public** 또는 **Private** 선택
5. **Create repository** 클릭

---

## 3. VS Code에서 Git 연동

### 최초 연결 (로컬 → GitHub)
```bash
git init
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git add .
git commit -m "init"
git push -u origin main
```

### remote가 이미 있을 때 URL 변경
```bash
git remote set-url origin https://github.com/USERNAME/REPO_NAME.git
```

### 인증 문제 시 사용자명 포함 URL
```bash
git remote set-url origin https://USERNAME@github.com/USERNAME/REPO_NAME.git
git push -u origin main
```
→ 브라우저에서 GitHub 인증 팝업 → **Authorize git-ecosystem** 클릭

---

## 4. 일상 워크플로우 (코드 수정 후 업로드)

### 터미널 방식
```bash
git add .
git commit -m "변경 내용 설명"
git push
```

### VS Code GUI 방식
1. 왼쪽 **소스 제어** 아이콘 (`Ctrl+Shift+G`)
2. 변경 파일 옆 **`+`** 클릭 (스테이징)
3. 커밋 메시지 입력
4. **`✓ 커밋`** 클릭 (또는 `Ctrl+Enter`)
5. **`···`** → **Push** (또는 하단 동기화 아이콘)

### 한번에 커밋+푸시
- **`···`** → **Commit & Push**

---

## 5. 자주 쓰는 Git 명령어

| 명령어 | 설명 |
|--------|------|
| `git status` | 현재 상태 확인 |
| `git log --oneline` | 커밋 히스토리 보기 |
| `git diff` | 변경 내용 비교 |
| `git pull origin main` | 최신 코드 받기 |
| `git stash` | 작업 중 변경사항 임시 저장 |
| `git branch feature-name` | 브랜치 생성 |
| `git checkout feature-name` | 브랜치 전환 |
| `git merge feature-name` | 브랜치 병합 |

---

## 6. 트러블슈팅

### "Actual command not found, wanted to execute git.publish"
→ Git이 시스템에 설치되지 않음. Git 설치 후 VS Code 재시작.

### "Repository not found"
→ GitHub 인증 안 됨. 사용자명 포함 URL로 변경 후 재인증.

### Git 설치 시 "closing is required"
→ 작업관리자 → 자세히 → `bash.exe` 모두 종료 → Refresh → Install.

### 인증 초기화
```bash
git credential-manager github logout USERNAME
```

---

> 작성일: 2026-03-31 | ClaudeMultiElectron 프로젝트 기준
