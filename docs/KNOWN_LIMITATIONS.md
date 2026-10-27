# Known limitations and spec conflicts

## Conflicts resolved (higher-priority rule applied)
- **Status taxonomy:** legacy Data & Technical Spec proposes `Abandoned/Inactive/Lost/Retired/Unknown`; the corrected spec requires Green = Successful, Yellow = Working, Red = Lost contact or stopped working. Corrected spec followed.
- **Image fallback:** legacy docs propose placeholders; corrected spec/master prompt require omitting the image area. Omitted.
- **Globe:** legacy UX guide asks for a 3D globe; the corrected spec has none. A 2D schematic coordinate plot on Moon/Mars pages (synchronised with filters) is provided instead; it is not a surface map.
- **Timeline colours:** the corrected spec defines only the status legend. Event-type colours deliberately avoid green/yellow/red and always come with a symbol and label. Team should confirm.
- **Header:** the legacy guide mentions a notification bell; the corrected spec does not. Updates link with unread badge used instead.

## Limitations
- Catalogue is a 19-record working subset; not complete or verified field by field.
- Updates feed is static (redeploy to change). Notifications fire only when the site is opened and unseen entries exist; no background push.
- Planetary status for Juno, Voyager 2 and New Horizons needs a release-time check.
- No images, no artifact-year, no per-field source links (record-level or claim-level where supplied).
- Status categories, type categories, mass comparability and event types are editorial mappings (see Content note).
- Quiz/glossary are small and pending source review.
- Search is substring AND matching (no typo tolerance).
- Autoplay is off by default when the visitor prefers reduced motion.
- Browser testing was Chromium only. Not tested: Safari/Firefox, real screen readers, real notification delivery, automated contrast audit.
