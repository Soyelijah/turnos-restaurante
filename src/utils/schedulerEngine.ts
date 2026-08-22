import { Worker, CleaningZone, Shift, FairnessMetric } from '../types';
import {
  WEEKLY_LEGAL_HOURS_TARGET,
  getScheduleForDayOfWeek,
  SHIFT_SCHEDULE_CONFIG,
  MEAL_BREAKS_REGULAR_TWO,
  MEAL_BREAKS_GUARD_TWO,
  MEAL_BREAKS_REGULAR_SUNDAY,
  MEAL_BREAKS_GUARD_SUNDAY,
} from '../data/initialData';

// Helper to get dates for a given Monday-based week
export function getWeekDates(baseDate: Date): Date[] {
  const date = new Date(baseDate);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    week.push(nextDate);
  }
  return week;
}

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayNameSpanish(d: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[d.getDay()];
}

/**
 * Returns formatted meal break intervals string e.g. "12:00 - 12:30 ; 18:00 - 18:30"
 */
export function formatMealBreaksString(breaks?: { time: string }[]): string {
  if (!breaks || breaks.length === 0) return '';
  return breaks.map((b) => b.time).join(' ; ');
}

/**
 * Intelligent Fair Shift Generation Engine for Restaurant Waitstaff (Garzones)
 * Rules:
 * - Legal Limit: EXACTLY 43 hours per week per worker (excluding meal breaks).
 * - Operating Hours:
 *   * Lunes a Miércoles: 11:00 am - 21:00 hrs (Apertura 11:00-19:20 [7.3h] / Cierre 12:40-21:00 [7.3h] con 1h colación)
 *   * Jueves a Sábados: 11:00 am - 22:00 hrs (Apertura 11:00-19:20 [7.3h] / Cierre 13:40-22:00 [7.3h] con 1h colación)
 *   * Domingos: 11:00 am - 18:00 hrs (Entrada y salida conjunta 11:00 a 18:00, 6.5h efectivas, 30 min colación)
 *   * Total semanal: 5 turnos de 7.3h + 1 domingo de 6.5h = 43.0h efectivas trabajadas aparte de la colación
 * - Guardias de Colación (Lunch Guard Duty):
 *   * Lunes a Viernes: EXACTAMENTE 1 trabajador de guardia (12:00 - 12:30 atiende nuevos clientes, colación 12:30 - 13:00)
 *   * Sábados y Domingos: EXACTAMENTE 2 trabajadores de guardia (12:00 - 12:30 atienden nuevos clientes, colación 12:30 - 13:00)
 * - Rest Days:
 *   * 1 día libre por trabajador asegurando exactamente 43 horas semanales
 *   * Scheduled primarily Monday to Friday to maintain high weekend staffing
 * - Sunday Assignment:
 *   * Random cleaning zone distribution with ANTI-REPETITION check against previous Sundays
 * - Active Workers Only:
 *   * Automatically excludes workers on vacation, medical leave, or resigned
 */
