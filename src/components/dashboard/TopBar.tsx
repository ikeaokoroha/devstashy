import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6">
      <div className="flex-1">
        <SidebarTrigger className="-ml-1" />
      </div>

      <SearchTrigger />

      <div className="flex flex-1 items-center justify-end gap-2">
        <NewCollectionDialog className="hidden sm:inline-flex" />
        <NewItemDialog />
      </div>
    </header>
  );
}
