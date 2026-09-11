import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getItemTypeStyle } from "@/lib/item-types";
import { items, itemTypes } from "@/lib/mock-data";
import { SidebarCollapsibleGroup } from "./SidebarCollapsibleGroup";
import { SidebarNavLink } from "./SidebarNavLink";

export function SidebarTypesNav() {
  return (
    <SidebarCollapsibleGroup label="Types">
      <SidebarMenu>
        {itemTypes.map((type) => {
          const { icon: Icon, textClass } = getItemTypeStyle(type.name);
          const count = items.filter(
            (item) => item.itemTypeId === type.id
          ).length;

          return (
            <SidebarMenuItem key={type.id}>
              <SidebarNavLink href={`/items/${type.name}s`}>
                <Icon className={textClass} />
                <span className="capitalize">{type.name}s</span>
              </SidebarNavLink>
              <SidebarMenuBadge className="text-muted-foreground">
                {count}
              </SidebarMenuBadge>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarCollapsibleGroup>
  );
}
