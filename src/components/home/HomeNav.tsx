import Link from "next/link";

import { HomeContainer } from "@/components/home/HomeContainer";
import { HomeNavShell } from "@/components/home/HomeNavShell";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { HOME_NAV_LINKS } from "@/lib/home-content";

interface HomeNavProps {
  isSignedIn: boolean;
  /** `#top` on the homepage itself; `/` from the auth pages. */
  logoHref?: string;
}

export function HomeNav({ isSignedIn, logoHref }: HomeNavProps) {
  return (
    <HomeNavShell>
      <HomeContainer className="flex h-full items-center gap-8">
        <Logo href={logoHref} />

        <nav
          aria-label="Main"
          className="hidden gap-6 text-sm text-muted-foreground sm:flex"
        >
          {HOME_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {isSignedIn ? (
            <Button
              size="lg"
              nativeButton={false}
              className="btn-brand px-4 font-semibold text-white"
              render={<Link href="/dashboard" />}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="lg"
                nativeButton={false}
                className="px-4 text-muted-foreground"
                render={<Link href="/sign-in" />}
              >
                Sign In
              </Button>
              <Button
                size="lg"
                nativeButton={false}
                className="btn-brand px-4 font-semibold text-white"
                render={<Link href="/register" />}
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </HomeContainer>
    </HomeNavShell>
  );
}
