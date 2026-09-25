import Link from "next/link";
import { Star } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { CreateMenu } from "@/components/dashboard/CreateMenu";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6">
      <div className="flex-1">
        <SidebarTrigger className="-ml-1" />
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
        <CreateMenu className="sm:hidden" />
        <NewCollectionDialog className="hidden sm:inline-flex" />
        <NewItemDialog className="hidden sm:inline-flex" />
      </div>
    </header>
  );
}
