import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

interface SidebarCollapsibleGroupProps {
  label: string;
  children: React.ReactNode;
}

export function SidebarCollapsibleGroup({
  label,
  children,
}: SidebarCollapsibleGroupProps) {
  return (
    <SidebarGroup>
      <Collapsible defaultOpen>
        <SidebarGroupLabel
          render={<CollapsibleTrigger />}
          className="group/label w-fit gap-1 text-sm hover:text-sidebar-foreground"
        >
          {label}
          <ChevronDown className="-rotate-90 transition-transform group-data-panel-open/label:rotate-0" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
