# UI integration notes

- Prototype 2 remains the application base; its router, DOM hooks, data contracts, and interactive behaviors are retained.
- Prototype 1's NASA-blue/white visual language and cinematic animated home hero are applied through `prototype1-ui/` styles and script.
- Redesigned screens: Home, destination views, equipment directory, full-page equipment details, mission map, planet explorer, compare, quiz, glossary, sources/evidence, FAQs, and Space Classroom.
- Timeline is intentionally excluded from the new light-theme screen-specific styling so its existing Prototype 2 presentation remains intact.
- Data files were preserved from the merged Prototype 2 data bundle.

## Validation status

`app.js` passes `node --check`; all JSON files parse; the detail-screen section, route, renderer, and responsive CSS were checked statically. These checks do not replace browser-based interaction testing. Test all routes, map controls, search, filters, equipment detail navigation, quiz, classroom lesson navigation, and mobile layout before deployment.

## Follow-up decisions (26 Oct 2026)
- Header branding/logo is retained from the current Prototype 2 header, while the navigation layout is reorganized to the requested structure: Home, Destinations, Learn, Updates, About / Sources & Evidence.
- Timeline is not in the menu and the home timeline preview is removed. The existing Prototype 2 dedicated Timeline view is retained, with destination-specific Moon/Mars timeline links left in place.
- Equipment card/search/map-linked records now open a full-page dossier adapted from Prototype 1. It reads Prototype 2’s existing camelCase data fields and includes claim-level source rows only when present in the data, otherwise showing the primary record source without inventing individual claims. The dossier’s five-question quiz action stores the selected artifact context and opens the existing quiz view. Contextual per-item question selection and mission/planet-specific five-question quizzes still require implementation and browser validation.
- The Updates navigation destination needs a dedicated rendered view before that menu item is considered complete.

## Consolidated change pass (2026-10-28)

Base used: original `3rd.zip`. Existing core files and data files were retained and edited in place; this pass does not replace the project with another prototype.

Applied from the removal list:
- Removed NASA logo/graphic and the old project-name line from the header; header brand now reads `NASA SPACE APPS CHALLENGE`.
- Removed the hero eyebrow `NASA SPACE APPS CHALLENGE · THE NEXT FRONTIER`.
- Removed destination equipment-count stat boxes, map search/download/menu controls, accessible coordinate-table fallback sections, and reset/auto-rotate controls from Moon/Mars/Planets views. Core globe canvas, marker popup, zoom, info and layers controls remain.
- Removed the Equipment Library table-view toggle/table and Mission column.
- Removed the Missions directory screen and its navigation entry while retaining the mission dataset and internal data structures.
- Removed glossary category labels/filters from the visible glossary cards.
- Limited comparison UI and logic to two equipment records.

Applied from `1st.zip` updates PDF:
- Kept the existing header structure, updated its branding, added eLearning navigation, and added a notification bell beside global search.
- Added centered `Explore by categories` / `Browse equipment by their type` cards without icons.
- Added the Updates screen route.

Applied from `2nd.zip` and the timeline recording:
- Added Moon and Mars timelines inside their respective destination screens, filtered and sorted by destination/date.
- Removed the standalone combined timeline screen so timeline events are shown only in their respective destinations.

Applied from `4th.zip` updates PDF:
- Added the featured-equipment carousel below the type cards, with center/right/left card movement, six-second autoplay, looping, and centered Previous/Pause/Next controls. No “Showing X of Y” indicator is shown.
- Simplified Sources & Evidence to equipment names and clickable source links.
- Updates screen shows only entries with `approved: true`; existing update records without that flag are intentionally not displayed until manually approved.

Validation note: syntax and JSON parsing checks are included in the delivery review. Full interactive browser testing remains outstanding.


## Consolidated correction pass (2026-10-28)
- Base remains the previously consolidated Prototype 3 project; existing core application files and JSON datasets were preserved.
- Navigation reordered to Home, Destination, Library, About, eLearning, followed by search and notification bell. Existing route targets are reused.
- Home destination cards now use a consistent responsive three-card layout based on Prototype 1 and omit the View Lunar/Martian Hardware / View Planetary Missions links. The whole card remains a functional route link.
- Featured carousel remains directly below Browse equipment by their type, with 6-second continuous autoplay and Previous/Pause/Next controls.
- Moon and Mars destination timelines continue to use the Prototype 2 timeline dataset and alternating timeline-card presentation, filtered to the matching destination only.
- No research data was added or fabricated in this correction pass. Browser-level interaction testing remains necessary.

## Planetary map upgrade (2026-10-28)

