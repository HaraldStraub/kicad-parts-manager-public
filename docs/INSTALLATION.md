# Installation und Start

## Windows: Veröffentlichungspaket

Die Release-DB ist der separate, mit der Windows-Beta ausgelieferte Bibliotheksbestand. Ein GitHub-Quellcode-ZIP enthält nicht automatisch die Bibliotheken und Daten des Transferpakets.

1. Python ab 3.11 und KiCad installieren. KiCad simuliert mit seiner ngspice-Bibliothek. Der optionale Berechenbarkeitstest im Parts Manager kann zusätzlich eine ngspice-Konsolenanwendung erfordern.
2. Das freigegebene vollständige Datenpaket in einen neuen beschreibbaren Ordner entpacken, beispielsweise `Dokumente\KiCad-Parts-Manager`. Nicht im ZIP starten; den Ordner nach Einrichtung nicht verschieben.
3. `Start-KiCad-Parts-Manager.cmd` starten. Die erste Einrichtung erstellt eine lokale Python-Umgebung und lädt erforderliche Abhängigkeiten aus PyPI; dafür Internet einplanen. Das Programm läuft lokal und öffnet den Browser.
4. `Desktop-Verknuepfung-erstellen.cmd` ausführen. Danach startet die Desktop-Verknüpfung das Programm aus diesem Ordner. Keine Adminrechte für Programmumgebung oder Verknüpfung erforderlich; die Installation von Python/KiCad oder des ODBC-Treibers kann je nach Rechnerberechtigung Adminrechte brauchen.
5. KiCad schliessen, `Setup-CERN-KiCad.cmd` starten und einen bestehenden KiCad-Projektordner auswählen. Globale Bibliothekstabellen bleiben unverändert. Für CERN-Datenbankbibliotheken zusätzlich passenden SQLite3-ODBC-Treiber installieren. Projekt erneut öffnen und Platzierung prüfen.

Browser geschlossen? Über dieselbe Desktop-Verknüpfung bzw. Start-CMD erneut öffnen. Ein bereits laufender Server wird vom Programm erkannt. Daten nicht neu initialisieren oder Beispieldaten über einen vorhandenen Benutzerbestand schreiben.

## Browser

Empfohlen: aktueller Chrome oder Edge; auch andere aktuelle Chromium-Browser kommen infrage. Keine Browser-Erweiterung erforderlich. Der Browser verbindet sich mit dem lokalen Programm unter `127.0.0.1`.

Die Empfehlung betrifft vor allem Zwischenablage-Berechtigungen beim Kopieren von KiCad-Referenzen sowie die einheitliche Browser-Abnahme. Chromium ist keine technische Pflicht für die grundlegende Suche und Anzeige. `navigator.clipboard.writeText` verlangt einen sicheren Kontext und Browserberechtigungen; localhost gilt üblicherweise als vertrauenswürdig. Bei verweigertem Kopieren markiert das Programm die Referenz zur manuellen Übernahme mit Strg+C. Firefox und Safari sind noch nicht umfassend abgenommen; keine pauschale Zusage aller Funktionen.

Referenz: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText

## Linux: Entwicklungsstand, noch keine Plattformfreigabe

Python-Webanwendung und SQLite sind grundsätzlich plattformübergreifend. Windows-CMDs, private Windows-Transferpakete, KiCad-Erkennung und ODBC-Einrichtung sind nicht automatisch Linux-kompatibel. Der aktuelle öffentliche Kandidat ist noch nicht auf Linux abgenommen.

Für einen Quellcode-Test mit Python ab 3.11:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-runtime.txt
.venv/bin/python -m pip install --no-deps --no-build-isolation -e .
# Nur für einen neuen leeren Beispielbestand:
.venv/bin/kicad-parts-manager init
.venv/bin/kicad-parts-manager seed
sh Start-KiCad-Parts-Manager.sh
```

Bei fehlendem venv/pip die passenden Pakete der Linux-Distribution installieren. KiCad-Bibliotheks- und Konfigurationsordner gegebenenfalls manuell im Erststart angeben, z.B. `/usr/share/kicad` und `~/.config/kicad/10.0`; tatsächliche Pfade hängen von der Installation ab. ngspice und SQLite-ODBC separat distributionsgerecht einrichten. Es gibt noch keinen abgenommenen Linux-Desktop-Installer. Der Linux-Starter und die Auswahl von `.venv/bin/python` sind vorbereitet; echte Installation, Bibliothekserkennung, Platzierung und Simulation bleiben zu testen.

## Windows: Deinstallation mit Datenerhalt

`Deinstallieren.cmd` im entpackten Programmordner starten. Der Helfer zeigt die betroffene Installation und Programmdateien an. Erst die Eingabe `DEINSTALLIEREN` bestaetigt; Enter bricht ohne Aenderung ab. Vorher eigene Daten sichern, KiCad schliessen und den Programmserver im zugehoerigen Terminal mit Strg+C beenden. Browser schliessen allein reicht nicht. Laufende KiCad-/Installationsprozesse blockieren die Deinstallation.

Entfernt werden Programmcode, lokale Python-Umgebung und nur die Desktop-Verknuepfung, die genau auf diese Installation zeigt. Datenbanken (`db`), Bibliotheken (`data`, `kicad`), Modelle, Sicherungen, Dokumentation und externe Benutzerbibliotheken bleiben erhalten. Der Restordner ist beabsichtigt. Python, KiCad und ODBC werden nicht deinstalliert. KiCad-Projektbibliothekstabellen werden nicht veraendert; nicht mehr gewuenschte Eintraege manuell dort entfernen. Keine Neuinitialisierung eigener Daten!

Entwicklungscheckouts mit `.git` werden nicht deinstalliert. Vorschau ohne Aenderung: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\uninstall.ps1 -PreviewOnly`; englischer Helfer mit `-Language en`. Der Helfer wird in neu erzeugte Pakete aufgenommen; aeltere ZIPs enthalten ihn noch nicht.

Die Zielrechner-Pruefliste steht in [WINDOWS_ACCEPTANCE.md](WINDOWS_ACCEPTANCE.md). Isolierte Windows-Prüfung auf dem Entwicklungsrechner und Anwenderabnahme von KiCad-Platzierung/Simulation erfolgt. Eine zusätzliche Abnahme auf einem frisch eingerichteten zweiten Windows-Rechner bleibt offen.

## Eigene Daten und Updates

Privat-DB und Release-DB getrennt halten. Vor Updates eigene Daten sichern. Ein neues Paket zunächst in einen anderen Ordner entpacken; keine eigene Datenbank durch die Herausgeberdatenbank überschreiben. Automatischer konfliktgeprüfter Datenpaket-Abgleich ist noch kein freigegebener Updateweg.

Lizenzen und Disclaimer liegen im Paket. Bibliotheken behalten ihre eigenen Lizenzen; Herstellermodelle, Datenblätter und elektrische Angaben sind nicht durch die Programm-GPL automatisch freigegeben oder elektrisch geprüft.
