"use client";

import { useRouter } from "next/navigation";
import { BaseButton } from "@/components/shared/BaseButton";
import { setWelcomeCookie } from "@/lib/authCookie";

/** Client actions on /welcome that record the welcome cookie before navigating. */
export function WelcomeActions() {
  const router = useRouter();

  const handleNavigate = (target: "/login" | "/register") => {
    setWelcomeCookie();
    router.push(target);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <BaseButton onClick={() => handleNavigate("/login")}>Log in</BaseButton>
      <BaseButton variant="secondary" onClick={() => handleNavigate("/register")}>
        Create account
      </BaseButton>
    </div>
  );
}
