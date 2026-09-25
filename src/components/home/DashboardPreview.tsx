import { Search } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { SYSTEM_ITEM_TYPE_ORDER, getItemTypeStyle } from "@/lib/item-types";

// Files are the one type the card grid leaves out, so six cards fit two rows.
const CARD_TYPES = SYSTEM_ITEM_TYPE_ORDER.filter((type) => type !== "file");

/** A simplified, non-interactive picture of the app, shown beside the chaos panel. */
export function DashboardPreview() {
  return (
    <div
      aria-hidden="true"
      className="grid h-75 grid-cols-[82px_1fr] overflow-hidden rounded-xl border bg-background sm:grid-cols-[96px_1fr] md:grid-cols-[116px_1fr]"
    >
      <aside className="overflow-hidden border-r bg-black/25 px-2.5 py-3">
        <div className="mb-2.5 flex items-center gap-1.5 border-b pb-2.5">
          <span className="size-1.5 shrink-0 rounded-full bg-type-snippet" />
          <span className="h-1.5 w-[85%] rounded-full bg-white/10" />
        </div>

        <ul className="grid gap-1.5 text-[10.5px] text-muted-foreground md:text-[11.5px]">
          {SYSTEM_ITEM_TYPE_ORDER.map((type, index) => (
            <li
              key={type}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 ${
                index === 0 ? "bg-white/5 text-foreground" : ""
              }`}
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${getItemTypeStyle(type).dotClass}`}
              />
              <span className="truncate capitalize">{type}s</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-col gap-2.5 p-3">
        <div className="flex items-center gap-2 rounded-lg border bg-white/3 px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
          <Search className="size-3.5 shrink-0" />
          <span className="truncate">Search everything</span>
          <Kbd className="ml-auto h-4 bg-transparent text-[10px] ring ring-border">
            ⌘K
          </Kbd>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-2 sm:grid-cols-3 sm:grid-rows-2">
          {CARD_TYPES.map((type) => (
            <article
              key={type}
              className="relative flex flex-col gap-1.5 overflow-hidden rounded-lg border bg-card px-2 py-2.5"
            >
              <span
                className={`absolute inset-x-0 top-0 h-0.5 ${getItemTypeStyle(type).dotClass}`}
              />
              <span
                className={`text-[9.5px] font-bold tracking-[0.07em] uppercase ${getItemTypeStyle(type).textClass}`}
              >
                {type}
              </span>
              <span className="h-1.5 w-[85%] rounded-full bg-white/10" />
              <span className="h-1.5 w-3/5 rounded-full bg-white/10" />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
