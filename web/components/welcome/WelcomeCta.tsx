import { WelcomeActions } from "@/components/welcome/WelcomeActions";
import { WELCOME_COPY } from "@/lib/welcomeContent";

/** Bottom call-to-action panel on the Welcome page. */
export function WelcomeCta() {
  return (
    <section
      aria-labelledby="welcome-cta-title"
      className="mx-auto w-full max-w-5xl px-4 pb-12 min-w-0"
    >
      <div className="bg-sunken border border-line rounded-lg p-6 md:p-8 flex flex-col items-center text-center gap-4 min-w-0">
        <h2 id="welcome-cta-title" className="text-lg font-semibold text-ink">
          {WELCOME_COPY.ctaHeading}
        </h2>
        <p className="text-sm text-ink-muted max-w-prose">
          {WELCOME_COPY.ctaSubheading}
        </p>
        <WelcomeActions placement="cta" />
      </div>
    </section>
  );
}
