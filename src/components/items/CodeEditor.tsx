"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Monaco, OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopyToClipboard, type CopyStatus } from "@/hooks/use-copy-to-clipboard";
import {
  EDITOR_LINE_HEIGHT,
  EDITOR_PADDING,
  estimateContentHeight,
  getEditorHeight,
  getEditorLanguage,
} from "@/lib/code-editor";
import { cn } from "@/lib/utils";

// Monaco only runs in the browser, and its code (fetched from the jsDelivr CDN by
// @monaco-editor/react) loads only once an editor is actually shown.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const THEME = "devstash-dark";

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: "Copy code",
  copied: "Copied",
  failed: "Copy failed",
};

// Transparent backgrounds let the frame's Tailwind colour show through, and the
// scrollbar uses the same faint white as the app's borders.
function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme(THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#00000000",
      "editorGutter.background": "#00000000",
      "editor.lineHighlightBackground": "#ffffff08",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#ffffff40",
      "editorLineNumber.activeForeground": "#ffffff99",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1a",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });
}

function EditorSkeleton() {
  return <Skeleton className="size-full rounded-none bg-muted/40" />;
}

function WindowDots() {
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      <span className="size-3 rounded-full bg-[#ff5f57]" />
      <span className="size-3 rounded-full bg-[#febc2e]" />
      <span className="size-3 rounded-full bg-[#28c840]" />
    </div>
  );
}

interface CodeEditorProps {
  value: string;
  typeName: string;
  language: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  invalid?: boolean;
}

// Monaco in a macOS-style window, with the language and a copy button in the
// title bar. Grows with its content up to 400px, then scrolls.
export function CodeEditor({
  value,
  typeName,
  language,
  readOnly = false,
  onChange,
  ariaLabel = "Code",
  invalid = false,
}: CodeEditorProps) {
  const [height, setHeight] = useState(() =>
    getEditorHeight(estimateContentHeight(value), readOnly)
  );
  const { status: copyStatus, copy } = useCopyToClipboard();
  const editorLanguage = getEditorLanguage(language, typeName);
  const languageLabel =
    language?.trim() || (editorLanguage === "plaintext" ? "text" : editorLanguage);

  const handleMount: OnMount = (editor) => {
    const fit = () => setHeight(getEditorHeight(editor.getContentHeight(), readOnly));
    fit();
    editor.onDidContentSizeChange(fit);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-muted/40",
        !readOnly && "transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive ring-3 ring-destructive/20"
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b bg-muted/60 py-1.5 pr-1.5 pl-3">
        <WindowDots />
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate font-mono text-xs text-muted-foreground">{languageLabel}</span>
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
      </div>

      {/* The height is measured from Monaco's content at runtime, so it can't be a class. */}
      <div style={{ height }}>
        <MonacoEditor
          value={value}
          language={editorLanguage}
          theme={THEME}
          beforeMount={defineTheme}
          onMount={handleMount}
          onChange={(next) => onChange?.(next ?? "")}
          loading={<EditorSkeleton />}
          options={{
            readOnly,
            domReadOnly: readOnly,
            ariaLabel,
            automaticLayout: true,
            minimap: { enabled: false },
            lineNumbers: readOnly ? "off" : "on",
            lineNumbersMinChars: 3,
            lineDecorationsWidth: readOnly ? 16 : 8,
            glyphMargin: false,
            folding: false,
            renderLineHighlight: readOnly ? "none" : "line",
            scrollBeyondLastLine: false,
            overviewRulerLanes: 0,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            stickyScroll: { enabled: false },
            contextmenu: !readOnly,
            tabSize: 2,
            fontSize: 12,
            lineHeight: EDITOR_LINE_HEIGHT,
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            padding: { top: EDITOR_PADDING, bottom: EDITOR_PADDING },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
              // Let the drawer scroll when the wheel reaches the editor's edge.
              alwaysConsumeMouseWheel: false,
            },
          }}
        />
      </div>
    </div>
  );
}
