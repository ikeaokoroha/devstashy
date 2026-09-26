import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "cn";

import { BillingPeriodProvider } from "@/components/home/BillingPeriodProvider";
import { BillingToggle } from "@/components/home/BillingToggle";
import { HomeContainer } from "@/components/home/HomeContainer";
import { ProPrice } from "@/components/home/ProPrice";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Button } from "@/components/ui/button";
import {
  FREE_PLAN,
  PRICING_COPY,
  PRO_PLAN,
  SIGNED_IN_PRO_HREF,
  type HomePlan,
} from "@/lib/home-content";

function PlanCard({
  plan,
  price,
  highlighted = false,
}: {
  plan: HomePlan;
  // The Free plan's price is fixed; Pro's follows the billing toggle.
  price: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-card px-7 py-8",
        highlighted &&
          "border-type-prompt/45 shadow-[0_20px_60px_color-mix(in_srgb,var(--color-type-prompt)_16%,transparent)]",
      )}
    >
      {highlighted ? (
        <span className="btn-brand absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11.5px] font-bold tracking-[0.05em] text-white uppercase">
          {PRICING_COPY.popular}
        </span>
      ) : null}

      <h3 className="text-[1.05rem] font-bold text-muted-foreground">
        {plan.name}
      </h3>

      {price}

      <ul className="my-6 grid gap-3 text-sm text-muted-foreground">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-type-link" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        variant={highlighted ? "default" : "outline"}
        nativeButton={false}
        className={cn(
          "mt-auto h-11 w-full font-semibold",
          highlighted && "btn-brand text-white",
        )}
        render={<Link href={plan.href} />}
      >
        {plan.cta}
      </Button>
    </article>
  );
}

interface PricingSectionProps {
  isSignedIn: boolean;
}

export function PricingSection({ isSignedIn }: PricingSectionProps) {
  const proPlan = isSignedIn ? { ...PRO_PLAN, href: SIGNED_IN_PRO_HREF } : PRO_PLAN;

  return (
    <section id="pricing" className="scroll-mt-24 py-18 md:py-24">
      <BillingPeriodProvider>
        <HomeContainer>
          <SectionHeading
            title={PRICING_COPY.title}
            subtitle={PRICING_COPY.subtitle}
          >
            <BillingToggle />
          </SectionHeading>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <Reveal className="h-full">
              <PlanCard
                plan={FREE_PLAN}
                price={
                  <>
                    <p className="mt-2.5 flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold tracking-tight">
                        $0
                      </span>
                      <span className="text-sm text-muted-foreground/70">
                        forever
                      </span>
                    </p>
                    <p className="mt-2 min-h-11 text-sm text-muted-foreground">
                      {FREE_PLAN.blurb}
                    </p>
                  </>
                }
              />
            </Reveal>

            <Reveal className="h-full delay-75">
              <PlanCard plan={proPlan} price={<ProPrice />} highlighted />
            </Reveal>
          </div>
        </HomeContainer>
      </BillingPeriodProvider>
    </section>
  );
}
