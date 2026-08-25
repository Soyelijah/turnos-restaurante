import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  MapPinned,
  ShieldCheck,
  Sparkles,
  User,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { workers, switchUserById, currentUser, authenticate, isAuthenticated } = useApp();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    if (authenticate(code, pin)) {
      setError('');
      setCode('');
      setPin('');
      setShowPin(false);
      onClose();
      return;
    }

    setError(
      import.meta.env.DEV
        ? 'No encontramos ese acceso. Revisa el código y el PIN, o usa un perfil de prueba.'
        : 'No encontramos ese acceso. Revisa el código y el PIN asignados por tu encargado.',
    );
  };

  const handleQuickSelect = (workerId: string) => {
    switchUserById(workerId);
    onClose();
  };

  return (
    <div className="login-stage fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-0 sm:p-5 lg:p-8 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative grid min-h-full w-full overflow-hidden bg-slate-950 shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:min-h-0 sm:max-w-6xl sm:rounded-[2rem] sm:border sm:border-white/10 lg:grid-cols-[1.14fr_0.86fr]"
      >
        <section className="relative isolate hidden min-h-[680px] overflow-hidden lg:flex lg:flex-col lg:justify-between" aria-label="GarzónTurnos Pro">
          <img
            src="/og.png"
            alt="Pase de cocina con comandas organizadas por estado"
            className="absolute inset-0 z-0 h-full w-full scale-105 object-cover object-[72%_center]"
          />
          <div className="absolute inset-0 z-10 bg-[linear-gradient(105deg,rgba(3,10,20,0.97)_0%,rgba(4,13,25,0.72)_48%,rgba(4,13,25,0.16)_100%)]" />
          <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.04)_48%,rgba(2,6,23,0.9)_100%)]" />

          <header className="relative z-20 flex items-center justify-between p-9 xl:p-11">
            <div className="flex items-center gap-3 text-white">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-amber-300/30 bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/30">
                <UtensilsCrossed className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-black tracking-tight">GarzónTurnos</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">Pro · Equipo de sala</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              Servicio en línea
            </div>
          </header>

          <div className="login-waiter-walk pointer-events-none absolute bottom-0 right-[-1.5rem] z-20 w-[46%] max-w-[315px]" aria-hidden="true">
            <img
              src="/assets/garzon-service.webp"
              alt=""
              className="login-waiter-body relative z-20 h-auto w-full drop-shadow-[0_28px_28px_rgba(0,0,0,0.55)]"
            />
            <span className="login-waiter-shadow absolute bottom-5 left-1/2 z-10 h-8 w-3/5 -translate-x-1/2 rounded-[50%] bg-black/60 blur-xl" />
          </div>

          <div className="relative z-20 max-w-[410px] p-9 xl:p-11">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.26em] text-amber-300">
              <span className="h-px w-8 bg-amber-400" />
              El pase empieza aquí
            </p>
            <h2 className="max-w-[390px] text-4xl font-black leading-[1.06] tracking-[-0.04em] text-white xl:text-[2.7rem]">
              Tu turno, tu zona y tu equipo en un solo lugar.
            </h2>
            <p className="mt-5 max-w-[350px] text-sm leading-6 text-slate-300">
              Entra antes del servicio para revisar tu jornada, confirmar cambios y llegar a sala con todo claro.
            </p>

            <div className="mt-8 grid max-w-[365px] grid-cols-3 gap-2">
              {[
                { icon: Clock3, label: 'Turno', value: 'Al día' },
                { icon: MapPinned, label: 'Zona', value: 'Asignada' },
                { icon: ShieldCheck, label: 'Acceso', value: 'Privado' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/55 p-3.5 backdrop-blur-md">
                  <Icon className="mb-3 h-4 w-4 text-amber-300" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-100">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="service-ticket-pane relative flex min-h-full flex-col bg-[#f5f1e8] text-slate-950 sm:min-h-[680px] lg:min-h-0">
          {isAuthenticated && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar acceso"
              className="absolute right-5 top-[13rem] z-30 grid h-10 w-10 place-items-center rounded-full border border-slate-300 bg-white/90 text-slate-500 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-950 lg:top-5"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="relative min-h-48 overflow-hidden border-b border-slate-900/10 bg-slate-950 px-6 py-5 text-white lg:hidden">
            <div className="absolute inset-0 opacity-35">
              <img src="/og.png" alt="" className="h-full w-full object-cover object-[75%_58%]" />
            </div>
            <div className="login-waiter-walk absolute -bottom-7 right-2 h-56" aria-hidden="true">
              <img
                src="/assets/garzon-service.webp"
                alt=""
                className="login-waiter-body h-full w-auto drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)]"
              />
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-slate-950">
                <UtensilsCrossed className="h-5 w-5" />
              </span>
              <div>
                <p className="font-black tracking-tight">GarzónTurnos Pro</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-300">Acceso de equipo · Sala</p>
              </div>
            </div>
            <p className="relative z-10 mt-9 max-w-[190px] text-lg font-black leading-tight tracking-tight">Tu servicio comienza aquí.</p>
          </div>

          <div className="flex flex-1 items-center px-6 py-8 sm:px-10 sm:py-10 xl:px-14">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-8">
                <div className="mb-5 flex items-center justify-between border-b border-dashed border-slate-300 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Pase de servicio</span>
                  <span className="rounded-md bg-slate-900 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-white">Acceso personal</span>
                </div>
                <p className="text-xs font-bold text-slate-500">Bienvenido al turno</p>
                <h1 id="login-title" className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
                  Entra a tu jornada
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Usa el código y PIN que te entregó tu encargado de sala.
                </p>
              </div>

              {error && (
                <div role="alert" aria-live="polite" className="mb-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold leading-5 text-rose-800">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-identifier" className="mb-2 block text-xs font-black text-slate-700">
                    Código de garzón o correo
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Ej. GZ-01 o ADMIN"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-pin" className="mb-2 block text-xs font-black text-slate-700">
                    PIN de acceso
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-pin"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      autoComplete="current-password"
                      maxLength={6}
                      required
                      value={pin}
                      onChange={(event) => setPin(event.target.value)}
                      placeholder="••••"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 font-mono text-sm font-bold tracking-[0.28em] text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((visible) => !visible)}
                      aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                      aria-pressed={showPin}
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-black text-slate-950 shadow-[0_8px_24px_rgba(217,119,6,0.24)] transition hover:bg-amber-300 active:scale-[0.99]"
                >
                  Entrar a mi turno
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>

              <div className="mt-6 flex items-start gap-2.5 border-t border-dashed border-slate-300 pt-5 text-[11px] leading-5 text-slate-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p>Tu sesión queda guardada solo en este equipo. Cierra sesión al terminar el servicio.</p>
              </div>

              {import.meta.env.DEV && (
                <details className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs">
                  <summary className="flex cursor-pointer list-none items-center gap-2 font-black text-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    Perfiles de prueba
                  </summary>
                  <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                    {workers.map((worker) => {
                      const isSelected = worker.id === currentUser.id;

                      return (
                        <button
                          key={worker.id}
                          type="button"
                          onClick={() => handleQuickSelect(worker.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-indigo-100 bg-white p-2 text-left text-slate-700 transition hover:border-indigo-300"
                        >
                          <span className="min-w-0 truncate font-bold">
                            {worker.name} <span className="font-mono text-[10px] font-normal text-slate-500">({worker.code})</span>
                          </span>
                          <span className="ml-2 flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-amber-700">
                            PIN {worker.pin}
                            {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
