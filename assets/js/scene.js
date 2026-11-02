/* Original canvas + CSS studio field. No WebGL or external runtime. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const hero = $(".hero");
  if (!hero) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  // Always show the studio's local time, independent of the visitor's zone.
  const clock = $("[data-studio-time]");
  const updateClock = () => {
    if (!clock) return;
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = `(${new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(now)})`;
  };
  updateClock();
  const clockTimer = setInterval(updateClock, 30000);

  // The gallery shows abstract studio studies, while CleanBoost remains the
  // only featured case study. Decorative copies never enter the tab order.
  const assets = ["resonance", "intelligence", "mobile", "systems", "play", "engineering"];
  const tiles = $("[data-scene-tiles]");
  if (tiles) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 36; i++) {
      const item = document.createElement("div");
      item.className = "scene-tile";
      const angle = i * 2.399963;
      const radius = 260 + (i % 7) * 125;
      item.style.setProperty("--tx", `${Math.cos(angle) * radius}px`);
      item.style.setProperty("--ty", `${Math.sin(angle) * radius * 0.53 - 50}px`);
      item.style.setProperty("--turn", `${(i % 5 - 2) * 5}deg`);
      item.style.setProperty("--delay", `${-i * 52 / 36}s`);
      const img = new Image();
      img.src = `assets/img/studio-${assets[i % assets.length]}.svg`;
      img.alt = "";
      img.decoding = "async";
      item.appendChild(img);
      fragment.appendChild(item);
    }
    tiles.appendChild(fragment);
  }

  const canvas = $("#studio-field");
  const context = canvas?.getContext("2d");
  const toggle = $("[data-motion-toggle]");
  let width = 0, height = 0, frame = 0, previous = 0;
  let userPaused = false, onStage = true, destroyed = false;
  let pointerX = 0, pointerY = 0, driftX = 0, driftY = 0;
  let stars = [];
  let seed = 29;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const colors = ["#e9eae1", "#92bca7", "#969bd3", "#dbb691", "#9bc0da"];
  const shouldAnimate = () => !destroyed && !userPaused && !reduced.matches && onStage && !document.hidden;

  const resize = () => {
    width = hero.clientWidth;
    height = hero.clientHeight;
    if (!context) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 29;
    stars = Array.from({ length: width < 700 ? 310 : 650 }, () => {
      const angle = random() * Math.PI * 2;
      const radius = 30 + Math.pow(random(), .7) * 650;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .8,
        z: random() * 2400 + 1, size: random() * 2.4 + .6, color: colors[Math.floor(random() * colors.length)] };
    });
    draw(0);
  };

  function draw(delta) {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    driftX += (pointerX - driftX) * Math.min(delta * 3, 1);
    driftY += (pointerY - driftY) * Math.min(delta * 3, 1);
    const focal = width < 700 ? 420 : 680;
    stars.forEach(star => {
      if (delta) {
        star.z -= delta * 36;
        if (star.z < 5) star.z += 2400;
      }
      const scale = focal / (star.z + 160);
      const x = width * .52 + (star.x + driftX * 35) * scale;
      const y = height * .38 + (star.y + driftY * 25) * scale;
      const size = Math.max(.5, Math.min(star.size * scale, 4));
      if (x < 0 || y < 0 || x > width || y > height) return;
      context.globalAlpha = Math.min(.72, .15 + scale * .38);
      context.fillStyle = star.color;
      context.fillRect(x, y, size, size * .75);
    });
    context.globalAlpha = 1;
  }
  const animate = timestamp => {
    frame = 0;
    if (!shouldAnimate()) return;
    const delta = previous ? Math.min((timestamp - previous) / 1000, .05) : 0;
    previous = timestamp;
    draw(delta);
    frame = requestAnimationFrame(animate);
  };
  const syncMotion = () => {
    hero.classList.toggle("is-motion-paused", !shouldAnimate());
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (shouldAnimate() && context) frame = requestAnimationFrame(animate);
    else draw(0);
    if (toggle) {
      toggle.hidden = reduced.matches;
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.textContent = userPaused ? "Resume motion" : "Pause motion";
    }
  };
  toggle?.addEventListener("click", () => { userPaused = !userPaused; syncMotion(); });
  hero.addEventListener("pointermove", e => {
    if (!shouldAnimate()) return;
    const rect = hero.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) / rect.width - .5;
    pointerY = (e.clientY - rect.top) / rect.height - .5;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { pointerX = pointerY = 0; });
  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  if (resizeObserver) resizeObserver.observe(hero);
  else addEventListener("resize", resize);
  const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    onStage = entries[0].isIntersecting;
    syncMotion();
  }, { threshold: 0 }) : null;
  observer?.observe(hero);
  document.addEventListener("visibilitychange", syncMotion);
  reduced.addEventListener("change", syncMotion);
  resize();
  syncMotion();

  // Native modal semantics supply focus containment and Escape handling.
  // Move, rather than clone, sections so IDs and form controls stay unique.
  const panel = $("[data-studio-panel]");
  const content = $("[data-panel-content]");
  const panelLabel = $("#panel-label");
  let activeContent = null, placeholder = null;
  const restore = () => {
    if (activeContent && placeholder) {
      placeholder.replaceWith(activeContent);
      activeContent = placeholder = null;
    }
    document.body.classList.remove("overlay-open");
  };
  const close = () => { panel?.close(); restore(); };
  const labels = { work: "Selected work", services: "What we build", studio: "The studio", contact: "Start a project", process: "Our process" };
  if (panel && typeof panel.showModal === "function") {
    document.addEventListener("click", event => {
      const link = event.target.closest("a[data-panel]");
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const section = document.getElementById(link.dataset.panel);
      const inner = section?.querySelector(":scope > .wrap");
      if (!inner || panel.open) return;
      event.preventDefault();
      placeholder = document.createElement("div");
      placeholder.className = "panel-placeholder";
      placeholder.style.height = `${inner.getBoundingClientRect().height}px`;
      inner.before(placeholder);
      activeContent = inner;
      content.appendChild(inner);
      panelLabel.textContent = labels[link.dataset.panel] || "Explore";
      panel.dataset.view = link.dataset.panel;
      document.body.classList.add("overlay-open");
      const drawer = $("[data-drawer]");
      const burger = $("[data-burger]");
      drawer?.setAttribute("hidden", "");
      drawer?.classList.remove("is-open");
      burger?.setAttribute("aria-expanded", "false");
      try { panel.showModal(); content.scrollTop = 0; }
      catch { restore(); section.scrollIntoView(); }
    });
    $("[data-panel-close]")?.addEventListener("click", close);
    panel.addEventListener("close", restore);
    panel.addEventListener("click", event => {
      if (event.target !== panel) return;
      const rect = panel.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    panel.addEventListener("click", event => {
      const link = event.target.closest('a[href^="#"]:not([data-panel])');
      if (!link) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      event.preventDefault();
      close();
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth" });
    });
  }
  addEventListener("pagehide", event => {
    if (event.persisted) { onStage = false; syncMotion(); return; }
    destroyed = true;
    if (frame) cancelAnimationFrame(frame);
    clearInterval(clockTimer);
    resizeObserver?.disconnect();
    observer?.disconnect();
  });
  addEventListener("pageshow", event => { if (event.persisted) { onStage = true; syncMotion(); updateClock(); } });
})();
