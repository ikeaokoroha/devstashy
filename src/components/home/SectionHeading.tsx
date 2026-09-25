import { cn } from "cn";

import { Reveal } from "@/components/home/Reveal";

/** Centred title and subtitle above a homepage section. */
export function SectionHeading({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className={cn("mx-auto mb-12 max-w-xl text-center", className)}>
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3.5 text-muted-foreground">{subtitle}</p>
      {children}
    </Reveal>
  );
}
