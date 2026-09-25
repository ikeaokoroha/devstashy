import Link from "next/link";
import { Star } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { CreateMenu } from "@/components/dashboard/CreateMenu";
import { MobileSidebarToggle } from "@/components/dashboard/MobileSidebarToggle";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    // md:pl-3.5 centres the 28px logo mark over the 56px icon strip below it.
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:pr-6 md:pl-3.5">
      <div className="flex flex-1 items-center gap-3">
        {/* From md up the toggle lives at the top of the sidebar instead. */}
        <MobileSidebarToggle className="-ml-1 md:hidden" />
        {/* Icon only below sm, so the search box keeps its room on a phone. */}
        <Logo href="/" wordmarkClassName="hidden sm:inline" />
      </div>

      <SearchTrigger />

      <div className="flex flex-1 items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          title="Favorites"
          nativeButton={false}
          render={<Link href="/favorites" aria-label="Favorites" />}
        >
          <Star />
        </Button>
        {/* Labelled buttons only from lg: below that they squeeze the search
            box until it wraps and push New Item past the bar's padding. */}
        <CreateMenu className="lg:hidden" />
        <NewCollectionDialog className="hidden lg:inline-flex" />
        <NewItemDialog className="hidden lg:inline-flex" />
      </div>
    </header>
  );
}
