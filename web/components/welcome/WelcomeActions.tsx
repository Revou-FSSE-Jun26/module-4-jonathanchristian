"use client";

import { useRouter } from "next/navigation";
import { BaseButton } from "@/components/shared/BaseButton";
import { setWelcomeCookie } from "@/lib/authCookie";
import { WELCOME_COPY } from "@/lib/welcomeContent";

interface WelcomeActionsProps {
  placement: "hero" | "cta";
}

/** Client actions on /welcome that record the welcome cookie before navigating. */
export function WelcomeActions({ placement }: WelcomeActionsProps) {
  const router = useRouter();

  const handleNavigate = (target: "/login" | "/register") => {
    setWelcomeCookie();
    router.push(target);
  };

  if (placement === "hero") {
    return (
      <div className="w-full md:w-auto flex justify-center pt-2">
        <BaseButton
          className="w-full md:w-auto"
          onClick={() => handleNavigate(WELCOME_COPY.heroCtaTarget)}
        >
          {WELCOME_COPY.heroCtaLabel}
        </BaseButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:justify-center gap-2 w-full md:w-auto pt-2">
      <BaseButton
        className="w-full md:w-auto"
        onClick={() => handleNavigate(WELCOME_COPY.ctaPrimaryTarget)}
      >
        {WELCOME_COPY.ctaPrimaryLabel}
      </BaseButton>
      <BaseButton
        variant="secondary"
        className="w-full md:w-auto"
        onClick={() => handleNavigate(WELCOME_COPY.ctaSecondaryTarget)}
      >
        {WELCOME_COPY.ctaSecondaryLabel}
      </BaseButton>
    </div>
  );
}
