#!/usr/bin/env python3
"""
write_note.py
수집된 텔레그램 피드를 Obsidian 월별 노트에 병합·저장한다.

- 파일 없음 → 신규 생성
- 파일 있음 → 날짜·시간순으로 기존 내용에 병합 (중복 건너뜀)

사용법:
    python3 write_note.py <yesterday_iso> <year_month> <entries_json>

    yesterday_iso  : YYYY-MM-DD
    year_month     : yymm
    entries_json   : JSON 배열. 각 항목: {"time": "HH:MM", "forwarded": "채널명|URL", "body": "본문"}
                     forwarded는 없으면 빈 문자열.
"""

import json
import os
import re
import sys

VAULT = "/Users/tealeaf/Library/Mobile Documents/iCloud~md~obsidian/Documents/CC/0 inbox"
PERSON = "전종현"


def make_entry_block(time: str, summary: str, forwarded: str, body: str) -> str:
    """단일 피드 항목 마크다운 블록을 생성한다."""
    lines = [f"#### {time} {summary}"]
    if forwarded:
        name, url = (forwarded.split("|", 1) + [""])[:2]
        if url:
            lines.append(f"> Forwarded from [{name}]({url})")
        else:
            lines.append(f"> Forwarded from {name}")
        lines.append("")
    lines.append(body)
    return "\n".join(lines)


def make_new_note(year_month: str, date_iso: str, entry_blocks: list[str]) -> str:
    """새 월별 노트 전체 내용을 생성한다."""
    yyyy_mm = f"20{year_month[:2]}-{year_month[2:]}"
    entries_md = "\n\n---\n\n".join(entry_blocks)
    return f"""---
tags: [{PERSON}, 텔레그램, 산업분석]
date: {yyyy_mm}
source: https://t.me/chunjonghyun
---

# {PERSON} {year_month}

---
## {date_iso}

{entries_md}

---
"""


def merge_entries(existing: str, date_iso: str, entry_blocks: list[str]) -> str:
    """기존 노트에 새 항목을 날짜·시간순으로 병합한다."""
    date_header = f"## {date_iso}"

    # 이미 동일 날짜 섹션이 있는지 확인
    if date_header in existing:
        # 해당 섹션의 끝 위치 찾기 (다음 ## 또는 파일 끝)
        section_start = existing.index(date_header)
        next_section = re.search(r"\n## ", existing[section_start + len(date_header):])
        if next_section:
            section_end = section_start + len(date_header) + next_section.start()
        else:
            section_end = len(existing)

        section = existing[section_start:section_end]

        new_blocks = []
        for block in entry_blocks:
            # 시간 추출 (#### HH:MM ...)
            time_match = re.match(r"#### (\d{2}:\d{2})", block)
            if time_match:
                time_str = time_match.group(1)
                # 중복 체크
                if f"#### {time_str}" in section:
                    continue
            new_blocks.append(block)

        if not new_blocks:
            return existing

        addition = "\n\n---\n\n" + "\n\n---\n\n".join(new_blocks)
        return existing[:section_end].rstrip() + addition + "\n" + existing[section_end:]

    else:
        # 날짜순에 맞는 위치에 새 섹션 삽입
        new_section = f"## {date_iso}\n\n" + "\n\n---\n\n".join(entry_blocks) + "\n\n---"

        # 삽입 위치: date_iso보다 늦은 날짜 섹션 직전, 없으면 파일 끝
        date_sections = list(re.finditer(r"\n## (\d{4}-\d{2}-\d{2})", existing))
        insert_pos = len(existing)
        for m in date_sections:
            if m.group(1) > date_iso:
                insert_pos = m.start()
                break

        return existing[:insert_pos].rstrip() + f"\n\n---\n{new_section}\n" + existing[insert_pos:].lstrip()


def main():
    if len(sys.argv) < 4:
        print("Usage: write_note.py <yesterday_iso> <year_month> <entries_json>")
        sys.exit(1)

    yesterday_iso = sys.argv[1]   # YYYY-MM-DD
    year_month = sys.argv[2]       # yymm
    entries = json.loads(sys.argv[3])

    filename = f"{PERSON}_{year_month}"
    filepath = os.path.join(VAULT, f"{filename}.md")

    # 각 항목을 마크다운 블록으로 변환 (summary는 LLM이 채워야 하므로 여기서는 빈값 허용)
    entry_blocks = [
        make_entry_block(e["time"], e.get("summary", ""), e.get("forwarded", ""), e["body"])
        for e in entries
    ]

    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            existing = f.read()
        updated = merge_entries(existing, yesterday_iso, entry_blocks)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(updated)
        print(f"UPDATED:{filepath}")
    else:
        content = make_new_note(year_month, yesterday_iso, entry_blocks)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"CREATED:{filepath}")


if __name__ == "__main__":
    main()
