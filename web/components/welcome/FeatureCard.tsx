import { Move, Search, Tag, Users } from "lucide-react";
import type { FeatureIconName, WelcomeFeature } from "@/lib/welcomeContent";

const FEATURE_ICONS: Record<FeatureIconName, typeof Move> = {
  Move,
  Tag,
  Users,
  Search,
};

interface FeatureCardProps {
  feature: WelcomeFeature;
}

/** Single feature card displayed in the Welcome page features grid. */
export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = FEATURE_ICONS[feature.icon];

  return (
    <div className="bg-surface border border-line rounded-lg p-6 flex flex-col gap-3 min-w-0">
      <div
        aria-hidden="true"
        className="size-10 rounded-md bg-primary-50 text-primary-600 inline-flex items-center justify-center shrink-0"
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-ink">{feature.title}</h3>
      <p className="text-sm text-ink-muted max-w-prose">{feature.description}</p>
    </div>
  );
}
