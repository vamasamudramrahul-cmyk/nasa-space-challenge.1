# Content and evidence note

## What the data is
- **Equipment (19 records, Moon 5 / Mars 14):** parsed from `data/source_equipment_seed.csv` (the NASA-only working subset). The supplied file is marked "DO NOT PUBLISH YET": it is not a full inventory and several fields are unverified. IDs (M001, R001...) are project-created, not NASA IDs.
- **Planetary cards (7):** `data/source_planetary_cards.json`, kept out of the catalogue and its filters. Status text for Juno, Voyager 2 and New Horizons is time-sensitive ("recheck at release") and was **not** re-verified here.
- **Timeline (88 events):** built from each record's `mission_history` plus planetary-card dates. Event-type labels are assigned by keyword rules in `scripts/build_data.py` (editorial). Day/month/year precision is preserved; conflicting dates (e.g. Viking 2 final operations "1980-04-11/12") show "Sources differ" with the note.
- **Sources (50 URLs):** every URL appearing as a record source, claim source or event source. The seed has no source titles, so only organisation (from domain) and URL are shown.
- **Glossary / quiz / updates:** written for this prototype from the records. Glossary definitions are project wording marked "source review pending"; quiz questions use only high-clarity record facts and cite the record's source URL.

## Verification performed
No new web research was done and no NASA page was re-checked in this build (no network in the build environment). All facts are as supplied. A record-level source URL is not treated as proof of each field; claim-level entries appear where the seed provides them.

## Editorial mappings added (need owner review)
1. **Working-status category** (green/yellow/red) per record, with a one-line basis stored in `status_category_basis` and shown on detail pages. Original labels and colours are unchanged; no new categories.
2. **Equipment type categories** for the six homepage types. "Spacecraft" is an umbrella for orbiters, landers and the Apollo 11 lunar module; "Descent stages" currently holds only Apollo 11 Eagle (descent stage remains on the Moon).
3. **Mass statistic:** sums only landed-vehicle masses with an explicit rover/lander/landing basis (Apollo LRV, Viking 1 and 2, Sojourner, Spirit, Opportunity) for records whose hardware remains on a surface; launch/wet/unverified masses (Surveyor 1, Lunar Orbiter 1, Ingenuity, orbiters) are excluded. Currently 1,904.6 kg, shown as partial.

## Missing / unresolved data
- **Images:** `image_url` is empty for all 19 records. No image, placeholder or generic illustration is shown anywhere; image areas are omitted.
- **Earliest artifact year:** no source-backed artifact-year field exists; shown as Unavailable.
- **Coordinates:** 5 records have a sourced landing-site coordinate (Apollo 11 Eagle, Surveyor 1, Viking 1, Viking 2, Phoenix). Lunar Orbiter 1 has conflicting published impact coordinates (unresolved; not plotted). Rover final positions, orbiters and moving rovers have none.
- Missing mass/dimensions/power/mobility render as "Unknown / not verified", never zero.
- Mixed conventions in the seed (longitude east-positive 0–360 vs -180–180) are displayed with the convention string supplied; the plot converts for drawing only.
- Not used from the ZIP: the legacy PRD/UX/technical drafts (older status enum and placeholder-image proposals conflict with the corrected spec), the research workbooks and the UI reference media (used only as visual reference).
