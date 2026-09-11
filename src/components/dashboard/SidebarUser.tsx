import { Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarFooter } from "@/components/ui/sidebar";
import { currentUser } from "@/lib/mock-data";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SidebarUser() {
  return (
    <SidebarFooter className="border-t border-sidebar-border">
      <div className="flex items-center gap-3 px-2 py-1.5">
        <Avatar size="lg">
          {currentUser.image && (
            <AvatarImage src={currentUser.image} alt={currentUser.name} />
          )}
          <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{currentUser.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser.email}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <Settings />
        </Button>
      </div>
    </SidebarFooter>
  );
}
