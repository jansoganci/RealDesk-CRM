
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { useMeetingNotifications } from '@/hooks/useMeetingNotifications';
import { Button } from '../ui/button';

import { X, TestTube } from 'lucide-react';
import { COLORS } from '@/config/colors';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const MainLayout = ({ children, title }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { demoMode, exitDemoMode } = useAuth();
  const { t } = useTranslation('common');
  useMeetingNotifications(); // Initialize meeting notifications

  return (
    <div className={`min-h-screen ${COLORS.background.bgGradient}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 lg:pl-0">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t('demoMode.banner')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitDemoMode}
                className="text-white hover:bg-white/20 h-6 px-2"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">{t('demoMode.exitDemo')}</span>
              </Button>
            </div>
          </div>
        )}

        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="py-4 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
