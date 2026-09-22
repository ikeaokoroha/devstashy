"use client";

import { Label } from "@/components/ui/label";
import { isCodeType } from "@/lib/code-editor";
import { CodeEditor } from "./CodeEditor";
import { TextareaField } from "./TextareaField";

interface ContentFieldProps {
  typeName: string;
  value: string;
  onChange: (value: string) => void;
  language: string;
  error?: string;
  textareaClassName?: string;
}

// The content input: the code editor for snippets and commands, a textarea otherwise.
export function ContentField({
  typeName,
  value,
  onChange,
  language,
  error,
  textareaClassName,
}: ContentFieldProps) {
  if (!isCodeType(typeName)) {
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
