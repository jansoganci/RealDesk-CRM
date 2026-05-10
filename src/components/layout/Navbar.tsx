import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { COLORS } from '@/config/colors';
import { AlertCenter } from '@/features/deals/components/AlertCenter';

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
}

export const Navbar = ({ title, onMenuClick }: NavbarProps) => {
  return (
    <header className={`sticky top-0 z-30 ${COLORS.card.bg} dark:bg-slate-950 border-b ${COLORS.border.DEFAULT_class} dark:border-slate-800 shadow-sm`}>
      <div className="flex items-center justify-between gap-4 px-4 h-[72px] lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className={`text-xl font-semibold ${COLORS.gray.text900} dark:text-slate-100`}>{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <AlertCenter />
        </div>
      </div>
    </header>
  );
};
