"use client";

import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCopyToClipboard, type CopyStatus } from "@/hooks/use-copy-to-clipboard";
import { getSafeHref } from "@/lib/item-detail";
import { cn } from "@/lib/utils";

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: "Copy content",
  copied: "Copied",
  failed: "Copy failed",
};

// Only http(s) links become clickable; anything else renders as plain text.
// Wide tables scroll inside their own box instead of widening the preview.
const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => {
    const safeHref = href ? getSafeHref(href) : null;
    if (!safeHref) return <span>{children}</span>;
    return (
      <a href={safeHref} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table>{children}</table>
    </div>
  ),
};

function MarkdownPreview({ value, readOnly }: { value: string; readOnly: boolean }) {
  return (
    <div className={cn("max-h-100 overflow-auto px-4 py-3", !readOnly && "min-h-30")}>
      {value.trim() ? (
        // Raw HTML in the content is ignored (no rehype-raw), so it can't inject markup.
        <div className="markdown-preview">
          <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
            {value}
          </Markdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing to preview</p>
      )}
    </div>
  );
}

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  invalid?: boolean;
}

// Write/Preview tabs in the same frame as CodeEditor, with a copy button in the
// header. Read-only shows the preview alone. Grows with its content up to 400px.
export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
  id,
  ariaLabel = "Content",
  ariaDescribedBy,
  invalid = false,
}: MarkdownEditorProps) {
  const { status: copyStatus, copy } = useCopyToClipboard();

  return (
    <Tabs
      defaultValue={readOnly ? "preview" : "write"}
      className={cn(
        "gap-0 overflow-hidden rounded-lg border bg-muted/40",
        !readOnly && "transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive ring-3 ring-destructive/20"
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b bg-muted/60 py-1 pr-1.5 pl-1.5">
        <TabsList className="h-7 bg-transparent p-0">
          {!readOnly && (
            <TabsTrigger value="write" className="h-6 flex-none px-2.5 text-xs">
              Write
            </TabsTrigger>
          )}
          <TabsTrigger value="preview" className="h-6 flex-none px-2.5 text-xs">
            Preview
          </TabsTrigger>
        </TabsList>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={COPY_LABELS[copyStatus]}
          title={COPY_LABELS[copyStatus]}
          disabled={!value}
          onClick={() => void copy(value)}
        >
          {copyStatus === "copied" ? <Check /> : <Copy />}
        </Button>
      </div>

      {!readOnly && (
        <TabsContent value="write">
          <textarea
            id={id}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-describedby={ariaDescribedBy}
            spellCheck={false}
            className="block field-sizing-content min-h-30 max-h-100 w-full resize-none bg-transparent px-4 py-3 font-mono text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
            placeholder="Write Markdown..."
          />
        </TabsContent>
      )}
      <TabsContent value="preview">
        <MarkdownPreview value={value} readOnly={readOnly} />
      </TabsContent>
    </Tabs>
  );
}
