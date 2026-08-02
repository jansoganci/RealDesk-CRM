import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Download, FileText, FileDown, FileSpreadsheet, ChevronDown, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CurrencySelector } from './CurrencySelector';
import { useOrg } from '@/contexts/OrgContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';

export type ExportFormat = 'csv' | 'pdf' | 'excel';

interface FinanceHeaderProps {
  onAddTransaction: () => void;
  onExport: (format: ExportFormat) => void;
  loading: boolean;
}

export const FinanceHeader = ({
  onAddTransaction,
  onExport,
  loading,
}: FinanceHeaderProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const { isMember } = useOrg();
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const AddButton = (
    <Button 
      onClick={onAddTransaction} 
      disabled={isMember}
      className="gap-1.5 md:gap-2 px-2 md:px-4 h-8 md:h-10 text-xs md:text-sm"
    >
      <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
      <span className="sm:hidden">{t('finance:actions.addTransactionShort')}</span>
      <span className="hidden sm:inline">{t('finance:actions.addTransaction')}</span>
    </Button>
  );

  return (
    <>
      <div className="flex items-center gap-2 md:gap-3">
        {/* Currency Selector */}
        <CurrencySelector />

        {/* Export Button with Dropdown */}
        <div className="relative">
          <div className="flex">
            <Button
              variant="outline"
              onClick={() => onExport('csv')}
              disabled={loading}
              className="gap-1.5 md:gap-2 whitespace-nowrap rounded-r-none px-2 md:px-4 h-8 md:h-10 text-xs md:text-sm bg-card dark:bg-muted dark:hover:bg-muted dark:text-muted-foreground dark:border-border"
            >
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="sm:hidden">{t('finance:export.exportShort')}</span>
              <span className="hidden sm:inline">{t('finance:export.exportData')}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={loading}
              className="px-1.5 md:px-2 rounded-l-none border-l-0 h-8 md:h-10 bg-card dark:bg-muted dark:hover:bg-muted dark:text-muted-foreground dark:border-border"
            >
              <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>

          {exportMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setExportMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-muted rounded-lg shadow-lg border border-border dark:border-border z-20">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onExport('csv');
                      setExportMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted dark:hover:bg-muted flex items-center gap-2"
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4 text-success" />
                    {t('finance:export.exportCSV')}
                  </button>
                  <button
                    onClick={() => {
                      onExport('pdf');
                      setExportMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted dark:hover:bg-muted flex items-center gap-2"
                    disabled={loading}
                  >
                    <FileDown className="h-4 w-4 text-destructive" />
                    {t('finance:export.exportPDF')}
                  </button>
                  <button
                    onClick={() => {
                      onExport('excel');
                      setExportMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted dark:hover:bg-muted flex items-center gap-2"
                    disabled={loading}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    {t('finance:export.exportExcel')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add Transaction Button - DESKTOP ONLY */}
        <div className="hidden md:block">
          {isMember ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-not-allowed">
                    {AddButton}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    {t('common:readOnlyMode')}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            AddButton
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      {!isMember && (
        <Button
          onClick={onAddTransaction}
          className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-105 transition-transform"
          aria-label={t('finance:actions.addTransaction')}
        >
          <Plus className="h-7 w-7" />
        </Button>
      )}
    </>
  );
};

