"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * The top bar's hamburger on phones, where there's no rail. SidebarTrigger
 * hard-codes the panel icon, so this toggles the sidebar itself.
 */
export function MobileSidebarToggle({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label="Open navigation"
      onClick={toggleSidebar}
    >
      <Menu />
    </Button>
  );
}
