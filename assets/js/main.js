/* Navigation */
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }),
  );
}
/* Hero-Slider */
const slides = [...document.querySelectorAll(".hero-slider img")];
let current = 0;
const sliderToggle = document.querySelector(".slider-toggle");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let sliderTimer = null;
function pauseSlider() {
  clearInterval(sliderTimer);
  sliderTimer = null;
  if (sliderToggle) sliderToggle.textContent = "Bilderwechsel starten";
}
function startSlider() {
  if (sliderTimer !== null || reducedMotion.matches || slides.length < 2)
    return;
  sliderTimer = setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 4500);
  if (sliderToggle) sliderToggle.textContent = "Bilderwechsel pausieren";
}
if (sliderToggle && slides.length > 1) {
  sliderToggle.hidden = reducedMotion.matches;
  sliderToggle.addEventListener("click", () => {
    if (sliderTimer === null) startSlider();
    else pauseSlider();
  });
  reducedMotion.addEventListener("change", () => {
    pauseSlider();
    sliderToggle.hidden = reducedMotion.matches;
  });
  startSlider();
}
/* Aktiver Navigationslink */
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".site-nav a")];
if ("IntersectionObserver" in window) {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) => a.removeAttribute("aria-current"));
          const link = document.querySelector(
            `.site-nav a[href="#${entry.target.id}"]`,
          );
          if (link) link.setAttribute("aria-current", "true");
        }
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
  );
  sections.forEach((s) => obs.observe(s));
}
/* Galerie-Dialog */
const dialog = document.querySelector(".image-dialog");
if (dialog) {
  const dialogImg = dialog.querySelector("img");
  const galleryButtons = [...document.querySelectorAll(".gallery button")];
  const dialogStatus = dialog.querySelector(".dialog-status");
  let imageIndex = 0;
  let opener = null;
  function showImage(index) {
    imageIndex = (index + galleryButtons.length) % galleryButtons.length;
    const button = galleryButtons[imageIndex];
    dialogImg.src = button.dataset.full;
    dialogImg.alt =
      button.querySelector("img")?.alt || "Galeriebild Gästehaus Perschall";
    dialogStatus.textContent = `Bild ${imageIndex + 1} von ${galleryButtons.length}`;
  }
  function openGallery(index, trigger) {
    opener = trigger;
    showImage(index);
    dialog.showModal();
  }
  galleryButtons.forEach((button, index) => {
    button.addEventListener("click", () => openGallery(index, button));
  });
  document.querySelector(".room-main")?.addEventListener("click", (event) => {
    const index = galleryButtons.findIndex(button => button.classList.contains("is-selected"));
    openGallery(Math.max(0, index), event.currentTarget);
  });
  dialog
    .querySelector(".dialog-prev")
    .addEventListener("click", () => showImage(imageIndex - 1));
  dialog
    .querySelector(".dialog-next")
    .addEventListener("click", () => showImage(imageIndex + 1));
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showImage(imageIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => opener?.focus());
}

