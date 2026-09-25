"use client";

import { useState } from "react";
import { FolderPlus, Plus } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreateMenuProps {
  className?: string;
}

// Both create actions behind one + button, for the top bar on a phone, where a
// second labeled button would leave the search box no room. Nothing here is
// mobile-specific — only where the top bar renders it — so showing it at every
// width later is a class change. Both dialogs are siblings of the menu rather
// than children, since a dialog inside it would unmount when the menu closed.
export function CreateMenu({ className }: CreateMenuProps) {
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="icon-lg" aria-label="Create" />}>
          <Plus />
        </DropdownMenuTrigger>
        {/* w-auto overrides the popup's default w-(--anchor-width), which would
            take the icon trigger's 36px and wrap "New Collection" onto two lines;
            the component's own min-w-32 stays as the floor. */}
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuItem onClick={() => setIsItemOpen(true)}>
            <Plus />
            New Item
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsCollectionOpen(true)}>
            <FolderPlus />
            New Collection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewItemDialog open={isItemOpen} onOpenChange={setIsItemOpen} />
      <NewCollectionDialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen} />
    </div>
  );
}
