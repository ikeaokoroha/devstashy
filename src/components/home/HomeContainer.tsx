import { cn } from "cn";

/** The homepage's shared page gutter and max width. */
export function HomeContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1180px] px-6", className)}>
      {children}
    </div>
  );
}
