import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { getPageHref, getPageNumbers } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  // The list's own path, e.g. "/items/snippets".
  basePath: string;
}

// The numbered page links under a list. It composes the ui primitives rather
// than using their PaginationLink, which hardcodes a plain anchor: these links
// go through next/link so paging keeps the app shell instead of reloading it.
export function PaginationControls({ page, pageCount, basePath }: PaginationControlsProps) {
  // Nothing to page through, so nothing to render.
  if (pageCount <= 1) {
    return null;
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PageStep
            direction="previous"
            basePath={basePath}
            page={page - 1}
            disabled={page <= 1}
          />
        </PaginationItem>

        {getPageNumbers(page, pageCount).map((link, index) =>
          link === "ellipsis" ? (
            // Ellipses have no page of their own, so their position in the row
            // is the only thing that distinguishes them.
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={link}>
              <Button
                variant={link === page ? "outline" : "ghost"}
                size="icon"
                nativeButton={false}
                render={
                  <Link
                    href={getPageHref(basePath, link)}
                    aria-label={`Go to page ${link}`}
                    aria-current={link === page ? "page" : undefined}
                  />
                }
              >
                {link}
              </Button>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PageStep
            direction="next"
            basePath={basePath}
            page={page + 1}
            disabled={page >= pageCount}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

interface PageStepProps {
  direction: "previous" | "next";
  page: number;
  basePath: string;
  disabled: boolean;
}

function PageStep({ direction, page, basePath, disabled }: PageStepProps) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Previous" : "Next";
  const edgeClass = isPrevious ? "pl-1.5!" : "pr-1.5!";

  const content = (
    <>
      {isPrevious && <ChevronLeftIcon data-icon="inline-start" />}
      <span className="hidden sm:block">{label}</span>
      {!isPrevious && <ChevronRightIcon data-icon="inline-end" />}
    </>
  );

  // At either end the control greys out in place rather than disappearing, so
  // the row doesn't shift as you page through. It renders as a span, so there's
  // no link left to follow or focus.
  if (disabled) {
    return (
      <Button
        variant="ghost"
        aria-disabled
        aria-label={`Go to ${direction} page`}
        className={cn(edgeClass, "pointer-events-none opacity-50")}
        nativeButton={false}
        render={<span />}
      >
        {content}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className={edgeClass}
      nativeButton={false}
      render={
        <Link
          href={getPageHref(basePath, page)}
          aria-label={`Go to ${direction} page`}
        />
      }
    >
      {content}
    </Button>
  );
}
