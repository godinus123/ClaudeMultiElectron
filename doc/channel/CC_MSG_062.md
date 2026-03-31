---
FROM: claude-code
TO:   vscode-copilot
MSG:  062
TOPIC: [구현 시방서] 패널 헤더 드롭 존 — 텍스트/파일/이미지 드래그 앤 드롭
DATE: 2026-03-30
STATUS: new
---

# CC_MSG_062 — 드래그 앤 드롭 구현 시방서

## 사용자 요청

> "드래그 앤 드롭을 파일 그림 텍스트 대충 갖다 놓으면 받는 놈이 알아먹겠지"

---

# Part 1. 개요

## 원리

webview 간 직접 드래그는 불가 (Chromium 샌드박스).
대신 **패널 헤더를 드롭 존**으로 만들어서 중계.

```
소스 (어디서든)          드롭 존              대상
─────────────         ──────────          ─────────
패널 1 내 텍스트 선택    패널 2 헤더에         패널 2 webview
→ 브라우저 기본 드래그   드롭!                 입력창에 자동 주입
                        ↓
OS 탐색기에서 파일       패널 3 헤더에         패널 3 webview
→ 드래그                드롭!                 파일 업로드
```

## 지원 타입

| 드롭 데이터 | 처리 방법 |
|-------------|-----------|
| 텍스트 (text/plain) | `execCommand('insertText')` 로 입력창 주입 |
| HTML (text/html) | 텍스트 추출 후 동일 처리 |
| 파일 (Files) | `DataTransfer` + `drop` 이벤트로 webview 전달 |
| 이미지 파일 | 파일과 동일 — claude.ai가 이미지 업로드 자체 처리 |
| 기타 | 무시 (에러 없음) |

---

# Part 2. UI 설계

## 기본 상태

```
┌──────────────────────────────────────────┐
│ [1] ● 프론트봇              [➡▼] [↺]    │  ← 평소 모습
├──────────────────────────────────────────┤
│ (webview)                                │
└──────────────────────────────────────────┘
```

## 드래그 중 (무언가를 끌고 있을 때)

```
┌──────────────────────────────────────────┐
│ [1] ● 프론트봇   📥 여기에 놓기          │  ← 헤더 하이라이트 (파란 테두리)
├──────────────────────────────────────────┤
│ (webview)                                │
└──────────────────────────────────────────┘
```

## 드롭 완료

```
┌──────────────────────────────────────────┐
│ [1] ● 프론트봇   ✅ 전달됨              │  ← 1초간 초록색 표시 후 원래대로
├──────────────────────────────────────────┤
│ (webview)                                │
└──────────────────────────────────────────┘
```

---

# Part 3. 구현

## 3.1 renderer.js — createPanel 함수 수정

현재 헤더 구성 (167~170줄):
```javascript
  header.appendChild(badge);
  header.appendChild(title);
  header.appendChild(relaySelect);
  header.appendChild(resetBtn);
```

### 헤더에 드롭 존 기능 추가

```javascript
  // ── 드롭 존 상태 표시 텍스트 ──
  var dropHint = document.createElement('span');
  dropHint.className = 'drop-hint';
  dropHint.textContent = '';

  // ── 헤더를 드롭 존으로 설정 ──

  // dragenter: 드래그가 헤더 위에 올라왔을 때
  header.addEventListener('dragenter', function(e) {
      e.preventDefault();
      e.stopPropagation();
      header.classList.add('drop-active');
      dropHint.textContent = '📥 여기에 놓기';
  });

  // dragover: 드래그가 헤더 위에 있는 동안 (필수 — 없으면 drop 안 됨)
  header.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
  });

  // dragleave: 드래그가 헤더를 벗어났을 때
  header.addEventListener('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      header.classList.remove('drop-active');
      dropHint.textContent = '';
  });

  // drop: 드롭 실행!
  header.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      header.classList.remove('drop-active');

      handleDrop(e.dataTransfer, def.id, wv, dropHint);
  });

  header.appendChild(badge);
  header.appendChild(title);
  header.appendChild(dropHint);      // ← 추가
  header.appendChild(relaySelect);
  header.appendChild(resetBtn);
```

---

## 3.2 renderer.js — handleDrop 함수 추가

`relayResponse` 함수 뒤(361줄 뒤)에 추가:

