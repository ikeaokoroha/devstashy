import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getItemTypeStyle } from "@/lib/item-types";
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
