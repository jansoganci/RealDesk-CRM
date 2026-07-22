"use client";

import { useTranslation } from "react-i18next";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie } from "lucide-react";

export default function CookieNotice() {
  const { t } = useTranslation(["cookie", "compliance"]);
  const {
    showBanner,
    acceptAll,
    rejectAll,
    openPreferences,
  } = useCookieConsent();

  if (!showBanner) return null;

  const cookiePolicyLink = "/legal/cookie-policy-en.html";
  const privacyPolicyLink = "/legal/privacy-policy-en.html";
  const cookieDisclosureLink = "/legal/cookie-disclosure-en.html";

  return (
    <>
      {/* Skip to content link for keyboard navigation */}
      <a
        href="#root"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {t("banner.skipToContent")}
      </a>
      <div 
        role="region"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
        className="fixed bottom-4 left-4 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-[562.5px] px-4 sm:px-0"
      >
        <Card className="shadow-lg rounded-2xl border bg-background text-foreground">
          <CardContent className="p-5">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <Cookie className="h-5 w-5 text-blue-600" />
                <h2 id="cookie-banner-title" className="font-semibold text-base sm:text-lg">
                  {t("banner.title")}
                </h2>
              </div>
              <p id="cookie-banner-description" className="text-sm text-muted-foreground leading-relaxed">
                {t("banner.description")}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href={cookiePolicyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t("banner.cookiePolicy")}
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href={privacyPolicyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t("banner.privacyPolicy")}
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href="/privacy"
                  className="underline text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t("compliance:page.title")}
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href={cookieDisclosureLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t("banner.privacyPolicyLink")}
                </a>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center pt-2">
                <button
                  onClick={openPreferences}
                  aria-label={t("banner.managePreferences")}
                  className="text-sm underline text-blue-600 hover:text-blue-700 transition-colors text-left sm:text-center"
                >
                  {t("banner.managePreferences")}
                </button>
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={rejectAll}
                    className="flex-1 sm:flex-none"
                  >
                    {t("banner.rejectAll")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={acceptAll}
                    className="flex-1 sm:flex-none"
                  >
                    {t("banner.acceptAll")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

