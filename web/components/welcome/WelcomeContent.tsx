import { BoardPreview } from "@/components/welcome/BoardPreview";
import { FeaturesSection } from "@/components/welcome/FeaturesSection";
import { WelcomeCta } from "@/components/welcome/WelcomeCta";
import { WelcomeHero } from "@/components/welcome/WelcomeHero";

/** Public Server Component composing the Welcome page sections in order. */
export function WelcomeContent() {
  return (
    <div className="flex flex-col min-w-0">
      <WelcomeHero />
      <BoardPreview />
      <FeaturesSection />
      <WelcomeCta />
    </div>
  );
}
