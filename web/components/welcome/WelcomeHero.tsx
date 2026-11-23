import { WelcomeActions } from "@/components/welcome/WelcomeActions";
import { WELCOME_COPY } from "@/lib/welcomeContent";

/** Hero section for the public Welcome page. */
export function WelcomeHero() {
  return (
    <section
      aria-labelledby="welcome-hero-title"
      className="mx-auto w-full max-w-3xl px-4 py-12 flex flex-col items-center text-center gap-4 min-w-0"
    >
      <span className="inline-flex items-center h-5 px-2.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
        {WELCOME_COPY.heroEyebrow}
      </span>
      <h1
        id="welcome-hero-title"
        className="text-xl md:text-2xl font-semibold text-ink"
      >
        {WELCOME_COPY.heroHeadline}
      </h1>
      <p className="text-base text-ink-muted max-w-prose">
        {WELCOME_COPY.heroSubheadline}
      </p>
      <WelcomeActions placement="hero" />
    </section>
  );
}
