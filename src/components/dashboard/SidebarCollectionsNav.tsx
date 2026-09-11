import { Folder, Star } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { collections, items, type Collection } from "@/lib/mock-data";
import { SidebarCollapsibleGroup } from "./SidebarCollapsibleGroup";
import { SidebarNavLink } from "./SidebarNavLink";

const RECENT_COLLECTIONS_LIMIT = 5;

interface CollectionListProps {
  heading: string;
  collections: Collection[];
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
            <SidebarMenuBadge className="text-muted-foreground">
              {collection.isFavorite ? (
                <Star
                  aria-label="Favorite"
                  className="size-3.5 fill-yellow-400 text-yellow-400"
                />
              ) : (
                items.filter((item) =>
                  item.collectionIds.includes(collection.id)
                ).length
              )}
            </SidebarMenuBadge>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}

export function SidebarCollectionsNav() {
  const favorites = collections.filter((collection) => collection.isFavorite);
  const recent = collections
    .filter((collection) => !collection.isFavorite)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, RECENT_COLLECTIONS_LIMIT);

  return (
    <SidebarCollapsibleGroup label="Collections">
      <CollectionList heading="Favorites" collections={favorites} />
      <CollectionList heading="Recent" collections={recent} />
    </SidebarCollapsibleGroup>
  );
}