- Base project remains the latest supplied working ZIP descended from `3rd.zip`; map-related HTML, CSS and JavaScript were added/updated in the existing project, preserving the application router and data bundle.
- Moon and Mars screens provide NASA-backed 3D globes and 2D global surface-imagery views, with equipment markers, a collapsible controls panel, download actions, Info dialog, zoom controls and location popups. The Explore Planets screen is 3D-only. Map-specific search bars and time controls have been removed.
- Three.js textured globes use NASA/JPL/GSFC imagery: the Moon uses the NASA/JPL Moon Trek LRO WAC WMTS mosaic where reachable, Mars uses the NASA/JPL/USGS Viking global image mosaic, and other bodies use the listed NASA/JPL textures where available. The Sun is explicitly a procedural visualization, not a NASA surface map.
- Terrain/elevation map modes and their globe data have been removed from the project.
- Mars 3D and 2D appearance views use NASA/JPL/USGS Viking global image imagery; no terrain/elevation data is loaded.
- Planetary textures for Jupiter, Saturn, Uranus and Neptune are labelled as representative/illustrative where appropriate. The interface links to NASA Solar System Treks for supported regional layers and measurement tools rather than claiming to reproduce all capabilities of the official Trek web apps.
- Equipment/site markers are created only for existing equipment records with valid latitude/longitude values. Missing coordinates or mission trajectories are never inferred. The Mission-linked layer highlights the available mapped records associated with missions; no independent mission-track dataset was fabricated.
- Map marker popups link to the existing full-page equipment detail route (`#equipment/<id>`). The Planetary Globe Explorer selector synchronizes with the existing Solar System Overview/card selection.
- Map information notes document coordinate uncertainty, the distinction between a landing-site coordinate and a surveyed hardware position, texture credits, and the intended use of the official NASA Trek portals.
- WebGL/CDN or imagery failures trigger a labelled illustrative fallback; this does not claim to be live NASA imagery. The fallback retains basic mode, layer, info, search and download controls where possible.

### Map validation

- `app.js` and `prototype1-ui/planetary-map-engine.js` pass Node syntax checks.
- All JSON datasets parse.
- HTML ID scan found no duplicate IDs; map canvas, loader, search, layer, download and popup controls are present once per screen.
- Full interactive browser testing could not be completed in the constrained build environment. On a normal browser with internet access, test NASA/JPL image loading, WMTS tile availability/CORS, WebGL, view switching, marker navigation, download permissions, zoom controls, the body selector, and responsive layout before deployment.


## First NASA Moon Trek WMTS integration (2026-10-28)

- First external map layer integrated: NASA/JPL Moon Trek `LRO_WAC_Mosaic_Global_303ppd_v02` equirectangular global lunar mosaic.
- Official Trek WMTS documentation: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon
- Capabilities document for this layer: https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/WMTSCapabilities.xml
- REST tile template used first: `https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/1/{row}/{col}.jpg`; it composes TileMatrix 1, 4 columns × 2 rows into a 2:1 equirectangular canvas. It uses the `default` style and `default028mm` TileMatrixSet; `.jpg` follows NASA's published example for this mosaic.
- A legacy HTTPS `moontrek.jpl.nasa.gov/trektiles/...` tile path is tried as a fallback before reverting to the existing NASA LRO WAC global texture. The fallback is visibly reported in the map status; the app does not claim the WMTS data loaded if requests fail.
- The NASA Moon Trek WMTS overview is used for the Moon surface map and, where WebGL is available, the 3D Moon globe texture. Terrain/elevation mode and its data are removed.
- Map tile images are loaded with CORS enabled and the canvas is checked with `toDataURL()` so image download does not silently use a tainted canvas. If CORS or network access blocks the tile mosaic, a labelled existing NASA texture fallback is used.
- NASA's Trek documentation explains that WMTS GetCapabilities declares the image extension, style, TileMatrixSet, and TileMatrix zoom identifiers. This integration uses the published mosaic example and must still be live-tested in a normal browser to confirm current endpoint availability and CORS behavior.

### First-layer validation status

- Static code checks: complete (JavaScript syntax, JSON parse, required endpoint/markup checks, ZIP integrity).
- Live NASA network fetch from the build environment: unavailable because outbound DNS/network access is restricted; therefore successful live tile rendering could not be confirmed here. Browser status feedback and a labelled fallback are included so the layer can be verified on the user's computer with internet access.


## Immersive planetary map layout (2026-10-28)
- Applied an immersive starfield viewer layout to Moon and Mars with a compact 3D Globe/Surface Map switch at the top-right, a collapsible left-side controls panel, right-side info/zoom/fullscreen rail, and lower status bar. Map search and time controls are removed. Explore Planets retains only its 3D globe layout.
- NASA Trek WMTS / planetary appearance-texture logic, map markers, controls popovers, equipment-detail links, and destination timelines remain in place; terrain/elevation data and the separate Explore Planets 2D layout are removed.
- Time Controls opens a clearly labelled panel that navigates to the associated Moon/Mars mission timeline or the planetary overview; it does not claim to simulate time or ephemerides.
- Fullscreen uses the browser Fullscreen API where supported. External tile rendering, browser export permissions, and interaction behaviour still need browser testing.
