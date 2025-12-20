"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import type { ConsentCategories } from "@/types/cookieConsent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Cookie Preferences Modal Props
 */
interface CookiePreferencesProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Cookie Preferences Component
 * 
 * Modal dialog for managing cookie consent preferences.
 * Allows users to toggle Analytics and Marketing cookies individually.
 * Essential cookies are always active and cannot be disabled.
 * 
 * @param props - CookiePreferencesProps
 * @returns JSX.Element - Dialog component with cookie preference switches
 */
export function CookiePreferences({
  open,
  onOpenChange,
}: CookiePreferencesProps) {
  const { t } = useTranslation("cookie");
  const { consent, updateConsent, closePreferences, withdrawConsent } = useCookieConsent();

  // Local state for temporary consent values (before Save)
  const [localConsent, setLocalConsent] = useState<ConsentCategories>(consent);

  // Update local state when consent changes or modal opens
  useEffect(() => {
    if (open) {
      setLocalConsent(consent);
    }
  }, [open, consent]);

  const handleSave = () => {
    updateConsent({
      analytics: localConsent.analytics,
      marketing: localConsent.marketing,
    });
    closePreferences();
  };

  const handleCancel = () => {
    // Reset to current consent values
    setLocalConsent(consent);
    closePreferences();
  };

  const handleWithdraw = () => {
    withdrawConsent();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel();
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* 
        Note: Radix UI Dialog (used by shadcn) automatically handles:
        - Focus trap (keeps focus within modal)
        - Escape key to close
        - Focus return to trigger element on close
        - Keyboard navigation (Tab/Shift+Tab cycles through modal elements)
        No explicit focus management props needed unless custom behavior is required.
      */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("preferences.title")}</DialogTitle>
          <DialogDescription>
            {t("preferences.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Essential Cookies */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label id="essential-label" htmlFor="essential" className="font-medium text-sm">
                    {t("preferences.essential.title")}
                  </Label>
                  <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                    {t("preferences.alwaysActive")}
                  </span>
                </div>
                <p id="essential-description" className="text-xs text-muted-foreground">
                  {t("preferences.essential.description")}
                </p>
              </div>
              <Switch
                id="essential"
                aria-labelledby="essential-label"
                aria-describedby="essential-description"
                checked={true}
                disabled={true}
                className="opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label id="analytics-label" htmlFor="analytics" className="font-medium text-sm">
                  {t("preferences.analytics.title")}
                </Label>
                <p id="analytics-description" className="text-xs text-muted-foreground">
                  {t("preferences.analytics.description")}
                </p>
              </div>
              <Switch
                id="analytics"
                aria-labelledby="analytics-label"
                aria-describedby="analytics-description"
                checked={localConsent.analytics}
                onCheckedChange={(checked) =>
                  setLocalConsent((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label id="marketing-label" htmlFor="marketing" className="font-medium text-sm">
                  {t("preferences.marketing.title")}
                </Label>
                <p id="marketing-description" className="text-xs text-muted-foreground">
                  {t("preferences.marketing.description")}
                </p>
              </div>
              <Switch
                id="marketing"
                aria-labelledby="marketing-label"
                aria-describedby="marketing-description"
                checked={localConsent.marketing}
                onCheckedChange={(checked) =>
                  setLocalConsent((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Withdraw All Consent Button */}
        {(consent.analytics || consent.marketing) && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleWithdraw}
              aria-label={t("preferences.withdrawAll")}
              className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              {t("preferences.withdrawAll")}
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleCancel}>
            {t("preferences.cancel")}
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
          >
            {t("preferences.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

