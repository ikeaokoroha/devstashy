import { CalendarDays, Mail } from "lucide-react";
import { GitHubIcon } from "@/components/shared/GitHubIcon";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ProfileUser } from "@/types/profile";

interface ProfileHeaderProps {
  user: ProfileUser;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

// Only GitHub is wired up, so anything else falls back to its bare name.
const PROVIDER_LABELS: Record<string, string> = { github: "GitHub" };

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <Card className="gap-0 px-6 sm:flex-row sm:items-center sm:gap-6">
      <UserAvatar
        name={user.name}
        email={user.email}
        image={user.image}
        className="size-16 shrink-0 text-lg"
      />
      <div className="min-w-0 space-y-1">
        <h2 className="truncate text-xl font-semibold">{user.name ?? user.email}</h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-4 shrink-0" />
          <span className="truncate">{user.email}</span>
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" />
          {/* Fixed locale so the server and client render the same string. */}
          <span>Joined {user.createdAt.toLocaleDateString("en-US", DATE_FORMAT)}</span>
        </p>
        {user.providers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {user.providers.map((provider) => (
              <Badge key={provider} variant="outline" className="gap-1">
                {provider === "github" && <GitHubIcon className="size-3" />}
                {PROVIDER_LABELS[provider] ?? provider}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
