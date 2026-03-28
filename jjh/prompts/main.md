# telegram — 실행 프롬프트

아래 작업을 순서대로 수행해줘. 추가로 묻지 말고 진행해.

---

## 1단계: 텔레그램 피드 수집

`scripts/fetch_feed.py`를 실행해서 어제 날짜(KST) 메시지를 수집해.

```bash
python3 /Users/tealeaf/.claude/skills/telegram/scripts/fetch_feed.py
```

스크립트 출력 형식:
- `YESTERDAY_ISO:YYYY-MM-DD`
- `YESTERDAY_DISPLAY:yymmdd`
- `YEAR_MONTH:yymm`
- `COUNT:N`
- `---MSG---` 구분자 이후 각 메시지 블록:
  - `TIME:HH:MM`
  - `FORWARDED:채널명|URL` (해당 시)
  - 마크다운 변환된 본문

수집된 피드가 0개면 "어제 올라온 글 없음"을 출력하고 종료해.

---

## 2단계: Obsidian 월별 노트에 저장

`scripts/write_note.py`를 실행해서 수집된 피드를 노트에 저장해.

```bash
python3 /Users/tealeaf/.claude/skills/telegram/scripts/write_note.py
```

**저장 경로:**
```
/Users/tealeaf/Library/Mobile Documents/iCloud~md~obsidian/Documents/CC/0 inbox
```

**노트 파일명:** `전종현_yymm.md` (예: `전종현_2603.md`)

**처리 로직:**

| 상황 | 처리 |
|------|------|
| 파일 없음 | 신규 생성 (frontmatter + 제목 포함) |
| 파일 있음, 해당 날짜 섹션 없음 | 날짜순에 맞는 위치에 `## YYYY-MM-DD` 섹션 삽입 |
| 파일 있음, 해당 날짜 섹션 있음 | 섹션 내 마지막 항목 뒤에 추가 |
| 동일 `#### HH:MM` 항목 이미 존재 | 중복 → 건너뜀 |

**작성 규칙:**
- 날짜 구분선: `## YYYY-MM-DD`
- 항목 헤더: `#### HH:MM 핵심내용 요약` (핵심내용은 5단어 이내)
- Forwarded: 헤더 아래에 `> Forwarded from [채널명](URL)` 인용 블록
- 본문 링크: `[텍스트](URL)` 마크다운 형식 유지
- 항목 간 구분: `---` 수평선

출력 템플릿 참고: `templates/monthly_note.md`

---

## 3단계: 결과 요약 출력

아래 항목을 포함해 요약 출력:

- 수집된 피드 수
- 저장된 노트 파일명 및 전체 경로
- 신규 생성 / 기존 파일 업데이트 여부
- 각 피드 첫 줄 미리보기 (Forwarded 여부 포함)