/* === Belegungsdaten (gemeinsam für Kalender und Preisrechner) === */
const occupancyRules = window.PerschallOccupancy;
let occupancyState = { status: "loading", ranges: null };
let occupancyLoading = false;
async function loadOccupancy() {
  if (occupancyLoading) return;
  occupancyLoading = true;
  occupancyState = { status: "loading", ranges: null };
  window.dispatchEvent(new Event("occupancychange"));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch("kalender/belegung.ics", { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const ranges = occupancyRules.parse(await response.text(), { dateEnd: document.querySelector(".calendar-widget")?.dataset.calendarEnd || "exclusive" });
    occupancyState = { status: "ready", ranges };
  } catch {
    occupancyState = { status: "error", ranges: null };
  } finally {
    clearTimeout(timeout);
    occupancyLoading = false;
    window.dispatchEvent(new Event("occupancychange"));
  }
}

/* === Belegungskalender Gästehaus Perschall === */
(() => {
  const calendar = document.querySelector("#occupancy-calendar");
  if (!calendar) return;

  const status = document.querySelector(".calendar-status");
  const prevButton = document.querySelector(".calendar-prev");
  const nextButton = document.querySelector(".calendar-next");

  const retryButton = document.querySelector(".calendar-retry");
  const monthFormat = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
  const dayFormat = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });
  const weekdayFormat = new Intl.DateTimeFormat("de-DE", { weekday: "short" });
  const weekdayNames = Array.from({ length: 7 }, (_, i) => weekdayFormat.format(new Date(2026, 0, 5 + i)));
  const smallScreen = matchMedia("(max-width: 760px)");
  const mediumScreen = matchMedia("(max-width: 950px)");
  let firstVisibleMonth = new Date();
  firstVisibleMonth = new Date(firstVisibleMonth.getFullYear(), firstVisibleMonth.getMonth(), 1);

  function isToday(date) {
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  function createMonth(year, month) {
    const monthElement = document.createElement("section");
    monthElement.className = "calendar-month";

    const heading = document.createElement("h3");
    heading.textContent = monthFormat.format(new Date(year, month, 1));
    monthElement.appendChild(heading);

    const weekdays = document.createElement("div");
    weekdays.className = "calendar-weekdays";

    for (const weekday of weekdayNames) {
      const label = document.createElement("span");
      label.textContent = weekday;
      weekdays.appendChild(label);
    }

    monthElement.appendChild(weekdays);

    const days = document.createElement("div");
    days.className = "calendar-days";

    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < offset; i++) {
      const empty = document.createElement("span");
      empty.className = "calendar-day calendar-day-empty";
      empty.setAttribute("aria-hidden", "true");
      days.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayElement = document.createElement("span");
      const known = occupancyState.status === "ready";
      const occupied = known && occupancyRules.isOccupied(occupancyState.ranges, date);

      dayElement.className = "calendar-day";
      dayElement.textContent = String(day);

      if (!known) dayElement.classList.add("calendar-day-unknown");
      if (occupied) {
        dayElement.classList.add("calendar-day-occupied");
      }

      if (isToday(date)) {
        dayElement.classList.add("calendar-day-today");
      }

      dayElement.setAttribute("role", "img");
      dayElement.setAttribute(
        "aria-label",
        `${dayFormat.format(date)}: ${!known ? "Verfügbarkeit unbekannt" : occupied ? "belegt" : "frei"}`,
      );

      days.appendChild(dayElement);
    }

    monthElement.appendChild(days);
    return monthElement;
  }

  function renderCalendar() {
    calendar.replaceChildren();

    const count = smallScreen.matches ? 1 : mediumScreen.matches ? 2 : 3;
    calendar.setAttribute("aria-busy", String(occupancyState.status === "loading"));
    retryButton.hidden = occupancyState.status !== "error";
    for (let offset = 0; offset < count; offset++) {
      const date = new Date(
        firstVisibleMonth.getFullYear(),
        firstVisibleMonth.getMonth() + offset,
        1,
      );

      calendar.appendChild(createMonth(date.getFullYear(), date.getMonth()));
    }

    const lastVisibleMonth = new Date(
      firstVisibleMonth.getFullYear(),
      firstVisibleMonth.getMonth() + count - 1,
      1,
    );

    const period = count === 1 ? monthFormat.format(firstVisibleMonth) : monthFormat.format(firstVisibleMonth) + " – " + monthFormat.format(lastVisibleMonth);
    status.textContent = period + (occupancyState.status === "loading"
      ? ": Belegungskalender wird geladen …"
      : occupancyState.status === "error"
        ? ": Verfügbarkeit unbekannt. Bitte erneut laden oder direkt anfragen."
        : "");
  }

  prevButton?.addEventListener("click", () => {
    firstVisibleMonth = new Date(
      firstVisibleMonth.getFullYear(),
      firstVisibleMonth.getMonth() - 1,
      1,
    );
    renderCalendar();
  });

  nextButton?.addEventListener("click", () => {
    firstVisibleMonth = new Date(
      firstVisibleMonth.getFullYear(),
      firstVisibleMonth.getMonth() + 1,
      1,
    );
    renderCalendar();
  });

  retryButton.addEventListener("click", loadOccupancy);
  window.addEventListener("occupancychange", renderCalendar);
  smallScreen.addEventListener("change", renderCalendar);
  mediumScreen.addEventListener("change", renderCalendar);
  renderCalendar();
})();

