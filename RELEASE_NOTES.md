# Windows Beta 1 – v0.1.0-beta.1

## Download / Herunterladen

Use **KiCad-Parts-Manager-0.1.0-beta.1-Windows.zip** for the complete program and Release-DB. Extract fully and run Start-KiCad-Parts-Manager.cmd. Python 3.11+ and KiCad are separate prerequisites; first setup needs Internet. GitHub's automatic source ZIP does not contain the Release-DB. Matching source ZIP and SHA256 files are included.

Das vollständige Windows-ZIP enthält Programm und Release-DB. In einen neuen beschreibbaren Ordner entpacken, Start-CMD starten, optional Desktop-Verknüpfung erstellen. Eigene Daten vor Updates sichern und getrennt halten. Deinstallieren.cmd erhält Daten und Bibliotheken.

## Included / Enthalten

- CERN, KiCad, SparkFun, DigiKey, DigiKey Partner, Seeed: 66,149 catalog entries (49,392 symbols/parts and 16,757 standalone footprints), plus separate synthetic examples.
- Faster catalog startup; native previews loaded on demand. Reimport retains the selected existing category and shared parameter profile.
- GitHub bug/suggestion forms through Feedback, DE/EN, with explicit user submission. Private security reporting enabled.
- No Privat-DB, personal imports, private history or direct Würth manufacturer collection; no additional vendor PDF/3D/SIM collections.

## Validation and limits / Prüfung und Grenzen

408 Python + 142 JavaScript tests passed in RC preparation; affected feedback tests repeated for publication. Isolated Windows 11/Python 3.14/KiCad 10.0.6 setup, previews, import/reimport, data persistence, shortcut and uninstall preview passed. User accepted KiCad placement and simulation; a native KiCad diode DC sweep was confirmed with 101 points. Startup measurements: 15.22 s first / 2.92 s cached; hardware dependent. No second clean Windows PC acceptance.

Beta limitations: 55 upstream footprint-reference gaps; some broad/unassigned categories; 3D placement and electrical model suitability require checking. Linux experimental. The application calculation check may require a separate ngspice console executable; KiCad's simulator can use its bundled library. No live pricing/stock or automatic user-data merge on update.

Code GPL-3.0-only. Other library licenses, attribution and modification notices remain separate. See included DISCLAIMER.md and THIRD_PARTY_NOTICES.md.
