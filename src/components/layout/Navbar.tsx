import React, { useState, useRef, useEffect } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Layers,
  ArrowLeftRight,
  Users,
  BarChart3,
  Smartphone,
  ChevronDown,
  LogOut,
  LogIn,
  KeyRound,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC<{
  onOpenLogin: () => void;
  onOpenProfile?: () => void;
}> = ({ onOpenLogin, onOpenProfile }) => {
  const {
    currentUser,
    workers,
    switchUserById,
    activeTab,
    setActiveTab,
    setIsPWAInstallOpen,
    swapRequests,
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pending swap requests that require attention
  const pendingAdminSwaps = swapRequests.filter((s) => s.status === 'pending_admin').length;
  const pendingMySwaps = swapRequests.filter(
    (s) => s.targetWorkerId === currentUser.id && s.status === 'pending_target'
  ).length;
  const totalNotifications = currentUser.role === 'admin' ? pendingAdminSwaps : pendingMySwaps;

  const navItems = [
    { id: 'my_day', label: 'Mi Día', icon: Sparkles },
    { id: 'schedule', label: 'Horarios', icon: Calendar },
    { id: 'zones', label: 'Zonas de Aseo', icon: Layers },
    {
      id: 'swaps',
      label: 'Permutas',
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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* 1. Left: Brand & Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-indigo-300 bg-clip-text text-transparent whitespace-nowrap">
                GarzónTurnos Pro
              </span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                Sala & Turnos
              </span>
            </div>
          </div>

          {/* 2. Center: Desktop Navigation Bar (Clean, single-line tabs) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="flex items-center justify-center px-1.5 py-0.2 text-[10px] font-black text-slate-950 bg-amber-400 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. Right: App Download, Quick Switcher, Profile & Login/Logout Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Install PWA Button */}
            <button
              id="install-pwa-header-btn"
              onClick={() => setIsPWAInstallOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 border border-amber-500/30 transition-colors shadow-sm whitespace-nowrap"
              title="Descargar app para celular o instalar en escritorio"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar App</span>
            </button>

            {/* Local preview tool. Never expose identity switching in production. */}
            {import.meta.env.DEV && <div className="relative flex items-center">
              <label htmlFor="quick-user-select" className="sr-only">
                Cambiar Usuario
              </label>
              <select
                id="quick-user-select"
                value={currentUser.id}
                onChange={(e) => switchUserById(e.target.value)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[125px] sm:max-w-[160px] truncate"
                title="Cambiar rápidamente de usuario para probar vistas"
              >
                <optgroup label="Administración">
                  {workers
                    .filter((w) => w.role === 'admin')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        👑 {w.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Garzones (Personal)">
                  {workers
                    .filter((w) => w.role === 'worker')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.status === 'active' ? '👤' : w.status === 'vacation' ? '🏖️' : '🏥'} {w.name} ({w.code})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>}

            {/* User Profile & Session Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                id="user-profile-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
                title="Menú de cuenta: Iniciar sesión, cambiar usuario o cerrar sesión"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-indigo-400 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-200 leading-none truncate max-w-[100px]">
                    {currentUser.name}
                  </p>
                  <span className="text-[10px] text-indigo-400 font-semibold">
                    {currentUser.role === 'admin' ? 'Encargado' : currentUser.code}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {currentUser.role === 'admin' ? '👑 Administrador' : `👤 Garzón (${currentUser.code})`}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    {onOpenProfile && (
                      <button
                        id="menu-edit-profile-btn"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                      >
                        <UserCheck className="w-4 h-4 text-indigo-400" />
                        <span>Mi Perfil & Datos</span>
                      </button>
                    )}

                    {import.meta.env.DEV && <button
                      id="menu-login-pin-btn"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                    >
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Ingresar con Código / PIN</span>
                    </button>}

                    {import.meta.env.DEV && <button
                      id="menu-logout-btn"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-left border-t border-slate-800/80 mt-1 pt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión / Cambiar</span>
                    </button>}

                    {!import.meta.env.DEV && (
                      <div className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold text-emerald-300">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sesión privada protegida</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
