#!/usr/bin/env python3
"""
채널 감시 데몬 — 10초마다 new 상태 메시지 감지 후 알림
실행: python cc_watch.py
종료: Ctrl+C
"""

import os
import re
import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime

# Windows CP949 인코딩 문제 방지 — UTF-8 강제
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

CHANNEL = Path(__file__).parent / "doc" / "channel"
POLL_INTERVAL = 10  # 초
SEEN_FILE = Path(__file__).parent / ".cc_watch_seen"

def load_seen() -> set:
    if SEEN_FILE.exists():
        return set(SEEN_FILE.read_text(encoding="utf-8").splitlines())
    return set()

def save_seen(seen: set):
    SEEN_FILE.write_text("\n".join(sorted(seen)), encoding="utf-8")

def get_new_messages(seen: set) -> list:
    results = []
    for f in sorted(CHANNEL.glob("*_MSG_*.md")):
        if f.stem in seen:
            continue
        content = f.read_text(encoding="utf-8", errors="ignore")
        if "STATUS: new" not in content:
            seen.add(f.stem)  # new 아닌 것도 seen에 등록
            continue
        # 메타 추출
        from_m  = re.search(r"FROM:\s*(.+)", content)
        topic_m = re.search(r"TOPIC:\s*(.+)", content)
        msg_from  = from_m.group(1).strip()  if from_m  else "?"
        msg_topic = topic_m.group(1).strip() if topic_m else "(제목 없음)"
        results.append((f.stem, msg_from, msg_topic))
    return results

def notify(name: str, from_: str, topic: str):
    """Windows 토스트 알림 (선택) + 콘솔 출력"""
    now = datetime.now().strftime("%H:%M:%S")
    print(f"\n{'='*60}")
    print(f"  [{now}] 새 메시지 감지!")
    print(f"  파일  : {name}.md")
    print(f"  발신  : {from_}")
    print(f"  내용  : {topic}")
    print(f"{'='*60}")

    # Windows 토스트 알림 시도
    try:
        ps_cmd = (
            f"[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime] | Out-Null;"
            f"$template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02;"
            f"$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($template);"
            f"$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('[{name}] {from_}')) | Out-Null;"
            f"$xml.GetElementsByTagName('text')[1].AppendChild($xml.CreateTextNode('{topic[:60]}')) | Out-Null;"
            f"$toast = [Windows.UI.Notifications.ToastNotification]::new($xml);"
            f"[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('CC Watch').Show($toast);"
        )
        subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True, timeout=3)
    except Exception:
        pass  # 토스트 실패해도 콘솔 출력은 유지

def main():
    print("=" * 60)
    print("  CC 채널 감시 데몬 시작")
    print(f"  감시 폴더: {CHANNEL}")
    print(f"  폴링 간격: {POLL_INTERVAL}초")
    print("  종료: Ctrl+C")
    print("=" * 60)

    seen = load_seen()

    # 최초 실행 시 기존 파일은 모두 seen 처리 (중복 알림 방지)
    first_run = not SEEN_FILE.exists()
    if first_run:
        for f in CHANNEL.glob("*_MSG_*.md"):
            seen.add(f.stem)
        save_seen(seen)
        print(f"\n  초기화 완료 — 기존 {len(seen)}개 파일 등록됨")
        print("  이후 새로 추가되는 new 메시지만 알림합니다.\n")

    print(f"  [{datetime.now().strftime('%H:%M:%S')}] 감시 중...\n")

    try:
        while True:
            new_msgs = get_new_messages(seen)
            for name, from_, topic in new_msgs:
                notify(name, from_, topic)
                seen.add(name)
                save_seen(seen)

            if not new_msgs:
                print(f"  [{datetime.now().strftime('%H:%M:%S')}] 이상 없음", end="\r")

            time.sleep(POLL_INTERVAL)

    except KeyboardInterrupt:
        print("\n\n  감시 종료.")

if __name__ == "__main__":
    main()
