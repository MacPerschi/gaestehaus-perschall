# Gästehaus Perschall Website

Modernisierte statische Website für das Gästehaus Perschall in Bardowick.

Für KI-Assistenten gelten die Projektregeln in [AGENTS.md](AGENTS.md).

Die Seite basiert auf der öffentlich ausgelieferten Bestandswebsite und wurde in eine pflegbare, GitHub-Pages-taugliche Struktur überführt.

## Ziele

- statische Website ohne Build-Zwang
- moderne SEO-Grundlagen: Canonical URL, Open Graph, strukturierte Daten, Sitemap, robots.txt
- bessere Accessibility: semantische Landmarks, Skip-Link, Fokus-Stile, Alt-Texte, responsive Navigation
- einfache Vorschau über GitHub Pages
- Erhalt der bestehenden Inhalte und Bilder; eigener Belegungskalender

## Lokale Vorschau

```bash
python3 -m http.server 8787 --bind 127.0.0.1
```

Dann öffnen: <http://127.0.0.1:8787/>

## Struktur

```text
.
├── index.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/styles.css
│   └── js/main.js
├── img/
│   ├── bgslides/
│   ├── works/
│   ├── screenshots/
│   └── parallax/
├── scripts/validate_site.py
└── .github/workflows/
    ├── pages.yml
    └── quality.yml
```

## Externe Abhängigkeiten

- Belegungskalender: lokale Datei `kalender/belegung.ics` (noch nicht im Repository); die automatische Übertragung vom Hermes-Server steht aus. Ferienhausmiete.de ist als externer Link vorhanden.
- Kartenansicht: OpenStreetMap Embed, erst nach Klick auf „Zustimmen und Karte laden“; mit „Karte entfernen“ wieder entfernbar. Die Freigabe wird nicht gespeichert.

## Rechtlicher Hinweis

Vor finaler Veröffentlichung sollten Impressum, Datenschutz, Preise und externe Dienste fachlich/rechtlich geprüft und vom Inhaber freigegeben werden.

## Fehlerseite und Domainwechsel

`404.html` wird von GitHub Pages bei unbekannten Adressen angezeigt. Die absoluten
Pfade beginnen aktuell mit `/gaestehaus-perschall/`, damit sie auch unter
verschachtelten Fehleradressen funktionieren. Beim Wechsel auf eine eigene Domain
müssen CSS-, Favicon- und Startseitenpfade in `404.html` auf `/` umgestellt werden.

## Datenschutztext vor Freigabe prüfen

Der Text beschreibt die technische Einbindung, ist aber noch keine abschließend
geprüfte Datenschutzerklärung. Vor Freigabe insbesondere Rechtsgrundlagen,
Anbieter-/Empfängerangaben, internationale Übermittlungen, Speicherdauern,
Betroffenenrechte und Beschwerdestelle mit einem aktuellen Generator oder
fachkundiger Prüfung ergänzen. Das Impressum bleibt unverändert; eine eventuell
erforderliche Umsatzsteuer-ID muss vom Inhaber bestätigt werden.

Quellen: GitHub General Privacy Statement und OpenStreetMap Foundation Privacy Policy
(Links im Datenschutzabschnitt, geprüft am 03.10.2026).
