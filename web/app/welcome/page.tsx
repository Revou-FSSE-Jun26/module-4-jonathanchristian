import type { Metadata } from "next";
import { WelcomeContent } from "@/components/welcome/WelcomeContent";
import { WELCOME_COPY } from "@/lib/welcomeContent";

export const metadata: Metadata = {
  title: WELCOME_COPY.metaTitle,
  description: WELCOME_COPY.metaDescription,
};

/** Public welcome page shown to first-time unauthenticated visitors. */
export default function WelcomePage() {
  return <WelcomeContent />;
}
