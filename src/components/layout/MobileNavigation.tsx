import React from 'react';
import {
  Sparkles,
  Calendar,
  Layers,
  ArrowLeftRight,
  Users,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileNavigation: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, swapRequests } = useApp();

  const pendingAdminSwaps = swapRequests.filter((s) => s.status === 'pending_admin').length;
  const pendingMySwaps = swapRequests.filter(
    (s) => s.targetWorkerId === currentUser.id && s.status === 'pending_target'
  ).length;
  const totalNotifications = currentUser.role === 'admin' ? pendingAdminSwaps : pendingMySwaps;

  const navItems = [
    { id: 'my_day', label: 'Mi Día', icon: Sparkles },
    { id: 'schedule', label: 'Horarios', icon: Calendar },
    { id: 'zones', label: 'Aseo', icon: Layers },
    {
      id: 'swaps',
      label: 'Cambios',
      icon: ArrowLeftRight,
      badge: totalNotifications > 0 ? totalNotifications : undefined,
    },
    ...(currentUser.role === 'admin'
      ? [
          { id: 'workers', label: 'Personal', icon: Users },
          { id: 'reports', label: 'Reportes', icon: BarChart3 },
        ]
      : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-150 min-w-[54px] ${
                isActive ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 stroke-[2.2]' : 'text-slate-400'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center w-4 h-4 text-[9px] font-extrabold text-slate-950 bg-amber-400 rounded-full animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-amber-400 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
