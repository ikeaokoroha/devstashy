"use client";

import { useEffect, useRef } from "react";
import { AppWindow, Bookmark, FileText, Terminal } from "lucide-react";

import { NotionIcon, SlackIcon, VsCodeIcon } from "@/components/home/BrandIcons";
import { GitHubIcon } from "@/components/shared/GitHubIcon";
import { getItemTypeStyle } from "@/lib/item-types";

interface ChaosSource {
  label: string;
  // A system item type, only for the icon's colour.
  type: string;
  Icon: React.ComponentType<{ className?: string }>;
}

// Where developers' knowledge currently lives. The type is a tint, not a claim
// about what the tool is.
const CHAOS_SOURCES: ChaosSource[] = [
  { label: "Notion", type: "note", Icon: NotionIcon },
  { label: "GitHub", type: "file", Icon: GitHubIcon },
  { label: "Slack", type: "image", Icon: SlackIcon },
  { label: "VS Code", type: "snippet", Icon: VsCodeIcon },
  { label: "Browser tabs", type: "link", Icon: AppWindow },
  { label: "Terminal", type: "command", Icon: Terminal },
  { label: "Text file", type: "prompt", Icon: FileText },
  { label: "Bookmark", type: "link", Icon: Bookmark },
];

const BASE_SPEED = 0.022; // px per ms
const MAX_SPEED = 0.09;
const REPEL_RADIUS = 120;
const REPEL_STRENGTH = 0.0016;
const MAX_FRAME_MS = 32; // clamp, so a backgrounded tab doesn't teleport icons

interface Particle {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  phase: number;
  pulse: number;
}

/**
 * The hero's scattered-knowledge panel: icons drift, bounce off the walls,
 * spin and pulse, and are pushed away from the pointer.
 *
 * Positions are written straight to each node's transform rather than held in
 * state, so the loop never re-renders. When motion is reduced the loop never
 * starts and the CSS scatter in globals.css stands in.
 */
export function ChaosField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const icons = Array.from(
      field.querySelectorAll<HTMLElement>("[data-chaos-icon]"),
    );
    if (!icons.length) return;

    let width = field.clientWidth;
    let height = field.clientHeight;
    const size = icons[0].offsetWidth || 44;

    // Seed each icon in its own cell of a 4×2 grid so nothing starts stacked.
    const cols = 4;
    const rows = 2;
    const cells = Array.from({ length: cols * rows }, (_, index) => index);
    for (let i = cells.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const particles: Particle[] = icons.map((el, index) => {
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

    const onPointerMove = (event: PointerEvent) => {
      const rect = field.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    field.addEventListener("pointermove", onPointerMove);
    field.addEventListener("pointerleave", onPointerLeave);

    function step(particle: Particle, delta: number, time: number) {
      if (pointer.active) {
        const dx = particle.x + size / 2 - pointer.x;
        const dy = particle.y + size / 2 - pointer.y;
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

      particle.el.style.transform = `translate3d(${particle.x.toFixed(2)}px, ${particle.y.toFixed(2)}px, 0) rotate(${particle.rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    }

    let frame = 0;
    let last = 0;
    let inView = true;

    function loop(now: number) {
      const delta = last ? Math.min(now - last, MAX_FRAME_MS) : 16;
      last = now;
      for (const particle of particles) step(particle, delta, now);
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

    // Place them once so the first paint matches the loop's first frame.
    for (const particle of particles) step(particle, 0, 0);

    // Keep the icons inside the box when it changes size.
    const resizeObserver =
      "ResizeObserver" in window
        ? new ResizeObserver(() => {
            width = field.clientWidth;
            height = field.clientHeight;
            for (const particle of particles) {
              particle.x = Math.min(particle.x, Math.max(width - size, 0));
              particle.y = Math.min(particle.y, Math.max(height - size, 0));
            }
          })
        : null;
    resizeObserver?.observe(field);

    // Don't burn frames while the hero is scrolled out of view.
    const visibility =
      "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            for (const entry of entries) {
              inView = entry.isIntersecting;
              if (inView) start();
              else stop();
            }
          })
        : null;

    if (visibility) visibility.observe(field);
    else start();

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      resizeObserver?.disconnect();
      visibility?.disconnect();
      field.removeEventListener("pointermove", onPointerMove);
      field.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      aria-hidden="true"
      className="relative h-75 overflow-hidden rounded-xl border border-dashed border-white/10 bg-black/25"
    >
      {CHAOS_SOURCES.map(({ label, type, Icon }, index) => (
        <span
          key={`${label}-${index}`}
          data-chaos-icon
          title={label}
          className={`chaos-icon absolute top-0 left-0 grid size-11 place-items-center rounded-xl border border-white/15 bg-muted/60 p-2.5 will-change-transform ${getItemTypeStyle(type).textClass}`}
        >
          <Icon className="size-full" />
        </span>
      ))}
    </div>
  );
}