/* === Preisrechner (rechnet wie Hermes: 50 €/Nacht bis 2 Personen, zuerst Erwachsene;
   weitere Person ab 17 J. 20 €/Nacht, Kind bis 16 J. 10 €/Nacht, Haustier 8 €/Nacht,
   Endreinigung 50 €, mindestens 2 Nächte, höchstens 4 Personen) === */
(() => {
  const form = document.querySelector("#price-calc-form");
  if (!form) return;

  const PRICE = { night: 50, adult: 20, child: 10, pet: 8, cleaning: 50 };
  const MIN_NIGHTS = 2;
  const MAX_PERSONS = 4;
  const arrival = form.querySelector("#calc-arrival");
  const departure = form.querySelector("#calc-departure");
  const adults = form.querySelector("#calc-adults");
  const children = form.querySelector("#calc-children");
  const pets = form.querySelector("#calc-pets");
  const result = document.querySelector("#calc-result");
  const request = document.querySelector("#calc-request");
  let ranges = null;
  const fields = [arrival, departure, adults, children, pets];
  function clearErrors() {
    fields.forEach(field => {
      field.removeAttribute("aria-invalid");
      document.getElementById(field.id + "-error").textContent = "";
    });
  }
  function invalid(field, message) {
    field.setAttribute("aria-invalid", "true");
    document.getElementById(field.id + "-error").textContent = message;
    show([line(message, "calc-warning")]);
  }

  const euro = (value) =>
    value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const toDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const isoDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const deDate = (date) =>
    date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  arrival.min = isoDate(today);

  function line(text, cls) {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.textContent = text;
    return p;
  }

  // Empty request template, shown while no dates are chosen yet.
  const emptyRequestBody = [
    "Anreise: ",
    "Abreise: ",
    "Erwachsene: ",
    "Kinder (Alter): ",
    "Hund: ja / nein",
    "",
    "Nachricht: ",
  ].join("\n");

  function show(nodes, mailBody) {
    result.replaceChildren(...nodes);
    if (mailBody) {
      request.href =
        "mailto:urlaub@gaestehaus-perschall.com?subject=" +
        encodeURIComponent("Anfrage Gästehaus Perschall") +
        "&body=" +
        encodeURIComponent(mailBody);
      request.hidden = false;
    } else {
      request.hidden = true;
    }
  }

  function calculate() {
    clearErrors();
    const start = toDate(arrival.value);
    const end = toDate(departure.value);
    if (start) {
      departure.min = isoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + MIN_NIGHTS));
    } else {
      departure.removeAttribute("min");
    }
    if (!start || !end) return show([line("Bitte wählen Sie An- und Abreise.")], emptyRequestBody);
    if (start < today) return invalid(arrival, "Bitte wählen Sie eine Anreise ab heute.");
    if (end <= start) return invalid(departure, "Bitte wählen Sie eine Abreise nach der Anreise.");

    const nights = Math.round((end - start) / 86400000);
    const a = Number(adults.value);
    const c = Number(children.value);
    const h = Number(pets.value);

    if (a + c > MAX_PERSONS) {
      invalid(adults, `Bitte wählen Sie insgesamt höchstens ${MAX_PERSONS} Personen.`);
      return invalid(children, `Bitte wählen Sie insgesamt höchstens ${MAX_PERSONS} Personen.`);
    }
    if (nights < MIN_NIGHTS) {
      return invalid(departure, `Bitte wählen Sie mindestens ${MIN_NIGHTS} Nächte.`);
    }

    // Der Grundpreis deckt 2 Personen ab, zuerst die Erwachsenen.
    const extraAdults = Math.max(0, a - 2);
    const extraChildren = Math.max(0, c - Math.max(0, 2 - a));
    const items = [[`Übernachtung (${plural(nights, "Nacht", "Nächte")})`, nights * PRICE.night]];
    if (extraAdults) {
      items.push([`${plural(extraAdults, "weitere Person", "weitere Personen")} ab 17 J.`, extraAdults * nights * PRICE.adult]);
    }
    if (extraChildren) {
      items.push([`${plural(extraChildren, "Kind", "Kinder")} bis 16 J.`, extraChildren * nights * PRICE.child]);
    }
    if (h) items.push([plural(h, "Haustier", "Haustiere"), h * nights * PRICE.pet]);
    items.push(["Endreinigung", PRICE.cleaning]);
    const total = items.reduce((sum, [, value]) => sum + value, 0);

    const list = document.createElement("dl");
    list.className = "calc-items";
    for (const [label, value] of items) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = euro(value);
      list.append(dt, dd);
    }

    let availability;
    let occupied = false;
    if (ranges === null) {
      availability = line(occupancyState.status === "loading" ? "Die Verfügbarkeit wird geprüft …" : "Die Verfügbarkeit ist unbekannt. Bitte fragen Sie den Zeitraum direkt bei uns an.", "calc-info");
    } else if (ranges.some((r) => occupancyRules.overlaps(r, {start, end}))) {
      occupied = true;
      availability = line(
        "In diesem Zeitraum ist unser Gästehaus leider belegt. Bitte wählen Sie einen anderen Zeitraum.",
        "calc-warning",
      );
    } else {
      availability = line("Laut Belegungskalender ist dieser Zeitraum frei.", "calc-ok");
    }

    const summary = line(
      `${deDate(start)} bis ${deDate(end)} · ${plural(a, "Erwachsene/r", "Erwachsene")}` +
        (c ? ` · ${plural(c, "Kind", "Kinder")}` : "") +
        (h ? ` · ${plural(h, "Haustier", "Haustiere")}` : ""),
      "calc-summary",
    );

    const body =
      `Anreise: ${deDate(start)}\nAbreise: ${deDate(end)}\nErwachsene: ${a}\n` +
      `Kinder: ${c}${c ? " (Alter: bitte angeben)" : ""}\nHaustiere: ${h}\n` +
      `Richtpreis laut Preisrechner: ${euro(total)}\n\nNachricht: `;
    show([summary, list, line(`Richtpreis gesamt: ${euro(total)}`, "calc-total"), availability], occupied ? null : body);
  }

  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  form.addEventListener("submit", event => {
    event.preventDefault();
    calculate();
    form.querySelector('[aria-invalid="true"]')?.focus();
  });
  window.addEventListener("occupancychange", () => {
    ranges = occupancyState.ranges;
    calculate();
  });
  calculate();
})();

