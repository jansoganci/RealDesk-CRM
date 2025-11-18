import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Download, FileText, FileDown, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {/* Export Button with Dropdown */}
      <div className="relative">
        <div className="flex">
          <Button
            variant="outline"
            onClick={() => onExport('csv')}
            disabled={loading}
            className="gap-2 whitespace-nowrap rounded-r-none"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('finance:export.exportData')}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={loading}
            className="px-2 rounded-l-none border-l-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {exportMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setExportMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <button
                  onClick={() => {
                    onExport('csv');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 text-green-600" />
                  {t('finance:export.exportCSV')}
                </button>
                <button
                  onClick={() => {
                    onExport('pdf');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  disabled={loading}
                >
                  <FileDown className="h-4 w-4 text-red-600" />
                  {t('finance:export.exportPDF')}
                </button>
                <button
                  onClick={() => {
                    onExport('excel');
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  disabled={loading}
                >
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  {t('finance:export.exportExcel')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Button */}
      <Button onClick={onAddTransaction} className="gap-2">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{t('finance:actions.addTransaction')}</span>
        <span className="sm:hidden">+</span>
      </Button>
    </div>
  );
};

