import { ProBadge } from "@/components/shared/ProBadge";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ICON_MODE_MENU_GAP, ICON_MODE_PADDING } from "@/lib/sidebar";
import { getItemTypeSlug, getItemTypeStyle, PRO_ITEM_TYPES } from "@/lib/item-types";
import type { ItemTypeWithCount } from "@/types/dashboard";
import { SidebarCollapsibleGroup } from "./SidebarCollapsibleGroup";
import { SidebarNavLink } from "./SidebarNavLink";

interface SidebarTypesNavProps {
  itemTypes: ItemTypeWithCount[];
}

export function SidebarTypesNav({ itemTypes }: SidebarTypesNavProps) {
  return (
    <SidebarCollapsibleGroup label="Types" className={ICON_MODE_PADDING}>
      <SidebarMenu className={ICON_MODE_MENU_GAP}>
        {itemTypes.map((type) => {
          const { icon: Icon, textClass } = getItemTypeStyle(type.name);

          return (
            <SidebarMenuItem key={type.id}>
              <SidebarNavLink
                href={`/items/${getItemTypeSlug(type.name)}`}
                tooltip={`${type.name[0].toUpperCase()}${type.name.slice(1)}s`}
              >
                <Icon className={textClass} />
                <span className="capitalize">{type.name}s</span>
                {PRO_ITEM_TYPES.includes(type.name) && <ProBadge />}
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
