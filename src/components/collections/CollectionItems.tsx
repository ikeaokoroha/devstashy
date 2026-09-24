import type { ReactNode } from "react";
import { Layers, type LucideIcon } from "lucide-react";

import { FileList } from "@/components/items/FileList";
import { ImageGrid } from "@/components/items/ImageGrid";
import { ItemGrid } from "@/components/items/ItemGrid";
import { getItemTypeStyle } from "@/lib/item-types";
import { cn } from "@/lib/utils";
import type { ItemWithType } from "@/types/dashboard";

interface SectionProps {
  icon: LucideIcon;
  iconClass?: string;
  title: string;
  showHeading: boolean;
  children: ReactNode;
}

function Section({ icon: Icon, iconClass, title, showHeading, children }: SectionProps) {
  return (
    <section className="space-y-4">
      {showHeading && (
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className={cn("size-4", iconClass)} />
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

interface CollectionItemsProps {
  items: ItemWithType[];
  emptyMessage: string;
}

// A collection holds every type at once, so images and files get the thumbnail
// grid and Drive-style list they have on their own /items pages instead of
// collapsing into the generic card rows.
export function CollectionItems({ items, emptyMessage }: CollectionItemsProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const images = items.filter((item) => item.itemType.name === "image");
  const files = items.filter((item) => item.itemType.name === "file");
  const rest = items.filter(
    (item) => item.itemType.name !== "image" && item.itemType.name !== "file"
  );

  // Headings only earn their place once the collection holds more than one
  // shape: a collection of plain snippets shouldn't grow an "Items" header.
  const showHeadings = [rest, images, files].filter((group) => group.length > 0).length > 1;
  const imageStyle = getItemTypeStyle("image");
  const fileStyle = getItemTypeStyle("file");

  return (
    <div className="space-y-8">
      {rest.length > 0 && (
        <Section icon={Layers} title="Items" showHeading={showHeadings}>
          <ItemGrid items={rest} emptyMessage={emptyMessage} />
        </Section>
      )}
      {images.length > 0 && (
        <Section
          icon={imageStyle.icon}
          iconClass={imageStyle.textClass}
          title="Images"
          showHeading={showHeadings}
        >
          <ImageGrid items={images} emptyMessage={emptyMessage} leading={rest.length === 0} />
        </Section>
      )}
      {files.length > 0 && (
        <Section
          icon={fileStyle.icon}
          iconClass={fileStyle.textClass}
          title="Files"
          showHeading={showHeadings}
        >
          <FileList items={files} emptyMessage={emptyMessage} />
        </Section>
      )}
    </div>
  );
}
