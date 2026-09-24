"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FAVORITE_SORT_OPTIONS, type FavoriteSort } from "@/lib/favorites";

interface FavoritesSortSelectProps {
  value: FavoriteSort;
  onChange: (value: FavoriteSort) => void;
}

const SORT_LABELS: Record<FavoriteSort, string> = Object.fromEntries(
  FAVORITE_SORT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<FavoriteSort, string>;

// Controlled by FavoritesList, which owns the sort state for both sections.
export function FavoritesSortSelect({ value, onChange }: FavoritesSortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="favorites-sort" className="text-xs text-muted-foreground">
        Sort by
      </Label>
      <Select
        value={value}
        onValueChange={(next) => next !== null && onChange(next as FavoriteSort)}
      >
        <SelectTrigger id="favorites-sort" size="sm" className="w-32">
          {/* Base UI renders the raw value unless it's formatted here. */}
          <SelectValue>{(sort: FavoriteSort) => SORT_LABELS[sort]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FAVORITE_SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
