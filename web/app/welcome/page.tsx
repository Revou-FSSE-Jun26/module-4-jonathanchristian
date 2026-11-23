import { WelcomeActions } from "@/components/welcome/WelcomeActions";
import { WelcomeContent } from "@/components/welcome/WelcomeContent";

/** Public welcome page shown to first-time unauthenticated visitors. */
export default function WelcomePage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 flex flex-col gap-6 min-w-0">
      <WelcomeContent />
      <WelcomeActions />
    </div>
  );
}
