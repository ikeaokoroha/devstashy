import { Badge } from "@/components/ui/badge";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getItemTypeStyle, PRO_ITEM_TYPES } from "@/lib/item-types";
import type { ItemTypeWithCount } from "@/types/dashboard";
import { SidebarCollapsibleGroup } from "./SidebarCollapsibleGroup";
import { SidebarNavLink } from "./SidebarNavLink";

interface SidebarTypesNavProps {
  itemTypes: ItemTypeWithCount[];
}

export function SidebarTypesNav({ itemTypes }: SidebarTypesNavProps) {
  return (
    <SidebarCollapsibleGroup label="Types">
      <SidebarMenu>
        {itemTypes.map((type) => {
          const { icon: Icon, textClass } = getItemTypeStyle(type.name);

          return (
            <SidebarMenuItem key={type.id}>
              <SidebarNavLink href={`/items/${type.name}s`}>
                <Icon className={textClass} />
                <span className="capitalize">{type.name}s</span>
                {PRO_ITEM_TYPES.includes(type.name) && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
                  >
                    PRO
                  </Badge>
                )}
              </SidebarNavLink>
              <SidebarMenuBadge className="text-muted-foreground">
                {type.itemCount}
              </SidebarMenuBadge>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarCollapsibleGroup>
  );
}
