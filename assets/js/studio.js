(() => {
  const root=document.documentElement, toggle=document.querySelector('.theme-toggle');
  const system=matchMedia('(prefers-color-scheme: dark)');
  function sync(){const dark=root.dataset.theme==='dark';toggle?.setAttribute('aria-label',dark?'Hellmodus einschalten':'Dunkelmodus einschalten');toggle?.setAttribute('title',dark?'Hellmodus einschalten':'Dunkelmodus einschalten');toggle?.setAttribute('aria-pressed',String(dark));document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#14231b':'#faf7ef');window.dispatchEvent(new Event('themechange'));}
  toggle?.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('perschall-theme',root.dataset.theme)}catch{}sync();});
  system.addEventListener('change',()=>{let saved;try{saved=localStorage.getItem('perschall-theme')}catch{}if(!saved){root.dataset.theme=system.matches?'dark':'light';sync();}});sync();
  const nav=document.querySelector('.site-nav'),navButton=document.querySelector('.nav-toggle');
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');navButton.setAttribute('aria-expanded','false');navButton.focus();}});
  const roomMain=document.querySelector('.room-main'),roomImage=roomMain?.querySelector('img'),gallery=[...document.querySelectorAll('.gallery button')],tabs=document.querySelector('.room-tabs');
  let roomIndex = 0;
  const roomKeys = gallery.map(button => button.dataset.room.toLocaleLowerCase("de-DE"));
  function showRoom(index, updateUrl = false) {
    roomIndex = (index + gallery.length) % gallery.length;
    const button = gallery[roomIndex];
    if (window.gsap) gsap.killTweensOf(roomImage);
    roomImage.style.opacity = "1";
    roomImage.src = button.dataset.full;
    roomImage.alt = button.querySelector("img").alt;
    roomMain.setAttribute("aria-label", button.dataset.room + ": Bild vergrößern");
    document.querySelector("#room-title").textContent = button.dataset.room;
    document.querySelector("#room-count").textContent = String(roomIndex + 1).padStart(2, "0") + " / " + String(gallery.length).padStart(2, "0");
    gallery.forEach((item, i) => item.classList.toggle("is-selected", i === roomIndex));
    [...tabs.children].forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === roomIndex));
      tab.tabIndex = i === roomIndex ? 0 : -1;
    });
    document.querySelector(".room-viewer").setAttribute("aria-labelledby", "room-tab-" + roomIndex);
    if (updateUrl) {
      const url = new URL(location.href);
      if (url.searchParams.get("raum") !== roomKeys[roomIndex]) {
        url.searchParams.set("raum", roomKeys[roomIndex]);
        history.pushState(null, "", url);
      }
    }
  }
  if (tabs && gallery.length) {
    const panel = document.querySelector(".room-viewer");
    panel.id = "room-panel";
    panel.setAttribute("role", "tabpanel");
    gallery.forEach((button, i) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.setAttribute("role", "tab");
      tab.textContent = button.dataset.room;
      tab.setAttribute("aria-controls", "room-panel");
      tab.id = "room-tab-" + i;
      tab.addEventListener("click", () => showRoom(i, true));
      tab.addEventListener("keydown", event => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? gallery.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + gallery.length) % gallery.length;
        showRoom(next, true);
        tabs.children[next].focus();
      });
      tabs.append(tab);
    });
    const restoreRoom = () => showRoom(Math.max(0, roomKeys.indexOf(new URL(location.href).searchParams.get("raum"))));
    window.addEventListener("popstate", restoreRoom);
    restoreRoom();
  }
  if(window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{gsap.from('.hero-content>.eyebrow,.hero h1,.hero-lead,.hero-actions',{y:22,opacity:0,duration:.9,stagger:.12,ease:'power2.out',clearProps:'all'});gsap.from('.hero-image-wrap',{opacity:0,duration:1.15,ease:'power2.out'});gsap.from('.house-seal',{scale:.8,opacity:0,duration:1,delay:.4,ease:'power2.out'});document.querySelectorAll('.section h2,.feature-band h2,.landwehr-gallery,.cards .card,.room-viewer').forEach(el=>gsap.from(el,{y:28,opacity:0,duration:.85,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',once:true},clearProps:'all'}));gsap.to('.hero-image',{yPercent:5,scale:1.05,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});});window.addEventListener('pagehide',()=>mm.revert(),{once:true});}
})();

