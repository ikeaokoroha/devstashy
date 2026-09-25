import Link from "next/link";
import { cn } from "cn";

/** Brand mark and wordmark, shared by the homepage nav and footer. */
export function HomeLogo({ className }: { className?: string }) {
  return (
    <Link
      href="#top"
      className={cn(
        "inline-flex items-center gap-2.5 font-bold tracking-tight",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-7 text-type-snippet"
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
      <span>
        Dev<span className="text-muted-foreground">stashy</span>
      </span>
    </Link>
  );
}
