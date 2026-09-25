import Link from "next/link";

import { HomeContainer } from "@/components/home/HomeContainer";
import { Reveal } from "@/components/home/Reveal";
import { Button } from "@/components/ui/button";
import { FINAL_CTA } from "@/lib/home-content";

export function FinalCta() {
  return (
    <section className="pb-10">
      <HomeContainer className="max-w-2xl py-16 text-center">
        <Reveal>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {FINAL_CTA.title}
          </h2>
          <p className="mt-3.5 text-muted-foreground">{FINAL_CTA.subtitle}</p>
          <Button
            size="lg"
            nativeButton={false}
            className="btn-brand mt-7 h-12 px-6 text-[15px] font-semibold text-white"
            render={<Link href="/register" />}
          >
            {FINAL_CTA.cta}
          </Button>
        </Reveal>
      </HomeContainer>
    </section>
  );
}
