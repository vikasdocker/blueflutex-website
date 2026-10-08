/* =========================================================
   BlueFluteX \u2014 interaction layer
   Vanilla, no dependencies. Every effect is an enhancement:
   with JS off (or WebGL down) the page is still complete.
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- headline split ----------
     Wraps each word in an overflow-hidden box with an inner span, so a
     translateY reveal looks like the type rising from behind a mask.
     Markup is built from textContent, so there is no HTML injection risk. */
  const splitHero = (el) => {
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((word, i) => {
      const outer = document.createElement("span");
      outer.className = "split-w";
      const inner = document.createElement("span");
      inner.className = "split-i";
      inner.style.setProperty("--d", String(i));
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  };
  splitHero($("[data-split]"));

  /* ---------- data-d -> --d so CSS owns the stagger ---------- */
  $$(".reveal").forEach((el) => {
    const d = el.dataset.d;
    if (d !== undefined) el.style.setProperty("--d", d);
  });

  /* ---------- scroll reveal ---------- */
  // the split headline animates via .is-in too, but through .split-i rather
  // than .reveal -- it has no opacity/translate of its own to start from
  const revealables = $$(".reveal, [data-split]");

  if (reduced.matches || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target); // one-shot: no re-animate on scroll back
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealables.forEach((el) => io.observe(el));
  }

  /* ---------- sticky nav + scroll progress ---------- */
  const nav = $("[data-nav]");
  const progress = $("[data-progress]");
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (nav) nav.classList.toggle("is-stuck", y > 8);
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = `${max > 0 ? Math.min(y / max, 1) * 100 : 0}%`;
      }
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile drawer ---------- */
  const burger = $("[data-burger]");
  const drawer = $("[data-drawer]");

  const setDrawer = (open) => {
    if (!burger || !drawer) return;
    burger.setAttribute("aria-expanded", String(open));
    drawer.classList.toggle("is-open", open);
    // hidden keeps it out of the a11y tree and tab order when closed
    if (open) drawer.removeAttribute("hidden");
    else drawer.setAttribute("hidden", "");
  };

  burger?.addEventListener("click", () =>
    setDrawer(burger.getAttribute("aria-expanded") !== "true")
  );
  drawer?.addEventListener("click", (e) => {
    if (e.target.tagName === "A") setDrawer(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") setDrawer(false);
  });
  addEventListener("resize", () => {
    if (innerWidth > 780) setDrawer(false);
  });

  /* ---------- ticker ----------
     Clone the strip once so the CSS translate loop has no visible seam.
     Motion itself is CSS; this only guarantees the content is wide enough. */
  $$("[data-marquee]").forEach((row) => {
    const set = $(".ticker__set", row);
    if (set) row.appendChild(set.cloneNode(true));
  });

  /* ---------- card spotlight (pointer-fine only) ---------- */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });

    /* ---------- magnetic primary buttons ---------- */
    if (!reduced.matches) {
      $$(".btn--ink, .btn--line").forEach((btn) => {
        btn.addEventListener("pointermove", (e) => {
          const r = btn.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
          const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          btn.style.transform = `translate(${dx * 5}px, ${dy * 3}px)`;
        });
        btn.addEventListener("pointerleave", () => {
          btn.style.transform = "";
        });
      });
    }
  }

  /* ---------- footer year ---------- */
  $$("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- analytics events ----------
     Pushes to window.dataLayer for Google Tag Manager. GTM decides what to do
     with them; nothing here talks to Google directly, and the container ID
     lives only in the four HTML files.

     dataLayer is a plain array created by the GTM snippet, so these pushes are
     harmless under an ad blocker, with JS off, or if GTM never loads at all.

     `generate_lead` is a GA4 recommended event name, which means it can be
     marked as a key event without any extra GTM configuration. The other two
     are custom and need an Event tag in the container. See README.md. */
  const track = (event, params = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      link_url: location.href,
      link_domain: location.hostname,
      page_location: location.pathname,
      ...params,
    });
  };

  // 1. contact form accepted by the server -- the primary conversion
  // 2. a mailto: click, which bypasses the form entirely
  // 3. any off-site link, so you can see which visits become repo visits
  document.addEventListener(
    "click",
    (e) => {
      const link = e.target.closest?.("a[href]");
      if (!link) return;

      const href = link.getAttribute("href") || "";

      if (href.startsWith("mailto:")) {
        track("email_click", { link_text: link.textContent.trim() });
        return;
      }

      // data-todo-link marks the unreplaced placeholder profiles
      if (href.startsWith("http") && !href.includes(location.hostname)) {
        track("outbound_click", { link_text: link.textContent.trim(), link_url: href });
      }
    },
    // passive: this listener only reads, never prevents default
    { passive: true }
  );

  /* ---------- contact form ----------
     Progressive enhancement: without JS this is a normal POST that lands on
     contact.php, which renders its own result. With JS we POST JSON and swap
     the status line in place so the page never navigates. */
  const form = $("#contact");

  if (form) {
    const status = $("[data-status]", form);
    const submit = $("[data-submit]", form);
    const label = $("[data-submit-label]", form);

    const fieldOf = (input) => input.closest(".field");

    const setError = (input, msg) => {
      const wrap = fieldOf(input);
      const box = wrap && $("[data-err-for]", wrap);
      if (wrap) wrap.classList.toggle("is-bad", Boolean(msg));
      if (box) {
        box.textContent = msg || "";
        box.hidden = !msg;
      }
      if (msg) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    };

    const rules = {
      "f-name": (v) => (v.trim().length >= 2 ? "" : "Please tell us your name."),
      "f-email": (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "That email address doesn\u2019t look right.",
      "f-msg": (v) =>
        v.trim().length >= 20 ? "" : "A sentence or two about the project, please.",
    };

    const validate = () => {
      let firstBad = null;
      Object.entries(rules).forEach(([id, rule]) => {
        const input = document.getElementById(id);
        if (!input) return;
        const msg = rule(input.value);
        setError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      return firstBad;
    };

    $$("input[name], textarea[name]", form).forEach((input) => {
      input.addEventListener("blur", () => {
        const id = input.id;
        if (rules[id]) setError(input, rules[id](input.value));
      });
      input.addEventListener("input", () => {
        if (fieldOf(input)?.classList.contains("is-bad")) setError(input, "");
      });
    });

    const say = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle("is-ok", kind === "ok");
      status.classList.toggle("is-bad", kind === "bad");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const bad = validate();
      if (bad) {
        say("Please fix the highlighted fields.", "bad");
        bad.focus();
        return;
      }

      submit.disabled = true;
      if (label) label.textContent = "Sending\u2026";
      say("", null);

      const payload = Object.fromEntries(new FormData(form).entries());

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) throw new Error(data.error || "The message could not be sent.");

        form.reset();
        say(data.message || "Thanks \u2014 we\u2019ll reply within two working days.", "ok");

        // Only on confirmed delivery, so a failed submit never counts as a
        // lead. Note this is a client-side signal: the honeypot is evaluated
        // server-side and still answers ok, so bot submissions can inflate
        // this event. Cross-check against the contact_messages table before
        // treating the numbers as exact.
        track("generate_lead", {
          form_id: "contact",
          lead_type: "contact_form",
          budget: payload.budget || "unstated",
        });
      } catch (err) {
        say(
          err.message + " You can also email us directly at vikasshu7@gmail.com.",
          "bad"
        );
      } finally {
        submit.disabled = false;
        if (label) label.textContent = "Send message";
      }
    });
  }
})();