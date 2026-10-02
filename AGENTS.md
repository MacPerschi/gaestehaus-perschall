# Gästehaus Perschall – Regeln für KI-Assistenten

## Projekt
Statische One-Page-Website auf GitHub Pages. Inhaber: Sven Perschall (kein Entwickler).
- `index.html` – gesamter Seiteninhalt
- `assets/css/styles.css`, `assets/js/main.js` – Design und Interaktion
- `img/` – Bilder; neue oder ersetzte Bilder auf höchstens 300 KB pro Datei begrenzen
- `scripts/validate_site.py` – vorhandenes Prüfskript, läuft auch in CI

## Grundsätze
- Einfach bleiben: kein Framework, kein Build-Schritt, kein npm/package.json, kein CMS.
- Keine neuen externen Dienste oder Scripts hinzufügen (Datenschutz).
- Externe Inhalte sollen erst nach Klick geladen werden; Kalender und Karte laden
  derzeit direkt. Diese Einbindungen nur im Rahmen eines passenden Issues ändern.
- Vorhandene CSS-Klassen wiederverwenden statt neue Komponenten zu erfinden.
- Barrierefreiheit erhalten: Alt-Texte, Überschriften-Reihenfolge, Tastaturbedienung.
- Bestehende Architektur und Konventionen respektieren; Änderungen auf das Issue begrenzen.
- Keine Zugangsdaten, Tokens, API Keys oder `.env` mit Secrets committen.

## Inhalte
- Preise, Ausstattung, Zeiten, Kontaktdaten, Impressum und Datenschutz NIE ohne
  ausdrückliche Bestätigung von Sven ändern oder erfinden.
- Bei Unklarheit nachfragen statt raten.

## Arbeitsablauf und Prüfung
- Issue vollständig lesen und relevante Dateien sowie Projektregeln prüfen.
- Für jedes Issue einen eigenen Branch `issue-<nummer>-<kurze-beschreibung>` verwenden.
- Vor jedem Commit: `python3 scripts/validate_site.py` muss
  `All static-site checks passed.` ausgeben; Diff und betroffene Pfade prüfen.
- Weitere vorhandene Prüfungen ausführen; keine Tests/Lint/Build-Scripts erfinden.
- Lokale Vorschau bei Änderungen an der Darstellung:
  `python3 -m http.server 8787 --bind 127.0.0.1` → http://127.0.0.1:8787/
- Änderungen committen, Issue-Branch pushen und einen Pull Request mit kurzer,
  verständlicher Beschreibung und tatsächlichen Prüfergebnissen für Sven erstellen.
- Nicht direkt auf `main` arbeiten und nicht automatisch mergen: Ein Mensch prüft
  und gibt den Pull Request frei. Keine Schutzregeln umgehen oder Historie umschreiben.
