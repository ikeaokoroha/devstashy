import Link from "next/link";

import { ChaosField } from "@/components/home/ChaosField";
import { DashboardPreview } from "@/components/home/DashboardPreview";
import { HomeContainer } from "@/components/home/HomeContainer";
import { Reveal } from "@/components/home/Reveal";
import { Button } from "@/components/ui/button";
import { HERO_COPY } from "@/lib/home-content";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-29 pb-22 md:pt-35">
      <div
        aria-hidden="true"
        className="home-glow pointer-events-none absolute -top-65 left-1/2 h-155 w-[900px] -translate-x-1/2"
      />

      <HomeContainer className="relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border bg-white/3 px-3.5 py-1.5 text-[12.5px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-type-link shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-type-link)_18%,transparent)]" />
            {HERO_COPY.eyebrow}
          </p>

          <h1 className="mt-5.5 text-[clamp(2.4rem,6vw,4rem)] leading-[1.1] font-extrabold tracking-tight">
            {HERO_COPY.title}{" "}
            <span className="brand-gradient-text block">
              {HERO_COPY.titleAccent}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            {HERO_COPY.subtitle}
          </p>

          <div className="mt-7.5 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              className="btn-brand h-12 px-6 text-[15px] font-semibold text-white"
              render={<Link href="/register" />}
            >
              {HERO_COPY.primaryCta}
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              className="h-12 px-6 text-[15px] font-semibold"
              render={<Link href="#features" />}
            >
              {HERO_COPY.secondaryCta}
            </Button>
          </div>

          <p className="mt-3.5 text-[13px] text-muted-foreground/70">
            {HERO_COPY.note}
          </p>
        </Reveal>

        <Reveal className="mt-16 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <figure className="m-0 mx-auto w-full max-w-lg rounded-2xl border bg-card p-4 shadow-2xl md:max-w-none">
            <figcaption className="mb-3 text-xs font-semibold tracking-[0.06em] text-muted-foreground/70 uppercase">
              {HERO_COPY.chaosLabel}
            </figcaption>
            <ChaosField />
          </figure>

          <div
            aria-hidden="true"
            className="arrow-pulse mx-auto w-16 text-type-prompt"
          >
            <svg viewBox="0 0 64 24" fill="none" className="w-full">
              <path
                d="M2 12h54"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray="6 7"
              />
              <path
                d="m50 4 10 8-10 8"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <figure className="m-0 mx-auto w-full max-w-lg rounded-2xl border bg-card p-4 shadow-2xl md:max-w-none">
            <figcaption className="mb-3 text-xs font-semibold tracking-[0.06em] text-muted-foreground/70 uppercase">
              {HERO_COPY.orderLabel}
            </figcaption>
            <DashboardPreview />
          </figure>
        </Reveal>
      </HomeContainer>
    </section>
  );
}
