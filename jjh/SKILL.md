---
name: telegram
description: 텔레그램 채널 피드 자동 수집 스킬. 전종현(chunjonghyun) 채널의 어제 날짜 메시지를 Telethon으로 수집하고 Obsidian 월별 노트에 시간순으로 저장한다.
version: 1.0.0
author: tealeaf
---

# telegram

## 목적

텔레그램 채널 `chunjonghyun`(전종현)의 **어제 날짜** 메시지를 자동으로 수집하여 Obsidian 월별 노트에 저장한다.

- 링크·볼드·이탤릭 등 entity를 마크다운으로 변환
- Forwarded 메시지 출처 표시
- 기존 노트가 있으면 날짜·시간순에 맞게 병합, 중복 건너뜀

---

## 사용 방법

```
/telegram
```

인자 없이 실행한다. 어제 날짜(KST)는 자동 계산된다.

---

## 입력

| 항목 | 값 |
|------|-----|
| 채널 | `chunjonghyun` (전종현) |
| 날짜 | 실행일 기준 전날 KST |
| 세션 | `/Users/tealeaf/.claude/tg_session` |

---

## 출력

| 항목 | 설명 |
|------|------|
| 노트 파일명 | `전종현_yymm.md` (예: `전종현_2603.md`) |
| 저장 경로 | `/Users/tealeaf/Library/Mobile Documents/iCloud~md~obsidian/Documents/CC/0 inbox` |
| 결과 요약 | 수집 건수, 신규 생성/업데이트 여부, 피드 미리보기 |

### 노트 파일명 예시

```
전종현_2603.md
```

---

## 실행 흐름

```
1단계: 텔레그램 피드 수집  → Telethon으로 어제자 메시지 파싱 (링크·서식 마크다운 변환)
2단계: Obsidian 노트 저장  → 월별 파일에 날짜·시간순 병합 (신규 생성 또는 기존 파일 업데이트)
3단계: 결과 요약 출력      → 수집 수, 저장 경로, 각 피드 미리보기
```

자세한 프롬프트 지시: `prompts/main.md`
수집 스크립트: `scripts/fetch_feed.py`
노트 저장 스크립트: `scripts/write_note.py`
채널 정보: `references/channel_info.md`
출력 템플릿: `templates/monthly_note.md`

---

## 파일 구조

```
telegram/
├── SKILL.md                  ← 스킬 정의 (이 파일)
├── prompts/
│   └── main.md               ← LLM 실행 프롬프트
├── scripts/
│   ├── fetch_feed.py         ← Telethon 메시지 수집 스크립트
│   └── write_note.py         ← Obsidian 노트 병합·저장 스크립트
├── references/
│   └── channel_info.md       ← 채널 정보, API 자격증명, 경로
└── templates/
    └── monthly_note.md       ← Obsidian 월별 노트 템플릿
```
