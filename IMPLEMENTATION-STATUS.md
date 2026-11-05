# Abandoned but Not Forgotten — integrated implementation status

This package combines the current prototype with the requested Moon/Mars map integration and the currently implemented site changes.

## Included in this build
- Moon and Mars interactive 3D globe plus surface-map views. Surface imagery uses remote NASA/NASA-JPL/USGS imagery and may require an internet connection.
- Map controls menu toggle, zoom/fullscreen controls, equipment markers where usable coordinates exist, and map downloads.
- Terrain/elevation layers and related controls/data are not included.
- Explore Planets uses a 3D globe selector for the eight planets only; the Moon remains a dedicated destination.
- Homepage hero buttons removed; equipment-type cards include imagery; homepage research-registry section is absent.
- Equipment Library uses an Operational Status Colors key. Moon/Mars timelines use Working Status Colors.
- Quiz limited to five questions; retry label is “Retry”; the requested NASA archive claim has been removed from the result text.
- Classroom includes guided starter lessons, learning-path entry points, teacher resource text downloads, local notes/bookmarks/completion, My Learning, and progress export.
- About, Source and Evidence, Glossary, Compare, Equipment Library, and updates screens remain present.

## Limitations to test / future work
- Remote NASA imagery is not bundled locally and depends on network availability, remote-service uptime, and browser cross-origin policies.
- The Classroom is a starter prototype with four authored guided lessons and starter teacher templates, not a complete curriculum pack; some learning-path/resource filters remain lightweight and need fuller content wiring.
- Verify all routes, responsive behavior, marker coordinate provenance, downloads, and accessibility in a real browser before presenting as complete.
- This build has not been certified against WCAG 2.2 AA and does not claim formal scientific review of every record.
