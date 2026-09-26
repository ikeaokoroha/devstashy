import { Check } from "lucide-react";

import { FormMessage } from "@/components/auth/FormMessage";
import { ManageBillingForm } from "@/components/settings/ManageBillingForm";
import { UpgradeForm } from "@/components/settings/UpgradeForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRO_PLAN } from "@/lib/home-content";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/usage-limits";

export type CheckoutResult = "success" | "canceled";

interface BillingCardProps {
  isPro: boolean;
  usage: { items: number; collections: number };
  // Set by Checkout's return and cancel URLs.
  checkout?: CheckoutResult;
}

const CHECKOUT_MESSAGES: Record<CheckoutResult, string> = {
  success: "You're on Pro — thanks!",
  canceled: "Checkout canceled — you haven't been charged.",
};

// id="billing" so other pages (the homepage's Go Pro) can link to /settings#billing.
export function BillingCard({ isPro, usage, checkout }: BillingCardProps) {
  return (
    <Card id="billing" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Plan
          <Badge variant={isPro ? "default" : "outline"}>{isPro ? "Pro" : "Free"}</Badge>
        </CardTitle>
        <CardDescription>
          {isPro
            ? "Unlimited items and collections, plus file and image uploads."
            : "Upgrade to Pro for unlimited items and collections, and file and image uploads."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {checkout && (
          <FormMessage variant={checkout === "success" ? "success" : "error"}>
            {CHECKOUT_MESSAGES[checkout]}
          </FormMessage>
        )}
        {isPro ? <ManageBillingForm /> : <FreePlanDetails usage={usage} />}
      </CardContent>
    </Card>
  );
}

function FreePlanDetails({ usage }: Pick<BillingCardProps, "usage">) {
  return (
    <>
      <dl className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <UsageStat label="Items" count={usage.items} limit={FREE_ITEM_LIMIT} />
        <UsageStat label="Collections" count={usage.collections} limit={FREE_COLLECTION_LIMIT} />
      </dl>
      <div className="grid gap-2">
        <p className="text-sm font-medium">Pro includes</p>
        <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
          {PRO_PLAN.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-emerald-400" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <UpgradeForm />
    </>
  );
}

interface UsageStatProps {
  label: string;
  count: number;
  limit: number;
}

function UsageStat({ label, count, limit }: UsageStatProps) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm">
        <span className={count >= limit ? "text-destructive" : undefined}>{count}</span> / {limit}
      </dd>
    </div>
  );
}
