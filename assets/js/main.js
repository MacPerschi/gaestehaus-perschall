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
  galleryButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      opener = button;
      showImage(index);
      dialog.showModal();
    });
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

/* === Belegungskalender Gästehaus Perschall === */
(() => {
  const calendar = document.querySelector("#occupancy-calendar");
  if (!calendar) return;

  const status = document.querySelector(".calendar-status");
  const prevButton = document.querySelector(".calendar-prev");
  const nextButton = document.querySelector(".calendar-next");

  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  const weekdayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  let occupiedRanges = [];
  let firstVisibleMonth = new Date();
  firstVisibleMonth = new Date(
    firstVisibleMonth.getFullYear(),
    firstVisibleMonth.getMonth(),
    1,
  );

  function parseIcsDate(value) {
    if (!/^\d{8}$/.test(value)) return null;

    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));

    return new Date(year, month, day);
  }

  function parseOccupancy(ics) {
    const ranges = [];
    const events = ics.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

    for (const event of events) {
      const startMatch = event.match(/DTSTART(?:;VALUE=DATE)?:([0-9]{8})/);
      const endMatch = event.match(/DTEND(?:;VALUE=DATE)?:([0-9]{8})/);

      if (!startMatch || !endMatch) continue;

      const start = parseIcsDate(startMatch[1]);
      const end = parseIcsDate(endMatch[1]);

      if (start && end && end > start) {
        ranges.push({ start, end });
      }
    }

    return ranges;
  }

  function isOccupied(date) {
    return occupiedRanges.some(
      (range) => date >= range.start && date <= range.end,
    );
  }

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
    heading.textContent = `${monthNames[month]} ${year}`;
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
      const occupied = isOccupied(date);

      dayElement.className = "calendar-day";
      dayElement.textContent = String(day);

      if (occupied) {
        dayElement.classList.add("calendar-day-occupied");
      }

      if (isToday(date)) {
        dayElement.classList.add("calendar-day-today");
      }

      dayElement.setAttribute("role", "img");
      dayElement.setAttribute(
        "aria-label",
        `${day}. ${monthNames[month]} ${year}: ${occupied ? "belegt" : "frei"}`,
      );

      days.appendChild(dayElement);
    }

    monthElement.appendChild(days);
    return monthElement;
  }

  function renderCalendar() {
    calendar.replaceChildren();

    for (let offset = 0; offset < 3; offset++) {
      const date = new Date(
        firstVisibleMonth.getFullYear(),
        firstVisibleMonth.getMonth() + offset,
        1,
      );

      calendar.appendChild(createMonth(date.getFullYear(), date.getMonth()));
    }

    const lastVisibleMonth = new Date(
      firstVisibleMonth.getFullYear(),
      firstVisibleMonth.getMonth() + 2,
      1,
    );

    status.textContent =
      `${monthNames[firstVisibleMonth.getMonth()]} ${firstVisibleMonth.getFullYear()} – ` +
      `${monthNames[lastVisibleMonth.getMonth()]} ${lastVisibleMonth.getFullYear()}`;
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

  fetch("kalender/belegung.ics", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    })
    .then((ics) => {
      occupiedRanges = parseOccupancy(ics);
      renderCalendar();
    })
    .catch((error) => {
      console.error("Belegungskalender konnte nicht geladen werden:", error);
      calendar.replaceChildren();
      status.textContent =
        "Der Belegungskalender kann momentan nicht geladen werden.";
    });
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
