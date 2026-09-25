// Simplified brand marks for the hero's "knowledge today" panel. Lucide has no
// brand icons, and these are recognisable approximations rather than the
// official logos — a real marketing page would want licensed assets.

interface BrandIconProps {
  className?: string;
}

export function NotionIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.5 16.5v-9l7 9v-9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SlackIcon({ className }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <rect x="10.2" y="2.4" width="3.6" height="9.2" rx="1.8" />
      <rect x="10.2" y="12.4" width="3.6" height="9.2" rx="1.8" opacity=".55" />
      <rect x="2.4" y="10.2" width="9.2" height="3.6" rx="1.8" opacity=".8" />
      <rect x="12.4" y="10.2" width="9.2" height="3.6" rx="1.8" opacity=".4" />
    </svg>
  );
}

export function VsCodeIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M17.4 2.6 21 4.4v15.2l-3.6 1.8-8.5-8-4.3 3.3L3 15.5 6.1 12 3 8.5l1.6-1.2 4.3 3.3 8.5-8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M17.4 7.3v9.4L11.3 12l6.1-4.7Z" fill="currentColor" opacity=".3" />
    </svg>
  );
}
