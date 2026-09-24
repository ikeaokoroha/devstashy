"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ActionResult } from "@/types/actions";

interface UseFavoriteToggleOptions {
  // The value the server rendered. Adopted again whenever it changes, so a
  // refresh started by another surface doesn't leave a stale star behind.
  isFavorite: boolean;
  // The action to run, given the state the UI has already flipped to.
  save: (isFavorite: boolean) => Promise<ActionResult>;
  errorMessage: string;
}

interface UseFavoriteToggle {
  isFavorite: boolean;
  toggle: () => void;
}

// The shared toggle behind every favorite star: the flip shows immediately, is
// rolled back with a toast if the save fails, and a success refreshes the route
// so the sidebar's favorites group, the favorite counts and /favorites follow.
// There is no success toast — the star is its own confirmation, and one per click
// would be noise.
export function useFavoriteToggle({
  isFavorite,
  save,
  errorMessage,
}: UseFavoriteToggleOptions): UseFavoriteToggle {
  const router = useRouter();
  const [value, setValue] = useState(isFavorite);
  // Only the newest click may report or roll back: an earlier save that resolves
  // late would otherwise revert a click the user has since made again.
  const requestRef = useRef(0);
  // The save and the refresh it ends with run as one transition, so the route's
  // re-render doesn't interrupt the flip the user just saw. The button stays
  // clickable throughout: the star is already showing the new state, and the
  // request count settles a burst of clicks.
  const [, startSaving] = useTransition();

  // Another surface showing the same row (the drawer over its card) refreshes the
  // route when it saves, so a changed server value is the truth and replaces the
  // local one.
  const [serverValue, setServerValue] = useState(isFavorite);
  if (serverValue !== isFavorite) {
    setServerValue(isFavorite);
    setValue(isFavorite);
  }

  function toggle() {
    const previous = value;
    const next = !previous;
    setValue(next);
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    startSaving(async () => {
      try {
        const result = await save(next);
        // A save the user has already clicked past neither toasts nor rolls back;
        // the click that overtook it reports for both.
        if (requestId !== requestRef.current) {
          return;
        }
        if (!result.success) {
          setValue(previous);
          toast.error(result.error ?? errorMessage);
          return;
        }
        router.refresh();
      } catch (error) {
        // The action itself reports a failed write through its result, so
        // reaching here means the call never got that far — a dropped request or
        // a stale action reference. Logged rather than swallowed, since the toast
        // can't say which.
        console.error("Failed to toggle favorite", error);
        if (requestId === requestRef.current) {
          setValue(previous);
          toast.error(errorMessage);
        }
      }
    });
  }

  return { isFavorite: value, toggle };
}
