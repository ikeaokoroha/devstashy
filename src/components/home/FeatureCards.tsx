import { HomeContainer } from "@/components/home/HomeContainer";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { FEATURES } from "@/lib/home-content";
import { getItemTypeStyle } from "@/lib/item-types";

// Staggers the cards as the grid comes into view. Static classes, since
// Tailwind only generates what it can see in full.
const REVEAL_DELAYS = [
  "",
  "delay-75",
  "delay-150",
  "delay-[50ms]",
  "delay-100",
  "delay-200",
];

export function FeatureCards() {
  return (
    <section id="features" className="scroll-mt-24 py-18 md:py-24">
      <HomeContainer>
        <SectionHeading
          title="Everything in one stash"
          subtitle="Seven item types, one search box, zero context switching."
        />

        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const { textClass, bgClass, dotClass } = getItemTypeStyle(
              feature.type,
            );
            const Icon = feature.icon;

            return (
              <Reveal
                key={feature.title}
                className={`h-full ${REVEAL_DELAYS[index]}`}
              >
                <article className="group relative h-full overflow-hidden rounded-2xl border bg-card px-6 pt-6.5 pb-7 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-white/20">
                  <span
                    className={`absolute inset-x-0 top-0 h-0.5 opacity-85 ${dotClass}`}
                  />
                  <span
                    className={`mb-4.5 grid size-10.5 place-items-center rounded-xl border border-transparent ${bgClass} ${textClass}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-[1.05rem] font-bold">{feature.title}</h3>
                  <p className="mt-2.5 text-sm text-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </HomeContainer>
    </section>
  );
}
