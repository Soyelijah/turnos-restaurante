import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { InstallPWAModal } from './components/layout/InstallPWAModal';
import { WorkerDashboardView } from './views/WorkerDashboardView';
import { ScheduleCalendarView } from './views/ScheduleCalendarView';
import { CleaningZonesView } from './views/CleaningZonesView';
import { SwapRequestsView } from './views/SwapRequestsView';
import { WorkersManagementView } from './views/WorkersManagementView';
import { ReportsView } from './views/ReportsView';
import { LoginModal } from './views/LoginModal';
import { EditProfileModal } from './components/modals/EditProfileModal';

const MainContent: React.FC = () => {
  const { activeTab, currentUser } = useApp();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'my_day':
        return <WorkerDashboardView />;
      case 'schedule':
        return <ScheduleCalendarView />;
      case 'zones':
        return <CleaningZonesView />;
      case 'swaps':
        return <SwapRequestsView />;
      case 'workers':
        return currentUser.role === 'admin' ? <WorkersManagementView /> : <WorkerDashboardView />;
      case 'reports':
        return currentUser.role === 'admin' ? <ReportsView /> : <WorkerDashboardView />;
      default:
        return <WorkerDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {renderActiveView()}
      </main>

      {/* Mobile Floating Bottom Bar */}
      <MobileNavigation />

      {/* Install PWA Prompt Modal */}
      <InstallPWAModal />

      {/* Login & User Switcher Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Profile & Personal Info Modal (Accessible everywhere) */}
      <EditProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
