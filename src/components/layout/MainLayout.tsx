
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useMeetingNotifications } from '@/hooks/useMeetingNotifications';

import { COLORS } from '@/config/colors';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const MainLayout = ({ children, title }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useMeetingNotifications(); // Initialize meeting notifications

  return (
    <div className={`min-h-screen ${COLORS.background.bgGradient}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="py-4 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
