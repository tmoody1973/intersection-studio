"use client";

import { useTranslations } from "next-intl";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { TARGET_NEIGHBORHOODS } from "@/lib/constants";

export function Header() {
  const t = useTranslations("dashboard");
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="border-b border-limestone/20 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-iron sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-foundry">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSelector />
          <span className="hidden text-xs text-limestone sm:block">
            {TARGET_NEIGHBORHOODS.length} {t("neighborhoods")}
          </span>
          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className="rounded-lg bg-lakeshore px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lakeshore/90 min-h-[44px]">
                {t("signIn")}
              </button>
            </SignInButton>
          )}
          {isLoaded && isSignedIn && <UserButton />}
        </div>
      </div>
    </header>
  );
}
