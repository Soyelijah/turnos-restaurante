import React, { useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  Sparkles,
  Check,
  X,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SHIFT_DEFINITIONS } from '../data/initialData';

export const SwapRequestsView: React.FC = () => {
  const {
    currentUser,
    workers,
    swapRequests,
    adminReviewSwap,
    targetRespondSwap,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'pending_admin' | 'my_swaps' | 'history'>('pending_admin');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingSwapId, setRejectingSwapId] = useState<string | null>(null);

  // Filter requests
  const pendingAdminSwaps = swapRequests.filter((s) => s.status === 'pending_admin');
  const myPendingSwaps = swapRequests.filter(
    (s) => s.requesterWorkerId === currentUser.id || s.targetWorkerId === currentUser.id
  );
  const resolvedSwaps = swapRequests.filter(
    (s) => s.status === 'approved' || s.status === 'rejected'
  );

  const getWorker = (id: string) => workers.find((w) => w.id === id);

  const handleApprove = (swapId: string) => {
    adminReviewSwap(swapId, true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSwapId) return;
    adminReviewSwap(rejectingSwapId, false, rejectReason);
    setRejectingSwapId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-amber-400" />
            Centro de Validación de Cambios de Turno
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Los intercambios entre garzones requieren acuerdo mutuo y validación previa del jefe con tiempo anticipado.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            {pendingAdminSwaps.length} pendientes por aprobar
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1 text-xs font-bold overflow-x-auto">
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveSubTab('pending_admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'pending_admin'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Por Aprobar (Administración)</span>
            {pendingAdminSwaps.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                {pendingAdminSwaps.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('my_swaps')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'my_swaps'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Mis Solicitudes & Intercambios</span>
          {myPendingSwaps.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
              {myPendingSwaps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeSubTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Resoluciones</span>
        </button>
      </div>

      {/* 1. Admin Pending Swaps Tab */}
      {activeSubTab === 'pending_admin' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Solicitudes que Requieren tu Aprobación como Encargado
          </h2>

          {pendingAdminSwaps.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-slate-200">¡Bandeja al día!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No hay solicitudes pendientes de validación administrativa en este momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingAdminSwaps.map((swap) => {
                const requester = getWorker(swap.requesterWorkerId);
                const target = getWorker(swap.targetWorkerId);
                const isUrgent = swap.advanceNoticeHours < 24;

                return (
                  <div
                    key={swap.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Aprobado por Compañero • En espera de Jefatura
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isUrgent
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          ⏰ {swap.advanceNoticeHours}h de anticipación
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Creado: {new Date(swap.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Visual Comparison of the Swap */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Requester Shift */}
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={requester?.avatar}
                            alt={requester?.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-600"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="text-[10px] text-indigo-400 font-bold uppercase">
                              Solicitante
                            </span>
                            <h4 className="text-xs font-bold text-slate-100">{requester?.name}</h4>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-700/40 text-xs">
                          <span className="text-slate-400">Turno a entregar: </span>
                          <strong className="text-amber-400">{swap.requesterShiftDate}</strong> (
                          {SHIFT_DEFINITIONS[swap.requesterShiftType]?.label})
                        </div>
                      </div>

                      {/* Target Shift */}
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={target?.avatar}
                            alt={target?.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-600"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase">
                              Compañero que asume
                            </span>
                            <h4 className="text-xs font-bold text-slate-100">{target?.name}</h4>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-700/40 text-xs">
                          <span className="text-slate-400">Turno a recibir: </span>
                          <strong className="text-emerald-400">{swap.targetShiftDate}</strong> (
                          {SHIFT_DEFINITIONS[swap.targetShiftType]?.label})
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 font-medium">Motivo informado: </span>
                      <span className="text-slate-200 italic">"{swap.reason}"</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setRejectingSwapId(swap.id)}
                        className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-all"
                      >
                        Rechazar Solicitud
                      </button>
                      <button
                        onClick={() => handleApprove(swap.id)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprobar y Ejecutar en Horario</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. My Swaps Tab */}
      {activeSubTab === 'my_swaps' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Historial de Solicitudes Personales
          </h2>

          {myPendingSwaps.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-2">
              <ArrowLeftRight className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs">No tienes intercambios activos en curso.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPendingSwaps.map((swap) => {
                const requester = getWorker(swap.requesterWorkerId);
                const target = getWorker(swap.targetWorkerId);
                const isRequester = swap.requesterWorkerId === currentUser.id;

                return (
                  <div
                    key={swap.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-200">
                          {isRequester ? `Pediste cambio a ${target?.name}` : `${requester?.name} te pidió cambio`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            swap.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : swap.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {swap.status === 'pending_target'
                            ? 'Esperando a compañero'
                            : swap.status === 'pending_admin'
                            ? 'Esperando aprobación del jefe'
                            : swap.status === 'approved'
                            ? 'Aprobado ✅'
                            : 'Rechazado ❌'}
                        </span>
                      </div>
                      <p className="text-slate-400">
                        {swap.requesterShiftDate} ⇄ {swap.targetShiftDate} • "{swap.reason}"
                      </p>
                    </div>

                    {/* If current user is the target and status is pending_target, give buttons to accept/reject */}
                    {!isRequester && swap.status === 'pending_target' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => targetRespondSwap(swap.id, true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                        >
                          Aceptar Cambio
                        </button>
                        <button
                          onClick={() => targetRespondSwap(swap.id, false)}
                          className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg font-bold"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Resolved Swaps History */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Registro Histórico de Solicitudes Evaluadas
          </h2>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                  <th className="p-3 font-bold">Fecha / ID</th>
                  <th className="p-3">Solicitante</th>
                  <th className="p-3">Compañero</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Revisado Por</th>
                  <th className="p-3">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {resolvedSwaps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Aún no hay registros de cambios resueltos.
                    </td>
                  </tr>
                ) : (
                  resolvedSwaps.map((swap) => (
                    <tr key={swap.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400 font-mono">
                        {new Date(swap.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        {getWorker(swap.requesterWorkerId)?.name}
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        {getWorker(swap.targetWorkerId)?.name}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            swap.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {swap.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{swap.reviewedBy || 'Admin'}</td>
                      <td className="p-3 text-slate-400 italic">{swap.adminNotes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingSwapId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-slate-100 mb-1">Rechazar Solicitud de Cambio</h3>
            <p className="text-xs text-slate-400 mb-3">
              Indica el motivo del rechazo para informar a los garzones.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: Turno descubierto por alta demanda en sala ese día..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingSwapId(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
