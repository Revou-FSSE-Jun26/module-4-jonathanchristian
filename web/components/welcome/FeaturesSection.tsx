import { FeatureCard } from "@/components/welcome/FeatureCard";
import { FEATURES, WELCOME_COPY } from "@/lib/welcomeContent";

/** Features section introducing Kano's four core workflow areas. */
export function FeaturesSection() {
  return (
    <section
      aria-labelledby="welcome-features-title"
      className="mx-auto w-full max-w-5xl px-4 py-12 flex flex-col gap-8 min-w-0"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <h2 id="welcome-features-title" className="text-lg font-semibold text-ink">
          {WELCOME_COPY.featuresHeading}
        </h2>
        <p className="text-sm text-ink-muted max-w-prose">
          {WELCOME_COPY.featuresSubheading}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}