/* OpenStreetMap erst nach Freigabe laden */
const mapPlaceholder = document.querySelector(".map-placeholder");
if (mapPlaceholder) {
  const loadMap = mapPlaceholder.querySelector(".map-load");
  const unloadMap = mapPlaceholder.querySelector(".map-unload");
  const mapContent = mapPlaceholder.querySelector("#map-content");
  const mapStatus = mapPlaceholder.querySelector(".map-status");
  loadMap.hidden = false;
  loadMap.addEventListener("click", () => {
    if (mapContent.querySelector("iframe")) return;
    const frame = document.createElement("iframe");
    frame.title = "Karte: Birkenweg 11, 21357 Bardowick";
    frame.referrerPolicy = "no-referrer";
    frame.src = mapPlaceholder.dataset.mapSrc;
    mapContent.replaceChildren(frame);
    loadMap.hidden = true;
    unloadMap.hidden = false;
    mapStatus.textContent = "Die Karte von OpenStreetMap wurde aktiviert.";
    unloadMap.focus();
  });
  unloadMap.addEventListener("click", () => {
    mapContent.replaceChildren();
    unloadMap.hidden = true;
    loadMap.hidden = false;
    mapStatus.textContent = "Die Karte wurde entfernt.";
    loadMap.focus();
  });
}


if (document.querySelector("#occupancy-calendar, #price-calc-form")) loadOccupancy();
