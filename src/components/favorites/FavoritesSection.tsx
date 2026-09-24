import type { ReactNode } from "react";

interface FavoritesSectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

// One labelled block of favorites rows. The heading is mono and quiet so the
// rows themselves carry the page, and the rows are separated by single lines
// rather than being boxed into cards.
export function FavoritesSection({ title, count, children }: FavoritesSectionProps) {
  return (
    <section className="space-y-1">
      <h2 className="flex items-baseline gap-2 px-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {title}
        <span className="text-muted-foreground/60">{count}</span>
      </h2>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  );
}
