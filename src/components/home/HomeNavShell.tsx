"use client";

import { useEffect, useRef } from "react";

/**
 * The fixed homepage header. Past a few pixels of scroll it turns opaque —
 * written as a data attribute on the node rather than state, so the nav's
 * contents stay server components and nothing re-renders on scroll.
 */
export function HomeNavShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      element.dataset.scrolled = String(window.scrollY > 8);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      ref={ref}
      data-scrolled="false"
      className="fixed inset-x-0 top-0 z-50 h-17 border-b border-transparent bg-background/35 backdrop-blur-sm transition-[background-color,border-color,backdrop-filter] duration-250 data-[scrolled=true]:border-border data-[scrolled=true]:bg-background/92 data-[scrolled=true]:backdrop-blur-md"
    >
      {children}
    </header>
  );
}
