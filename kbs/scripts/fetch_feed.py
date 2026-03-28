#!/usr/bin/env python3
"""
Facebook 피드 수집 스크립트 (김봉수 / bongsoo2)
어제 날짜(KST) 포스트를 Playwright로 수집하여 구조화된 포맷으로 출력한다.

출력 형식:
  YESTERDAY:YYYY-MM-DD
  MONTH:yymm
  COUNT:N
  ---POST---
  TIME:HH:MM
  <본문>
  ---POST---
  TIME:HH:MM
  <본문>
"""

import asyncio, re, os, sys
from playwright.async_api import async_playwright
from datetime import datetime, timedelta, timezone

SESSION_FILE = '/Users/tealeaf/.claude/fb_session.json'
PROFILE_URL  = 'https://www.facebook.com/bongsoo2'
KST = timezone(timedelta(hours=9))

today_kst     = datetime.now(KST).date()
yesterday_kst = today_kst - timedelta(days=1)
yesterday_str = yesterday_kst.strftime('%Y-%m-%d')
month_display = yesterday_kst.strftime('%y%m')

if not os.path.exists(SESSION_FILE):
    print('ERROR:SESSION_FILE_NOT_FOUND', flush=True)
    sys.exit(1)


def parse_tooltip(tooltip):
    """'Thursday, March 19, 2026 at 2:27 PM' → (date, 'HH:MM')"""
    if not tooltip:
        return None, '??:??'
    normalized = tooltip.replace('\u202f', ' ').strip()
    m = re.search(r'(\w+ \d+, \d{4}) at (\d+:\d+\s*[AP]M)', normalized, re.IGNORECASE)
    if not m:
        return None, '??:??'
    try:
        dt = datetime.strptime(f"{m.group(1)} {m.group(2).strip()}", '%B %d, %Y %I:%M %p')
        return dt.date(), dt.strftime('%H:%M')
    except Exception:
        return None, '??:??'


def rel_to_expected_date(rel_time):
    """'1d' → yesterday, '3h' → today or yesterday"""
    now = datetime.now(KST)
    m = re.match(r'^(\d+)([wdhm])$', rel_time, re.IGNORECASE)
    if not m:
        return None
    n, unit = int(m.group(1)), m.group(2).lower()
    if unit == 'd':
        return (now - timedelta(days=n)).date()
    elif unit == 'w':
        return (now - timedelta(weeks=n)).date()
    elif unit == 'h':
        return (now - timedelta(hours=n)).date()
    elif unit == 'm':
        return now.date()
    return None


async def hover_get_tooltip(page, element):
    try:
        await page.mouse.move(640, 450)
        await page.wait_for_timeout(300)
        await element.scroll_into_view_if_needed()
        await element.hover()
        await page.wait_for_timeout(1500)
        return await page.evaluate(r"""
        () => {
            const portals = document.querySelectorAll('.__fb-light-mode [id^="_r_"], body > div[class]');
            for (const p of portals) {
                const t = p.innerText ? p.innerText.trim() : '';
                if (t.match(/\w+ \d+.*\d+:\d+/)) return t;
            }
            for (const t of document.querySelectorAll('[role="tooltip"]')) {
                if (t.innerText) return t.innerText.trim();
            }
            return null;
        }
        """)
    except Exception:
        return None


async def get_creation_time_from_post_page(page, post_url, expected_date):
    try:
        await page.goto(post_url, wait_until='domcontentloaded', timeout=30000)
        await page.wait_for_timeout(3500)

        timestamps = await page.evaluate(r"""
        () => {
            const results = [];
            const seen = new Set();
            for (const s of document.querySelectorAll('script')) {
                const c = s.textContent || '';
                const re = /"creation_time":(\d{10})/g;
                let m;
                while ((m = re.exec(c)) !== null) {
                    const ts = parseInt(m[1]);
                    if (!seen.has(ts)) { seen.add(ts); results.push(ts); }
                }
            }
            return results.sort();
        }
        """)

        matching = []
        for ts in timestamps:
            dt = datetime.fromtimestamp(ts, tz=KST)
            if dt.date() == expected_date:
                matching.append(dt)

        if matching:
            best = min(matching)
            return best.date(), best.strftime('%H:%M')
    except Exception as e:
        print(f'  [get_creation_time] error: {e}', file=sys.stderr)

    return None, '??:??'


