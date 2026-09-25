import { FolderOpen, LayoutDashboard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ICON_MODE_MENU_GAP, ICON_MODE_PADDING } from "@/lib/sidebar";
import type {
  ItemTypeWithCount,
  SidebarCollections,
  SidebarUserInfo,
} from "@/types/dashboard";
import { SidebarCollectionsNav } from "./SidebarCollectionsNav";
import { SidebarNavLink } from "./SidebarNavLink";
import { SidebarTypesNav } from "./SidebarTypesNav";
import { SidebarUser } from "./SidebarUser";

interface AppSidebarProps {
  itemTypes: ItemTypeWithCount[];
  collections: SidebarCollections;
  user: SidebarUserInfo;
}

export function AppSidebar({ itemTypes, collections, user }: AppSidebarProps) {
  return (
    // On desktop the sidebar sits below the full-width top bar (h-16) and
    // collapses to an icon strip rather than off screen, so the strip and the
    // open drawer are the same element. The mobile sheet ignores className and
    // collapsible, staying a full-height overlay opened from the top bar.
    <Sidebar collapsible="icon" className="top-16 h-[calc(100svh-4rem)]">
      <SidebarHeader
        className={cn(
          // Label left and toggle right in the open drawer; the label hides and
          // the toggle centres in the icon strip.
          "flex-row items-center justify-between py-3 group-data-[collapsible=icon]:justify-center",
          ICON_MODE_PADDING,
        )}
      >
        <span className="px-2 text-sm font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          Navigation
        </span>
        <SidebarTrigger title="Toggle sidebar" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className={ICON_MODE_PADDING}>
          <SidebarMenu className={ICON_MODE_MENU_GAP}>
            <SidebarMenuItem>
              <SidebarNavLink href="/dashboard" tooltip="Dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarNavLink>
            </SidebarMenuItem>
            {/* Only while collapsed: the open drawer lists collections below. */}
            <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
              <SidebarNavLink href="/collections" tooltip="Collections">
                <FolderOpen />
                <span>Collections</span>
              </SidebarNavLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarTypesNav itemTypes={itemTypes} />
        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
        <SidebarCollectionsNav collections={collections} />
      </SidebarContent>

      <SidebarUser user={user} />
    </Sidebar>
  );
}
