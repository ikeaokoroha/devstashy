// The sidebar's width while collapsed to icons, overriding shadcn's 3rem so the
// strip has room around its 32px buttons.
export const SIDEBAR_ICON_WIDTH = "3.5rem";

// Side padding for each sidebar section while collapsed to icons: 3.5rem less
// 2 × 0.75rem leaves exactly the 2rem an icon button takes, so it stays centred.
export const ICON_MODE_PADDING = "group-data-[collapsible=icon]:px-3";

// Vertical space between icon buttons while collapsed; the open drawer keeps
// its compact rows.
export const ICON_MODE_MENU_GAP = "group-data-[collapsible=icon]:gap-2";