async def get_posts():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            storage_state=SESSION_FILE,
            viewport={'width': 1280, 'height': 900},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        await page.goto(PROFILE_URL, wait_until='domcontentloaded', timeout=60000)
        await page.wait_for_timeout(5000)

        seen_keys = set()
        all_posts = []

        for scroll_n in range(25):
            result = await page.evaluate(r"""
            () => {
                const stories = document.querySelectorAll('[data-ad-rendering-role="story_message"]');
                const posts = [];
                stories.forEach(story => {
                    const seeMoreBtn = story.querySelector('div[role="button"]');
                    if (seeMoreBtn) {
                        const btnText = seeMoreBtn.innerText ? seeMoreBtn.innerText.trim() : '';
                        if (btnText === 'See more' || btnText === '더 보기') {
                            seeMoreBtn.click();
                        }
                    }
                    const text = story.innerText ? story.innerText.trim() : '';
                    const key = text.substring(0, 40);
                    let card = story;
                    let timeInfo = null;
                    for (let i = 0; i < 25; i++) {
                        card = card.parentElement;
                        if (!card) break;
                        for (const a of card.querySelectorAll('a')) {
                            const t = a.innerText ? a.innerText.trim() : '';
                            if (/^\d+[wdhm]$/i.test(t)) {
                                timeInfo = { text: t, href: a.href, hasCommentId: a.href.includes('comment_id') };
                                break;
                            }
                        }
                        if (timeInfo) break;
                    }
                    posts.push({ key, text, timeInfo });
                });
                return posts;
            }
            """)

            await page.wait_for_timeout(800)

            stories_els = await page.query_selector_all('[data-ad-rendering-role="story_message"]')
            expanded = {}
            for el in stories_els:
                t = await el.inner_text()
                if t:
                    t = t.strip()
                    for r in result:
                        if r['key'][:20] in t:
                            expanded[r['key']] = t
                            break

            found_older = False
            for pi in result:
                if pi['key'] in seen_keys or not pi['text']:
                    continue
                seen_keys.add(pi['key'])

                text = expanded.get(pi['key'], pi['text'])
                ti = pi.get('timeInfo') or {}
                rel_time = ti.get('text') or ''
                has_comment_id = ti.get('hasCommentId', False)
                href = ti.get('href') or ''

                expected_date = rel_to_expected_date(rel_time) if rel_time else None

                if expected_date and expected_date < yesterday_kst:
                    found_older = True
                    continue

                post_date, time_str = None, '??:??'

                if has_comment_id and expected_date and href:
                    base_url = href.split('?')[0]
                    print(f'  [comment_id link] fetching post page...', file=sys.stderr)
                    post_date, time_str = await get_creation_time_from_post_page(page, base_url, expected_date)
                    await page.goto(PROFILE_URL, wait_until='domcontentloaded', timeout=60000)
                    await page.wait_for_timeout(3000)
                    seen_keys.discard(pi['key'])
                    if post_date:
                        all_posts.append({'key': pi['key'], 'text': text, 'post_date': post_date, 'time_str': time_str})
                        seen_keys.add(pi['key'])
                    break
                else:
                    for el in stories_els:
                        el_t = await el.inner_text()
                        if el_t and pi['key'][:20] in el_t.strip():
                            time_a = await el.evaluate_handle(r"""
                            el => {
                                let card = el;
                                for (let i = 0; i < 25; i++) {
                                    card = card.parentElement;
                                    if (!card) break;
                                    for (const a of card.querySelectorAll('a')) {
                                        const t = a.innerText ? a.innerText.trim() : '';
                                        if (/^\d+[wdhm]$/i.test(t)) return a;
                                    }
                                }
                                return null;
                            }
                            """)
                            is_null = await time_a.evaluate("el => el === null")
                            if not is_null:
                                tooltip = await hover_get_tooltip(page, time_a)
                                post_date, time_str = parse_tooltip(tooltip)
                            break

                    all_posts.append({'key': pi['key'], 'text': text, 'post_date': post_date, 'time_str': time_str})

            dates = [p['post_date'] for p in all_posts if p['post_date']]
            oldest = min(dates) if dates else None
            print(f'SCROLL:{scroll_n} TOTAL:{len(all_posts)} OLDEST:{oldest}', file=sys.stderr)

            if found_older:
                print('Found posts older than yesterday, stopping', file=sys.stderr)
                break

            await page.evaluate('window.scrollBy(0, 2000)')
            await page.wait_for_timeout(2500)

        await browser.close()
        return all_posts


all_posts = asyncio.run(get_posts())
filtered_posts = [p for p in all_posts if p.get('post_date') == yesterday_kst]

# 구조화된 출력
print(f'YESTERDAY:{yesterday_str}')
print(f'MONTH:{month_display}')
print(f'COUNT:{len(filtered_posts)}')
for post in filtered_posts:
    print('---POST---')
    print(f'TIME:{post["time_str"]}')
    print(post['text'])
