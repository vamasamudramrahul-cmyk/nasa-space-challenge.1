# Test report

Run: 2026-10-25 07:00:39 - Playwright 1.56, headless Chromium, site served at http://localhost:8080. Command: `python3 tests/e2e_test.py`.

**Result: 135/135 checks passed, 0 failed.**

Covered (all executed): approved heading/description; hero visible only on Home, no scroll lock; Moon/Mars/Planets cards open the correct pages; all 10 dropdown items, Escape, ArrowDown and Enter; top-nav links; catalogue combined AND filters, clear, no-results; type cards; detail pages and sections; unknown values not shown as zero; conflicting dates/coordinates kept visible; no images rendered; carousel next/prev wrap, 10 s autoplay (fake clock), pause, reduced motion; Moon/Mars/NASA timelines and filters; compare (2-4 records, URL ids, caps); quiz scoring; universal search across 8 content types; glossary/sources/planets/missions; updates feed, opt-in permission request (stubbed), denied/unsupported fallback; mobile (390px) and tablet (820px) overflow; labels, landmarks, skip link; data integrity (unique ids, Moon/Mars only, links resolve, https sources); zero console errors.

Not tested: Safari/Firefox; real screen readers; real browser notification delivery (headless Chromium reports 'denied', so granted/denied flows used a stubbed Notification API); automated colour-contrast audit; source URL reachability (no network); Lighthouse.

Full per-check list: `tests/last_run.json`.