export function generateWeeklySchedule(
  allWorkers: Worker[],
  zones: CleaningZone[],
  weekStartDate: Date,
  existingShifts: Shift[] = []
): Shift[] {
  const garzones = allWorkers.filter((w) => w.role === 'worker');
  const activeWorkers = garzones.filter((w) => w.status === 'active');
  const inactiveWorkers = garzones.filter((w) => w.status !== 'active');

  if (garzones.length === 0) return [];

  const weekDates = getWeekDates(weekStartDate);
  const sortedZones = [...zones].sort((a, b) => a.priority - b.priority);
  const newShifts: Shift[] = [];

  // Track past Sunday assignments per worker for anti-repetition constraint
  const workerSundayZoneHistory = new Map<string, string[]>();
  for (const shift of existingShifts) {
    if (shift.isSundayRandom && shift.zoneId) {
      const hist = workerSundayZoneHistory.get(shift.workerId) || [];
      hist.push(shift.zoneId);
      workerSundayZoneHistory.set(shift.workerId, hist);
    }
  }

  // 1. Assign 7 days of OFF / Vacation / Leave for inactive workers (e.g. Ally S.)
  inactiveWorkers.forEach((worker) => {
    weekDates.forEach((date) => {
      const dateStr = formatDateToISO(date);
      const isVacation = worker.status === 'vacation';
      newShifts.push({
        id: `shift-${dateStr}-${worker.id}`,
        date: dateStr,
        workerId: worker.id,
        type: 'off',
        startTime: '-',
        endTime: '-',
        grossHours: 0,
        effectiveHours: 0,
        mealBreaks: [],
        isSundayRandom: false,
        isManuallyAssigned: false,
        isOnGuard: false,
        notes: isVacation
          ? '🏖️ En período de vacaciones anuales autorizadas'
          : '🩺 En período de licencia médica',
      });
    });
  });

  // 2. Map designated rest day per active worker (STRICTLY Monday to Friday: 1=Mon..5=Fri)
  // Rule: 1 day off per week per worker, only Mon-Fri.
  // Full team (>= 9 active): 2 resting workers per day Mon-Fri.
  // Reduced team (< 9 active): 1 resting worker per day Mon-Fri.
  const workerDaysOff = new Map<string, number[]>(); // workerId -> [dayIndex]
  const isFullTeam = activeWorkers.length >= 9;

  // Track how many workers are assigned to each Mon-Fri day (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri)
  const dayOffCounts = [0, 0, 0, 0, 0];

  activeWorkers.forEach((worker, idx) => {
    let restDayIndex: number;

    if (worker.preferredRestDay !== undefined && worker.preferredRestDay >= 1 && worker.preferredRestDay <= 5) {
      // Admin manually designated a Mon-Fri rest day
      restDayIndex = worker.preferredRestDay - 1;
    } else {
      // Auto-distribution across Mon-Fri
      if (isFullTeam) {
        // Distribute 2 per day across 5 days (0..4)
        restDayIndex = Math.floor(idx / 2) % 5;
      } else {
        // Distribute 1 per day across 5 days (0..4)
        restDayIndex = idx % 5;
      }
    }

    // Clamp strictly to Monday (0) through Friday (4) - Saturday (5) and Sunday (6) NEVER have rest days
    restDayIndex = Math.max(0, Math.min(4, restDayIndex));
    dayOffCounts[restDayIndex]++;

    workerDaysOff.set(worker.id, [restDayIndex]);
  });

  // Track accumulated weekly hours per worker
  const workerAccumulatedHours = new Map<string, number>();
  activeWorkers.forEach((w) => workerAccumulatedHours.set(w.id, 0));

  // Track guard duty assignments per worker to ensure fair rotation
  const workerGuardCount = new Map<string, number>();
  activeWorkers.forEach((w) => workerGuardCount.set(w.id, 0));

  // Loop through 7 days of the week (0 = Monday, ..., 6 = Sunday)
  weekDates.forEach((date, dayIndex) => {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isWeekend = isSunday || isSaturday;
    const dateStr = formatDateToISO(date);

    // Identify working vs resting workers for today
    const workingWorkersToday: Worker[] = [];
    const restingWorkersToday: Worker[] = [];

    activeWorkers.forEach((worker) => {
      const restDays = workerDaysOff.get(worker.id) || [];
      if (restDays.includes(dayIndex)) {
        restingWorkersToday.push(worker);
      } else {
        workingWorkersToday.push(worker);
      }
    });

    // 1. Assign "OFF" shifts for resting workers on their strict rest day
    restingWorkersToday.forEach((worker) => {
      newShifts.push({
        id: `shift-${dateStr}-${worker.id}`,
        date: dateStr,
        workerId: worker.id,
        type: 'off',
        startTime: '-',
        endTime: '-',
        grossHours: 0,
        effectiveHours: 0,
        mealBreaks: [],
        isSundayRandom: false,
        isManuallyAssigned: false,
        isOnGuard: false,
        notes: `Día de descanso asignado (${getDayNameSpanish(date)})`,
      });
    });

    // 2. Determine guard workers for today:
    // Mon-Fri: 1 guard worker
    // Sat-Sun: 2 guard workers
    const guardsNeeded = isWeekend ? 2 : 1;

    // Pick working workers with lowest guard count
    const candidateGuardWorkers = [...workingWorkersToday].sort((a, b) => {
      const countA = workerGuardCount.get(a.id) || 0;
      const countB = workerGuardCount.get(b.id) || 0;
      if (countA !== countB) return countA - countB;
      // Rotation tie-breaker
      return ((dayIndex * 3 + activeWorkers.indexOf(a)) % activeWorkers.length) -
             ((dayIndex * 3 + activeWorkers.indexOf(b)) % activeWorkers.length);
    });

    const guardWorkerIds = new Set<string>(
      candidateGuardWorkers.slice(0, guardsNeeded).map((w) => w.id)
    );

    // Update guard counts
    guardWorkerIds.forEach((id) => {
      const current = workerGuardCount.get(id) || 0;
      workerGuardCount.set(id, current + 1);
    });

    if (isSunday) {
      // ==========================================
      // DOMINGO: ALEATORIO CON ANTI-REPETICIÓN + 2 GUARDIAS (6.5h efectivas)
      // ==========================================
      const sundaySchedule = SHIFT_SCHEDULE_CONFIG.sunday;
      const shuffledWorkers = [...workingWorkersToday].sort(() => Math.random() - 0.5);
      const availableZoneIds = sortedZones.map((z) => z.id);
      const assignedZonesToday = new Set<string>();

      shuffledWorkers.forEach((worker) => {
        const pastSundayZones = workerSundayZoneHistory.get(worker.id) || [];
        const lastSundayZone = pastSundayZones[pastSundayZones.length - 1];

        let eligibleZones = availableZoneIds.filter(
          (zId) => !assignedZonesToday.has(zId) && zId !== lastSundayZone
        );

        if (eligibleZones.length === 0) {
          eligibleZones = availableZoneIds.filter((zId) => !assignedZonesToday.has(zId));
        }
        if (eligibleZones.length === 0) {
          eligibleZones = availableZoneIds;
        }

        const randomIndex = Math.floor(Math.random() * eligibleZones.length);
        const selectedZoneId = eligibleZones[randomIndex];

        if (selectedZoneId) {
          assignedZonesToday.add(selectedZoneId);
          const hist = workerSundayZoneHistory.get(worker.id) || [];
          hist.push(selectedZoneId);
          workerSundayZoneHistory.set(worker.id, hist);
        }

        const currentHours = workerAccumulatedHours.get(worker.id) || 0;
        workerAccumulatedHours.set(worker.id, currentHours + sundaySchedule.effectiveHours);

        const isGuard = guardWorkerIds.has(worker.id);
        const mealBreaks = isGuard ? MEAL_BREAKS_GUARD_SUNDAY : MEAL_BREAKS_REGULAR_SUNDAY;
        const guardNote = isGuard
          ? ' • 🛡️ Guardia de Colación (12:00-12:30 atiende nuevos clientes | 12:30-13:00 colación diferida)'
          : '';

        newShifts.push({
          id: `shift-${dateStr}-${worker.id}`,
          date: dateStr,
          workerId: worker.id,
          type: 'regular',
          startTime: sundaySchedule.startTime,
          endTime: sundaySchedule.endTime,
          grossHours: sundaySchedule.grossHours,
          effectiveHours: sundaySchedule.effectiveHours,
          mealBreaks,
          zoneId: selectedZoneId,
          isSundayRandom: true,
          isManuallyAssigned: false,
          isOnGuard: isGuard,
          guardTime: isGuard ? '12:00 - 12:30' : undefined,
          notes: `Turno Domingo (11:00-18:00, 6.5h efectivas) - Salida conjunta 18:00 - Sorteo de zona sin repetición${guardNote}`,
        });
      });
    } else {
      // ==========================================
      // LUNES A SÁBADO: REGLA INTELIGENTE SEGÚN DOTACIÓN DIARIA (7.3h efectivas)
      //
      // 1. REGLA DE 4 TRABAJADORES (O MENOS):
      //    - Es indispensable mínimo 4 personas para la limpieza de zonas a las 11:00 AM.
      //    - TODOS (los 4) entran a las 11:00 AM para limpiar sus zonas y cubrir almuerzos.
      //    - 2 hacen Apertura Corrido (11:00 - 19:20, 7.3h netas, 1h colación).
      //    - 2 hacen Apertura con Pausa Intermedia & Cierre (11:00 - 21:00 Lun-Mié / 11:00 - 22:00 Jue-Sáb):
      //      Toman su pausa libre intermedia en la tarde (horas de bajo flujo) y cubren el cierre oficial (7.3h netas).
      //
      // 2. REGLA DE 5 O MÁS TRABAJADORES:
      //    - Se asignan exactamente 4 trabajadores a las 11:00 AM (Apertura Corrido 11:00 - 19:20, 7.3h netas)
      //      para garantizar el mínimo requerido de limpieza.
      //    - Los trabajadores adicionales (5to en adelante) se asignan AUTOMÁTICAMENTE a entrar más tarde de corrido:
      //      * Lun-Mié: Turno Cierre Corrido (12:40 - 21:00, 7.3h netas)
      //      * Jue-Sáb: Turno Cierre Corrido (13:40 - 22:00, 7.3h netas)
      //    - Rotación equitativa día a día entre todo el equipo.
      // ==========================================
      const totalWorkingToday = workingWorkersToday.length;
      const isFourWorkersOrLess = totalWorkingToday <= 4;

      // Determinamos quiénes entran a las 11:00 AM
      // Si <= 4: todos los 4 entran a las 11:00 AM
      // Si >= 5: exactamente 4 entran a las 11:00 AM
      const openingCrewLimit = isFourWorkersOrLess ? totalWorkingToday : 4;

      // Las 4 zonas prioritarias de la semana (Prioridad 1 a 4: Salón 2, Salón 1, Baños, Pasillos)
      // Siempre son cubiertas obligatoriamente por los 4 trabajadores que ingresan a las 11:00 AM
      const priorityZones = sortedZones.slice(0, 4);
      const secondaryZones = sortedZones.slice(4);

      // Trabajadores que entran a las 11:00 AM hoy
      const openingWorkersList = workingWorkersToday.filter((_, wIdx) => {
        const rotIdx = (wIdx + dayIndex) % totalWorkingToday;
        return rotIdx < openingCrewLimit;
      });

      // Asignar guardias de colación (12:00 - 12:30) exclusivamente a trabajadores que entran a las 11:00 AM
      const sortedOpeningForGuard = [...openingWorkersList].sort((a, b) => {
        const countA = workerGuardCount.get(a.id) || 0;
        const countB = workerGuardCount.get(b.id) || 0;
        return countA - countB;
      });
      const todayGuardIds = new Set<string>(
        sortedOpeningForGuard.slice(0, isWeekend ? 2 : 1).map((w) => w.id)
      );

      workingWorkersToday.forEach((worker, workerIdx) => {
        const rotIdx = (workerIdx + dayIndex) % totalWorkingToday;
        const isOpeningCrew = rotIdx < openingCrewLimit;

        // ASIGNACIÓN ESTRICTA DE ZONAS PRIORITARIAS:
        // Los 4 trabajadores que entran a las 11:00 AM reciben inequívocamente las 4 zonas prioritarias (1..4)
        // rotadas equitativamente entre ellos día a día.
        // Si hay un 5to o 6to trabajador en el día, se les asignan las zonas secundarias o de apoyo.
        let assignedZone: CleaningZone;
        if (isOpeningCrew) {
          const openingWorkerPosition = openingWorkersList.findIndex((w) => w.id === worker.id);
          const priorityZoneIdx = (openingWorkerPosition >= 0 ? openingWorkerPosition + dayIndex : workerIdx) % priorityZones.length;
          assignedZone = priorityZones[priorityZoneIdx] || sortedZones[0];
        } else {
          const lateIndex = rotIdx - openingCrewLimit;
          const secZoneIdx = secondaryZones.length > 0 ? lateIndex % secondaryZones.length : 0;
          assignedZone = secondaryZones[secZoneIdx] || sortedZones[workerIdx % sortedZones.length];
        }

        let scheduleConfig = SHIFT_SCHEDULE_CONFIG.mon_wed_open;
        let shiftNotes = '';
        let shiftCategory: 'open_straight' | 'open_split_close' | 'late_close' = 'open_straight';

        if (isFourWorkersOrLess) {
          // ==========================================
          // CASO 4 TRABAJADORES: Todos entran 11:00 am
          // rotIdx 0..1 => Apertura Corrido (11:00 - 19:20)
          // rotIdx 2..3 => Apertura 11:00 + Pausa Intermedia & Cierre (11:00 - 21:00/22:00)
          // ==========================================
          const isSplitCloser = rotIdx >= 2;

          if (dayOfWeek >= 1 && dayOfWeek <= 3) {
            // Lunes a Miércoles
            if (isSplitCloser) {
              scheduleConfig = SHIFT_SCHEDULE_CONFIG.mon_wed_split;
              shiftNotes = 'Turno Apertura 11:00 con Pausa Intermedia & Cierre 21:00 (11:00 a 21:00 | Limpieza 11:00 + Pausa 15:30-17:10 | 7.3h netas)';
              shiftCategory = 'open_split_close';
            } else {
              scheduleConfig = SHIFT_SCHEDULE_CONFIG.mon_wed_open;
              shiftNotes = 'Turno Apertura Corrido (11:00 a 19:20 | Limpieza 11:00 + Salida 19:20 | 7.3h netas)';
              shiftCategory = 'open_straight';
            }
          } else {
            // Jueves a Sábados
            if (isSplitCloser) {
              scheduleConfig = SHIFT_SCHEDULE_CONFIG.thu_sat_split;
              shiftNotes = 'Turno Apertura 11:00 con Pausa Intermedia & Cierre 22:00 (11:00 a 22:00 | Limpieza 11:00 + Pausa 15:30-18:10 | 7.3h netas)';
              shiftCategory = 'open_split_close';
            } else {
              scheduleConfig = SHIFT_SCHEDULE_CONFIG.thu_sat_open;
              shiftNotes = 'Turno Apertura Corrido (11:00 a 19:20 | Limpieza 11:00 + Salida 19:20 | 7.3h netas)';
              shiftCategory = 'open_straight';
            }
          }
        } else {
          // ==========================================
          // CASO 5 O MÁS TRABAJADORES:
          // rotIdx 0..3 (4 trabajadores) => Entran a las 11:00 AM Corrido (11:00 - 19:20) para Limpieza
          // rotIdx >= 4 (5to en adelante) => Entran más tarde Corrido para Cierre (12:40-21:00 / 13:40-22:00)
          // ==========================================
          const isMorningCrew = rotIdx < 4;

          if (dayOfWeek >= 1 && dayOfWeek <= 3) {
            // Lunes a Miércoles
            if (isMorningCrew) {
              scheduleConfig = SHIFT_SCHEDULE_CONFIG.mon_wed_open;
              shiftNotes = 'Turno Apertura Corrido (11:00 a 19:20 | Limpieza 11:00 + Salida 19:20 | 7.3h netas)';
              shiftCategory = 'open_straight';
            } else {
              scheduleConfig = SHIFT_SCHEDULE_CONFIG.mon_wed_close;
              shiftNotes = 'Turno Cierre Corrido / Entrada Tarde (12:40 a 21:00 | Entrada 12:40 + Cierre 21:00 | 7.3h netas)';
              shiftCategory = 'late_close';
            }
          } else {
            // Jueves a Sábados
            if (isMorningCrew) {
              scheduleConfig = SHIFT_SCHEDULE_CONFIG.thu_sat_open;
              shiftNotes = 'Turno Apertura Corrido (11:00 a 19:20 | Limpieza 11:00 + Salida 19:20 | 7.3h netas)';
              shiftCategory = 'open_straight';
            } else {
              scheduleConfig = SHIFT_SCHEDULE_CONFIG.thu_sat_close;
              shiftNotes = 'Turno Cierre Corrido / Entrada Tarde (13:40 a 22:00 | Entrada 13:40 + Cierre 22:00 | 7.3h netas)';
              shiftCategory = 'late_close';
            }
          }
        }

        const currentHours = workerAccumulatedHours.get(worker.id) || 0;
        workerAccumulatedHours.set(worker.id, currentHours + scheduleConfig.effectiveHours);

        const isGuard = (shiftCategory === 'open_straight' || shiftCategory === 'open_split_close') && todayGuardIds.has(worker.id);
        if (isGuard) {
          const currentGuards = workerGuardCount.get(worker.id) || 0;
          workerGuardCount.set(worker.id, currentGuards + 1);
        }

        let mealBreaks = scheduleConfig.mealBreaks;
        if (isGuard) {
          if (shiftCategory === 'open_split_close') {
            mealBreaks = [
              { name: '1ª Colación Mediodía (Post-Guardia)', time: '12:30 - 13:00', durationMinutes: 30 },
              scheduleConfig.mealBreaks[1], // Pausa intermedia
              scheduleConfig.mealBreaks[2], // Colación cena
            ];
          } else {
            mealBreaks = MEAL_BREAKS_GUARD_TWO;
          }
        }

        const guardNote = isGuard
          ? ' • 🛡️ Guardia de Colación (Atiende: 12:00-12:30 y 18:00-18:30 | Come diferido: 12:30-13:00 y 18:30-19:00)'
          : '';

        newShifts.push({
          id: `shift-${dateStr}-${worker.id}`,
          date: dateStr,
          workerId: worker.id,
          type: 'regular',
          startTime: scheduleConfig.startTime,
          endTime: scheduleConfig.endTime,
          grossHours: scheduleConfig.grossHours,
          effectiveHours: scheduleConfig.effectiveHours,
          mealBreaks,
          zoneId: assignedZone?.id,
          isSundayRandom: false,
          isManuallyAssigned: false,
          isOnGuard: isGuard,
          guardTime: isGuard ? '12:00 - 12:30' : undefined,
          notes: `${shiftNotes}${guardNote}`,
        });
      });
    }
  });

  return newShifts;
}

