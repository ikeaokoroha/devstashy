import { Search } from "lucide-react";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6">
      <div className="flex-1">
        <SidebarTrigger className="-ml-1" />
      </div>

      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          aria-label="Search items"
          className="h-9 pr-12 pl-9"
        />
        <Kbd className="absolute top-1/2 right-2 -translate-y-1/2">⌘K</Kbd>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <NewCollectionDialog className="hidden sm:inline-flex" />
        <NewItemDialog />
      </div>
    </header>
  );
}
