import type { Metadata } from "next";

import { auth } from "@/auth";
import { AiSection } from "@/components/home/AiSection";
import { FeatureCards } from "@/components/home/FeatureCards";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { HomeNav } from "@/components/home/HomeNav";
import { PricingSection } from "@/components/home/PricingSection";
import { SiteFooter } from "@/components/home/SiteFooter";

export const metadata: Metadata = {
  title: "Devstashy — One home for your developer knowledge",
  description:
    "Devstashy is a fast, searchable hub for your code snippets, AI prompts, commands, notes, files and links.",
};

export default async function HomePage() {
  // Public page: the session only decides what the nav and Go Pro offer.
  const session = await auth();
  const isSignedIn = Boolean(session?.user);

  return (
    <div data-home className="flex flex-1 flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:border focus:bg-card focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <HomeNav isSignedIn={isSignedIn} />

      <main id="main" className="flex-1">
        <Hero />
        <FeatureCards />
        <AiSection />
        <PricingSection isSignedIn={isSignedIn} />
        <FinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}
