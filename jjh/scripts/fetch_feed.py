#!/usr/bin/env python3
"""
fetch_feed.py
텔레그램 채널 chunjonghyun에서 어제(KST) 날짜 메시지를 수집한다.

출력 형식:
    YESTERDAY_ISO:YYYY-MM-DD
    YESTERDAY_DISPLAY:yymmdd
    YEAR_MONTH:yymm
    COUNT:N
    ---MSG---
    TIME:HH:MM
    FORWARDED:채널명|URL   (해당 시)
    <마크다운 변환 본문>
    ...

사용법:
    python3 fetch_feed.py
"""

import asyncio
from datetime import datetime, timedelta, timezone

from telethon import TelegramClient
from telethon.tl.types import (
    MessageEntityBold,
    MessageEntityCode,
    MessageEntityItalic,
    MessageEntityPre,
    MessageEntityTextUrl,
    MessageEntityUnderline,
    MessageEntityUrl,
)

# ── 설정 (references/channel_info.md 참조) ──────────────────────────────────
API_ID = 32844347
API_HASH = "432b3c2ca6b5e925320031c3e234ac58"
SESSION_FILE = "/Users/tealeaf/.claude/tg_session"
CHANNEL = "chunjonghyun"
FETCH_LIMIT = 200
# ────────────────────────────────────────────────────────────────────────────


def build_markdown(text: str, entities) -> str:
    """Telegram entities를 마크다운 텍스트로 변환한다."""
    if not entities:
        return text

    sorted_ents = sorted(entities, key=lambda e: e.offset)
    result = ""
    prev = 0
    for ent in sorted_ents:
        start = ent.offset
        end = ent.offset + ent.length
        chunk = text[start:end]
        result += text[prev:start]

        if isinstance(ent, MessageEntityTextUrl):
            result += f"[{chunk}]({ent.url})"
        elif isinstance(ent, MessageEntityUrl):
            result += f"[{chunk}]({chunk})"
        elif isinstance(ent, MessageEntityBold):
            result += f"**{chunk}**"
        elif isinstance(ent, MessageEntityItalic):
            result += f"*{chunk}*"
        elif isinstance(ent, MessageEntityUnderline):
            result += f"**{chunk}**"
        elif isinstance(ent, (MessageEntityCode, MessageEntityPre)):
            result += f"`{chunk}`"
        else:
            result += chunk

        prev = end
    result += text[prev:]
    return result


async def main():
    kst = timezone(timedelta(hours=9))
    today_kst = datetime.now(kst).date()
    yesterday_kst = today_kst - timedelta(days=1)

    yesterday_iso = yesterday_kst.strftime("%Y-%m-%d")
    yesterday_display = yesterday_kst.strftime("%y%m%d")
    year_month = yesterday_kst.strftime("%y%m")

    print(f"YESTERDAY_ISO:{yesterday_iso}")
    print(f"YESTERDAY_DISPLAY:{yesterday_display}")
    print(f"YEAR_MONTH:{year_month}")

    client = TelegramClient(SESSION_FILE, API_ID, API_HASH)
    await client.connect()

    messages = []
    async for msg in client.iter_messages(CHANNEL, limit=FETCH_LIMIT):
        msg_date = msg.date.astimezone(kst).date()
        if msg_date == yesterday_kst:
            messages.append(msg)
        elif msg_date < yesterday_kst:
            break

    messages.reverse()  # 오래된 것부터 정렬
    print(f"COUNT:{len(messages)}")

    seen = set()
    for msg in messages:
        if not msg.text:
            continue

        key = msg.text[:30]
        if key in seen:
            continue
        seen.add(key)

        # Forwarded 처리
        forwarded = ""
        if msg.forward:
            fwd = msg.forward
            if hasattr(fwd, "channel_id") and fwd.channel_id:
                try:
                    fwd_entity = await client.get_entity(fwd.channel_id)
                    fwd_name = getattr(fwd_entity, "title", "") or getattr(fwd_entity, "username", "")
                    fwd_username = getattr(fwd_entity, "username", "")
                    fwd_url = f"https://t.me/{fwd_username}" if fwd_username else ""
                    forwarded = f"FORWARDED:{fwd_name}|{fwd_url}"
                except Exception:
                    forwarded = "FORWARDED:Unknown|"
            elif hasattr(fwd, "from_name") and fwd.from_name:
                forwarded = f"FORWARDED:{fwd.from_name}|"

        time_kst = msg.date.astimezone(kst).strftime("%H:%M")
        md_text = build_markdown(msg.text, msg.entities)

        print("---MSG---")
        print(f"TIME:{time_kst}")
        if forwarded:
            print(forwarded)
        print(md_text)

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
