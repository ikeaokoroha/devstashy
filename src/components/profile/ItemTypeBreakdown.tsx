import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemTypeStyle } from "@/lib/item-types";
import { cn } from "@/lib/utils";
import type { ItemTypeWithCount } from "@/types/dashboard";

interface ItemTypeBreakdownProps {
  itemTypes: ItemTypeWithCount[];
}

// "snippet" → "Snippets": the type names are stored lowercase and singular.
function pluralize(name: string) {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}s`;
}

export function ItemTypeBreakdown({ itemTypes }: ItemTypeBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items by type</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {itemTypes.map(({ id, name, itemCount }) => {
          const { icon: Icon, textClass, bgClass } = getItemTypeStyle(name);

          return (
            <div
              key={id}
              className={cn("flex flex-col gap-1 rounded-lg px-3 py-2.5", bgClass)}
            >
              <div className={cn("flex items-center gap-2", textClass)}>
                <Icon className="size-4 shrink-0" />
                <span className="truncate text-xs font-medium">{pluralize(name)}</span>
              </div>
              <p className="text-xl font-semibold">{itemCount}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
