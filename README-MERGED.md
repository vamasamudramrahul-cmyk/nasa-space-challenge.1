# Abandoned but Not Forgotten — merged prototype

This build combines the upgraded visual direction from Prototype 1 with the existing application engine, controls, and production data bundle from Prototype 2.

## What changed

- Added a Space Classroom / eLearning area with four short teaching modules, learning goals, discussion prompts, educator activity structure, and previous/next lesson controls.
- Added a searchable FAQ screen covering catalog scope, map interpretation, evidence labels, comparison, classroom use, and corrections.
- Integrated Prototype 1’s full-page equipment dossier into Prototype 2: breadcrumb/title bar, status, verified-image-only area, mission summary, technical specifications, scientific instruments and discoveries, chronological milestones, evidence register, quick facts, coordinate/uncertainty notes, known data gaps, and comparison/catalogue/quiz actions. The detail renderer maps Prototype 1’s fields to Prototype 2’s existing data schema.
- Added Classroom and FAQ shortcuts to the navigation and map menus.

- Replaced the original plain home hero with Prototype 1's animated starfield/nebula hero.
- Applied the Prototype 1 visual language to the site: dark NASA-style header and footer, white content surfaces, NASA-blue accents, brighter cards, and simplified borders/shadows.
- Added responsive styles for the upgraded hero and destination cards.
- The animated hero runs only while the Home route is active and respects reduced-motion preferences.
- Set the default theme to Light to match Prototype 1. The existing theme toggle remains available; an already-saved theme in the browser still takes precedence.

## What was preserved

- Prototype 2's `app.js` route system and screen markup/IDs.
- The existing bundled 100-record equipment dataset and associated mission, timeline, quiz, glossary, source, update, and planet data.
- Existing 3D canvas globe/map logic, directory filters, grid/table toggle, comparison, quiz, search, recently explored history, notifications, feedback modal, tutorial, theme toggle, and local-storage behavior. Equipment links now route to a full-page dossier instead of opening the old short detail modal; the old modal markup remains in the project but is not used by the equipment detail route.
- Hash routes such as `#home`, `#filters`, `#destination-moon`, `#destination-mars`, `#mission-map`, `#timeline`, `#compare`, `#quiz`, `#glossary`, `#sources`, and `#about`.

## Run locally

Open `index.html` in a modern browser. `data/bundle.js` is retained so the prototype can initialize without fetching the JSON files; the raw JSON datasets are included as well.

## GitHub Pages deployment

Upload the contents of this folder to the repository root (or replace the files in the target branch) and keep the same relative paths. GitHub Pages should serve `index.html` from that root. Test the main routes and interactive controls on the published site after deployment.

## Validation

The app JavaScript passes `node --check` and all JSON datasets parse successfully. The full-page equipment detail route and its responsive dossier styles are present. JavaScript syntax and JSON parsing checks pass. Full browser interaction testing and live deployment have not been completed; before replacing the published site, test equipment links, back navigation, source links, quiz entry, navigation, lessons, FAQ search, map controls, theme toggle, filters, comparison, and mobile layout.

## Planetary map explorer

The Moon, Mars, and Planets destination screens include a shared planetary map explorer. It provides a rotatable Three.js globe and a 2D surface/texture view, search, zoom controls, layer selection, map information, download, and marker popups that link to the existing full equipment dossier. The map uses remote NASA/JPL imagery where available and links to the official NASA Solar System Treks for higher-resolution regional layers and tools.

Map/source notes:
- Moon global surface imagery: NASA/GSFC/Arizona State University LRO Wide Angle Camera mosaic, served through NASA/JPL Moon Trek WMTS where reachable.
- Mars appearance texture: NASA/JPL/USGS Viking global image mosaic. Terrain/elevation map modes and associated globe data have been removed.
- Other planetary textures: NASA/JPL catalog where available. Some outer-planet textures are representative rather than current scientific observations. The Sun uses an explicitly illustrative procedural visualization.
- Location markers are displayed only for records with valid coordinates; no missing location or trajectory data is invented.
- Live imagery and the official Trek links require internet access. If WebGL or remote textures are unavailable, the prototype shows a labelled illustrative fallback.


## First Moon Trek WMTS layer

The Moon destination attempts to load NASA/JPL Moon Trek's LRO WAC global mosaic from the documented WMTS service in both the 3D Moon globe texture and Surface Map view. It composes the WMTS level-1 global tile set (4 columns × 2 rows) into an equirectangular overview. The NASA LRO global image remains as a fallback if NASA tile delivery, browser CORS, or internet access is unavailable. Moon and Mars retain 3D and 2D appearance views; Explore Planets is 3D-only. Terrain/elevation data, map-specific search bars, and time controls have been removed. Live tile loading must still be verified in a normal browser connected to the internet.


## Immersive map viewer layout
Moon, Mars, and the selected planetary body use a custom starfield-backed viewer inspired by the general control placement in NASA's Eyes interface. The viewer has an in-canvas top bar, search, map download, external Trek link, 3D/surface switch, right-side info/layers/zoom/fullscreen controls, status readout, and a bottom-center panel that links to the existing mission timeline or solar-system overview. This is a layout integration; it is not the NASA Eyes application and does not simulate time-dependent orbital positions.
