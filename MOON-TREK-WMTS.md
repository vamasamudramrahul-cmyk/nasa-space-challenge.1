# First Moon Trek WMTS layer integration

This prototype uses one documented NASA/JPL Moon Trek WMTS layer as an initial integration test: **LRO WAC Global Mosaic v2** (`LRO_WAC_Mosaic_Global_303ppd_v02`). NASA's Trek API documentation explains that layers are exposed using the OGC WMTS protocol and that GetCapabilities declares the actual style, matrix set, tile matrix identifiers, and image extension.

- Trek documentation: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon
- Layer GetCapabilities URL: https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/WMTSCapabilities.xml
- Primary tile URL pattern implemented: `https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/1/{row}/{col}.jpg`
- Legacy HTTPS tile URL pattern tried second: `https://moontrek.jpl.nasa.gov/trektiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/1/{row}/{col}.jpg`
- Tile matrix `1`: 4 columns × 2 rows, composing an equirectangular 2:1 global overview. The official NASA API catalog documents the same product and sample `.jpg` tiles; it explains that WMTS GetCapabilities is the source of truth for the extension, style, matrix set, and levels.
- At present this is an overview mosaic for the surface map and global 3D texture. It is not an implementation of the full Moon Trek application or a substitute for its regional analysis tools.
- Terrain/elevation mode and its LRO/LOLA globe data have been removed from this project.
- Attribution: NASA/GSFC/Arizona State University LRO Wide Angle Camera mosaic; served by NASA/JPL Solar System Treks.

## Fallback and verification

The browser attempts the primary tile endpoint, then the legacy HTTPS endpoint. If tile requests fail, the page falls back to the existing NASA LRO global texture and shows that in its status text. Images are requested with CORS enabled, and the composed canvas is checked before being used for downloadable imagery.

Static code validation passed in the build environment. The build environment could not resolve external hostnames and its Chromium runtime blocked local page navigation, so successful live tile rendering could not be verified here. Please verify on a normal browser with internet access: the Moon status should report “NASA Moon Trek WMTS layer loaded” and the surface map should show the global lunar mosaic. If the status reports the fallback, use the official Trek link and check browser network/CORS errors before assuming the live layer is available.
