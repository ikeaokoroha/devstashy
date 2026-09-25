import Link from "next/link";
import { cn } from "cn";

interface LogoProps {
  href?: string;
  className?: string;
  /** Classes for the wordmark, e.g. `hidden sm:inline` for an icon-only logo on phones. */
  wordmarkClassName?: string;
}

/** Brand mark and wordmark, shared by the homepage, the auth pages and the app's top bar. */
export function Logo({ href = "#top", className, wordmarkClassName }: LogoProps) {
  return (
    <Link
      href={href}
      // Named explicitly so the link keeps its name when the wordmark is hidden.
      aria-label="Devstashy"
      className={cn(
        "inline-flex items-center gap-2.5 font-bold tracking-tight",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-7 shrink-0 text-type-snippet"
      >
        <path
          d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7L12 2.8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8 10.2 12 12.4l4-2.2M12 12.4v4.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={wordmarkClassName}>
        Dev<span className="text-muted-foreground">stashy</span>
      </span>
    </Link>
  );
}
