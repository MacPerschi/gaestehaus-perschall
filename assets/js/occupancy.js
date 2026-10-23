/* Shared booking-day rules. The current all-day feed uses an exclusive block end.
 * Normalize that technical boundary; keep source values and include departure.
 * Unsupported/invalid feeds fail closed instead of implying availability.
 */
(function (root) {
  "use strict";
  function day(value) {
    if (!/^\d{8}$/.test(value)) throw new Error("Ungültiges Kalenderdatum");
    const y = Number(value.slice(0, 4)), m = Number(value.slice(4, 6)) - 1, d = Number(value.slice(6, 8));
    const date = new Date(y, m, d);
    if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
      throw new Error("Ungültiges Kalenderdatum");
    }
    return date;
  }
  function eventDate(line) {
    const colon = line.indexOf(":"), params = line.slice(0, colon), value = line.slice(colon + 1);
    if (/^\d{8}$/.test(value)) return day(value);
    const time = value.match(/^(\d{8})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (!time || Number(time[2]) > 23 || Number(time[3]) > 59 || Number(time[4]) > 59) {
      throw new Error("Nicht unterstütztes Kalenderdatum");
    }
    const date = day(time[1]);
    if (time[5]) {
      const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), Number(time[2]), Number(time[3]), Number(time[4])));
      const parts = Object.fromEntries(new Intl.DateTimeFormat("de-DE", {timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(utc).map(p => [p.type, p.value]));
      return day(parts.year + parts.month + parts.day);
    }
    const zone = params.match(/;TZID=([^;:]+)/)?.[1]?.replace(/^"|"$/g, "");
    if (zone && zone !== "Europe/Berlin") throw new Error("Nicht unterstützte Kalenderzeitzone");
    return date;
  }
  function parse(ics, { dateEnd = "exclusive" } = {}) {
    if (!["exclusive", "departure"].includes(dateEnd)) throw new Error("Unbekannte Kalender-Endkonvention");
    const text = ics.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").trim();
    const lines = text.split("\n");
    if (lines[0] !== "BEGIN:VCALENDAR" || lines.at(-1) !== "END:VCALENDAR" || !lines.includes("VERSION:2.0")) {
      throw new Error("Ungültige Kalenderantwort");
    }
    const ranges = [], stack = [];
    let event = null;
    for (const line of lines) {
      if (line.startsWith("BEGIN:")) {
        const component = line.slice(6);
        if ((!stack.length && component !== "VCALENDAR") || (stack.length && component === "VCALENDAR")) throw new Error("Ungültige Kalenderstruktur");
        if (component === "VEVENT") {
          if (event || stack.at(-1) !== "VCALENDAR") throw new Error("Ungültiger Kalendereintrag");
          event = [];
        }
        stack.push(component);
      } else if (line.startsWith("END:")) {
        const component = line.slice(4);
        if (stack.pop() !== component) throw new Error("Unvollständiger Kalender");
        if (component === "VEVENT") {
          if (!event.includes("STATUS:CANCELLED")) {
            if (event.some(l => /^(RRULE|RDATE|EXDATE|RECURRENCE-ID)[;:]/.test(l))) throw new Error("Wiederholungen müssen im Kalender einzeln bereitgestellt werden");
            const starts = event.filter(l => /^DTSTART[;:]/.test(l));
            const ends = event.filter(l => /^DTEND[;:]/.test(l));
            if (starts.length !== 1 || ends.length !== 1) throw new Error("Unvollständiger Buchungszeitraum");
            const start = eventDate(starts[0]), sourceEnd = eventDate(ends[0]);
            const allDay = /:\d{8}$/.test(starts[0]);
            if (allDay !== /:\d{8}$/.test(ends[0])) throw new Error("Uneinheitliche Kalenderdatumstypen");
            const end = new Date(sourceEnd);
            // Current feed: 30 Oct–2 Nov (exclusive) represents departure on 1 Nov.
            if (allDay && dateEnd === "exclusive") end.setDate(end.getDate() - 1);
            if (end < start) throw new Error("Umgekehrter Buchungszeitraum");
            ranges.push({ start, end, sourceEnd });
          }
          event = null;
        }
      } else if (event && stack.at(-1) === "VEVENT") {
        event.push(line);
      }
    }
    if (stack.length || event) throw new Error("Unvollständiger Kalender");
    return ranges;
  }
  const overlaps = (a, b) => a.start <= b.end && a.end >= b.start;
  const isOccupied = (ranges, date) => ranges.some(range => overlaps(range, {start:date, end:date}));
  const api = { parse, overlaps, isOccupied };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PerschallOccupancy = api;
})(typeof window === "undefined" ? globalThis : window);
