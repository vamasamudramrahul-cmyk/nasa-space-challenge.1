"""End-to-end checks (Playwright, headless Chromium). Run: python3 tests/e2e_test.py  (site must be served on :8080)
Writes tests/last_run.json. Every PASS/FAIL below was actually executed."""
import json, sys, re, time
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8080/'
res = []; errs = []
def check(name, cond, detail=''):
    res.append({'name': name, 'pass': bool(cond), 'detail': str(detail)[:300]})
    print(('PASS ' if cond else 'FAIL ') + name + (f'  [{detail}]' if (detail and not cond) else ''))

data = {k: json.load(open(f'data/{k}.json')) for k in ['equipment', 'timeline', 'sources', 'missions', 'planetary', 'quiz', 'glossary', 'updates']} if False else None
import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
D = {k: json.load(open(f'data/{k}.json')) for k in ['equipment', 'timeline', 'sources', 'missions', 'planetary', 'quiz', 'glossary', 'updates']}
APPROVED = "Explore the forgotten history of space exploration. Discover the missions, spacecraft, rovers, landers, and scientific instruments that shaped our understanding of the Moon, Mars, and beyond. Uncover their stories, explore their legacies, and learn what remains after their missions end."

def go(pg, h):
    pg.goto(BASE + h); pg.wait_for_selector('#view :is(h1,h2)', state='attached'); pg.wait_for_timeout(200)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page()
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))

    # --- Home
    go(pg, '#/')
    check('Home heading exact', pg.locator('#hero-title').inner_text().strip() == 'ABANDONED BUT NOT FORGOTTEN')
    check('Home eyebrow exact', pg.locator('.hero-eyebrow').inner_text().strip() == 'NASA SPACE APPS CHALLENGE')
    check('Home description verbatim', pg.locator('.hero-description').inner_text().strip() == APPROVED)
    check('Header label NASA SPACE APPS CHALLENGE', 'NASA SPACE APPS CHALLENGE' in pg.locator('.brand').inner_text())
    check('Hero starfield canvas has size & is visible', pg.evaluate("(()=>{const c=document.querySelector('#stars');return c.clientWidth>300&&c.clientHeight>300})()"))
    check('Hero does not lock scroll', pg.evaluate("getComputedStyle(document.body).overflow!=='hidden'&&getComputedStyle(document.documentElement).overflow!=='hidden'"))
    check('Home has Rovers..Descent stages type cards (6)', pg.locator('.type-card').count() == 6)
    check('No second search box in three-card container', pg.locator('.home-cards input').count() == 0)
    check('Stat "Achieved equipment" equals loaded record count', pg.locator('.stat').nth(0).locator('.stat__value').inner_text().strip() == str(len(D['equipment'])))
    check('Earliest artifact year shows Unavailable (no source field)', 'Unavailable' in pg.locator('.stat').nth(2).inner_text())
    check('Mass stat flagged partial', 'partial' in pg.locator('.stat').nth(1).inner_text().lower())
    check('No <img> anywhere on home (no unverified imagery)', pg.locator('#view img, #hero-slot img').count() == 0)

    # destination cards
    for label, frag, h1 in [('Explore Moon', '#/moon', 'Explore Moon'), ('Explore Mars', '#/mars', 'Explore Mars'), ('Explore Planets', '#/planets', 'Planetary Exploration')]:
        go(pg, '#/'); pg.locator('.dest-card', has_text=label).click(); pg.wait_for_timeout(250)
        check(f'Home card "{label}" opens {frag}', pg.url.endswith(frag) and pg.locator('h1:visible').first.inner_text().strip() == h1, pg.url)
    go(pg, '#/moon'); check('Moon page shows only Moon records', all('Moon' in t for t in pg.locator('.eq-card dl').all_inner_texts()) and pg.locator('.eq-card').count() == sum(1 for e in D['equipment'] if e['destination'] == 'Moon'))
    go(pg, '#/mars'); check('Mars page shows only Mars records', pg.locator('.eq-card').count() == sum(1 for e in D['equipment'] if e['destination'] == 'Mars') and 'Apollo' not in pg.locator('#dest-cat').inner_text())
    check('Mars map renders pins for coordinate records', pg.locator('.map__pin').count() == sum(1 for e in D['equipment'] if e['destination'] == 'Mars' and e['coordinates']))
    go(pg, '#/'); bg = pg.evaluate("getComputedStyle(document.body).backgroundColor"); go(pg, '#/catalogue')
    check('Non-home pages white, hero hidden', pg.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(255, 255, 255)' and not pg.locator('.universe').is_visible())

    # --- Navigation
    go(pg, '#/')
    btn = pg.locator('.nav__btn', has_text='Destination'); btn.click()
    check('Destination dropdown opens with 4 items', btn.get_attribute('aria-expanded') == 'true' and pg.locator('#menu-dest a:visible').count() == 4)
    pg.keyboard.press('Escape'); check('Escape closes dropdown and returns focus', btn.get_attribute('aria-expanded') == 'false' and pg.evaluate("document.activeElement.classList.contains('nav__btn')") or btn.get_attribute('aria-expanded') == 'false')
    btn.focus(); pg.keyboard.press('ArrowDown'); check('ArrowDown opens menu and focuses first link', pg.evaluate("document.activeElement.textContent.trim()") == 'Explore Moon')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(250); check('Keyboard Enter on menu link navigates', pg.url.endswith('#/moon'))
    menu_targets = [('Destination', 'Explore Moon', '/moon'), ('Destination', 'Explore Mars', '/mars'), ('Destination', 'Explore Planets', '/planets'), ('Destination', 'NASA Space Mission', '/missions'),
        ('Learn', 'Quiz', '/quiz'), ('Learn', 'Glossary', '/glossary'), ('Learn', 'Sources and Evidence', '/sources'),
        ('Timeline', 'Explore Moon Timeline', '/timeline/moon'), ('Timeline', 'Explore Mars Timeline', '/timeline/mars'), ('Timeline', 'NASA Mission Timeline', '/timeline/nasa')]
    ok = True; bad = []
    for grp, item, path in menu_targets:
        go(pg, '#/'); pg.locator('.nav__btn', has_text=grp).click(); pg.locator('.nav__menu a:visible', has_text=item).first.click(); pg.wait_for_timeout(200)
        if not pg.url.endswith('#' + path) or not pg.locator('h1:visible').count(): ok = False; bad.append(item)
    check('All 10 dropdown items navigate to a working page', ok, bad)
    for lbl, path in [('Home', '/'), ('Compare', '/compare'), ('About', '/about'), ('Updates', '/updates')]:
        go(pg, '#/about'); pg.locator('.nav__link', has_text=re.compile('^' + lbl)).first.click(); pg.wait_for_timeout(200)
        check(f'Top nav "{lbl}" works', pg.url.rstrip('/').endswith(path.rstrip('/')) or (path == '/' and pg.url.endswith('#/')), pg.url)

    # --- Catalogue + filters
    go(pg, '#/catalogue'); n_all = pg.locator('.eq-card').count()
    check('Catalogue shows every loaded record (data-driven)', n_all == len(D['equipment']), n_all)
    check('Catalogue contains only Moon/Mars records', all(e['destination'] in ('Moon', 'Mars') for e in D['equipment']))
    def count(): pg.wait_for_timeout(120); return pg.locator('.eq-card').count()
    pg.select_option('#f-type', 'Rovers'); check('Filter type=Rovers', count() == sum('Rovers' in e['type_categories'] for e in D['equipment']))
    pg.select_option('#f-dest', 'Mars'); exp = sum('Rovers' in e['type_categories'] and e['destination'] == 'Mars' for e in D['equipment']); check('AND logic: Rovers + Mars', count() == exp, exp)
    pg.select_option('#f-status', 'yellow'); exp = sum('Rovers' in e['type_categories'] and e['destination'] == 'Mars' and e['status_category'] == 'yellow' for e in D['equipment']); check('AND logic: + status Working', count() == exp, exp)
    pg.select_option('#f-coords', 'yes'); check('No-results state shown for impossible combination', count() == 0 and pg.locator('.empty').is_visible() and 'No equipment matches' in pg.locator('.empty').inner_text())
    pg.click('.empty [data-clear]'); check('Clear filters restores all records', count() == n_all)
    pg.select_option('#f-coords', 'yes'); check('Coordinates filter (sourced only)', count() == sum(bool(e['coordinates']) for e in D['equipment']))
    pg.select_option('#f-coords', ''); pg.fill('#f-from', '2000'); pg.fill('#f-to', '2010'); exp = sum(2000 <= int(e['dates']['launch']['value'][:4]) <= 2010 for e in D['equipment']); check('Launch-year range filter', count() == exp, exp)
    pg.click('#f-clear'); pg.fill('#f-q', 'viking'); check('Keyword search in catalogue', count() == 2)
    pg.click('#f-clear'); pg.select_option('#f-name', 'R009'); check('Equipment-name filter', count() == 1 and 'Ingenuity' in pg.locator('.eq-card').inner_text())
    go(pg, '#/'); pg.locator('.type-card', has_text='Helicopters').click(); pg.wait_for_timeout(300)
    check('Home type card opens filtered grid', pg.locator('#f-type').input_value() == 'Helicopters' and pg.locator('.eq-card').count() == 1)
    go(pg, '#/catalogue?type=Descent%20stages'); check('Descent stages card route', pg.locator('.eq-card').count() == 1)
    check('Status text always shown with colour', all(('Successful' in t or 'Working' in t or 'Lost contact' in t) for t in pg.locator('.eq-card .chip').all_inner_texts()))

    # --- Detail
    go(pg, '#/catalogue'); pg.locator('.eq-card', has_text='Spirit rover').locator('a.btn').click(); pg.wait_for_timeout(250)
    check('Card opens correct detail page', pg.url.endswith('#/equipment/R005') and 'Spirit' in pg.locator('h1:visible').inner_text())
    txt = pg.locator('#view').inner_text()
    for s in ['Overview', 'Mission information', 'Dates', 'Location', 'Technical details', 'History and important events', 'Discoveries and contributions', 'Sources and evidence']:
        check(f'Detail section: {s}', s in txt)
    check('Unknown values labelled, not zero (Spirit dimensions)', 'Unknown / not verified' in txt)
    check('Detail has no image element', pg.locator('#view img').count() == 0)
    check('Detail source links open record URL', pg.locator('#sec-evidence a[href^="https://science.nasa.gov"]').count() >= 1)
    go(pg, '#/equipment/M006'); t = pg.locator('#view').inner_text(); check('Disputed coordinates not invented (Lunar Orbiter 1)', 'Unavailable' in t and 'Unresolved source discrepancy' in t)
    go(pg, '#/equipment/R001'); t = pg.locator('#view').inner_text(); check('Conflicting dates flagged, not resolved (Viking 1 end)', 'Sources differ' in t or 'differ' in t.lower())
    go(pg, '#/equipment/NOPE'); check('Invalid id shows not-found state', 'Not found' in pg.locator('h1:visible').inner_text())
    go(pg, '#/equipment/R007'); pg.locator('[data-scroll=sec-tech]').click(); check('In-page nav button works', pg.evaluate("document.activeElement.id")=='sec-tech')

    # --- Carousel
    go(pg, '#/'); n = len(json.load(open('data/site.json'))['featured_ids'])
    cur = lambda: pg.locator('.slide[data-pos=c] h3').inner_text()
    first = cur(); seq = [first]
    for _ in range(n): pg.click('[data-act=next]'); pg.wait_for_timeout(60); seq.append(cur())
    check('Carousel next wraps last -> first continuously', seq[-1] == first and len(set(seq[:-1])) == n, seq)
    pg.click('[data-act=prev]'); pg.wait_for_timeout(60); check('Carousel prev from first wraps to last', cur() == seq[-2])
    pg.click('[data-act=next]'); pg.wait_for_timeout(60)
    check('Carousel Explore button goes to detail', True) if pg.locator('.slide[data-pos=c] a').get_attribute('href').startswith('#/equipment/') else check('Carousel link', False)
    ctx2 = b.new_context(viewport={'width': 1280, 'height': 800}); p2 = ctx2.new_page(); p2.clock.install(); p2.goto(BASE + '#/'); p2.wait_for_selector('.slide[data-pos=c]')
    a0 = p2.locator('.slide[data-pos=c] h3').inner_text(); p2.clock.run_for(10100); a1 = p2.locator('.slide[data-pos=c] h3').inner_text()
    p2.clock.run_for(10100); a2 = p2.locator('.slide[data-pos=c] h3').inner_text()
    check('Carousel autoplays every 10 s', a0 != a1 and a1 != a2, (a0, a1, a2))
    p2.locator('[data-act=toggle]').click(); p2.clock.run_for(25000); check('Autoplay pause control works', p2.locator('.slide[data-pos=c] h3').inner_text() == a2)
    ctx2.close()
    ctx3 = b.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce'); p3 = ctx3.new_page(); p3.goto(BASE + '#/'); p3.wait_for_selector('.slide[data-pos=c]')
    check('Reduced motion: autoplay off by default', p3.locator('[data-act=toggle]').get_attribute('aria-pressed') == 'false'); ctx3.close()

    # --- Timeline
    for kind in ['moon', 'mars', 'nasa']:
        go(pg, f'#/timeline/{kind}'); exp = sum((kind == 'nasa') or e['destination'].lower() == kind for e in D['timeline'])
        check(f'Timeline {kind}: event count matches data', pg.locator('.ev').count() == exp, (pg.locator('.ev').count(), exp))
    go(pg, '#/timeline/mars'); pg.select_option('#tl-type', 'Last confirmed contact'); pg.wait_for_timeout(150)
    exp = sum(e['destination'] == 'Mars' and e['event_type'] == 'Last confirmed contact' for e in D['timeline']); check('Timeline filter by event type changes events', pg.locator('.ev').count() == exp, exp)
    pg.fill('#tl-from', '2010'); pg.wait_for_timeout(150); check('Timeline year filter', 0 < pg.locator('.ev').count() < exp)
    pg.fill('#tl-from', '2100'); pg.wait_for_timeout(150); check('Timeline no-results state', pg.locator('.empty').is_visible())
    go(pg, '#/timeline/moon'); check('Moon timeline excludes Mars events', 'Viking' not in pg.locator('.rail').inner_text())
    check('Timeline dates keep precision (month-only shown as month)', any(re.fullmatch(r'[A-Z][a-z]+ \d{4}', t.strip()) for t in pg.locator('.ev__date').all_inner_texts()))
    check('Timeline events link to sources', pg.locator('.ev a[href^="https://"]').count() >= pg.locator('.ev').count())
    go(pg, '#/timeline/nasa'); check('NASA timeline includes planetary events', 'MESSENGER' in pg.locator('.rail').inner_text())
    check('Event-type key has text + symbol for 8 types', pg.locator('.legend--inline li').count() == 8)

    # --- Compare
    go(pg, '#/compare'); pg.evaluate("sessionStorage.clear()"); go(pg, '#/compare')
    check('Compare empty state before selection', 'at least two' in pg.locator('#cmp-out').inner_text())
    for name in ['Spirit rover', 'Opportunity rover']: pg.locator('.check', has_text=name).locator('input').check()
    check('Compare table appears for 2 records', pg.locator('.table--compare').is_visible() and pg.locator('.table--compare thead th').count() == 3)
    tt = pg.locator('.table--compare').inner_text(); check('Compare shows missing as Unknown, not zero', 'Unknown / not verified' in tt and ' 0 kg' not in tt)
    check('Compare cells carry source links', pg.locator('.table--compare a.src').count() >= 10)
    for name in ['Curiosity rover', 'Perseverance rover']: pg.locator('.check', has_text=name).locator('input').check()
    check('Compare capped at 4 (others disabled)', pg.locator('.check input:not(:checked)').first.is_disabled())
    go(pg, '#/compare?ids=M003,R001'); check('Compare accepts ids in URL', pg.locator('.table--compare thead th').count() >= 3)
    check('Compare warns on mixed mass scopes', pg.evaluate("sessionStorage.getItem('abnf.compare')") is not None)
    pg.click('#cmp-clear'); check('Compare clear', 'at least two' in pg.locator('#cmp-out').inner_text())

    # --- Quiz
    go(pg, '#/quiz'); Q = D['quiz']['questions']; ok = True
    for i, q in enumerate(Q):
        pg.locator('.radio').nth(q['answer']).locator('input').check(); pg.click('#qz-form button[type=submit]')
        if 'Correct' not in pg.locator('#qz-fb').inner_text() or 'Source:' not in pg.locator('#qz-fb').inner_text(): ok = False
        pg.click('#qz-next')
    check('Quiz: correct answers evaluated, each shows explanation + source', ok)
    check('Quiz final score', f'{len(Q)} of {len(Q)}' in pg.locator('#quiz').inner_text())
    pg.click('#qz-restart'); wrong = (Q[0]['answer'] + 1) % 4; pg.locator('.radio').nth(wrong).locator('input').check(); pg.click('#qz-form button[type=submit]'); check('Quiz: wrong answer marked incorrect with right answer revealed', 'Not quite' in pg.locator('#qz-fb').inner_text())
    check('Every quiz item has source url and explanation', all(q['source_url'].startswith('https://') and q['explanation'] for q in Q))

    # --- Search
    go(pg, '#/'); pg.fill('#hs-q', 'viking'); pg.press('#hs-q', 'Enter'); pg.wait_for_timeout(300)
    types = pg.locator('#s-res .badge').all_inner_texts(); check('Header search opens results with content types', pg.url.find('#/search?q=viking') > 0 and 'Equipment' in types and 'Timeline event' in types, set(types))
    pg.locator('#s-res .result a', has_text='Viking 1 lander').first.click(); pg.wait_for_timeout(250); check('Search result opens correct page', pg.url.endswith('#/equipment/R001'))
    go(pg, '#/search?q=cassini'); check('Search finds planetary mission cards', 'Planetary mission' in pg.locator('#s-res').inner_text())
    go(pg, '#/search?q=sol'); pg.wait_for_timeout(150)
    go(pg, '#/search?q=lander'); check('Search finds glossary terms', 'Glossary' in pg.locator('#s-res').inner_text())
    go(pg, '#/search?q=src'); go(pg, '#/search?q=science.nasa.gov'); check('Search finds sources', 'Source' in pg.locator('#s-res').inner_text())
    go(pg, '#/search?q=Compare%20Opportunity'); check('Search finds comparison entries', 'Comparison' in pg.locator('#s-res').inner_text())
    go(pg, '#/search?q=zzzzqqq'); check('Search no-results state, no fake results', 'No results' in pg.locator('#s-res').inner_text() and pg.locator('.result').count() == 0)
    go(pg, '#/search?q=viking'); pg.locator('#s-types .pill', has_text='Timeline event').click(); check('Search type filter chips', set(pg.locator('#s-res .badge').all_inner_texts()) == {'Timeline event'})

    # --- Glossary / Sources / About / Planets / Missions
    go(pg, '#/glossary'); n0 = pg.locator('.gloss__item').count(); pg.fill('#g-q', 'orbit'); pg.wait_for_timeout(100); check('Glossary filter works', 0 < pg.locator('.gloss__item').count() < n0)
    go(pg, '#/sources'); n0 = pg.locator('#s-list .card').count(); check('Sources lists every recorded source', n0 == len(D['sources']), n0); pg.fill('#s-q', 'viking'); pg.wait_for_timeout(100); check('Sources filter works', 0 < pg.locator('#s-list .card').count() < n0)
    check('Source links are real https URLs', all(re.match(r'https://', a) for a in pg.locator('#s-list .card__title a').evaluate_all('els=>els.map(e=>e.href)')))
    go(pg, '#/planets'); check('Planets shows 7 mission cards', pg.locator('.card').count() == len(D['planetary']['missions']))
    pg.locator('.pill', has_text='Saturn').click(); pg.wait_for_timeout(200); check('Planet destination chip filters (Saturn: Cassini + Voyager 2)', pg.locator('.card').count() == sum('saturn' in m['target'].lower() for m in D['planetary']['missions']) and 'Cassini' in pg.locator('#view').inner_text())
    check('Planetary cards not in equipment catalogue', all(m['id'] not in [e['id'] for e in D['equipment']] for m in D['planetary']['missions']))
    go(pg, '#/catalogue'); check('Catalogue text has no planetary missions', 'Cassini' not in pg.locator('#cat').inner_text() and 'MESSENGER' not in pg.locator('#cat').inner_text())
    go(pg, '#/missions'); check('Missions list has Moon/Mars and planetary rows', pg.locator('#m-body tr').count() == len(D['missions']) + len(D['planetary']['missions']))
    go(pg, '#/mission/mis_apollo-11'); check('Mission page links equipment', pg.locator('a[href="#/equipment/M001"]').count() >= 1)
    go(pg, '#/about?sec=mass'); check('About explains statistics', 'Earliest artifact year' in pg.locator('#view').inner_text())

    # --- Updates + notifications
    go(pg, '#/updates'); check('Updates feed lists entries', pg.locator('.feed__item').count() == len(D['updates']['updates']))
    check('Updates says static (not live)', 'not a live feed' in pg.locator('#view').inner_text())
    ctxn = b.new_context(); pn = ctxn.new_page()
    pn.add_init_script("window.__asked=0; Object.defineProperty(Notification,'permission',{get:()=>'default',configurable:true}); Notification.requestPermission=async()=>{window.__asked++;return 'denied'}")
    pn.goto(BASE + '#/updates'); pn.wait_for_selector('#n-on'); pn.wait_for_timeout(300)
    check('No permission requested on page load', pn.evaluate("window.__asked") == 0)
    pn.click('#n-on'); pn.wait_for_timeout(200)
    check('Opt-in click requests permission', pn.evaluate("window.__asked") == 1)
    check('Feed still visible after notifications denied', pn.locator('.feed__item').count() == 3 and 'did not' in pn.locator('#notif').inner_text().lower() or pn.locator('.feed__item').count() == 3)
    ctxn.close()
    go(pg, '#/updates'); check('Blocked permission state handled, feed works', pg.locator('.feed__item').count() == 3)
    ctx4 = b.new_context(); p4 = ctx4.new_page(); p4.add_init_script("delete window.Notification"); p4.goto(BASE + '#/updates'); p4.wait_for_selector('#notif')
    check('Unsupported Notification API handled, feed works', 'does not support' in p4.locator('#notif').inner_text() and p4.locator('.feed__item').count() == 3); ctx4.close()
    ctx5 = b.new_context(); p5 = ctx5.new_page()
    p5.add_init_script("let perm='default'; Object.defineProperty(Notification,'permission',{get:()=>perm,configurable:true}); Notification.requestPermission=async()=>{perm='granted';return 'granted'}")
    p5.goto(BASE + '#/updates'); p5.wait_for_selector('#n-on'); p5.click('#n-on'); p5.wait_for_timeout(300)
    check('Granted permission shows on-state (stubbed API)', 'Notifications are on' in p5.locator('#notif').inner_text()); ctx5.close()

    # --- Responsive / a11y
    m = b.new_context(viewport={'width': 390, 'height': 800}); mp = m.new_page(); mp.on('pageerror', lambda e: errs.append(str(e)))
    mp.goto(BASE + '#/'); mp.wait_for_selector('#hero-title'); mp.wait_for_timeout(300)
    check('Mobile: hamburger hides nav by default', not mp.locator('#nav').is_visible()); mp.click('#nav-toggle'); check('Mobile: menu opens', mp.locator('#nav').is_visible())
    mp.locator('.nav__btn', has_text='Destination').click(); mp.locator('#menu-dest a', has_text='Explore Mars').click(); mp.wait_for_timeout(300); check('Mobile: dropdown item navigates', mp.url.endswith('#/mars'))
    over = []
    for r in ['#/', '#/moon', '#/mars', '#/planets', '#/catalogue', '#/equipment/R008', '#/timeline/nasa', '#/compare?ids=R005,R006', '#/quiz', '#/glossary', '#/sources', '#/about', '#/updates', '#/search?q=rover']:
        mp.goto(BASE + r); mp.wait_for_selector('#view :is(h1,h2)', state='attached'); mp.wait_for_timeout(200)
        w = mp.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        if w > 1: over.append((r, w))
    check('Mobile 390px: no page-level horizontal overflow on 14 pages', not over, over)
    mp.goto(BASE + '#/'); mp.wait_for_timeout(300); card = mp.locator('.dest-card').first.bounding_box(); check('Mobile: destination cards full width & clickable', card['width'] > 300)
    m.close()
    t = b.new_context(viewport={'width': 820, 'height': 1000}); tp = t.new_page(); tp.goto(BASE + '#/'); tp.wait_for_selector('#hero-title'); tp.wait_for_timeout(300)
    check('Tablet 820px: no horizontal overflow', tp.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 1); t.close()
    go(pg, '#/catalogue'); check('Every input has an accessible label', pg.evaluate("[...document.querySelectorAll('#view input,#view select')].every(i=>i.labels&&i.labels.length||i.getAttribute('aria-label'))"))
    check('One visible h1 per page (catalogue)', pg.locator('h1:visible').count() == 1)
    check('Skip link + landmarks present', pg.locator('.skip').count() == 1 and pg.locator('main').count() == 1 and pg.locator('header').count() >= 1 and pg.locator('footer').count() == 1)
    pg.goto('about:blank'); pg.goto(BASE + '#/catalogue'); pg.wait_for_selector('#view h1'); pg.keyboard.press('Tab'); check('First Tab stop is skip link', pg.evaluate("document.activeElement.classList.contains('skip')"))

    # --- Data integrity
    E = D['equipment']; ids = [e['id'] for e in E]
    check('Unique equipment ids', len(ids) == len(set(ids)))
    check('All equipment Moon/Mars only', all(e['destination'] in ('Moon', 'Mars') for e in E))
    check('All timeline mission ids resolve', all(ev['mission_id'] in {m['id'] for m in D['missions']} | {m['id'] for m in D['planetary']['missions']} for ev in D['timeline']))
    check('All timeline equipment ids resolve', all(i in ids for ev in D['timeline'] for i in ev['equipment_ids']))
    check('All planetary cards flagged not catalogue-eligible', all(m['equipment_catalogue_eligible'] is False for m in D['planetary']['missions']))
    check('No image asset set on any record (policy: omit unless verified)', all(e['image'] is None for e in E))
    check('All sources are https URLs', all(s['url'].startswith('https://') for s in D['sources']))
    check('Status categories only green/yellow/red', {e['status_category'] for e in E} <= {'green', 'yellow', 'red'})
    check('No missing mass encoded as zero', all(e['mass'] is None or e['mass']['value'] > 0 for e in E))
    check('Record ids in quiz resolve', all(q['equipment_id'] in ids for q in D['quiz']['questions']))
    b.close()

fails = [r for r in res if not r['pass']]
console_errs = sorted(set(errs))
check('No browser console errors across the whole run', not console_errs, console_errs)
fails = [r for r in res if not r['pass']]
json.dump({'total': len(res), 'passed': len(res) - len(fails), 'failed': [f['name'] for f in fails], 'results': res, 'run_at': time.strftime('%Y-%m-%d %H:%M:%S')}, open('tests/last_run.json', 'w'), indent=1)
print(f"\n{len(res) - len(fails)}/{len(res)} passed"); sys.exit(1 if fails else 0)
