import { FileRow } from "@/components/items/FileRow";
import type { ItemWithType } from "@/types/dashboard";

interface FileListProps {
  items: ItemWithType[];
  emptyMessage: string;
}

export function FileList({ items, emptyMessage }: FileListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  // A single column of rows, whatever the width. The @container is here so each
  // row lays its details out by the list's own width rather than the viewport,
  // as in ItemGrid and ImageGrid — the collapsible sidebar changes how much
  // room there is at the same screen size.
  return (
    <div className="@container">
      <div className="divide-y overflow-hidden rounded-lg border">
        {items.map((item) => (
          <FileRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
