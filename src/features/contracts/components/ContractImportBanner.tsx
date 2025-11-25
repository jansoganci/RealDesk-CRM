import { Button } from '../../components/ui/button';
import { FileInput } from 'lucide-react';

/**
 * Contract Import Banner Component
 * Displays a banner promoting the contract import feature
 */

interface ContractImportBannerProps {
  onImportClick: () => void;
}

export function ContractImportBanner({ onImportClick }: ContractImportBannerProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-amber-50 border-2 border-blue-200 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <FileInput className="h-5 w-5 text-blue-600" />
            Eski Sözleşmeleri Sisteme Aktarın
          </h3>
          <p className="text-sm text-gray-600">
            PDF veya Word dosyalarınızı yükleyin, sistem otomatik olarak bilgileri çıkarsın
          </p>
        </div>
        <Button
          onClick={onImportClick}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 whitespace-nowrap"
        >
          <FileInput className="h-4 w-4 mr-2" />
          Eski Sözleşme Aktar
        </Button>
      </div>
    </div>
  );
}

