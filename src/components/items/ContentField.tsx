"use client";

import { Label } from "@/components/ui/label";
import { isCodeType } from "@/lib/code-editor";
import { isMarkdownType } from "@/lib/markdown";
import { CodeEditor } from "./CodeEditor";
import { MarkdownEditor } from "./MarkdownEditor";
import { TextareaField } from "./TextareaField";

const FIELD_ID = "field-content";
const ERROR_ID = `${FIELD_ID}-error`;

interface ContentFieldProps {
  typeName: string;
  value: string;
  onChange: (value: string) => void;
  language: string;
  error?: string;
  textareaClassName?: string;
}

// The content input: the code editor for snippets and commands, the Markdown
// editor for prompts and notes, a textarea otherwise.
export function ContentField({
  typeName,
  value,
  onChange,
  language,
  error,
  textareaClassName,
}: ContentFieldProps) {
  if (isCodeType(typeName)) {
    return (
      <div className="grid gap-2">
        <Label>Content</Label>
        <CodeEditor
          value={value}
          onChange={onChange}
          typeName={typeName}
          language={language}
          ariaLabel="Content"
          invalid={Boolean(error)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (isMarkdownType(typeName)) {
    return (
      <div className="grid gap-2">
        <Label htmlFor={FIELD_ID}>Content</Label>
        <MarkdownEditor
          id={FIELD_ID}
          value={value}
          onChange={onChange}
          ariaDescribedBy={error ? ERROR_ID : undefined}
          invalid={Boolean(error)}
        />
        {error && (
          <p id={ERROR_ID} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <TextareaField
      name="content"
      label="Content"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      spellCheck={false}
      className={textareaClassName}
    />
  );
}