/**
 * Calculates equity and fairness stats across all workers
 * Validates compliance against WEEKLY_LEGAL_HOURS_TARGET (42.0 hrs) and guard distributions
 */
export function calculateFairnessMetrics(
  workers: Worker[],
  shifts: Shift[],
  zones: CleaningZone[]
): FairnessMetric[] {
  const zoneMap = new Map<string, CleaningZone>(zones.map((z) => [z.id, z]));

  return workers
    .filter((w) => w.role === 'worker')
    .map((worker) => {
      const workerShifts = shifts.filter((s) => s.workerId === worker.id);
      const activeShifts = workerShifts.filter((s) => s.type !== 'off');
      const daysOff = workerShifts.filter((s) => s.type === 'off').length;

      let totalHours = 0;
      let sundaysWorked = 0;
      let heavyZoneCount = 0;
      let lightZoneCount = 0;
      let guardCount = 0;
      const sundayHistory: { date: string; zoneId: string; zoneName: string }[] = [];

      workerShifts.forEach((s) => {
        if (s.type !== 'off') {
          totalHours += s.effectiveHours ?? 7.3;

          if (s.isOnGuard) {
            guardCount++;
          }

          const dateObj = new Date(s.date + 'T12:00:00');
          if (dateObj.getDay() === 0) {
            sundaysWorked++;
            if (s.zoneId) {
              const zone = zoneMap.get(s.zoneId);
              sundayHistory.push({
                date: s.date,
                zoneId: s.zoneId,
                zoneName: zone ? zone.name : 'Zona Desconocida',
              });
            }
          }

          if (s.zoneId) {
            const zone = zoneMap.get(s.zoneId);
            if (zone) {
              if (zone.priority <= 2) heavyZoneCount++;
              else if (zone.priority >= 4) lightZoneCount++;
            }
          }
        }
      });

      // Target weekly hours is 43.0 effective hours (excluding meal breaks)
      const targetHours = WEEKLY_LEGAL_HOURS_TARGET; // 43.0
      const hoursDiff = Math.abs(totalHours - targetHours);
      // Perfect 100% if within ±0.5 hour of 43.0 hrs
      const hoursCompliance = Math.max(0, 100 - hoursDiff * 8);
      const zoneBalanceBonus = Math.max(0, 100 - Math.abs(heavyZoneCount - lightZoneCount) * 8);
      const restDayBonus = daysOff >= 1 && daysOff <= 2 ? 100 : (daysOff === 0 ? 50 : 80);
      const equityScore = Math.round((hoursCompliance * 0.4) + (zoneBalanceBonus * 0.35) + (restDayBonus * 0.25));

      return {
        workerId: worker.id,
        workerName: worker.name,
        totalShifts: activeShifts.length,
        totalHours: Math.round(totalHours * 10) / 10,
        sundaysWorked,
        daysOffCount: daysOff,
        heavyZoneCount,
        lightZoneCount,
        guardCount,
        sundayZoneHistory: sundayHistory,
        equityScore: Math.min(100, Math.max(65, equityScore)),
      };
    });
}

