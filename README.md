# Abandoned but Not Forgotten — NASA Space Apps Challenge 2026 (working prototype)

Educational, interactive exploration of NASA missions and the Moon/Mars hardware they left behind. Plain HTML, CSS and JavaScript (ES modules); no backend, no build step, no paid services, no API keys.

## Run it
The site loads its JSON with `fetch`, so serve it over HTTP (opening `index.html` as a file will show an explanatory error):

```
cd abnf
./start.sh                  # or: python3 -m http.server 8080
# open http://localhost:8080
```

## Structure
```
index.html              app shell: header/nav, hero slot, #view, footer
css/hero.css            supplied hero stylesheet (unchanged, scoped to .universe)
css/styles.css          site styles (white pages, black header)
js/hero.js              supplied starfield script (unchanged)
js/app.js               router (hash routes), accessible nav, header search, compare bar, notification check
js/data.js              loads JSON, lookups, runtime statistics
js/catalogue.js         reusable filter + grid + coordinate plot
js/views-core.js        home, destination, catalogue, equipment detail, missions
js/views-more.js        planets, timeline, compare, quiz, glossary, sources, about, updates, search
js/search.js            universal search index
js/compare-state.js     comparison selection
js/util.js              helpers (escaping, dates, status chips, storage)
data/*.json             content used by the site (equipment, missions, planetary, timeline, sources, site, glossary, quiz, updates)
data/source_*           the supplied seed CSV and planetary JSON (inputs)
scripts/build_data.py   regenerates equipment/missions/planetary/timeline/sources/site JSON from the inputs
tests/e2e_test.py       Playwright end-to-end suite; tests/last_run.json = last result
docs/                   CONTENT_AND_EVIDENCE.md, KNOWN_LIMITATIONS.md, TEST_REPORT.md
```
Routes: `#/` `#/moon` `#/mars` `#/planets[/id]` `#/missions` `#/mission/id` `#/catalogue` `#/equipment/id` `#/timeline/{moon|mars|nasa}` `#/compare` `#/quiz` `#/glossary` `#/sources` `#/about` `#/updates` `#/search?q=`.

## Regenerate data / test
```
python3 scripts/build_data.py                       # needs only the Python standard library
pip install playwright && playwright install chromium
python3 -m http.server 8080 &  python3 tests/e2e_test.py
```

## Deploy
Static files only: upload the folder to any static host (GitHub Pages, Netlify, Cloudflare Pages, S3). Data changes ship with a redeploy.

## Decisions to review
See `docs/KNOWN_LIMITATIONS.md` (spec conflicts and editorial mappings: status category, "Spacecraft" type, mass statistic) and `docs/CONTENT_AND_EVIDENCE.md`.
