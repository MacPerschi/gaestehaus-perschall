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
├── impressum.html
├── datenschutz.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/styles.css
│   └── js/main.js
├── img/
│   ├── bgslides/
│   ├── works/
│   ├── umgebung/
│   └── parallax/
├── scripts/validate_site.py
└── .github/workflows/
    ├── pages.yml
    └── quality.yml
```

## Externe Abhängigkeiten

- Belegungskalender: Datei `kalender/belegung.ics`, die nicht im Repository liegt. Der Workflow `pages.yml` erzeugt sie bei jeder Veröffentlichung und stündlich: aus `belegung.ics` im Branch `kalender-daten` (vorgesehen für den Hermes-Server), solange es diesen Branch nicht gibt aus dem öffentlichen Kalender von ferienhausmiete.de. Übernommen werden nur die Zeiträume (DTSTART/DTEND, Bezeichnung „Belegt“). Ferienhausmiete.de ist als externer Link vorhanden.
- Kartenansicht: OpenStreetMap Embed, erst nach Klick auf „Zustimmen und Karte laden“; mit „Karte entfernen“ wieder entfernbar. Die Freigabe wird nicht gespeichert.

## Rechtlicher Hinweis

Vor finaler Veröffentlichung sollten Impressum, Datenschutz, Preise und externe Dienste fachlich/rechtlich geprüft und vom Inhaber freigegeben werden.

## Hosting, Fehlerseite und Domain

Die Seite liegt seit Oktober 2026 auf dem IONOS-Webspace unter https://gaestehaus-perschall.com/.
Der Workflow `.github/workflows/pages.yml` lädt sie bei jedem Merge und stündlich (Belegungskalender)
per SFTP hoch (Secrets `IONOS_SFTP_HOST`, `IONOS_SFTP_USER`, `IONOS_SFTP_PASSWORD`).
`scripts/`, `.github/` und `*.md` werden nicht hochgeladen. Die alte Adresse
macperschi.github.io/gaestehaus-perschall leitet auf die Domain weiter.

`.htaccess` erzwingt https ohne www und bindet `404.html` als Fehlerseite ein;
deren Pfade beginnen mit `/`.

`google4af9edbf7ec3275c.html` ist die Bestätigungsdatei der Google Search Console
und muss dauerhaft im Hauptverzeichnis bleiben (sonst geht der Zugang verloren).

## Datenschutztext vor Freigabe prüfen

Der Text beschreibt die technische Einbindung, ist aber noch keine abschließend
geprüfte Datenschutzerklärung. Vor Freigabe insbesondere Rechtsgrundlagen,
Anbieter-/Empfängerangaben, internationale Übermittlungen, Speicherdauern,
Betroffenenrechte und Beschwerdestelle mit einem aktuellen Generator oder
fachkundiger Prüfung ergänzen. Das Impressum bleibt unverändert; eine eventuell
erforderliche Umsatzsteuer-ID muss vom Inhaber bestätigt werden.

Quellen: GitHub General Privacy Statement und OpenStreetMap Foundation Privacy Policy
(Links im Datenschutzabschnitt, geprüft am 03.10.2026).

## Nach dem Go-live: Google Search Console

Einmalige Schritte für Sven, damit Google die Seite kennt und Probleme meldet:

1. <https://search.google.com/search-console> öffnen, mit dem Google-Konto anmelden
   und eine Property vom Typ „URL-Präfix“ mit der endgültigen Adresse anlegen
   (dieselbe Adresse wie `canonical` in `index.html`).
2. Bestätigungsmethode „HTML-Datei“ wählen. Die angebotene Datei `googleXXXX.html`
   unverändert ins Hauptverzeichnis des Repositorys legen, per Pull Request
   veröffentlichen und danach in der Search Console auf „Bestätigen“ klicken.
3. Unter „Sitemaps“ die Adresse `sitemap.xml` einreichen.
4. Bei einem späteren Domainwechsel die alte Property behalten und die neue
   zusätzlich anlegen; die Sitemap der neuen Adresse erneut einreichen.

Optional: In den Bing Webmaster Tools lässt sich die Search-Console-Property
importieren. Mehr Besucher bringt meist das Google-Unternehmensprofil (Eintrag
in Google Maps); dort Webseite, Telefonnummer und aktuelle Fotos prüfen.

## Belegungskalender

Führende Quelle ist der Belegungskalender von Hermes (alle gebuchten Aufenthalte, nur
„Belegt“). Hermes überträgt ihn alle 15 Minuten bei Änderung in den Branch
`kalender-daten` (Deploy Key „Hermes Belegungskalender“). Der stündliche Deploy erzeugt:

- `kalender/hermes.ics` – nur Hermes; **diese Adresse importiert ferienhausmiete.de**
- `kalender/belegung.ics` – Hermes plus (falls abrufbar) ferienhausmiete.de, für den Kalender auf der Website
