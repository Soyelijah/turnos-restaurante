import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Share2,
  PlusSquare,
  Download,
  CheckCircle2,
  Sparkles,
  Zap,
  Bell,
  Wifi,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const InstallPWAModal: React.FC = () => {
  const { isPWAInstallOpen, setIsPWAInstallOpen } = useApp();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');

  if (!isPWAInstallOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="close-pwa-modal"
          onClick={() => setIsPWAInstallOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Instalar App en tu Celular
            </h3>
            <p className="text-xs text-slate-400">
              Accede a tus horarios y tareas de aseo directamente desde tu pantalla de inicio
            </p>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl gap-1 mb-5 border border-slate-700">
          <button
            onClick={() => setActivePlatform('android')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activePlatform === 'android'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Android / Chrome
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activePlatform === 'ios'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            iPhone / Safari
          </button>
          <button
            onClick={() => setActivePlatform('desktop')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activePlatform === 'desktop'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Computadora
          </button>
        </div>

        {/* Instructions based on platform */}
        {activePlatform === 'android' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs text-slate-300">
                Abre esta aplicación desde tu navegador <strong className="text-amber-300">Google Chrome</strong> en tu móvil.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs text-slate-300">
                Presiona los <strong className="text-amber-300">tres puntos (⋮)</strong> en la esquina superior derecha del navegador.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs text-slate-300">
                Selecciona <strong className="text-emerald-400">"Instalar aplicación"</strong> o <strong className="text-emerald-400">"Agregar a la pantalla principal"</strong>.
              </div>
            </div>
          </div>
        )}

        {activePlatform === 'ios' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs text-slate-300">
                Abre esta página en el navegador <strong className="text-amber-300">Safari</strong> de tu iPhone o iPad.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-slate-300">
                Toca el botón <strong className="text-amber-300">Compartir</strong> (icono de cuadrado con flecha hacia arriba en la barra inferior).
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                <PlusSquare className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-slate-300">
                Desplázate hacia abajo y selecciona <strong className="text-emerald-400">"Agregar a inicio" (Add to Home Screen)</strong>.
              </div>
            </div>
          </div>
        )}

        {activePlatform === 'desktop' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                <Download className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-slate-300">
                Haz clic en el icono de instalación <strong className="text-amber-300">⊕</strong> situado en la barra de direcciones de Chrome, Edge o Brave para usarlo como aplicación independiente de escritorio.
              </div>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-left">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 text-[11px] text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Carga instantánea</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 text-[11px] text-slate-300">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Sin barras de navegador</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 text-[11px] text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Checklist interactivo táctil</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 text-[11px] text-slate-300">
            <Bell className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Alertas de cambios de turno</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsPWAInstallOpen(false)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Entendido, ¡Listo!
          </button>
        </div>
      </div>
    </div>
  );
};
