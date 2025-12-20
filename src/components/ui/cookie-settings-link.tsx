"use client";

import { useTranslation } from "react-i18next";
import { useCookieConsent } from "@/hooks/useCookieConsent";

/**
 * Cookie Settings Link Component
 * 
 * Footer link that opens the cookie preferences modal when clicked.
 * Used in the landing page footer to allow users to manage cookie preferences.
 * 
 * @returns JSX.Element - Button that opens cookie preferences modal
 */
export function CookieSettingsLink() {
  const { t } = useTranslation("cookie");
  const { openPreferences } = useCookieConsent();

  return (
    <button
      onClick={openPreferences}
      className="text-sm text-gray-600 hover:text-black transition-colors"
    >
      {t("footer.cookieSettings")}
    </button>
  );
}

