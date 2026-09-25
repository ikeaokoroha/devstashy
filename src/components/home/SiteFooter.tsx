import Link from "next/link";

import { HomeContainer } from "@/components/home/HomeContainer";
import { Logo } from "@/components/shared/Logo";
import { FOOTER_COLUMNS, FOOTER_COPY } from "@/lib/home-content";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/30 pt-14">
      <HomeContainer className="grid gap-12 pb-11 md:grid-cols-[1.4fr_2fr]">
        <div>
          <Logo />
          <p className="mt-3.5 max-w-xs text-sm text-muted-foreground">
            {FOOTER_COPY.tagline}
          </p>
        </div>

        <nav aria-label="Footer" className="grid gap-7 sm:grid-cols-3">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="mb-3.5 text-xs tracking-[0.07em] text-muted-foreground/70 uppercase">
                {column.heading}
              </h2>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="mb-2.5 block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </HomeContainer>

      <HomeContainer className="flex flex-wrap justify-between gap-2.5 border-t pt-5 pb-7 text-[13px] text-muted-foreground/70">
        <p>&copy; {new Date().getFullYear()} Devstashy. All rights reserved.</p>
        <p>{FOOTER_COPY.note}</p>
      </HomeContainer>
    </footer>
  );
}
