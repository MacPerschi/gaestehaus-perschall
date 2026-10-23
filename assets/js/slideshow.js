(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll(".photo-slideshow").forEach(show => {
    const slides = [...show.querySelectorAll("img")];
    const controls = show.parentElement.querySelector(".slideshow-controls");
    if (slides.length < 2 || !controls) return;
    const toggle = controls.querySelector(".slideshow-toggle");
    let current = Math.max(0, slides.findIndex(img => img.classList.contains("is-active")));
    let paused = false, timer = null;
    function display(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((img, i) => {
        img.classList.toggle("is-active", i === current);
        img.setAttribute("aria-hidden", String(i !== current));
      });
    }
    function sync() {
      clearInterval(timer);
      timer = null;
      const running = !paused && !reduced.matches && !document.hidden;
      show.classList.toggle("is-running", running);
      toggle.disabled = reduced.matches;
      toggle.textContent = reduced.matches ? "Automatischer Wechsel aus" : paused ? "Bilderwechsel starten" : "Bilderwechsel pausieren";
      if (running) timer = setInterval(() => display(current + 1), Number(show.dataset.interval) || 4500);
    }
    toggle.addEventListener("click", () => { paused = !paused; sync(); });
    controls.querySelector(".slideshow-prev").addEventListener("click", () => { paused = true; sync(); display(current - 1); });
    controls.querySelector(".slideshow-next").addEventListener("click", () => { paused = true; sync(); display(current + 1); });
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pagehide", () => clearInterval(timer));
    window.addEventListener("pageshow", sync);
    controls.hidden = false;
    display(current);
    sync();
  });
})();
