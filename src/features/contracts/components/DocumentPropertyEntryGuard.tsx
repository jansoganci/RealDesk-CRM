import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/constants';
import { isDocumentPropertyEntryBlocked } from '@/features/contracts/utils/documentJurisdiction';
import { propertiesService } from '@/lib/serviceProxy';

type GuardStatus = 'checking' | 'allowed' | 'blocked';

type DocumentPropertyEntryGuardProps = {
  children: ReactNode;
};

export function DocumentPropertyEntryGuard({ children }: DocumentPropertyEntryGuardProps) {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [status, setStatus] = useState<GuardStatus>(propertyId ? 'checking' : 'allowed');

  useEffect(() => {
    let cancelled = false;

    if (!propertyId) {
      setStatus('allowed');
      return () => {
        cancelled = true;
      };
    }

    setStatus('checking');
    void (async () => {
      try {
        const property = await propertiesService.getById(propertyId);
        if (cancelled) return;

        // V1 SCOPE: Only CA/TX/FL/NY/AZ supported for document generation.
        // Add new state codes to SUPPORTED_DOCUMENT_STATES (src/config/
        // supportedDocumentStates.ts) as legal review expands coverage — no
        // other change needed here once that list grows.
        setStatus(property && isDocumentPropertyEntryBlocked(property.state) ? 'blocked' : 'allowed');
      } catch {
        if (!cancelled) setStatus('allowed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (status === 'checking') {
    return (
      <div className="mx-auto w-full max-w-3xl py-8 text-center text-sm text-muted-foreground">
        {t('documentStateGuard.checking')}
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <div className="mx-auto w-full max-w-3xl py-8">
        <Alert variant="destructive">
          <AlertTitle>{t('documentStateGuard.title')}</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{t('documentStateGuard.message')}</p>
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.PROPERTIES)}>
              {t('documentStateGuard.backToProperties')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return children;
}
