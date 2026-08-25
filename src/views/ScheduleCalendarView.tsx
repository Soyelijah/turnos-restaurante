import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Printer,
  SlidersHorizontal,
  User,
  Users,
  Clock,
  Layers,
  ShieldCheck,
  Shield,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getWeekDates,
  formatDateToISO,
  getDayNameSpanish,
} from '../utils/schedulerEngine';
import { SHIFT_DEFINITIONS } from '../data/initialData';
import { Shift, ShiftSlotType } from '../types';

export const ScheduleCalendarView: React.FC = () => {
  const {
    currentUser,
    workers,
    shifts,
    cleaningZones,
    selectedWeekDate,
    setSelectedWeekDate,
    generateScheduleForWeek,
    updateShift,
    assignDayOff,
  } = useApp();

  const [filterWorkerId, setFilterWorkerId] = useState<string>('all');
  const [filterShiftType, setFilterShiftType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'day' | 'worker'>('table');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    return today === 0 ? 6 : today - 1; // 0 for Monday, 6 for Sunday
  });
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Edit Shift Form State
  const [editType, setEditType] = useState<ShiftSlotType>('regular');
  const [editZoneId, setEditZoneId] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('11:00');
  const [editEndTime, setEditEndTime] = useState<string>('21:00');
  const [editIsOnGuard, setEditIsOnGuard] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>('');

  const weekDates = getWeekDates(selectedWeekDate);
  const weekStartStr = formatDateToISO(weekDates[0]);
  const weekEndStr = formatDateToISO(weekDates[6]);

  const activeWorkers = workers.filter((w) => w.role === 'worker');
  const activeCount = activeWorkers.filter((w) => w.status === 'active').length;
  const unavailableCount = activeWorkers.length - activeCount;

  const handlePrevWeek = () => {
    const prev = new Date(selectedWeekDate);
    prev.setDate(prev.getDate() - 7);
    setSelectedWeekDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedWeekDate);
    next.setDate(next.getDate() + 7);
    setSelectedWeekDate(next);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekDate(new Date());
  };

  const openShiftEditor = (shift: Shift) => {
    if (currentUser.role !== 'admin') return;
    setEditingShift(shift);
    setEditType(shift.type);
    setEditZoneId(shift.zoneId || '');
    setEditStartTime(shift.startTime !== '-' ? shift.startTime : '11:00');
    setEditEndTime(shift.endTime !== '-' ? shift.endTime : '21:00');
    setEditIsOnGuard(!!shift.isOnGuard);
    setEditNotes(shift.notes || '');
    setIsEditModalOpen(true);
  };

  const handlePresetSelect = (preset: string) => {
    if (preset === 'mon_wed_open') {
      setEditType('regular');
      setEditStartTime('11:00');
      setEditEndTime('19:20');
    } else if (preset === 'mon_wed_close') {
      setEditType('regular');
      setEditStartTime('12:40');
      setEditEndTime('21:00');
    } else if (preset === 'mon_wed_split') {
      setEditType('regular');
      setEditStartTime('11:00');
      setEditEndTime('21:00');
    } else if (preset === 'thu_sat_open') {
      setEditType('regular');
      setEditStartTime('11:00');
      setEditEndTime('19:20');
    } else if (preset === 'thu_sat_close') {
      setEditType('regular');
      setEditStartTime('13:40');
      setEditEndTime('22:00');
    } else if (preset === 'thu_sat_split') {
      setEditType('regular');
      setEditStartTime('11:00');
      setEditEndTime('22:00');
    } else if (preset === 'sunday') {
      setEditType('regular');
      setEditStartTime('11:00');
      setEditEndTime('18:00');
    } else if (preset === 'off') {
      setEditType('off');
      setEditStartTime('-');
      setEditEndTime('-');
      setEditZoneId('');
      setEditIsOnGuard(false);
    }
  };

  const handleSaveShiftEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    const isSunday = new Date(editingShift.date + 'T00:00:00').getDay() === 0;
    const isOff = editType === 'off';

    // Calculate gross & effective hours and breaks
    let gross = 0;
    let effective = 0;
    let breaks = editingShift.mealBreaks || [];

    const lunchBreakTime = editIsOnGuard ? '12:30 - 13:00' : '12:00 - 12:30';
    const lunchBreakName = editIsOnGuard
      ? '1ª Colación Mediodía (Post-Guardia)'
      : 'Colación Mediodía (Equipo General)';

    const afternoonBreakTime = editIsOnGuard ? '18:30 - 19:00' : '18:00 - 18:30';
    const afternoonBreakName = editIsOnGuard
      ? '2ª Colación Tarde (Post-Guardia)'
      : 'Colación Tarde';

    if (!isOff) {
      if (editStartTime === '11:00' && editEndTime === '19:20') {
        gross = 8.3;
        effective = 7.3;
        breaks = [
          { name: lunchBreakName, time: lunchBreakTime, durationMinutes: 30 },
          { name: afternoonBreakName, time: afternoonBreakTime, durationMinutes: 30 },
        ];
      } else if (editStartTime === '12:40' && editEndTime === '21:00') {
        gross = 8.3;
        effective = 7.3;
        breaks = [
          { name: 'Colación Tarde', time: '14:00 - 14:30', durationMinutes: 30 },
          { name: 'Colación Cena', time: '18:30 - 19:00', durationMinutes: 30 },
        ];
      } else if (editStartTime === '13:40' && editEndTime === '22:00') {
        gross = 8.3;
        effective = 7.3;
        breaks = [
          { name: 'Colación Tarde', time: '15:30 - 16:00', durationMinutes: 30 },
          { name: 'Colación Cena', time: '19:30 - 20:00', durationMinutes: 30 },
        ];
      } else if (editStartTime === '11:00' && editEndTime === '21:00') {
        gross = 10.0;
        effective = 7.3;
        breaks = [
          { name: lunchBreakName, time: lunchBreakTime, durationMinutes: 30 },
          { name: 'Pausa Libre Intermedia (Cortado)', time: '15:30 - 17:10', durationMinutes: 100 },
          { name: 'Colación Cena', time: '19:00 - 19:30', durationMinutes: 30 },
        ];
      } else if (editStartTime === '11:00' && editEndTime === '22:00') {
        gross = 11.0;
        effective = 7.3;
        breaks = [
          { name: lunchBreakName, time: lunchBreakTime, durationMinutes: 30 },
          { name: 'Pausa Libre Intermedia (Cortado)', time: '15:30 - 18:10', durationMinutes: 160 },
          { name: 'Colación Cena', time: '19:30 - 20:00', durationMinutes: 30 },
        ];
      } else if (editStartTime === '11:00' && editEndTime === '18:00') {
        gross = 7;
        effective = 6.5;
        breaks = [
          { name: lunchBreakName, time: lunchBreakTime, durationMinutes: 30 },
        ];
      } else {
        // Custom hours
        const [sh, sm] = editStartTime.split(':').map(Number);
        const [eh, em] = editEndTime.split(':').map(Number);
        const diffHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
        gross = Math.max(0, diffHours);
        breaks = isSunday
          ? [{ name: lunchBreakName, time: lunchBreakTime, durationMinutes: 30 }]
          : [
              { name: lunchBreakName, time: lunchBreakTime, durationMinutes: 30 },
              { name: 'Colación Tarde', time: '18:00 - 18:30', durationMinutes: 30 },
            ];
        effective = Math.max(0, gross - (breaks.length * 0.5));
      }
    }

    updateShift(editingShift.id, {
      type: editType,
      startTime: isOff ? '-' : editStartTime,
      endTime: isOff ? '-' : editEndTime,
      zoneId: isOff ? undefined : editZoneId || undefined,
      notes: editNotes,
      grossHours: gross,
      effectiveHours: effective,
      mealBreaks: isOff ? [] : breaks,
      isOnGuard: isOff ? false : editIsOnGuard,
      guardTime: isOff || !editIsOnGuard ? undefined : '12:00 - 12:30',
    });

    setIsEditModalOpen(false);
    setEditingShift(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter helper logic
  const isShiftMatchingFilter = (shift: Shift | undefined, filter: string) => {
    if (filter === 'all') return true;
    const isOff = !shift || shift.type === 'off';
    if (filter === 'off' || filter === 'libres') return isOff;
    if (isOff || !shift) return false;

    if (filter === 'apertura' || filter === 'morning') {
      return shift.startTime === '11:00';
    }
    if (filter === 'cierre' || filter === 'night') {
      // Shits ending at closing time (21:00 Lun-Mié, 22:00 Jue-Sáb) or late shifts
      return (
        shift.endTime === '21:00' ||
        shift.endTime === '22:00' ||
        shift.startTime === '12:40' ||
        shift.startTime === '13:40'
      );
    }
    if (filter === 'cortado') {
      // Split shift 11:00 - 21:00 or 11:00 - 22:00 with pause
      return (
        shift.startTime === '11:00' &&
        (shift.endTime === '21:00' || shift.endTime === '22:00')
      );
    }
    if (filter === 'tarde') {
      return shift.startTime !== '11:00' && shift.startTime !== '-';
    }
    if (filter === 'guardia') {
      return !!shift.isOnGuard;
    }
    return true;
  };

  // Filtered workers list
  const displayWorkers = activeWorkers.filter((w) => {
    if (filterWorkerId !== 'all' && w.id !== filterWorkerId) return false;
    return true;
  });

  // Check if current week has any shifts generated
  const weekDatesIso = weekDates.map((d) => formatDateToISO(d));
  const weekShifts = shifts.filter((s) => weekDatesIso.includes(s.date));
  const hasShiftsThisWeek = weekShifts.length > 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Empty Week Notification Banner */}
      {!hasShiftsThisWeek && (
        <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border-2 border-dashed border-amber-500/40 rounded-2xl p-5 text-center sm:text-left sm:flex items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-start sm:items-center gap-3.5 mb-3 sm:mb-0">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 border border-amber-500/30">
              <CalendarIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                Semana sin turnos programados todavía
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {weekStartStr} al {weekEndStr}
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Esta semana aún no tiene turnos generados. Puedes generarla con 1 clic respetando la rotación equitativa, 43 hrs semanales, guardias y zonas de aseo.
              </p>
            </div>
          </div>
          {currentUser.role === 'admin' ? (
            <button
              id="empty-week-generate-btn"
              onClick={() => generateScheduleForWeek(selectedWeekDate)}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Generar Turnos para esta Semana</span>
            </button>
          ) : (
            <div className="text-xs text-amber-300/80 font-medium italic">
              El administrador aún no ha publicado los turnos para esta semana.
            </div>
          )}
        </div>
      )}

      {/* Header & Controls Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-amber-400" />
                Matriz Semanal de Horarios & Turnos
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Del <strong className="text-slate-200">{weekStartStr}</strong> al{' '}
              <strong className="text-slate-200">{weekEndStr}</strong> (Lunes a Domingo)
            </p>
          </div>

          {/* Week Selector buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="prev-week-btn"
              onClick={handlePrevWeek}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="current-week-btn"
              onClick={handleCurrentWeek}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
            >
              Esta Semana
            </button>
            <button
              id="next-week-btn"
              onClick={handleNextWeek}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Print button */}
            <button
              id="print-schedule-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
              title="Imprimir cartelera de turnos"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Admin Auto-generate trigger */}
            {currentUser.role === 'admin' && (
              <button
                id="auto-generate-schedule-btn"
                onClick={() => generateScheduleForWeek(selectedWeekDate)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Generar Turnos Automáticos</span>
              </button>
            )}
          </div>
        </div>

      {/* Schedule Policy and Break Rules Info Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wider">
                Jornada Laboral Oficial: 43 Horas Semanales & Horarios de Colación
              </h3>
              <p className="text-[11px] text-slate-400">
                Leyes laborales y política de servicio escalonado del restaurante (descuento estricto de colaciones).
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            ⚖️ Meta: 43.0 hrs / semana
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-300">Lunes a Miércoles</span>
              <span className="font-black text-white bg-blue-500/20 px-1.5 py-0.5 rounded text-[11px]">11:00 - 21:00</span>
            </div>
            <p className="text-[11px] text-slate-300">
              • <strong>Apertura / Limpieza:</strong> 11:00 a 19:20 (7.3h)
            </p>
            <p className="text-[11px] text-slate-300">
              • <strong>Cierre (Cubre 21h):</strong> 12:40 a 21:00 (7.3h)
            </p>
            <p className="text-[10px] text-amber-300/90 font-mono pt-1 border-t border-slate-800">
              🍽️ Colación: 12:00 - 12:30 ; 18:00 - 18:30
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">Jueves a Sábados</span>
              <span className="font-black text-white bg-amber-500/20 px-1.5 py-0.5 rounded text-[11px]">11:00 - 22:00</span>
            </div>
            <p className="text-[11px] text-slate-300">
              • <strong>Apertura / Limpieza:</strong> 11:00 a 19:20 (7.3h)
            </p>
            <p className="text-[11px] text-slate-300">
              • <strong>Cierre (Cubre 22h):</strong> 13:40 a 22:00 (7.3h)
            </p>
            <p className="text-[10px] text-amber-300/90 font-mono pt-1 border-t border-slate-800">
              🍽️ Colación: 12:00 - 12:30 ; 18:00 - 18:30
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300">Domingos (Sorteo)</span>
              <span className="font-black text-white bg-purple-500/20 px-1.5 py-0.5 rounded text-[11px]">11:00 - 18:00</span>
            </div>
            <p className="text-[11px] text-slate-300">
              • <strong>Salida conjunta:</strong> 11:00 a 18:00 (6.5h)
            </p>
            <p className="text-[11px] text-purple-200">
              • Sorteo aleatorio sin repetición de zonas
            </p>
            <p className="text-[10px] text-amber-300/90 font-mono pt-1 border-t border-purple-900/60">
              🍽️ Colación: 12:00 - 12:30 (1 guardia diferida)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Guardia de Colaciones
              </span>
              <span className="font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">1ª y 2ª Colación</span>
            </div>
            <p className="text-[11px] text-slate-300">
              🛡️ <strong>Lun-Vie: 1 | Sáb-Dom: 2</strong> garzones
            </p>
            <p className="text-[10px] text-amber-300/90 font-semibold">
              Atiende: 12:00-12:30 y 18:00-18:30. Colación diferida: 12:30-13:00 y 18:30-19:00.
            </p>
          </div>
        </div>
      </div>

        {/* Filters & View Mode Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Matriz Completa
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'day'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vista por Día
            </button>
            <button
              onClick={() => setViewMode('worker')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'worker'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Garzón
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Filtrar:</span>
            </div>

            <select
              id="filter-worker-select"
              value={filterWorkerId}
              onChange={(e) => setFilterWorkerId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los Garzones ({activeWorkers.length})</option>
              {activeWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>

            <select
              id="filter-shift-type-select"
              value={filterShiftType}
              onChange={(e) => setFilterShiftType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Todos los turnos</option>
              <option value="apertura">Apertura (11:00 AM)</option>
              <option value="cierre">Cierre (21:00 / 22:00 hrs)</option>
              <option value="cortado">Turno Cortado (11:00 + Pausa)</option>
              <option value="guardia">Guardia de Colación (🛡️)</option>
              <option value="off">Días Libres (🏖️)</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE: 1. TABLE MATRIX */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 text-xs">
                  <th className="p-3.5 font-bold sticky left-0 bg-slate-800 z-10 w-48 border-r border-slate-700">
                    Garzón / Trabajador
                  </th>
                  {weekDates.map((date, idx) => {
                    const isSunday = date.getDay() === 0;
                    const isSaturday = date.getDay() === 6;
                    const isToday = formatDateToISO(date) === formatDateToISO(new Date());
                    return (
                      <th
                        key={idx}
                        className={`p-3 text-center border-r border-slate-700/60 min-w-[120px] ${
                          isSunday
                            ? 'bg-purple-950/40 text-purple-200'
                            : isSaturday
                            ? 'bg-amber-950/30 text-amber-200'
                            : isToday
                            ? 'bg-indigo-950/40 text-indigo-200 font-bold'
                            : ''
                        }`}
                      >
                        <div className="font-extrabold uppercase text-[11px]">
                          {getDayNameSpanish(date)}
                        </div>
                        <div className="text-xs opacity-80 mt-0.5">
                          {date.getDate()} de {date.toLocaleString('es-ES', { month: 'short' })}
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1">
                          {isSunday ? (
                            <span className="text-[9px] font-black text-purple-300 bg-purple-500/20 px-1 py-0.5 rounded">
                              🎲 Sorteo • 🛡️ 2
                            </span>
                          ) : isSaturday ? (
                            <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded">
                              🛡️ 2 Guardias
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                              🛡️ 1 Guardia
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3 text-center bg-slate-800/90 text-slate-200 font-bold min-w-[130px]">
                    Jornada Semanal
                    <span className="block text-[10px] text-amber-400 font-semibold font-mono">Meta: 43.0h</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {displayWorkers.map((worker) => {
                  const isUnavailable = worker.status !== 'active';

                  // Calculate worker total effective hours for this week
                  let weeklyEffectiveHours = 0;
                  let daysOffCount = 0;

                  weekDates.forEach((d) => {
                    const dateIso = formatDateToISO(d);
                    const s = shifts.find((x) => x.workerId === worker.id && x.date === dateIso);
                    if (s && s.type !== 'off') {
                      weeklyEffectiveHours += s.effectiveHours ?? 7.3;
                    } else {
                      daysOffCount++;
                    }
                  });

                  weeklyEffectiveHours = Math.round(weeklyEffectiveHours * 10) / 10;
                  const hoursDiff = weeklyEffectiveHours - 43.0;
                  const isTargetMet = Math.abs(hoursDiff) <= 0.5;

                  return (
                    <tr
                      key={worker.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isUnavailable ? 'opacity-60 bg-slate-900/40' : ''
                      }`}
                    >
                      {/* Worker Info Column */}
                      <td className="p-3.5 sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={worker.avatar}
                            alt={worker.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-100 truncate text-xs">
                              {worker.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                                {worker.code}
                              </span>
                              {isUnavailable && (
                                <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1 rounded">
                                  {worker.status === 'vacation' ? 'Vacaciones' : 'Licencia'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7 Days Shift Cells */}
                      {weekDates.map((date, dayIdx) => {
                        const dateStr = formatDateToISO(date);
                        const isSunday = date.getDay() === 0;
                        const shift = shifts.find(
                          (s) => s.workerId === worker.id && s.date === dateStr
                        );
                        const isOff = !shift || shift.type === 'off';
                        const zone = shift?.zoneId
                          ? cleaningZones.find((z) => z.id === shift.zoneId)
                          : undefined;

                        // Filter check
                        const isMatch = isShiftMatchingFilter(shift, filterShiftType);
                        if (!isMatch) {
                          return (
                            <td key={dayIdx} className="p-2 text-center border-r border-slate-800/60 opacity-20">
                              <span className="text-slate-600 font-mono text-xs">-</span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={dayIdx}
                            onClick={() => {
                              if (shift) openShiftEditor(shift);
                              else if (currentUser.role === 'admin') {
                                assignDayOff(worker.id, dateStr);
                              }
                            }}
                            className={`p-2 border-r border-slate-800/60 text-center transition-all ${
                              currentUser.role === 'admin'
                                ? 'cursor-pointer hover:bg-indigo-950/30'
                                : ''
                            } ${isSunday ? 'bg-purple-950/10' : ''}`}
                          >
                            {isOff ? (
                              <div className="py-2.5 px-1.5 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-500 text-[10px] font-semibold flex flex-col items-center justify-center">
                                <span>🏖️ Libre</span>
                                <span className="text-[9px] text-slate-600 font-mono mt-0.5">0.0h</span>
                              </div>
                            ) : (
                              <div
                                className="p-2 rounded-xl border space-y-1.5 shadow-sm text-left relative group"
                                style={{
                                  backgroundColor: zone ? `${zone.color}15` : 'rgba(30, 41, 59, 0.7)',
                                  borderColor: zone ? `${zone.color}50` : '#334155',
                                }}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-black text-slate-100 font-mono tracking-tight">
                                    {shift?.startTime} - {shift?.endTime}
                                  </span>
                                  {shift?.isSundayRandom ? (
                                    <span className="text-[9px] font-extrabold text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30" title="Sorteo dominical aleatorio (6.5h)">
                                      🎲 Dom
                                    </span>
                                  ) : shift?.startTime === '11:00' && (shift?.endTime === '21:00' || shift?.endTime === '22:00') ? (
                                    <span className="text-[8px] font-extrabold text-purple-300 bg-purple-500/25 px-1 py-0.5 rounded border border-purple-500/40" title="Turno Cortado: Apertura 11:00 + Pausa Intermedia + Cierre">
                                      Cortado
                                    </span>
                                  ) : shift?.startTime === '11:00' ? (
                                    <span className="text-[8px] font-extrabold text-blue-300 bg-blue-500/20 px-1 py-0.5 rounded border border-blue-500/30" title="Apertura Corrido 11:00 (7.3h)">
                                      Corrido
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-extrabold text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/30" title="Cierre Corrido / Entrada Tarde (7.3h)">
                                      Tarde
                                    </span>
                                  )}
                                </div>

                                {shift?.isOnGuard && (
                                  <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[9px] font-black" title="Guardia en 1ª y 2ª Colación (Atiende 12:00-12:30 y 18:00-18:30 | Come diferido 12:30-13:00 y 18:30-19:00)">
                                    <Shield className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                    <span className="truncate">🛡️ Guardia Colaciones</span>
                                  </div>
                                )}

                                {/* Specific Schedule Details: Break / Split Timing */}
                                {shift?.mealBreaks && shift.mealBreaks.length > 0 && (
                                  <div className="space-y-0.5 bg-slate-900/90 p-1.5 rounded-lg border border-slate-700/60 text-[9px]">
                                    {shift.mealBreaks.map((b, bIdx) => {
                                      const isSplitPause = b.durationMinutes > 60;
                                      return (
                                        <div key={bIdx} className="flex items-center justify-between font-mono gap-1">
                                          <span className={`truncate font-medium ${isSplitPause ? 'text-purple-300 font-bold' : 'text-slate-400'}`}>
                                            {isSplitPause ? '⏸️ Cortado:' : '🍽️ Col:'}
                                          </span>
                                          <span className={`font-bold ${isSplitPause ? 'text-purple-300 bg-purple-500/20 px-1 rounded' : 'text-amber-300'}`}>
                                            {b.time}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-0.5">
                                  {zone ? (
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: zone.color }}
                                      />
                                      <span className="text-[9.5px] font-bold text-slate-200 truncate">
                                        {zone.name.split(':')[0]}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-slate-500">-</span>
                                  )}
                                  <span className="text-[9px] font-mono font-bold text-emerald-400">
                                    {shift?.effectiveHours || 7.3}h
                                  </span>
                                </div>

                                {currentUser.role === 'admin' && (
                                  <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-300 p-0.5 rounded">
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Weekly Hours Total Column */}
                      <td className="p-3 text-center bg-slate-900/60">
                        <div className="space-y-1">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black border ${
                              isTargetMet
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : weeklyEffectiveHours > 43.5
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {weeklyEffectiveHours} hrs
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {daysOffCount} {daysOffCount === 1 ? 'día libre' : 'días libres'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE: 2. DAY-BY-DAY VIEW (HIGHLY RESPONSIVE & MOBILE FRIENDLY) */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Day Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {weekDates.map((d, dIdx) => {
              const isSelected = selectedDayIndex === dIdx;
              const isToday = formatDateToISO(d) === formatDateToISO(new Date());
              const isSunday = d.getDay() === 0;
              const isSaturday = d.getDay() === 6;
              const dStr = formatDateToISO(d);
              const dayShifts = shifts.filter((s) => s.date === dStr && s.type !== 'off');
              const guardCount = dayShifts.filter((s) => s.isOnGuard).length;

              return (
                <button
                  key={dIdx}
                  onClick={() => setSelectedDayIndex(dIdx)}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {isToday && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {getDayNameSpanish(d)}
                  </div>
                  <div className="text-lg font-black mt-0.5">
                    {d.getDate()} {d.toLocaleString('es-ES', { month: 'short' })}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                    <span className={isSelected ? 'text-indigo-100' : 'text-slate-400'}>
                      {dayShifts.length} en turno
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-800 text-amber-300' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      🛡️ {guardCount} guard.
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Day Detail Card */}
          {(() => {
            const activeDate = weekDates[selectedDayIndex];
            const activeDateStr = formatDateToISO(activeDate);
            const isSunday = activeDate.getDay() === 0;
            const isSaturday = activeDate.getDay() === 6;
            const dayShifts = shifts.filter((s) => s.date === activeDateStr);
            const workingShifts = dayShifts.filter(
              (s) =>
                s.type !== 'off' &&
                isShiftMatchingFilter(s, filterShiftType) &&
                (filterWorkerId === 'all' || s.workerId === filterWorkerId)
            );
            const offShifts = dayShifts.filter(
              (s) =>
                s.type === 'off' &&
                isShiftMatchingFilter(s, filterShiftType) &&
                (filterWorkerId === 'all' || s.workerId === filterWorkerId)
            );
            const guardShifts = dayShifts.filter((s) => s.type !== 'off' && s.isOnGuard);

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white capitalize">
                        {getDayNameSpanish(activeDate)}, {activeDate.getDate()} de {activeDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                      </h2>
                      {isSunday && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          🎲 Sorteo Dominical
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Horario del restaurante: {isSunday ? '11:00 a 18:00' : isSaturday ? '11:00 a 22:00' : '11:00 a 21:00'} hrs
                    </p>
                  </div>

                  {/* Guard Duty Summary Banner */}
                  <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>
                        Guardia de Colación ({guardShifts.length} {guardShifts.length === 1 ? 'garzón' : 'garzones'}):
                      </span>
                    </div>
                    <div className="text-xs text-slate-200">
                      {guardShifts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {guardShifts.map((gs) => {
                            const w = workers.find((x) => x.id === gs.workerId);
                            return (
                              <span key={gs.id} className="px-2 py-0.5 bg-amber-500/30 text-amber-200 font-bold rounded-lg border border-amber-500/40">
                                🛡️ {w?.name} (12:00 - 12:30)
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No hay guardia asignada</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Working Garzones Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Garzones en Servicio Hoy ({workingShifts.length})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {workingShifts.map((shift) => {
                      const worker = workers.find((w) => w.id === shift.workerId);
                      const zone = shift.zoneId ? cleaningZones.find((z) => z.id === shift.zoneId) : undefined;
                      if (!worker) return null;

                      return (
                        <div
                          key={shift.id}
                          onClick={() => currentUser.role === 'admin' && openShiftEditor(shift)}
                          className={`p-4 rounded-2xl border transition-all ${
                            currentUser.role === 'admin' ? 'cursor-pointer hover:border-indigo-500' : ''
                          } bg-slate-850 border-slate-800 space-y-3`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={worker.avatar}
                                alt={worker.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 className="text-sm font-bold text-white">{worker.name}</h4>
                                <span className="text-[10px] text-slate-400 font-mono">{worker.code}</span>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                                shift.isSundayRandom
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : shift.startTime === '11:00' && (shift.endTime === '21:00' || shift.endTime === '22:00')
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : shift.startTime === '11:00'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                {shift.startTime} - {shift.endTime}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {shift.isSundayRandom
                                  ? '☀️ Domingo'
                                  : shift.startTime === '11:00' && (shift.endTime === '21:00' || shift.endTime === '22:00')
                                  ? `🔄 11:00 + Pausa & Cierre (${shift.endTime})`
                                  : shift.startTime === '11:00'
                                  ? '🌅 Apertura Corrido (11:00)'
                                  : `🌙 Cierre Corrido (${shift.endTime})`}
                              </span>
                            </div>
                          </div>

                          {/* Guard & Zone Badges */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                            {shift.isOnGuard && (
                              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-amber-300 font-bold text-[11px]">
                                <span className="flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                                  Guardia 12:00 - 12:30
                                </span>
                                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">
                                  Colación 12:30
                                </span>
                              </div>
                            )}

                            {zone ? (
                              <div
                                className="p-2.5 rounded-xl border flex items-center justify-between"
                                style={{
                                  backgroundColor: `${zone.color}15`,
                                  borderColor: `${zone.color}40`,
                                }}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: zone.color }}
                                  />
                                  <span className="font-bold text-slate-200 truncate text-xs">
                                    {zone.name}
                                  </span>
                                </div>
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white shrink-0"
                                  style={{ backgroundColor: zone.color }}
                                >
                                  P{zone.priority}
                                </span>
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg bg-slate-800 text-[11px] text-slate-400 text-center">
                                Sin zona específica
                              </div>
                            )}

                            {shift.mealBreaks && shift.mealBreaks.length > 0 && (
                              <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
                                  <span>⏰ Distribución de Horarios & Pausas</span>
                                  <span className="text-slate-500 font-normal">No imputables a jornada</span>
                                </div>
                                <div className="space-y-1">
                                  {shift.mealBreaks.map((b, bIdx) => {
                                    const isSplitPause = b.durationMinutes > 60;
                                    return (
                                      <div
                                        key={bIdx}
                                        className={`flex items-center justify-between p-1.5 rounded-lg border ${
                                          isSplitPause
                                            ? 'bg-purple-500/15 border-purple-500/30 text-purple-200'
                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span>{isSplitPause ? '⏸️' : '🍽️'}</span>
                                          <span className="font-bold">{b.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-white">{b.time}</span>
                                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                            isSplitPause ? 'bg-purple-500/30 text-purple-200' : 'bg-amber-500/20 text-amber-300'
                                          }`}>
                                            {b.durationMinutes >= 60 ? `${Math.floor(b.durationMinutes / 60)}h ${b.durationMinutes % 60}m` : `${b.durationMinutes}m`}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                              <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/80">
                                <span className="text-[10px] text-slate-400 block">Permanencia Total:</span>
                                <span className="font-mono font-bold text-slate-200">{shift.grossHours || 8.3}h</span>
                              </div>
                              <div className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/80 text-right">
                                <span className="text-[10px] text-emerald-400 block">Jornada Efectiva:</span>
                                <span className="font-mono font-bold text-emerald-400">{shift.effectiveHours || 7.3}h netas</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day Off Workers */}
                {offShifts.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span>🏖️ Personal en Día Libre / Descanso ({offShifts.length})</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {offShifts.map((s) => {
                        const w = workers.find((x) => x.id === s.workerId);
                        if (!w) return null;
                        return (
                          <div
                            key={s.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300"
                          >
                            <img
                              src={w.avatar}
                              alt={w.name}
                              className="w-5 h-5 rounded-lg object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-medium">{w.name}</span>
                            <span className="text-[10px] text-slate-400">({w.code})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW MODE: 3. WORKER CARDS VIEW */}
      {viewMode === 'worker' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayWorkers.map((w) => {
            const workerShifts = weekDates.map((d) => {
              const dStr = formatDateToISO(d);
              return {
                date: d,
                dateStr: dStr,
                dayName: getDayNameSpanish(d),
                shift: shifts.find((s) => s.workerId === w.id && s.date === dStr),
              };
            });

            const totalHours = workerShifts.reduce(
              (acc, curr) => acc + (curr.shift && curr.shift.type !== 'off' ? (curr.shift.effectiveHours ?? 8.5) : 0),
              0
            );

            const daysOff = workerShifts.filter((s) => !s.shift || s.shift.type === 'off').length;
            const guardsCount = workerShifts.filter((s) => s.shift?.isOnGuard).length;

            return (
              <div
                key={w.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={w.avatar}
                      alt={w.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-black text-white text-sm">{w.name}</h3>
                      <p className="text-[11px] text-slate-400">
                        {w.code} • Libre habitual: <strong className="text-amber-400">{w.preferredDayOff}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-400 block">{totalHours}h</span>
                    <span className="text-[10px] text-slate-400">/ 43.0h meta</span>
                  </div>
                </div>

                {/* 7 Days Mini Pills */}
                <div className="space-y-1.5 text-xs">
                  {workerShifts.map((item) => {
                    const isOff = !item.shift || item.shift.type === 'off';
                    const zone = item.shift?.zoneId
                      ? cleaningZones.find((z) => z.id === item.shift?.zoneId)
                      : undefined;

                    const isMatch = isShiftMatchingFilter(item.shift, filterShiftType);
                    return (
                      <div
                        key={item.dateStr}
                        onClick={() => item.shift && currentUser.role === 'admin' && openShiftEditor(item.shift)}
                        className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                          currentUser.role === 'admin' ? 'cursor-pointer hover:border-slate-600' : ''
                        } ${
                          isOff
                            ? 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-200'
                        } ${!isMatch ? 'opacity-25 grayscale' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[11px] w-12 text-slate-400">
                            {item.dayName.slice(0, 3)} {item.date.getDate()}
                          </span>
                          {isOff ? (
                            <span className="text-xs text-slate-500 font-medium">🏖️ Día Libre (0.0h)</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-white">{item.shift?.startTime} - {item.shift?.endTime}</span>
                                {item.shift?.startTime === '11:00' && (item.shift?.endTime === '21:00' || item.shift?.endTime === '22:00') ? (
                                  <span className="text-[8px] font-black bg-purple-500/25 text-purple-300 border border-purple-500/40 px-1 rounded">
                                    Cortado
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold text-emerald-400 font-mono">
                                    ({item.shift?.effectiveHours || 7.3}h)
                                  </span>
                                )}
                                {item.shift?.isOnGuard && (
                                  <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded">
                                    🛡️ Guardia
                                  </span>
                                )}
                              </div>
                              {item.shift?.mealBreaks && item.shift.mealBreaks.length > 0 && (
                                <div className="space-y-0.5 font-mono text-[9px]">
                                  {item.shift.mealBreaks.map((b, bIdx) => {
                                    const isSplitPause = b.durationMinutes > 60;
                                    return (
                                      <div key={bIdx} className="flex items-center gap-1">
                                        <span className={isSplitPause ? 'text-purple-300 font-bold' : 'text-amber-300'}>
                                          {isSplitPause ? '⏸️ Cortado:' : '🍽️ Col:'}
                                        </span>
                                        <span className={isSplitPause ? 'text-purple-200 bg-purple-500/20 px-1 rounded' : 'text-slate-300'}>
                                          {b.time} ({b.durationMinutes}m)
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {zone && !isOff && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white truncate max-w-[100px]"
                            style={{ backgroundColor: zone.color }}
                          >
                            {zone.name.split(':')[0]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{daysOff} días libres esta semana</span>
                  <span>🛡️ {guardsCount} guardia(s) asignadas</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend & Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cleaning Zones Legend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Jerarquía de Zonas de Aseo (De más a menos importante)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {cleaningZones.map((z) => (
              <div
                key={z.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/50"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: z.color }}
                />
                <span className="font-semibold text-slate-200 truncate">{z.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sunday Randomization and Guard Rule */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
          <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Protocolo de Guardias de Mediodía (12:00 - 12:30)
          </h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            • <strong>Lunes a Viernes:</strong> 1 garzón por día hace guardia de 12:00 a 12:30 para recibir y atender clientes nuevos mientras el resto del equipo almuerza. Al retornar el equipo (12:30), el garzón de guardia toma su colación de 12:30 a 13:00.
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            • <strong>Sábados y Domingos:</strong> 2 garzones de guardia simultáneamente de 12:00 a 12:30 para asegurar la alta afluencia del fin de semana.
          </p>
        </div>
      </div>

      {/* Admin Shift Editor Modal */}
      {isEditModalOpen && editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 mb-1">
              Editar Turno / Descanso Manual
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Fecha: <strong className="text-amber-400">{editingShift.date}</strong>
            </p>

            <form onSubmit={handleSaveShiftEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Plantillas Rápidas del Restaurante
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('mon_wed_open')}
                    className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-300 hover:bg-blue-900/50 text-[11px] font-bold text-left transition-all"
                  >
                    Lun-Mié Apertura (7.3h)
                    <span className="block text-[10px] font-normal text-slate-300">11:00 - 19:20 (2 col.)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('mon_wed_close')}
                    className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-300 hover:bg-blue-900/50 text-[11px] font-bold text-left transition-all"
                  >
                    Lun-Mié Cierre (7.3h)
                    <span className="block text-[10px] font-normal text-slate-300">12:40 - 21:00 (2 col.)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('mon_wed_split')}
                    className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 text-[11px] font-bold text-left transition-all"
                  >
                    Lun-Mié Cortado (7.3h)
                    <span className="block text-[10px] font-normal text-slate-300">11:00-21:00 (Pausa 15:30-17:10)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('thu_sat_open')}
                    className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 text-[11px] font-bold text-left transition-all"
                  >
                    Jue-Sáb Apertura (7.3h)
                    <span className="block text-[10px] font-normal text-slate-300">11:00 - 19:20 (2 col.)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('thu_sat_close')}
                    className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 text-[11px] font-bold text-left transition-all"
                  >
                    Jue-Sáb Cierre (7.3h)
                    <span className="block text-[10px] font-normal text-slate-300">13:40 - 22:00 (2 col.)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('thu_sat_split')}
                    className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 text-[11px] font-bold text-left transition-all"
                  >
                    Jue-Sáb Cortado (7.3h)
                    <span className="block text-[10px] font-normal text-slate-300">11:00-22:00 (Pausa 15:30-18:10)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('sunday')}
                    className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 text-[11px] font-bold text-left transition-all"
                  >
                    Domingos (6.5h)
                    <span className="block text-[10px] font-normal text-slate-300">11:00 - 18:00 (1 col.)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('off')}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-[11px] font-bold text-left transition-all"
                  >
                    🏖️ Día Libre (0h)
                    <span className="block text-[10px] font-normal text-slate-400">Sin turno asignado</span>
                  </button>
                </div>
              </div>

              {editType !== 'off' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Hora Inicio</label>
                      <input
                        type="time"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Hora Fin</label>
                      <input
                        type="time"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Zona de Limpieza & Aseo Asignada
                    </label>
                    <select
                      value={editZoneId}
                      onChange={(e) => setEditZoneId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5"
                    >
                      <option value="">Sin zona específica</option>
                      {cleaningZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          Prioridad #{z.priority} - {z.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Guard duty checkbox */}
                  <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                      <input
                        type="checkbox"
                        checked={editIsOnGuard}
                        onChange={(e) => setEditIsOnGuard(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-600"
                      />
                      <span>🛡️ Asignar Guardia de Colación (12:00 - 12:30)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 pl-6">
                      Atiende comensales nuevos durante el almuerzo del equipo. Su colación se programa de 12:30 a 13:00.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-slate-400 text-center text-xs">
                  Este trabajador quedará asignado con su día de descanso libre.
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ej: Cambio autorizado por jefe de sala..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
