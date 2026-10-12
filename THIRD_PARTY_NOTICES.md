# Licenses and notices / Lizenzen und Hinweise

## Original program

KiCad Parts Manager: Copyright (C) 2026 Harald Straub and contributors.
Original program code is distributed under GPL-3.0-only. See `LICENSE` for the complete terms, including sections 15 and 16. Corresponding sources and the build/setup scripts for this preview are included. This does not relicense third-party materials.

## Synthetic examples

The fresh example dataset, explicitly self-authored `.lib` fixtures, and the newly generated plain-color background in this preview are made available under CC0-1.0. See `licenses/CC0-1.0.txt`. They are illustrative and are not manufacturer data, certified component models or production recommendations. Existing vendor datasets and the original landing image are not covered by this declaration and are not included.

CC0 text obtained from the SPDX license-list-data project:
https://github.com/spdx/license-list-data/blob/main/text/CC0-1.0.txt
Original license: https://creativecommons.org/publicdomain/zero/1.0/

## Separately installed Python dependencies

No dependency wheel or Python runtime is bundled. The setup installs dependencies into a local environment. Their own copyright and license files must remain present in the installed distributions. The local dependency review found the following declared licenses for the recorded packages:

| Packages | Declared license |
|---|---|
| SQLAlchemy, Alembic, Mako, Pydantic, pydantic-core, annotated-types, typing-inspection, setuptools, wheel | MIT |
| MarkupSafe | BSD-3-Clause |
| packaging, where installed as a dependency | Apache-2.0 OR BSD-2-Clause |
| typing_extensions | PSF-2.0 |

Setuptools can contain additional vendor packages; retain their embedded notices as well. These declarations are a package-level inventory, not a replacement for the actual license texts or a complete transitive review of every future installation. `requirements-runtime.txt` records the intended versions. Python itself is installed separately under its own licensing terms.

## KiCad and ngspice

KiCad and ngspice are separate installations, not bundled here. Standard-symbol identifiers do not transfer ownership or change the license of their libraries. Redistributed KiCad library files must retain the applicable CC-BY-SA-4.0 license, attribution and KiCad exception. See https://www.kicad.org/libraries/license/ . Do not assume ngspice's software license applies to manufacturer models downloaded elsewhere.

KiCad Parts Manager is an independent project and does not claim endorsement by KiCad, CERN or any component manufacturer. Their names are used to identify compatible tools or sources.

## Excluded material

Private databases, local catalogs, direct Würth libraries/tables, Micro-Cap and other vendor model collections, datasheets, spreadsheet exports, internal development records and the original landing graphic are not included. Further data packages require a separate source-specific review. The existing private transfer ZIP is not an approved public package.

## Deutsch

Der eigene Programmcode steht unter GPLv3; die ausdrücklich gekennzeichneten synthetischen Beispiele unter CC0. Fremdsoftware, KiCad-Bibliotheken, Herstellerdaten und Modelle behalten ihre jeweiligen Rechte. Dieses Paket enthält zusätzlich den unter CERN-OHL-P-2.0 bereitgestellten CERN-Bestand; keine direkten Hersteller-Modellsammlungen. Die Nennung eines Herstellers oder ein Quellenlink ersetzt keine Lizenz. Alle vollständigen Lizenz- und Urheberhinweise der separat installierten Abhängigkeiten sind zu erhalten.

## CERN publication candidate / CERN-Veröffentlichungskandidat

CERN KiCad Libraries, source https://gitlab.com/ohwr/cern-kicad-libs, revision 5debc1bef23be0066d893e3ddabe0393d48cd679. CERN-OHL-P-2.0; original LICENSE, LICENSES and README retained in data/cern. All original source files remain unchanged. Derived catalog and public-components.sqlite created by KiCad Parts Manager on 11.10.2026: 24278 records with available symbol/footprint, category/parameter interpretation, portable relative asset paths and previews. Five incomplete source rows excluded from the derived catalog. No CERN endorsement; no bundled vendor PDFs, 3D or SIM models. Electrical data and placement are not certified.

## Additional open libraries – 11.10.2026

- kicad: https://www.kicad.org/libraries/, installed-KiCad-10.0.6-file-hashes. CC-BY-SA-4.0 with KiCad design exception. Original authors, licenses and source README retained under data/open-libraries/kicad/native/LICENSES. Converted/renamed working files and derived catalog retain the source license; see MODIFICATIONS.md.
- sparkfun: https://github.com/sparkfun/SparkFun-KiCad-Libraries, 25af7faf567c3c6627d5065acf771ba0ff883103. CC-BY-4.0; KiCad-derived assets retain CC-BY-SA-4.0. Original authors, licenses and source README retained under data/open-libraries/sparkfun/native/LICENSES. Converted/renamed working files and derived catalog retain the source license; see MODIFICATIONS.md.
- digikey: https://github.com/Digi-Key/digikey-kicad-library, d4bd68f42e6ccc474526811a853a03692e170b58. CC-BY-SA-4.0 with design exception. Original authors, licenses and source README retained under data/open-libraries/digikey/native/LICENSES. Converted/renamed working files and derived catalog retain the source license; see MODIFICATIONS.md.
- digikey-partner: https://github.com/Digi-Key/digikey-partner-kicad-library, b0bdcd1e0d2b817815c2bbf6fb656673b258bbe7. CC-BY-SA-4.0 with design exception. Original authors, licenses and source README retained under data/open-libraries/digikey-partner/native/LICENSES. Converted/renamed working files and derived catalog retain the source license; see MODIFICATIONS.md.
- seeed: https://github.com/Seeed-Studio/OPL_Kicad_Library, b0035c51eb0348bb3e165fdb2f2765fa3d1d17bd. CC-BY-SA-4.0. Original authors, licenses and source README retained under data/open-libraries/seeed/native/LICENSES. Converted/renamed working files and derived catalog retain the source license; see MODIFICATIONS.md.

Program GPLv3 does not replace library licenses. SparkFun KiCad-derived material retains applicable KiCad CC-BY-SA terms. No endorsement or warranty. Extra vendor PDFs/3D/SIM files not bundled.
