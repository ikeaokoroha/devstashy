import { ArrowRight, Folder, Star } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getItemTypeStyle } from "@/lib/item-types";
import { cn } from "@/lib/utils";
import type { SidebarCollection, SidebarCollections } from "@/types/dashboard";
import { SidebarCollapsibleGroup } from "./SidebarCollapsibleGroup";
import { SidebarNavLink } from "./SidebarNavLink";

interface CollectionListProps {
  heading: string;
  collections: SidebarCollection[];
}

function CollectionList({ heading, collections }: CollectionListProps) {
  if (collections.length === 0) return null;

  return (
    <div className="pb-2">
      <h3 className="px-2 pt-2 pb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {heading}
      </h3>
      <SidebarMenu>
        {collections.map((collection) => (
          <SidebarMenuItem key={collection.id}>
            <SidebarNavLink href={`/collections/${collection.id}`}>
              <Folder className="text-muted-foreground" />
              <span>{collection.name}</span>
            </SidebarNavLink>
            <SidebarMenuBadge>
              <CollectionMarker collection={collection} />
            </SidebarMenuBadge>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}

// Favorites get a star; the rest get a dot colored by their most-used item type.
function CollectionMarker({ collection }: { collection: SidebarCollection }) {
  if (collection.isFavorite) {
    return (
      <Star
        aria-label="Favorite"
        className="size-3.5 fill-yellow-400 text-yellow-400"
      />
    );
  }

  const { dotClass } = getItemTypeStyle(collection.dominantType?.name ?? "");
  return (
    <span
      aria-label={collection.dominantType?.name ?? "Empty collection"}
      className={cn("size-2 rounded-full", dotClass)}
    />
  );
}

interface SidebarCollectionsNavProps {
  collections: SidebarCollections;
}

export function SidebarCollectionsNav({ collections }: SidebarCollectionsNavProps) {
  return (
    // Hidden while collapsed to icons, where every row would be the same
    // folder; AppSidebar shows a single Collections icon there instead.
    <SidebarCollapsibleGroup label="Collections" className="group-data-[collapsible=icon]:hidden">
      <CollectionList heading="Favorites" collections={collections.favorites} />
      <CollectionList heading="Recent" collections={collections.recent} />
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarNavLink href="/collections">
            <span className="text-muted-foreground">View all collections</span>
            <ArrowRight className="ml-auto text-muted-foreground" />
          </SidebarNavLink>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarCollapsibleGroup>
  );
}