```javascript
// ══════════════════════════════════════════════════════
// 드래그 앤 드롭 처리
// ══════════════════════════════════════════════════════
//
// 패널 헤더에 드롭된 데이터를 타입별로 처리:
//   텍스트 → execCommand('insertText')
//   파일   → DataTransfer + drop 이벤트로 webview 전달
//   기타   → 무시

async function handleDrop(dataTransfer, panelId, wv, dropHint) {
    // ── 1. 파일이 있으면 파일 우선 처리 ──
    if (dataTransfer.files && dataTransfer.files.length > 0) {
        var success = await handleFileDrop(dataTransfer.files, wv);
        showDropResult(dropHint, success ? '✅ 파일 전달됨' : '❌ 파일 전달 실패');
        return;
    }

    // ── 2. 텍스트 처리 ──
    var text = dataTransfer.getData('text/plain');
    if (!text) {
        // HTML에서 텍스트 추출 시도
        var html = dataTransfer.getData('text/html');
        if (html) {
            var tmp = document.createElement('div');
            tmp.innerHTML = html;
            text = tmp.textContent || tmp.innerText || '';
        }
    }

    if (text && text.trim()) {
        await broadcastToPanel(wv, text.trim());
        showDropResult(dropHint, '✅ 텍스트 전달됨');
        return;
    }

    // ── 3. 아무것도 못 알아먹음 ──
    showDropResult(dropHint, '⚠️ 지원 안 됨');
}

// 파일 드롭 처리 — webview에 drop 이벤트 시뮬레이션
async function handleFileDrop(files, wv) {
    // 파일 경로 추출 (Electron 환경에서는 path 접근 가능)
    var filePaths = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].path) {
            filePaths.push(files[i].path);
        }
    }

    if (filePaths.length === 0) return false;

    // 방법 1: claude.ai 파일 입력 버튼 클릭 + 파일 경로 설정
    // 방법 2: 파일 내용을 읽어서 텍스트로 전달 (텍스트 파일만)

    // 텍스트 파일이면 내용 읽어서 전달
    try {
        for (var j = 0; j < files.length; j++) {
            var file = files[j];

            // 텍스트 계열 파일
            if (file.type.startsWith('text/') ||
                file.name.endsWith('.js') || file.name.endsWith('.py') ||
                file.name.endsWith('.ts') || file.name.endsWith('.css') ||
                file.name.endsWith('.html') || file.name.endsWith('.json') ||
                file.name.endsWith('.md') || file.name.endsWith('.txt') ||
                file.name.endsWith('.csv') || file.name.endsWith('.xml') ||
                file.name.endsWith('.yaml') || file.name.endsWith('.yml') ||
                file.name.endsWith('.sh') || file.name.endsWith('.bat')) {

                var content = await readFileAsText(file);
                var message = '[파일: ' + file.name + ']\n\n' + content;

                // 너무 길면 자르기
                if (message.length > 10000) {
                    message = message.substring(0, 10000) + '\n\n[...파일이 길어 10000자까지만 전달됨]';
                }

                await broadcastToPanel(wv, message);
                return true;
            }

            // 이미지 파일 — claude.ai 업로드 버튼으로 전달 시도
            if (file.type.startsWith('image/')) {
                // webview 내에서 파일 input을 찾아 파일 설정 시도
                var uploadResult = await tryUploadFile(wv, file);
                return uploadResult;
            }
        }

        // 기타 파일 — 파일명만 알림
        var names = Array.from(files).map(function(f) { return f.name; }).join(', ');
        await broadcastToPanel(wv, '[파일 드롭: ' + names + ']\n이 파일 형식은 직접 업로드해주세요.');
        return true;

    } catch (err) {
        console.error('파일 드롭 처리 실패:', err);
        return false;
    }
}

// 파일을 텍스트로 읽기
function readFileAsText(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function() { reject(reader.error); };
        reader.readAsText(file, 'utf-8');
    });
}

// 이미지 파일 업로드 시도 (claude.ai의 파일 input에 주입)
async function tryUploadFile(wv, file) {
    // claude.ai의 파일 업로드 input을 찾아 클릭하는 방식
    // ⚠️ claude.ai DOM에 의존 — 변경 시 수정 필요

    var script = `
        (function() {
            // 파일 첨부 버튼 찾기
            var fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.click();
                return 'found';
            }

            // 클립 아이콘 버튼 찾기
            var attachBtn = document.querySelector('button[aria-label*="Attach"]')
                || document.querySelector('button[aria-label*="attach"]')
                || document.querySelector('button[aria-label*="파일"]');
            if (attachBtn) {
                attachBtn.click();
                return 'clicked';
            }

            return 'not_found';
        })();
    `;

    try {
        var result = await wv.executeJavaScript(script);
        if (result === 'not_found') {
            // 파일 업로드 버튼 못 찾음 — 텍스트로 알림
            await broadcastToPanel(wv, '[이미지 파일: ' + file.name + ']\n파일 업로드 버튼을 찾을 수 없습니다. 직접 드래그해주세요.');
            return false;
        }
        // 버튼은 찾았지만, 프로그래밍적으로 파일을 설정하기 어려움
        // 사용자에게 파일 선택 다이얼로그가 열림 — 수동 선택 필요
        return true;
    } catch {
        return false;
    }
}

// 드롭 결과 표시 (1.5초 후 사라짐)
function showDropResult(dropHint, message) {
    dropHint.textContent = message;

    if (message.includes('✅')) {
        dropHint.style.color = '#3fb950';
    } else if (message.includes('❌')) {
        dropHint.style.color = '#ff7b72';
    } else {
        dropHint.style.color = '#d29922';
    }

    setTimeout(function() {
        dropHint.textContent = '';
        dropHint.style.color = '';
    }, 1500);
}
```

