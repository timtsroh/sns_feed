---
name: facebook
description: 페이스북 프로필 피드 자동 수집 스킬. 김봉수(bongsoo2) 프로필의 어제 날짜 포스트를 Playwright로 수집하고 Obsidian 월별 노트에 시간순으로 저장한다.
version: 1.0.0
author: tealeaf
---

# facebook

## 목적

페이스북 프로필 `bongsoo2`(김봉수)의 **어제 날짜** 포스트를 자동으로 수집하여 Obsidian 월별 노트에 저장한다.

- Playwright(headless Chromium)로 피드 스크래핑
- 시간 링크 hover tooltip 또는 `creation_time` 스크립트 데이터로 정확한 HH:MM 추출
- 각 포스트를 5단어 이내 한국어로 요약
- 기존 노트가 있으면 기존 파일 끝에 append

---

## 사용 방법

```
/facebook
```

인자 없이 실행한다. 어제 날짜(KST)는 자동 계산된다.

---

## 입력

| 항목 | 값 |
|------|-----|
| 프로필 | `https://www.facebook.com/bongsoo2` (김봉수) |
| 날짜 | 실행일 기준 전날 KST |
| 세션 | `/Users/tealeaf/.claude/fb_session.json` |

---

## 출력

| 항목 | 설명 |
|------|------|
| 노트 파일명 | `김봉수_yymm.md` (예: `김봉수_2603.md`) |
| 저장 경로 | `/Users/tealeaf/Library/Mobile Documents/iCloud~md~obsidian/Documents/CC/0 inbox` |
| 결과 요약 | 수집 건수, 신규 생성/업데이트 여부, 피드 미리보기 |

### 노트 파일명 예시

```
김봉수_2603.md
```

---

## 실행 흐름

```
사전 확인: Playwright 설치 여부 + 세션 파일 존재 여부 확인
1단계: 페이스북 피드 수집  → Playwright로 어제자 포스트 파싱 (정확한 HH:MM 추출)
2단계: 포스트 요약 생성    → LLM이 각 포스트를 5단어 이내 한국어로 요약
3단계: Obsidian 노트 저장  → 월별 파일에 시간순 저장 (신규 생성 또는 기존 파일 업데이트)
4단계: 결과 요약 출력      → 수집 수, 저장 경로, 각 피드 미리보기
```

자세한 프롬프트 지시: `prompts/main.md`
수집 스크립트: `scripts/fetch_feed.py`
프로필 정보: `references/profile_info.md`
출력 템플릿: `templates/monthly_note.md`

---

## 파일 구조

```
facebook/
├── SKILL.md                  ← 스킬 정의 (이 파일)
├── prompts/
│   └── main.md               ← LLM 실행 프롬프트
├── scripts/
│   └── fetch_feed.py         ← Playwright 피드 수집 스크립트
├── references/
│   └── profile_info.md       ← 프로필 정보, 세션 경로, 저장 경로
└── templates/
    └── monthly_note.md       ← Obsidian 월별 노트 템플릿
```
