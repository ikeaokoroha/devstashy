/* ──────────────────────────────────────────────────────────────
   DevStash homepage mockup
   Nav opacity, scroll reveals, the chaos animation and the
   pricing toggle. No dependencies.
   ────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ── Navbar ───────────────────────────────────────────────── */

  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;

    const update = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ── Scroll reveals ───────────────────────────────────────── */

  function initReveals() {
    const targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;

    // No observer support, or motion is off: show everything up front.
    if (!("IntersectionObserver" in window) || reducedMotion.matches) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px" },
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ── Chaos icons ──────────────────────────────────────────── */

  const BASE_SPEED = 0.022; // px per ms
  const MAX_SPEED = 0.09;
  const REPEL_RADIUS = 120;
  const REPEL_STRENGTH = 0.0016;
  const MAX_FRAME_MS = 32; // clamp, so a backgrounded tab doesn't teleport icons

  function initChaos() {
    const field = document.getElementById("chaos");
    if (!field) return;

    const icons = Array.prototype.slice.call(
      field.querySelectorAll(".chaos__icon"),
    );
    // Without the animation the CSS fallback layout stands in.
    if (!icons.length || reducedMotion.matches) return;

    let width = field.clientWidth;
    let height = field.clientHeight;
    const size = icons[0].offsetWidth || 46;

    // Seed each icon in its own cell of a 4×2 grid so nothing starts stacked.
    const cols = 4;
    const rows = 2;
    const cells = [];
    for (let i = 0; i < cols * rows; i += 1) cells.push(i);
    for (let i = cells.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = cells[i];
      cells[i] = cells[j];
      cells[j] = swap;
    }

    const particles = icons.map((el, index) => {
      const cell = cells[index % cells.length];
      const cellWidth = width / cols;
      const cellHeight = height / rows;
      const angle = Math.random() * Math.PI * 2;

      return {
        el,
        x:
          (cell % cols) * cellWidth +
          Math.random() * Math.max(cellWidth - size, 1),
        y:
          Math.floor(cell / cols) * cellHeight +
          Math.random() * Math.max(cellHeight - size, 1),
        vx: Math.cos(angle) * BASE_SPEED,
        vy: Math.sin(angle) * BASE_SPEED,
        rotation: Math.random() * 20 - 10,
        spin: (Math.random() * 0.02 - 0.01) * 1.4, // degrees per ms
        phase: Math.random() * Math.PI * 2,
        pulse: 0.0012 + Math.random() * 0.0008,
      };
    });

    const pointer = { x: 0, y: 0, active: false };

    field.addEventListener("pointermove", (event) => {
      const rect = field.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });

    field.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    function step(particle, delta, time) {
      if (pointer.active) {
        const centerX = particle.x + size / 2;
        const centerY = particle.y + size / 2;
        const dx = centerX - pointer.x;
        const dy = centerY - pointer.y;
        const distance = Math.hypot(dx, dy) || 0.001;

        if (distance < REPEL_RADIUS) {
          // Falls off to nothing at the edge of the radius.
          const push = (1 - distance / REPEL_RADIUS) * REPEL_STRENGTH * delta;
          particle.vx += (dx / distance) * push;
          particle.vy += (dy / distance) * push;
        }
      }

      // Bleed the repulsion off so icons settle back to a drift.
      const speed = Math.hypot(particle.vx, particle.vy);
      if (speed > BASE_SPEED) {
        const damping = Math.max(0.985, 1 - 0.0008 * delta);
        particle.vx *= damping;
        particle.vy *= damping;
      }
      if (speed > MAX_SPEED) {
        particle.vx = (particle.vx / speed) * MAX_SPEED;
        particle.vy = (particle.vy / speed) * MAX_SPEED;
      }

      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;

      // Bounce off the walls.
      const maxX = Math.max(width - size, 0);
      const maxY = Math.max(height - size, 0);
      if (particle.x <= 0) {
        particle.x = 0;
        particle.vx = Math.abs(particle.vx);
      } else if (particle.x >= maxX) {
        particle.x = maxX;
        particle.vx = -Math.abs(particle.vx);
      }
      if (particle.y <= 0) {
        particle.y = 0;
        particle.vy = Math.abs(particle.vy);
      } else if (particle.y >= maxY) {
        particle.y = maxY;
        particle.vy = -Math.abs(particle.vy);
      }

      particle.rotation += particle.spin * delta;
      const scale = 1 + Math.sin(time * particle.pulse + particle.phase) * 0.06;

      particle.el.style.transform =
        "translate3d(" +
        particle.x.toFixed(2) +
        "px, " +
        particle.y.toFixed(2) +
        "px, 0) rotate(" +
        particle.rotation.toFixed(2) +
        "deg) scale(" +
        scale.toFixed(3) +
        ")";
    }

    let frame = 0;
    let last = 0;
    let inView = true;

    function loop(now) {
      const delta = last ? Math.min(now - last, MAX_FRAME_MS) : 16;
      last = now;
      particles.forEach((particle) => step(particle, delta, now));
      frame = window.requestAnimationFrame(loop);
    }

    function start() {
      if (frame || !inView || document.hidden) return;
      last = 0;
      frame = window.requestAnimationFrame(loop);
    }

    function stop() {
      if (!frame) return;
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    field.classList.add("is-animated");
    particles.forEach((particle) => step(particle, 0, 0));

    // Keep the icons inside the box when it changes size.
    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        width = field.clientWidth;
        height = field.clientHeight;
        particles.forEach((particle) => {
          particle.x = Math.min(particle.x, Math.max(width - size, 0));
          particle.y = Math.min(particle.y, Math.max(height - size, 0));
        });
      });
      resizeObserver.observe(field);
    }

    // Don't burn frames while the hero is scrolled out of view.
    if ("IntersectionObserver" in window) {
      const visibility = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) start();
          else stop();
        });
      });
      visibility.observe(field);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }

  /* ── Pricing toggle ───────────────────────────────────────── */

  const BLURBS = {
    monthly: "Billed monthly. Switch to yearly and save $24.",
    yearly: "Billed annually at $72 — that's $6 a month.",
  };

  function initPricing() {
    const options = document.querySelectorAll(".billing__option");
    const price = document.getElementById("pro-price");
    const period = document.getElementById("pro-period");
    const blurb = document.getElementById("pro-blurb");
    if (!options.length || !price || !period || !blurb) return;

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const selected = option.dataset.period;

        options.forEach((other) => {
          const isSelected = other === option;
          other.classList.toggle("is-active", isSelected);
          other.setAttribute("aria-checked", String(isSelected));
        });

        price.textContent = price.dataset[selected];
        period.textContent = period.dataset[selected];
        blurb.textContent = BLURBS[selected];
      });
    });
  }

  /* ── Footer year ──────────────────────────────────────────── */

  function initYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  initNav();
  initReveals();
  initChaos();
  initPricing();
  initYear();
})();
