"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

interface SidebarNavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SidebarNavLink({ href, children }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuButton
      render={<Link href={href} />}
      isActive={pathname === href}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
    >
      {children}
    </SidebarMenuButton>
  );
}
