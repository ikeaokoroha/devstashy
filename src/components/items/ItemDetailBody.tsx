import { Calendar, FolderOpen, Tag, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { isCodeType } from "@/lib/code-editor";
import { formatFileSize, getContentLabel, getSafeHref } from "@/lib/item-detail";
import { isMarkdownType } from "@/lib/markdown";
import type { ItemDetailJson } from "@/types/items";
import { CodeEditor } from "./CodeEditor";
import { MarkdownEditor } from "./MarkdownEditor";

// Fixed locale and UTC so the date doesn't shift with the viewer's time zone.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface SectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-primary underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

function ItemContent({ item }: { item: ItemDetailJson }) {
  if (item.contentType === "URL" && item.url) {
    const href = getSafeHref(item.url);
    return href ? <ExternalLink href={href}>{item.url}</ExternalLink> : <p className="break-all">{item.url}</p>;
  }

  if (item.contentType === "FILE" && item.fileName) {
    const href = item.fileUrl ? getSafeHref(item.fileUrl) : null;
    const size = item.fileSize !== null ? ` (${formatFileSize(item.fileSize)})` : "";
    return (
      <p>
        {href ? <ExternalLink href={href}>{item.fileName}</ExternalLink> : item.fileName}
        <span className="text-muted-foreground">{size}</span>
      </p>
    );
  }

  if (!item.content) {
    return <p className="text-muted-foreground">No content</p>;
  }

  if (isCodeType(item.itemType.name)) {
    return (
      <CodeEditor
        value={item.content}
        typeName={item.itemType.name}
        language={item.language}
        ariaLabel={`${item.title} content`}
        readOnly
      />
    );
  }

  if (isMarkdownType(item.itemType.name)) {
    return <MarkdownEditor value={item.content} ariaLabel={`${item.title} content`} readOnly />;
  }

  return (
    <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
      <code>{item.content}</code>
    </pre>
  );
}

export function ItemDetailBody({ item }: { item: ItemDetailJson }) {
  return (
    <div className="space-y-6">
      {item.description && (
        <Section title="Description">
          <p>{item.description}</p>
        </Section>
      )}

      <Section title={getContentLabel(item.contentType)}>
        <ItemContent item={item} />
      </Section>

      {item.tags.length > 0 && (
        <Section title="Tags" icon={Tag}>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      <ItemMetadata item={item} />
    </div>
  );
}

// Collections and dates: read-only in both view and edit mode.
export function ItemMetadata({ item }: { item: Pick<ItemDetailJson, "collections" | "createdAt" | "updatedAt"> }) {
  return (
    <>
      {item.collections.length > 0 && (
        <Section title="Collections" icon={FolderOpen}>
          <div className="flex flex-wrap gap-1.5">
            {item.collections.map((collection) => (
              <Badge key={collection.id} variant="outline">
                {collection.name}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      <Section title="Details" icon={Calendar}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-right">{DATE_FORMATTER.format(new Date(item.createdAt))}</dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-right">{DATE_FORMATTER.format(new Date(item.updatedAt))}</dd>
        </dl>
      </Section>
    </>
  );
}

export function ItemDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading item" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}
