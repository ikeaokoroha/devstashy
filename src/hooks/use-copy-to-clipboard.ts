"use client";

import { useEffect, useRef, useState } from "react";

const COPY_FEEDBACK_MS = 2000;

export type CopyStatus = "idle" | "copied" | "failed";

// Copies text and reports "copied" or "failed" for 2s, so the button itself confirms.
export function useCopyToClipboard() {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), COPY_FEEDBACK_MS);
  }

  return { status, copy };
}
