# Backlog after Windows Beta 1

Planning updated on 12 October 2026. Stable item numbers match the development overview. This is a proposed work order, not a promise of delivery dates. Deferred items stay deferred. The released Beta remains unchanged.

## A — Beta reliability and a clear first-use workflow

1. **53 — Beta feedback and bug triage.** Prepared: [feedback workflow and reproduction template](BETA_FEEDBACK.md). Use existing GitHub forms; triage incoming reports manually and reproduce them in an isolated Release-DB installation. No automatic monitoring or new release configured.
2. **36 — Fresh Windows PC acceptance.** Test the public ZIP, setup, desktop restart, libraries, import/reimport, KiCad placement, simulation and uninstall with data retention. Previous private-package acceptance does not cover the public package.
3. **37 — Component import acceptance.** Check previews, duplicate handling and SPICE mapping with representative packages. Fix confirmed blockers before adding import features.
4. **46 — Basic filter correctness.** Check boundary values, SI units, unknown values and helpful tooltips.
5. **41 + 51 — Completed: website and illustrated quick-start guide.** Published on GitHub Pages: https://haraldstraub.github.io/kicad-parts-manager-public/. Maintenance and unpublishing: [website instructions](../website/README.md).
6. **27 — Undo local data changes.** Begin with individual parameter edits and revision checks; import rollback follows separately.
7. **43 — Safe update guidance.** Distinguish program updates from library-data updates, link to releases and protect user data. No automatic database replacement.

## B — Discoverability and usability

8. **51 — Completed jointly with 41:** published website and shared guide.
9. **50 / 25 — Search suggestions and aliases.** Local database-backed suggestions, existing unit-aware search and keyboard navigation.
10. **12 / 38 / 40 — Portability, release follow-up and version notes.** Continue technical checks and clear release documentation. Linux support and conflict-aware data merging need separate scopes.
11. **30 / 47 / 34 / 14 — Targeted usability, category and library-workflow improvements.** Address observed problems rather than redesigning the whole interface.
12. **52 — YouTube introduction.** After a stable setup flow, short guide and website, agree a script showing installation, search, import, KiCad placement and simulation. Use Release-DB only, avoid private paths/data and add captions and download/feedback links. No video is being created or uploaded yet.

## C — Later expansion

**3 / 44:** broad parameter enrichment; **5:** additional electrical model tests; **8 / 9 / 10:** deeper KiCad integration and new libraries; **39:** company IPNs/ERP; **48:** optional AI; **49:** live distributor prices/stock.

Implement these when user feedback justifies the effort. The basic application must remain useful without runtime AI or paid services.

## Completed

**42 — User feedback:** published in Windows Beta 1, with reviewed GitHub bug/feature forms and private security reporting. Continuing triage belongs to item 53.

Previously deferred items remain outside the active work queue until explicitly resumed.
