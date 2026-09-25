"use client";

import { useEffect, useRef } from "react";
import { cn } from "cn";

/**
 * Fades its children in the first time they scroll into view. The class is
 * toggled on the node rather than held in state, so nothing re-renders and the
 * server-rendered children stay server components.
 *
 * Stagger a group by passing a Tailwind `delay-*` class.
 */
export function Reveal({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // No observer support: show the content rather than leaving it hidden.
    if (!("IntersectionObserver" in window)) {
      element.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("reveal", className)}>
      {children}
    </div>
  );
}
