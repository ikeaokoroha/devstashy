import { Check } from "lucide-react";

import { CodeMockup } from "@/components/home/CodeMockup";
import { HomeContainer } from "@/components/home/HomeContainer";
import { Reveal } from "@/components/home/Reveal";
import { Badge } from "@/components/ui/badge";
import { AI_CAPABILITIES, AI_SECTION } from "@/lib/home-content";

export function AiSection() {
  return (
    <section className="border-y bg-card/30 py-18 md:py-24">
      <HomeContainer className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <Badge className="mb-4.5 h-6 border-type-prompt/30 bg-type-prompt/12 px-3 text-[11.5px] font-bold tracking-[0.05em] text-type-prompt uppercase">
            {AI_SECTION.badge}
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {AI_SECTION.title}
          </h2>
          <p className="mt-3.5 text-muted-foreground">{AI_SECTION.subtitle}</p>

          <ul className="mt-7.5 grid gap-4.5">
            {AI_CAPABILITIES.map((capability) => (
              <li key={capability.title} className="flex gap-3.5 text-sm">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-type-link/30 bg-type-link/15 text-type-link">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-muted-foreground">
                  <strong className="block text-[15px] font-semibold text-foreground">
                    {capability.title}
                  </strong>
                  {capability.body}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* min-w-0: a grid item defaults to min-width:auto, so the mockup's
            longest code line would size this column and push the page wider
            than the viewport instead of letting the <pre> scroll. */}
        <Reveal className="min-w-0">
          <CodeMockup />
        </Reveal>
      </HomeContainer>
    </section>
  );
}
