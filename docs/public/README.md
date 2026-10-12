# KiCad Parts Manager – CERN local publication candidate

**LOCAL CANDIDATE ONLY. Not published; target-computer and KiCad acceptance pending.**

This separate copy contains 24,278 CERN catalog records with available symbol and footprint files, plus eight synthetic application examples and five illustrative SPICE models. It does not contain the owner's private databases, spreadsheet exports or vendor model collections. Original CERN sources are under `data/cern`, revision `5debc1bef23be0066d893e3ddabe0393d48cd679`. Five incomplete source records are excluded from the derived catalog. 135 included records still need a functional category; found files do not certify pin/pad compatibility or electrical limits.

## Windows start

Extract into a new writable folder. Python 3.11+ is required. Run `Start-KiCad-Parts-Manager.cmd`; first setup installs dependencies from PyPI into a local `.venv`. It opens the local application in the browser. This package already has a CERN catalog, so the first-run library-scan card is not shown. Do not replace the CERN catalog with a scan of standard libraries; a combined, persistent import remains a separate release-preparation step.

The application reads `db/library-catalog.json`. `db/public-components.sqlite` is the structured, portable CERN dataset export, not a replacement for the application's main database schema. The original database is `data/cern/CERN.sqlite`; it contains all 24,283 source records unchanged. `db/kicad-parts-manager.sqlite` contains only the eight synthetic examples; personal changes are separate in `db/manual-data.sqlite`. Relative CERN asset paths resolve from the application folder. After setup, keep the folder at its location or extract a fresh copy elsewhere.

KiCad is installed separately. After the application setup, close KiCad and run `Setup-CERN-KiCad.cmd`. Enter an existing KiCad project folder. This adds project-specific symbol/footprint tables and generates `kpm-cern/CERN.kicad_dbl`, covering all CERN source tables and libraries. Existing entries are retained; conflicting library nicknames stop setup. Global KiCad configuration is not changed. Reopen that project. A SQLite3 ODBC Driver matching KiCad's architecture must be installed separately; its installation may require administrator rights. Installation/placement on a clean target remains unaccepted. The extracted application folder must remain in place because the generated tables refer to it. All original 24,283 source rows remain in the KiCad database; the five incomplete rows are excluded only from the Parts Manager catalog. No automatic download of vendor datasheets, 3D or SIM assets is included; hyperlinks are retained where usable.

Program code: GPL-3.0-only. CERN source and derived data: CERN-OHL-P-2.0, with original notices and dated modification notice in `THIRD_PARTY_NOTICES.md`. Synthetic examples: CC0-1.0. Package and source manifests record hashes and revision. No upload or public release is performed. Before release: complete KiCad integration, category review and clean target-computer acceptance.

## Deutsch

**Nur lokaler Veröffentlichungskandidat; noch nicht veröffentlicht.**

Enthalten sind 24.278 CERN-Katalogeinträge mit vorhandenen Symbol-/Footprint-Dateien sowie acht synthetische Beispiele und fünf Beispiel-SIM-Modelle. Fünf unvollständige Quellzeilen sind aus dem abgeleiteten Katalog ausgeschlossen. 135 Einträge brauchen noch eine fachliche Kategorie. Elektrische Kennwerte und Pin-/Pad-Zuordnungen sind dadurch nicht automatisch geprüft.

ZIP in einen neuen beschreibbaren Ordner entpacken. Python ab 3.11 muss installiert sein. `Start-KiCad-Parts-Manager.cmd` starten; beim ersten Start werden Abhängigkeiten aus PyPI lokal installiert. Der CERN-Katalog ist schon enthalten. Seine Zusammenführung mit einem späteren Scan weiterer Bibliotheken bleibt noch vorzubereiten.

Die Anwendung nutzt `db/library-catalog.json`. `db/public-components.sqlite` ist der strukturierte CERN-Datenexport mit eigenem Schema. Die unveränderte ursprüngliche CERN-Datenbank liegt in `data/cern/CERN.sqlite`. Die normale Programm-Datenbank enthält weiterhin nur die synthetischen Beispiele. Deine vorhandene Arbeitsdatenbank gehört nicht zu diesem Paket.

Nach dem ersten Programmstart KiCad schliessen und `Setup-CERN-KiCad.cmd` starten. Einen vorhandenen KiCad-Projektordner angeben. Alle CERN-Bibliotheken werden projektbezogen eingetragen; vorhandene Einträge bleiben erhalten, Namenskonflikte stoppen die Einrichtung. Danach dieses Projekt wieder öffnen. Die globale KiCad-Konfiguration bleibt unverändert. Zusätzlich wird der zur KiCad-Architektur passende SQLite3 ODBC Driver benötigt; dessen Installation kann Adminrechte erfordern. Den entpackten Programmordner danach nicht verschieben. In KiCad bleiben alle ursprünglichen 24.283 Quellzeilen verfügbar, auch die fünf unvollständigen; nur der Parts-Manager-Katalog schliesst diese aus. Hersteller-PDFs, 3D- und SIM-Sammlungen werden nicht mitgeliefert. Zielrechnerabnahme, Kategorieprüfung und Veröffentlichungsfreigabe stehen aus.

## Open library extension / Offene Bibliotheken

This local candidate additionally includes KiCad, SparkFun, DigiKey, DigiKey Partner and Seeed symbols/footprints. Generic symbols may have no fixed footprint; missing assignments remain visible. Extra 3D/SIM collections are not bundled. Setup-CERN-KiCad.cmd registers these native libraries together with CERN for the selected project.

Zusätzlich enthalten: KiCad, SparkFun, DigiKey, DigiKey Partner und Seeed. Generische Symbole ohne festen Footprint sind nutzbar; fehlende Zuordnungen bleiben sichtbar. Zusätzliche 3D-/SIM-Sammlungen sind nicht enthalten. Der Einrichtungsstarter bindet alle enthaltenen Bibliotheken projektbezogen ein.

## Desktop start / Desktop-Start

Run Desktop-Verknuepfung-erstellen.cmd after unpacking to create a Windows desktop shortcut. Detailed setup and platform limits: docs/INSTALLATION.md. Chrome/Edge recommended; clipboard restrictions have a manual-copy fallback. Linux starter provided as experimental preparation, not a tested Linux release.

Nach dem Entpacken Desktop-Verknuepfung-erstellen.cmd ausführen. Ausführliche Installation und Plattformgrenzen: docs/INSTALLATION.md. Chrome/Edge empfohlen, kein Chromium-Zwang. Linux-Starter vorbereitet; Linux noch nicht abgenommen.
