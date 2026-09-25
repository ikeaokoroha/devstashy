"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

interface SidebarNavLinkProps {
  href: string;
  /** Shown on hover while the sidebar is collapsed to icons. */
  tooltip?: string;
  children: React.ReactNode;
}

export function SidebarNavLink({ href, tooltip, children }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuButton
      render={<Link href={href} />}
      isActive={pathname === href}
      tooltip={tooltip}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
    >
      {children}
    </SidebarMenuButton>
  );
}
