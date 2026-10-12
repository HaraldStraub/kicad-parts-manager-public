# Etappe 4 – Abnahme auf frischem Windows-Zielrechner

Status: vorbereitet, noch nicht auf einem frischen Rechner abgenommen. Keine Veröffentlichung.

Testpaket: neues versioniertes ZIP mit Deinstallationshelfer. Nicht die Privat-DB verwenden. Ohne Administrator starten; Installationen von Python/KiCad/ODBC gegebenenfalls separat administrativ einrichten.

Rechner/Windows: ____ Python: ____ KiCad: ____ Browser: ____ ngspice: ____ Paketname/SHA256: ____ Datum/Tester: ____

| Pruefung | Ergebnis / Zeit / Befund |
|---|---|
| Neues ZIP entpacken; Start-CMD, Ersteinrichtung, sichtbare Startanzeige | |
| Desktop-Verknuepfung erstellen; Browser schliessen und erneut starten | |
| Suche 100nF 0805 und 0805 100nF; 10mR 2W und 2W 10mR vergleichen | |
| Kategorie wechseln, Filter, numerische Sortierung, Symbol/Footprint lesbar | |
| Symbol+Footprint+PDF+STEP+SIM importieren, Dateien entfernen, abbrechen | |
| Bestehendes Bauteil erneut importieren: ergaenzen/ersetzen, keine Dublette | |
| Parameter eingeben, speichern, Neustart: Daten erhalten | |
| CERN und native Bibliotheken projektbezogen einbinden; in KiCad platzieren | |
| SIM-Modell/Pinzuordnung pruefen; echtes ngspice, keine geratenen Pins | |
| Deutsch/Englisch und hell/dunkel stichprobenartig | |
| Deinstallieren.cmd: Anzeige, Abbruch ohne Aenderung; laufenden Server blockieren | |
| KiCad/Server beenden, eigene Testdaten sichern, Deinstallation bestaetigen | |
| Passende Desktop-Verknuepfung entfernt; Daten/Benutzerbibliothek erhalten | |
| Python/KiCad/ODBC sowie Verknuepfung einer anderen Installation erhalten | |

Vor Loeschung eigene Daten sichern. Den Server im zugehoerigen Terminal mit Strg+C beenden; Browser schliessen allein beendet ihn nicht. Nach der Deinstallation verbleiben absichtlich Daten und Dokumentation. KiCad-Projektbibliothekseintraege werden nicht automatisch bearbeitet.

Abnahme: bestanden / Befunde offen / nicht ausgefuehrt. Installation, echte KiCad-Platzierung, Simulation und Deinstallation erst nach ausgefuelltem Protokoll als abgenommen markieren. Automatisierte Tests ersetzen diese Rechnerabnahme nicht.
