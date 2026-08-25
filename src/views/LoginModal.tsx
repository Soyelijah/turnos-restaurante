import React, { useState } from 'react';
import {
  KeyRound,
  User,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { workers, switchUserById, currentUser, authenticate, isAuthenticated } = useApp();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticate(code, pin)) {
      setError('');
      setCode('');
      setPin('');
      onClose();
    } else {
      setError(
        import.meta.env.DEV
          ? 'Código/Usuario o PIN incorrecto. Revisa tus credenciales o usa el selector demo.'
          : 'Código/Usuario o PIN incorrecto. Revisa tus credenciales e inténtalo nuevamente.',
      );
    }
  };

  const handleQuickSelect = (workerId: string) => {
    switchUserById(workerId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {isAuthenticated && <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar acceso"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>}

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 text-white font-bold">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Acceso a GarzónTurnos</h2>
          <p className="text-xs text-slate-400">
            {import.meta.env.DEV
              ? 'Ingresa con tus credenciales privadas o cambia de perfil de prueba'
              : 'Ingresa con las credenciales asignadas por tu encargado'}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-3.5 text-xs mb-6">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Código / Usuario o Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: GZ-01 o ADMIN"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">PIN Privado (4 dígitos)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick switching and sample PINs are local-development tools only. */}
        {import.meta.env.DEV && <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Acceso Rápido de Prueba (Demo)
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {workers.map((w) => {
              const isSelected = w.id === currentUser.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleQuickSelect(w.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                      : 'bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={w.avatar}
                      alt={w.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-600 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate text-xs">
                      <span className="font-bold text-slate-100">{w.name}</span>{' '}
                      <span className="text-slate-400 font-mono text-[10px]">({w.code})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-amber-400 font-mono">PIN: {w.pin}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>}
      </div>
    </div>
  );
};
