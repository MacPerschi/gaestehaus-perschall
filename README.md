# Gästehaus Perschall Website

Modernisierte statische Website für das Gästehaus Perschall in Bardowick.

Für KI-Assistenten gelten die Projektregeln in [AGENTS.md](AGENTS.md).

Die Seite basiert auf der öffentlich ausgelieferten Bestandswebsite und wurde in eine pflegbare, GitHub-Pages-taugliche Struktur überführt.

## Ziele

- statische Website ohne Build-Zwang
- moderne SEO-Grundlagen: Canonical URL, Open Graph, strukturierte Daten, Sitemap, robots.txt
- bessere Accessibility: semantische Landmarks, Skip-Link, Fokus-Stile, Alt-Texte, responsive Navigation
- einfache Vorschau über GitHub Pages
- Erhalt der bestehenden Inhalte, Bilder und externen Kalender-Einbindung

## Lokale Vorschau

```bash
python3 -m http.server 8787 --bind 127.0.0.1
```

Dann öffnen: <http://127.0.0.1:8787/>

## Struktur

```text
.
├── index.html
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
└── .github/workflows/pages.yml
```

## Externe Abhängigkeiten

- Belegungskalender: Ferienhausmiete.de Widget
- Kartenansicht: OpenStreetMap Embed

## Rechtlicher Hinweis

Vor finaler Veröffentlichung sollten Impressum, Datenschutz, Preise und externe Dienste fachlich/rechtlich geprüft und vom Inhaber freigegeben werden.
