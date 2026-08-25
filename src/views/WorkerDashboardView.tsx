import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ArrowLeftRight,
  AlertCircle,
  Flame,
  Utensils,
  Wine,
  Sun,
  Archive,
  ChevronRight,
  Send,
  Check,
  X,
  History,
  ShieldCheck,
  Shield,
  UserCheck,
  Camera,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateToISO, getDayNameSpanish, getWeekDates } from '../utils/schedulerEngine';
import { SHIFT_DEFINITIONS } from '../data/initialData';
import { ShiftSlotType } from '../types';
import { EditProfileModal } from '../components/modals/EditProfileModal';

export const WorkerDashboardView: React.FC = () => {
  const {
    currentUser,
    workers,
    shifts,
    cleaningZones,
    tasks,
    toggleTask,
    getTasksForShift,
    swapRequests,
    createSwapRequest,
    targetRespondSwap,
    triggerConfetti,
    setActiveTab,
  } = useApp();

  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedTargetWorkerId, setSelectedTargetWorkerId] = useState('');
  const [selectedTargetDate, setSelectedTargetDate] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [swapAlertMessage, setSwapAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const todayStr = formatDateToISO(new Date());
  const todayDayName = getDayNameSpanish(new Date());

  // Find today's shift for current worker
  const todayShift = shifts.find(
    (s) => s.workerId === currentUser.id && s.date === todayStr
  );

  const todayZone = todayShift?.zoneId
    ? cleaningZones.find((z) => z.id === todayShift.zoneId)
    : undefined;

  const currentShiftTasks = todayShift ? getTasksForShift(todayShift) : [];
  const completedTasksCount = currentShiftTasks.filter((t) => t.completed).length;
  const progressPercent =
    currentShiftTasks.length > 0
      ? Math.round((completedTasksCount / currentShiftTasks.length) * 100)
      : 0;

  // Personal week shifts
  const weekDates = getWeekDates(new Date());
  const myWeekShifts = weekDates.map((date) => {
    const dStr = formatDateToISO(date);
    const shift = shifts.find((s) => s.workerId === currentUser.id && s.date === dStr);
    const zone = shift?.zoneId ? cleaningZones.find((z) => z.id === shift.zoneId) : undefined;
    return {
      date,
      dateStr: dStr,
      dayName: getDayNameSpanish(date),
      shift,
      zone,
      isSunday: date.getDay() === 0,
      isToday: dStr === todayStr,
    };
  });

  // Swaps involving this worker
  const incomingSwaps = swapRequests.filter(
    (s) => s.targetWorkerId === currentUser.id && s.status === 'pending_target'
  );
  const mySentSwaps = swapRequests.filter((s) => s.requesterWorkerId === currentUser.id);

  // Zone icon mapping
  const renderZoneIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5 text-yellow-400" />;
      case 'Wine':
        return <Wine className="w-5 h-5 text-blue-400" />;
      case 'Sun':
        return <Sun className="w-5 h-5 text-emerald-400" />;
      case 'Archive':
        return <Archive className="w-5 h-5 text-purple-400" />;
      default:
        return <Layers className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleTaskClick = (taskId: string) => {
    toggleTask(taskId, currentUser.id);
    if (completedTasksCount + 1 === currentShiftTasks.length) {
      triggerConfetti();
    }
  };

  const handleCreateSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetWorkerId || !selectedTargetDate || !swapReason) {
      setSwapAlertMessage({ type: 'error', text: 'Por favor completa todos los campos del formulario.' });
      return;
    }

    const myNextWorkingShift = shifts.find(
      (s) => s.workerId === currentUser.id && s.date >= todayStr && s.type !== 'off'
    );

    if (!myNextWorkingShift) {
      setSwapAlertMessage({ type: 'error', text: 'No tienes un turno asignado para cambiar.' });
      return;
    }

    const targetShift = shifts.find(
      (s) => s.workerId === selectedTargetWorkerId && s.date === selectedTargetDate
    );

    const result = createSwapRequest(
      currentUser.id,
      myNextWorkingShift.date,
      myNextWorkingShift.type,
      selectedTargetWorkerId,
      selectedTargetDate,
      targetShift ? targetShift.type : 'morning',
      swapReason
    );

    if (result.success) {
      setSwapAlertMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        setIsSwapModalOpen(false);
        setSwapAlertMessage(null);
        setSelectedTargetWorkerId('');
        setSelectedTargetDate('');
        setSwapReason('');
      }, 1800);
    } else {
      setSwapAlertMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/70 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Hola, {currentUser.name.split(' ')[0]}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentUser.code}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 capitalize">
                Hoy es <span className="font-semibold text-amber-400">{todayDayName}, {todayStr}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Estado: {currentUser.status === 'active' ? '🟢 En Servicio Activo' : '🟡 ' + currentUser.status}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              id="edit-profile-btn"
              onClick={() => setIsEditProfileOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all shadow-sm active:scale-95"
              title="Modificar foto de perfil, teléfono, email o PIN"
            >
              <Camera className="w-4 h-4" />
              <span>Editar Mi Perfil</span>
            </button>
            <button
              id="open-swap-request-btn"
              onClick={() => setIsSwapModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Solicitar Cambio de Turno</span>
            </button>
            <button
              id="view-full-schedule-btn"
              onClick={() => setActiveTab('schedule')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Ver Horario Completo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Incoming Swap Requests Notice (if any coworker requested a swap with current user) */}
      {incomingSwaps.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-200 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span>Tienes {incomingSwaps.length} solicitud(es) de cambio de turno pendiente(s)</span>
          </div>
          {incomingSwaps.map((swap) => {
            const requester = workers.find((w) => w.id === swap.requesterWorkerId);
            return (
              <div
                key={swap.id}
                className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-200">
                    <strong className="text-amber-400">{requester?.name}</strong> te pide cambiar su turno del{' '}
                    <span className="text-indigo-300">{swap.requesterShiftDate}</span> por tu turno del{' '}
                    <span className="text-emerald-300">{swap.targetShiftDate}</span>.
                  </p>
                  <p className="text-slate-400 mt-1 italic">"{swap.reason}"</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => targetRespondSwap(swap.id, true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aceptar</span>
                  </button>
                  <button
                    onClick={() => targetRespondSwap(swap.id, false)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid: Today's Shift & Interactive Cleaning Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Shift Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Shift Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Tu Turno de Hoy
              </h2>
              {todayShift?.isSundayRandom && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
                  🎲 Domingo Aleatorio
                </span>
              )}
            </div>

            {todayShift ? (
              todayShift.type === 'off' ? (
                <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700 text-center space-y-2">
                  <div className="text-4xl">🏖️</div>
                  <h3 className="text-base font-bold text-emerald-400">Día Libre / Descanso</h3>
                  <p className="text-xs text-slate-400">
                    Hoy no tienes turno programado. ¡Disfruta tu día de descanso!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Jornada de Trabajo</span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                        {todayShift.startTime} - {todayShift.endTime} hrs
                      </span>
                    </div>

                    {/* Guard Duty Notice for Today */}
                    {todayShift.isOnGuard && (
                      <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>🛡️ ¡Hoy estás de Guardia de Colación!</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Atiende a nuevos clientes en el salón de <strong>12:00 a 12:30</strong> mientras los demás comen. Tu colación es de <strong>12:30 a 13:00</strong>.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/50 text-xs">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Permanencia Total</span>
                        <span className="text-sm font-black text-slate-200">{todayShift.grossHours || 8.3} hrs</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-emerald-400 block font-medium">Horas Efectivas</span>
                        <span className="text-sm font-black text-emerald-400">{todayShift.effectiveHours || 7.3} hrs netas</span>
                      </div>
                    </div>

                    {/* Meal Breaks & Cortado Section */}
                    {todayShift.mealBreaks && todayShift.mealBreaks.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-amber-400" />
                            Colaciones & Pausas del Turno ({todayShift.mealBreaks.length})
                          </span>
                          <span className="text-[10px] text-slate-400 italic">No imputables a jornada</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {todayShift.mealBreaks.map((breakItem, bIdx) => {
                            const isSplitPause = breakItem.durationMinutes > 60;
                            return (
                              <div
                                key={bIdx}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                  isSplitPause
                                    ? 'bg-purple-500/15 border-purple-500/30'
                                    : 'bg-amber-500/10 border-amber-500/25'
                                }`}
                              >
                                <div>
                                  <span className={`text-[10px] font-bold block ${isSplitPause ? 'text-purple-300' : 'text-amber-300'}`}>
                                    {isSplitPause ? '⏸️ ' : '🍽️ '}
                                    {breakItem.name}
                                  </span>
                                  <span className="font-mono font-bold text-white text-xs">
                                    {breakItem.time}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  isSplitPause
                                    ? 'text-purple-200 bg-purple-500/30'
                                    : 'text-amber-400 bg-amber-500/20'
                                }`}>
                                  {breakItem.durationMinutes >= 60
                                    ? `${Math.floor(breakItem.durationMinutes / 60)}h ${breakItem.durationMinutes % 60}m`
                                    : `${breakItem.durationMinutes}m`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Designated Cleaning Zone Banner */}
                  {todayZone ? (
                    <div
                      className="p-4 rounded-xl border space-y-2"
                      style={{
                        backgroundColor: `${todayZone.color}15`,
                        borderColor: `${todayZone.color}40`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          {renderZoneIcon(todayZone.iconName)}
                          Zona de Aseo Asignada
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: todayZone.color }}
                        >
                          Prioridad #{todayZone.priority}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white">{todayZone.name}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {todayZone.description}
                      </p>
                      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-300">
                        <span>Tiempo estimado:</span>
                        <span className="font-bold text-amber-300">~{todayZone.estimatedMinutes} minutos</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 text-xs text-slate-400 text-center">
                      No hay zona de aseo específica requerida para este horario.
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 text-center text-xs text-slate-400">
                No hay turno asignado para el día de hoy.
              </div>
            )}
          </div>

          {/* Guarantee of Fair Rotation Box */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-400">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Garantía de Equidad en Turnos</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              El sistema equilibra automáticamente las zonas de aseo más pesadas (Cocina y Baños) y las más livianas (Terraza y Bodega) para que todos los garzones roten de forma justa y equitativa.
            </p>
          </div>
        </div>

        {/* Center & Right Column: Interactive Checklist for Today's Zone Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Checklist de Tareas Diarias de Aseo
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Marca cada tarea al completarla durante tu turno de servicio
                </p>
              </div>

              {currentShiftTasks.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-300">
                      {completedTasksCount} de {currentShiftTasks.length} listas
                    </span>
                    <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                    {progressPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Task Items List */}
            {todayShift?.type === 'off' ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-medium">¡Estás en día libre!</p>
                <p className="text-xs text-slate-500">No tienes tareas pendientes asignadas para hoy.</p>
              </div>
            ) : currentShiftTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-medium">No hay tareas de aseo cargadas para hoy.</p>
                <p className="text-xs text-slate-500">Consulta con tu encargado si requieres asignación manual.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentShiftTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    id={`task-item-${task.id}`}
                    onClick={() => handleTaskClick(task.id)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer active:scale-[0.99] select-none ${
                      task.completed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-100 hover:border-slate-600'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-emerald-400 shrink-0 focus:outline-none"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-medium leading-relaxed ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.completed && task.completedAt && (
                        <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Completado a las {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                      #{idx + 1}
                    </span>
                  </div>
                ))}

                {progressPercent === 100 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-center space-y-1 mt-4">
                    <p className="text-sm font-extrabold text-emerald-300 flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      ¡Excelente trabajo! Has completado todas las tareas de tu zona.
                    </p>
                    <p className="text-xs text-slate-400">
                      El registro ha quedado grabado en el reporte de cumplimiento de sala.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* This Worker's Full Weekly Schedule Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Tu Cronograma de la Semana
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Total Jornada:</span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  {Math.round(myWeekShifts.reduce((acc, curr) => acc + (curr.shift && curr.shift.type !== 'off' ? (curr.shift.effectiveHours ?? 7.3) : 0), 0) * 10) / 10} / 43.0 hrs efectivas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {myWeekShifts.map((dayItem) => {
                const isOff = !dayItem.shift || dayItem.shift.type === 'off';
                return (
                  <div
                    key={dayItem.dateStr}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col justify-between ${
                      dayItem.isToday
                        ? 'bg-indigo-950/40 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                        : isOff
                        ? 'bg-slate-800/30 border-slate-800 text-slate-500'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">
                        {dayItem.dayName.slice(0, 3)}
                      </span>
                      <span className="text-xs font-black text-white block">
                        {dayItem.date.getDate()}
                      </span>
                    </div>

                    <div className="my-2">
                      {isOff ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded block">
                            Libre
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 block">0.0h</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded block truncate text-white"
                            style={{
                              backgroundColor: dayItem.zone ? dayItem.zone.color : '#6366f1',
                            }}
                          >
                            {dayItem.zone ? `Z${dayItem.zone.priority} ${dayItem.zone.name.split(' ')[0]}` : 'Turno'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-200 block font-mono">
                            {dayItem.shift?.startTime} - {dayItem.shift?.endTime}
                          </span>
                          {dayItem.shift?.startTime === '11:00' && (dayItem.shift?.endTime === '21:00' || dayItem.shift?.endTime === '22:00') ? (
                            <span className="text-[8px] font-bold text-purple-300 bg-purple-500/20 px-1 py-0.5 rounded block border border-purple-500/30">
                              Cortado ({dayItem.shift?.effectiveHours || 7.3}h)
                            </span>
                          ) : (
                            <span className="text-[8.5px] font-bold text-emerald-400 font-mono block">
                              {dayItem.shift?.effectiveHours || 7.3}h netas
                            </span>
                          )}
                          {dayItem.shift?.mealBreaks && dayItem.shift.mealBreaks.length > 0 && (
                            <div className="text-[8px] font-mono space-y-0.5 bg-slate-900/80 p-1 rounded border border-slate-700/50">
                              {dayItem.shift.mealBreaks.map((b, bIdx) => {
                                const isSplitPause = b.durationMinutes > 60;
                                return (
                                  <div key={bIdx} className="flex items-center justify-between text-[7.5px]">
                                    <span className={isSplitPause ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                                      {isSplitPause ? '⏸️Pausa' : '🍽️Col'}
                                    </span>
                                    <span className={isSplitPause ? 'text-purple-200 font-bold' : 'text-amber-300'}>
                                      {b.time}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {dayItem.isSunday && (
                      <span className="text-[9px] text-purple-300 font-bold bg-purple-500/10 px-1 rounded block">
                        Domingo 🎲
                      </span>
                    )}

                    {dayItem.shift?.isOnGuard && (
                      <span className="text-[9px] text-amber-300 font-bold bg-amber-500/20 border border-amber-500/30 px-1 rounded block mt-0.5">
                        🛡️ Guardia
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Solicitar Cambio de Turno con Anticipación */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => {
                setIsSwapModalOpen(false);
                setSwapAlertMessage(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Solicitar Cambio de Turno</h3>
                <p className="text-xs text-slate-400">
                  Requiere aprobación previa de tu compañero y validación del jefe
                </p>
              </div>
            </div>

            {swapAlertMessage && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 ${
                  swapAlertMessage.type === 'error'
                    ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {swapAlertMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateSwap} className="space-y-4">
              {/* Target Worker Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ¿Con qué compañero deseas cambiar?
                </label>
                <select
                  required
                  value={selectedTargetWorkerId}
                  onChange={(e) => setSelectedTargetWorkerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecciona un compañero...</option>
                  {workers
                    .filter((w) => w.role === 'worker' && w.id !== currentUser.id && w.status === 'active')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Target Shift Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fecha del turno que asumirás a cambio
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={selectedTargetDate}
                  onChange={(e) => setSelectedTargetDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo de la solicitud (para revisión de jefatura)
                </label>
                <textarea
                  required
                  rows={3}
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Ej: Cambio por turno médico programado o trámite familiar..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Regla de Anticipación (48 Horas):</strong> Para evitar imprevistos a última hora, la solicitud debe enviarse con un mínimo de <strong>48 horas de anticipación</strong> para su validación mutua y administrativa.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Worker Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
};
