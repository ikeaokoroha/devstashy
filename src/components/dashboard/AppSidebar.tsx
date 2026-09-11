import Link from "next/link";
import { Layers } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarCollectionsNav } from "./SidebarCollectionsNav";
import { SidebarTypesNav } from "./SidebarTypesNav";
import { SidebarUser } from "./SidebarUser";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex-row items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-blue-500 text-white">
            <Layers className="size-4" />
          </span>
          <span className="text-lg font-semibold">Devstashy</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarTypesNav />
        <SidebarSeparator />
        <SidebarCollectionsNav />
      </SidebarContent>

      <SidebarUser />
    </Sidebar>
  );
}
