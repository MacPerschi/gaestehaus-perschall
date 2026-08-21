# Gästehaus Perschall – statische Rekonstruktion

Quelle: https://www.gaestehaus-perschall.com/  
Erstellt als lokale Sicherung/Rekonstruktion der öffentlich ausgelieferten Website.

## Inhalt

- `index.html` – die aktuell öffentlich ausgelieferte HTML-Seite
- `css/`, `color/` – Stylesheets
- `js/` – JavaScript-Libraries und Custom-JS
- `img/` – lokal gesicherte Bilder inkl. Galerie, Parallax- und Hero-Slider-Bilder
- `fonts/` – vorhandene FontAwesome-Fonts
- `manifest.json` – Download-/Prüfprotokoll

## Was funktioniert lokal?

Die Seite wurde lokal über `python3 -m http.server` getestet. Die wichtigsten Abschnitte und Assets laden: Hero, Über uns, Umgebung, Haus/Galerie, Preise, Belegungsplan, Impressum, Datenschutz, Anfahrt.

## Externe Abhängigkeiten

Nicht alles ist aus der Seite selbst rekonstruierbar, weil externe Dienste eingebunden sind:

- Belegungskalender: `ferienhausmiete.de` Widget (`widgets.js?id=41336...`)
- Google Maps / Anfahrt
- ggf. Gästebuch, falls serverseitig oder extern angebunden
- Kontaktformular-PHP ist nicht öffentlich ausgeliefert und daher nicht rekonstruierbar; aktuell ist der Kontakt-Link im HTML ohnehin auskommentiert.

## Empfehlung für Weiterpflege

Für eine langfristig pflegbare Version sollte diese Sicherung in ein Git-Repository übernommen und entweder:

1. als simple statische Website weitergeführt werden, oder
2. in eine kleine pflegbare Struktur mit separaten Content-Dateien umgebaut werden.

Wichtig: Vor Veröffentlichung sollten Impressum, Datenschutz, Preise und eingebundene Drittanbieter rechtlich/inhaltlich geprüft werden.
