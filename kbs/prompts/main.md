# facebook — 실행 프롬프트

아래 작업을 순서대로 수행해줘. 추가로 묻지 말고 진행해.

---

## 사전 준비 확인

Playwright가 설치되어 있지 않으면 먼저 설치해:

```bash
python3 -m pip install playwright -q
python3 -m playwright install chromium
```

Facebook 로그인 세션 파일 `/Users/tealeaf/.claude/fb_session.json`이 없으면 아래를 사용자에게 안내하고 종료해:

```
Facebook 세션 파일이 없습니다.
터미널에서 /tmp/fb_login3.py를 실행하여 로그인하세요:
  python3 /tmp/fb_login3.py
```

세션 파일이 있으면 다음 단계로 진행해.

---

## 1단계: 페이스북 피드 수집

`scripts/fetch_feed.py`를 실행해서 어제 날짜(KST) 포스트를 수집해.

```bash
python3 /Users/tealeaf/.claude/skills/facebook/scripts/fetch_feed.py
```

스크립트 출력 형식:
- `YESTERDAY:YYYY-MM-DD`
- `MONTH:yymm`
- `COUNT:N`
- `---POST---` 구분자 이후 각 포스트 블록:
  - `TIME:HH:MM`
  - 본문 텍스트

수집된 피드가 0개면 "어제 올라온 글 없음"을 출력하고 종료해.

---

## 2단계: 포스트 요약 생성

수집된 각 포스트 내용을 읽고, **핵심을 5단어 이내 한국어**로 요약해.
요약은 명사 위주로, 조사는 최소화하여 간결하게 작성해.

예시:
- "VLCC 운임 폭등 신조 확산"
- "달리오 호르무즈 미국 패권 경고"

---

## 3단계: Obsidian 월별 노트에 저장

**저장 경로:**
```
/Users/tealeaf/Library/Mobile Documents/iCloud~md~obsidian/Documents/CC/0 inbox
```

**노트 파일명:** `김봉수_yymm.md` (예: `김봉수_2603.md`)

**처리 로직:**

| 상황 | 처리 |
|------|------|
| 파일 없음 | 신규 생성 (frontmatter + 제목 포함) |
| 파일 있음 | 파일 끝에 `---` 구분선과 함께 append |

**작성 규칙:**
- 항목 헤더: `#### YYYY-MM-DD · HH:MM · <5단어 이내 요약>`
- 항목 간 구분: `---` 수평선
- 본문은 그대로 유지

출력 템플릿 참고: `templates/monthly_note.md`

---

## 4단계: 결과 요약 출력

아래 항목을 포함해 요약 출력:

- 수집된 피드 수
- 저장된 노트 파일명 및 전체 경로
- 신규 생성 / 기존 파일 업데이트 여부
- 각 피드 시간 및 첫 줄 미리보기

---

## ⚠️ 시간 표시 방식

- 시간 링크에 `comment_id` 없음 → hover tooltip으로 정확한 HH:MM 추출
- 시간 링크에 `comment_id` 포함 → 포스트 페이지의 `creation_time` 스크립트 데이터에서 추출
- creation_time도 없을 경우 → `??:??` 표시

## ⚠️ 세션 만료 시 재로그인

Facebook 세션이 만료되면 사용자 터미널에서 실행:

```bash
python3 /tmp/fb_login3.py
```