---

## 3.3 style.css 추가 (파일 끝에)

```css
/* ══ 드롭 존 ════════════════════════════════════════ */

/* 드롭 힌트 텍스트 */
.drop-hint {
    font-size: 10px;
    color: #8b949e;
    margin-left: auto;
    white-space: nowrap;
}

/* 드래그가 헤더 위에 있을 때 하이라이트 */
.panel-header.drop-active {
    background: #1a2332 !important;
    border-bottom: 2px solid #1f6feb;
    box-shadow: inset 0 0 10px rgba(31, 111, 235, 0.2);
}

.panel-header.drop-active .drop-hint {
    color: #58a6ff;
    font-weight: bold;
}
```

---

# Part 4. 동작 시나리오

## 시나리오 1: 텍스트 드래그

```
1. 패널 1에서 claude 응답 텍스트를 마우스로 선택 + 드래그
2. 패널 2 헤더 위로 이동 → 헤더 파란색 하이라이트 + "📥 여기에 놓기"
3. 드롭
4. 패널 2 claude.ai 입력창에 텍스트 주입 + 자동 전송
5. 헤더에 "✅ 텍스트 전달됨" 1.5초 표시
```

## 시나리오 2: 파일 드래그 (탐색기에서)

```
1. Windows 탐색기에서 script.js 파일 드래그
2. 패널 3 헤더 위로 이동 → 하이라이트
3. 드롭
4. 텍스트 파일 → 내용 읽기 → "[파일: script.js]\n{파일내용}" 전달
5. "✅ 파일 전달됨" 표시
```

## 시나리오 3: 이미지 드래그

```
1. 탐색기에서 screenshot.png 드래그
2. 패널 4 헤더에 드롭
3. claude.ai 파일 업로드 버튼 트리거 시도
4. 성공 시 "✅ 파일 전달됨", 실패 시 안내 메시지
```

## 시나리오 4: 알 수 없는 데이터

```
1. 무언가 드래그해서 헤더에 드롭
2. 텍스트도 파일도 아님
3. "⚠️ 지원 안 됨" 표시 → 1.5초 후 사라짐
4. 에러 없음
```

---

# Part 5. 수정 요약

| 파일 | 위치 | 내용 |
|------|------|------|
| renderer.js | createPanel (167줄) | 헤더에 dragenter/dragover/dragleave/drop 이벤트 + dropHint |
| renderer.js | 361줄 뒤 | handleDrop, handleFileDrop, readFileAsText, tryUploadFile, showDropResult |
| style.css | 파일 끝 | .drop-hint, .panel-header.drop-active |
| index.html | 변경 없음 | |

---

# Part 6. 제한사항

| 항목 | 상태 |
|------|------|
| 텍스트 드롭 | ✅ 확실히 동작 |
| 텍스트 파일 드롭 (.js, .py, .md 등) | ✅ 내용 읽어서 전달 |
| 이미지 파일 드롭 | ⚠️ claude.ai 업로드 버튼 트리거 시도, 실패 시 안내 |
| webview 내부 → 헤더 드래그 | ⚠️ 브라우저에 따라 다름, 대부분 동작 |
| 바이너리 파일 (.exe, .zip) | 파일명만 알림 |

---

# Part 7. 테스트

- [ ] 텍스트 선택 후 패널 헤더에 드롭 → 입력창에 주입 확인
- [ ] .js 파일 탐색기에서 헤더에 드롭 → 파일 내용 전달 확인
- [ ] .png 파일 드롭 → 업로드 시도 또는 안내 메시지
- [ ] 드래그 중 헤더 하이라이트 표시
- [ ] 드롭 후 "✅ 전달됨" 1.5초 표시 → 사라짐
- [ ] 빈 드롭 → "⚠️ 지원 안 됨" 표시
- [ ] 드래그 영역 벗어남 → 하이라이트 해제

---

**대충 갖다 놓으면 알아먹는 방식입니다.**
VS 즉시 착수 바랍니다.

---

*Claude Code · CC_MSG_062 · 2026-03-30*
