import { Home, Building2 } from 'lucide-react';
import { COLORS } from '@/config/colors';

interface PropertyTypeSelectorProps {
  value: 'rental' | 'sale';
  onChange: (value: 'rental' | 'sale') => void;
  disabled?: boolean;
}

export const PropertyTypeSelector = ({
  value,
  onChange,
  disabled = false,
}: PropertyTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => onChange('rental')}
        disabled={disabled}
        className={`
          flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all
          ${
            value === 'rental'
              ? `${COLORS.primary.bg} text-white shadow-md`
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Home className="h-5 w-5" />
        <span>Rental</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('sale')}
        disabled={disabled}
        className={`
          flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all
          ${
            value === 'sale'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Building2 className="h-5 w-5" />
        <span>Sale</span>
      </button>
    </div>
  );
};
