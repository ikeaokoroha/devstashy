import { UpgradeForm } from "@/components/settings/UpgradeForm";
import { ProBadge } from "@/components/shared/ProBadge";
import { PRO_PRICING } from "@/lib/home-content";
import { getItemTypeStyle } from "@/lib/item-types";
import { cn } from "@/lib/utils";

// $72/year against 12 × $8.
const UPGRADE_LABELS = {
  monthly: `Upgrade ${PRO_PRICING.monthly.amount}/month`,
  yearly: `Upgrade ${PRO_PRICING.yearly.amount}/yr (save 25%)`,
};

interface ProTypeUpgradeProps {
  typeName: string;
  label: string;
}

// Shown in place of a Pro-only type's page (/items/files, /items/images) when
// the user doesn't have Pro access. Both buttons go straight to Stripe Checkout.
export function ProTypeUpgrade({ typeName, label }: ProTypeUpgradeProps) {
  const { icon: Icon, textClass, bgClass } = getItemTypeStyle(typeName);

  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed px-6 py-16 text-center">
      <div className={cn("flex size-12 items-center justify-center rounded-lg", bgClass)}>
        <Icon className={cn("size-6", textClass)} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{label}</h1>
        <ProBadge />
      </div>
      <p className="mt-2 mb-6 max-w-sm text-muted-foreground">
        {label} are a Pro feature. Upgrade to Pro to upload and store{" "}
        {label.toLowerCase()} in DevStash.
      </p>
      <UpgradeForm labels={UPGRADE_LABELS} centered />
    </div>
  );
}
