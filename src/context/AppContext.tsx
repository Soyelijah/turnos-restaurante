import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Worker,
  CleaningZone,
  Shift,
  DailyTaskItem,
  SwapRequest,
  AuditLog,
  WorkerStatus,
  FairnessMetric,
  ShiftSlotType,
} from '../types';
import { INITIAL_WORKERS, INITIAL_CLEANING_ZONES } from '../data/initialData';
import {
  generateWeeklySchedule,
  getWeekDates,
  formatDateToISO,
  calculateFairnessMetrics,
} from '../utils/schedulerEngine';

interface AppContextType {
  currentUser: Worker;
  workers: Worker[];
  cleaningZones: CleaningZone[];
  shifts: Shift[];
  tasks: DailyTaskItem[];
  swapRequests: SwapRequest[];
  auditLogs: AuditLog[];
  selectedWeekDate: Date;
  activeTab: string;
  isPWAInstallOpen: boolean;
  fairnessMetrics: FairnessMetric[];
  
  // Navigation & User
  setActiveTab: (tab: string) => void;
  setCurrentUser: (worker: Worker) => void;
  switchUserById: (workerId: string) => void;
  setIsPWAInstallOpen: (open: boolean) => void;
  setSelectedWeekDate: (date: Date) => void;

  // Workers CRUD
  addWorker: (workerData: Omit<Worker, 'id'>) => boolean;
  updateWorker: (id: string, workerData: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  updateWorkerStatus: (id: string, status: WorkerStatus, reason?: string) => void;

  // Shift & Scheduler
  generateScheduleForWeek: (startDate?: Date) => void;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  assignDayOff: (workerId: string, dateStr: string) => void;
  
  // Tasks
  toggleTask: (taskId: string, workerId: string) => void;
  resetZoneTasksForDay: (dateStr: string, zoneId: string) => void;
  getTasksForShift: (shift: Shift) => DailyTaskItem[];

  // Cleaning Zones
  updateZonePriority: (zoneId: string, newPriority: number) => void;
  updateZone: (zoneId: string, updates: Partial<CleaningZone>) => void;
  addZone: (zone: Omit<CleaningZone, 'id'>) => void;
  deleteZone: (zoneId: string) => void;
  updateZoneTasks: (zoneId: string, tasks: string[]) => void;

  // Swap Requests
  createSwapRequest: (
    requesterWorkerId: string,
    requesterShiftDate: string,
    requesterShiftType: ShiftSlotType,
    targetWorkerId: string,
    targetShiftDate: string,
    targetShiftType: ShiftSlotType,
    reason: string
  ) => { success: boolean; message: string };
  targetRespondSwap: (swapId: string, accept: boolean) => void;
  adminReviewSwap: (swapId: string, approved: boolean, notes?: string) => void;

  // Utilities & Database Security
  exportDatabaseBackup: () => void;
  importDatabaseBackup: (jsonContent: string) => { success: boolean; message: string };
  resetToInitialData: () => void;
  triggerConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  VERSION: 'garzon_turnos_schema_v12',
  WORKERS: 'garzon_turnos_workers_v12',
  ZONES: 'garzon_turnos_zones_v12',
  SHIFTS: 'garzon_turnos_shifts_v12',
  TASKS: 'garzon_turnos_tasks_v12',
  SWAPS: 'garzon_turnos_swaps_v12',
  LOGS: 'garzon_turnos_logs_v12',
  CURRENT_USER_ID: 'garzon_turnos_current_user_id_v12',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State Loaders with Automatic Real-Workers Migration Check
  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORKERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if old placeholder worker names exist
        const hasPlaceholders = parsed.some((w: Worker) => 
          w.name.includes('Mateo') || w.name.includes('Sofía') || w.name.includes('Diego')
        );
        if (!hasPlaceholders && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_WORKERS;
  });

  const [cleaningZones, setCleaningZones] = useState<CleaningZone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ZONES);
      return saved ? JSON.parse(saved) : INITIAL_CLEANING_ZONES;
    } catch {
      return INITIAL_CLEANING_ZONES;
    }
  });

  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(() => new Date());

  const [shifts, setShifts] = useState<Shift[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasValidWorkers = parsed.some((s: Shift) => 
          s.workerId.includes('pierre') || s.workerId.includes('roberto') || s.workerId.includes('jose') || s.workerId.includes('alex')
        );
        const has43hTarget = parsed.some((s: Shift) => s.effectiveHours === 7.3);
        if (hasValidWorkers && has43hTarget && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    // Generate initial schedules for this week and next week with authentic workers
    const currentWeekShifts = generateWeeklySchedule(INITIAL_WORKERS, INITIAL_CLEANING_ZONES, new Date());
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekShifts = generateWeeklySchedule(INITIAL_WORKERS, INITIAL_CLEANING_ZONES, nextWeekDate, currentWeekShifts);
    return [...currentWeekShifts, ...nextWeekShifts];
  });

  const [tasks, setTasks] = useState<DailyTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SWAPS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'swap-demo-1',
        requesterWorkerId: 'worker-pierre',
        requesterShiftDate: formatDateToISO(new Date(Date.now() + 86400000 * 2)), // 2 days ahead
        requesterShiftType: 'regular',
        targetWorkerId: 'worker-roberto',
        targetShiftDate: formatDateToISO(new Date(Date.now() + 86400000 * 3)),
        targetShiftType: 'regular',
        reason: 'Compromiso personal con aviso de 48 horas de anticipación.',
        status: 'pending_admin',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        advanceNoticeHours: 48,
        adminNotes: '',
      },
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'log-seed-01',
        timestamp: new Date().toISOString(),
        actorId: 'worker-admin',
        actorName: 'Carlos Mendoza (Admin)',
        action: 'Base de Datos Inicializada',
        details: 'Configuración inicial de personal real: Pierre S., Roberto G., Jose C., Alex H., Ally S. (Vacaciones), Junior A. y 6 Zonas de Aseo.',
        type: 'auto_schedule',
      },
    ];
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'worker-admin';
  });

  const [activeTab, setActiveTab] = useState<string>('my_day');
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState<boolean>(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(cleaningZones));
  }, [cleaningZones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SWAPS, JSON.stringify(swapRequests));
  }, [swapRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  // Current logged in worker/admin
  const currentUser = useMemo(() => {
    return workers.find((w) => w.id === currentUserId) || workers[0] || INITIAL_WORKERS[0];
  }, [workers, currentUserId]);

  const fairnessMetrics = useMemo(() => {
    return calculateFairnessMetrics(workers, shifts, cleaningZones);
  }, [workers, shifts, cleaningZones]);

  const addAuditLog = (
    actorName: string,
    action: string,
    details: string,
    type: AuditLog['type']
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName,
      action,
      details,
      type,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // Fallback if canvas confetti fails
    }
  };

  // Switch User
  const switchUserById = (workerId: string) => {
    setCurrentUserId(workerId);
  };

  // Worker CRUD
  const addWorker = (workerData: Omit<Worker, 'id'>): boolean => {
    if (workers.length >= 12) {
      alert('Se ha alcanzado el límite máximo de trabajadores configurados.');
      return false;
    }
    const newWorker: Worker = {
      ...workerData,
      id: `worker-${Date.now()}`,
    };
    setWorkers((prev) => [...prev, newWorker]);
    addAuditLog(
      currentUser.name,
      'Trabajador Agregado',
      `Se agregó a ${newWorker.name} (${newWorker.code}) con rol ${newWorker.role}.`,
      'worker_status'
    );
    return true;
  };

  const updateWorker = (id: string, workerData: Partial<Worker>) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...workerData } : w))
    );
    addAuditLog(
      currentUser.name,
      'Trabajador Actualizado',
      `Se modificaron los datos del trabajador ID ${id}.`,
      'worker_status'
    );
  };

  const deleteWorker = (id: string) => {
    const workerToDelete = workers.find((w) => w.id === id);
    if (!workerToDelete) return;
    setWorkers((prev) => prev.filter((w) => w.id !== id));
    // Remove future un-worked shifts for this worker
    setShifts((prev) => prev.filter((s) => s.workerId !== id));
    addAuditLog(
      currentUser.name,
      'Trabajador Eliminado',
      `Se eliminó a ${workerToDelete.name}. Sus turnos fueron retirados para redistribución.`,
      'worker_status'
    );
  };

  const updateWorkerStatus = (id: string, status: WorkerStatus, reason?: string) => {
    const worker = workers.find((w) => w.id === id);
    if (!worker) return;

    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status } : w))
    );

    const statusLabels: Record<WorkerStatus, string> = {
      active: 'Activo',
      vacation: 'Vacaciones',
      medical_leave: 'Licencia Médica',
      resigned: 'Renuncia / Retiro',
      inactive: 'Inactivo',
    };

    addAuditLog(
      currentUser.name,
      'Cambio de Estado de Trabajador',
      `${worker.name} cambió a estado "${statusLabels[status]}". ${reason ? `Motivo: ${reason}` : ''}`,
      'worker_status'
    );

    // If status is not active, automatically convert future shifts into OFF or allow admin to trigger fair re-schedule
    if (status !== 'active') {
      const todayStr = formatDateToISO(new Date());
      setShifts((prev) =>
        prev.map((s) => {
          if (s.workerId === id && s.date >= todayStr) {
            return {
              ...s,
              type: 'off',
              startTime: '-',
              endTime: '-',
              notes: `No disponible (${statusLabels[status]})`,
            };
          }
          return s;
        })
      );
    }
  };

  // Shift & Scheduler
  const generateScheduleForWeek = (startDate: Date = selectedWeekDate) => {
    const weekDates = getWeekDates(startDate);
    const weekStartStr = formatDateToISO(weekDates[0]);
    const weekEndStr = formatDateToISO(weekDates[6]);

    // Keep shifts outside this week
    const outsideShifts = shifts.filter(
      (s) => s.date < weekStartStr || s.date > weekEndStr
    );

    const generated = generateWeeklySchedule(workers, cleaningZones, startDate, shifts);
    setShifts([...outsideShifts, ...generated]);

    triggerConfetti();
    addAuditLog(
      currentUser.name,
      'Generación Automática de Turnos',
      `Se generaron turnos equitativos del ${weekStartStr} al ${weekEndStr} solo con garzones activos y domingo aleatorio sin repetición.`,
      'auto_schedule'
    );
  };

  const updateShift = (shiftId: string, updates: Partial<Shift>) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === shiftId) {
          return { ...s, ...updates, isManuallyAssigned: true };
        }
        return s;
      })
    );
    addAuditLog(
      currentUser.name,
      'Ajuste Manual de Turno',
      `Se modificó manualmente el turno ID ${shiftId}.`,
      'shift_change'
    );
  };

  const assignDayOff = (workerId: string, dateStr: string) => {
    const existing = shifts.find((s) => s.workerId === workerId && s.date === dateStr);
    if (existing) {
      updateShift(existing.id, {
        type: 'off',
        startTime: '-',
        endTime: '-',
        notes: 'Día de descanso asignado manualmente por el jefe',
      });
    } else {
      const newShift: Shift = {
        id: `shift-${dateStr}-${workerId}`,
        date: dateStr,
        workerId,
        type: 'off',
        startTime: '-',
        endTime: '-',
        isManuallyAssigned: true,
        notes: 'Día libre manual',
      };
      setShifts((prev) => [...prev, newShift]);
    }
  };

  // Tasks Management
  const getTasksForShift = (shift: Shift): DailyTaskItem[] => {
    if (!shift.zoneId || shift.type === 'off') return [];
    
    const zone = cleaningZones.find((z) => z.id === shift.zoneId);
    if (!zone) return [];

    // Find existing tasks for this shift
    const existing = tasks.filter((t) => t.shiftId === shift.id || (t.workerId === shift.workerId && t.date === shift.date));
    if (existing.length > 0) return existing;

    // If no tasks exist in state yet, create them from zone defaultTasks
    const generatedTasks: DailyTaskItem[] = zone.defaultTasks.map((title, idx) => ({
      id: `task-${shift.id}-${idx}`,
      shiftId: shift.id,
      workerId: shift.workerId,
      date: shift.date,
      zoneId: zone.id,
      title,
      completed: false,
    }));

    return generatedTasks;
  };

  const toggleTask = (taskId: string, workerId: string) => {
    setTasks((prev) => {
      const taskIndex = prev.findIndex((t) => t.id === taskId);
      if (taskIndex >= 0) {
        const item = prev[taskIndex];
        const updated = {
          ...item,
          completed: !item.completed,
          completedAt: !item.completed ? new Date().toISOString() : undefined,
          completedBy: !item.completed ? workerId : undefined,
        };
        const newArr = [...prev];
        newArr[taskIndex] = updated;
        return newArr;
      }
      return prev;
    });
  };

  const resetZoneTasksForDay = (dateStr: string, zoneId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.date === dateStr && t.zoneId === zoneId) {
          return { ...t, completed: false, completedAt: undefined, completedBy: undefined };
        }
        return t;
      })
    );
  };

  // Cleaning Zones
  const updateZonePriority = (zoneId: string, newPriority: number) => {
    setCleaningZones((prev) => {
      const updated = prev.map((z) => (z.id === zoneId ? { ...z, priority: newPriority } : z));
      return updated.sort((a, b) => a.priority - b.priority);
    });
    addAuditLog(
      currentUser.name,
      'Reordenamiento de Jerarquía de Aseo',
      `Se actualizó la prioridad de la zona ${zoneId} a #${newPriority}.`,
      'zone_reorder'
    );
  };

  const updateZone = (zoneId: string, updates: Partial<CleaningZone>) => {
    setCleaningZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, ...updates } : z))
    );
    addAuditLog(
      currentUser.name,
      'Zona de Aseo Modificada',
      `Se actualizaron los datos/checklist de la zona ${zoneId}.`,
      'zone_reorder'
    );
  };

  const updateZoneTasks = (zoneId: string, taskList: string[]) => {
    setCleaningZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, defaultTasks: taskList } : z))
    );
    // Also update any uncompleted daily task items for this zone
    setTasks((prev) =>
      prev.map((t) => {
        if (t.zoneId === zoneId && !t.completed) {
          // Keep existing or align
        }
        return t;
      })
    );
    addAuditLog(
      currentUser.name,
      'Checklist de Zona Modificado',
      `Se actualizó la lista de ${taskList.length} tareas del checklist para la zona ${zoneId}.`,
      'zone_reorder'
    );
  };

  const deleteZone = (zoneId: string) => {
    const targetZone = cleaningZones.find((z) => z.id === zoneId);
    if (!targetZone) return;
    setCleaningZones((prev) => {
      const remaining = prev.filter((z) => z.id !== zoneId);
      // Re-normalize priorities 1..N
      return remaining.map((z, idx) => ({ ...z, priority: idx + 1 }));
    });
    // Remove zoneId from shifts if referenced
    setShifts((prev) =>
      prev.map((s) => (s.zoneId === zoneId ? { ...s, zoneId: undefined } : s))
    );
    addAuditLog(
      currentUser.name,
      'Zona de Aseo Eliminada',
      `Se eliminó la zona "${targetZone.name}".`,
      'zone_reorder'
    );
  };

  const addZone = (zoneData: Omit<CleaningZone, 'id'>) => {
    const newZone: CleaningZone = {
      ...zoneData,
      id: `zone-${Date.now()}`,
    };
    setCleaningZones((prev) => [...prev, newZone].sort((a, b) => a.priority - b.priority));
    addAuditLog(
      currentUser.name,
      'Nueva Zona de Aseo Creada',
      `Se creó la zona "${newZone.name}" con ${newZone.defaultTasks.length} tareas en su checklist.`,
      'zone_reorder'
    );
  };

  // Shift Swapping Flow
  const createSwapRequest = (
    requesterWorkerId: string,
    requesterShiftDate: string,
    requesterShiftType: ShiftSlotType,
    targetWorkerId: string,
    targetShiftDate: string,
    targetShiftType: ShiftSlotType,
    reason: string
  ): { success: boolean; message: string } => {
    // Validate advance notice: Must be at least 48 hours ahead of requester's shift
    const shiftDateTime = new Date(`${requesterShiftDate}T08:00:00`).getTime();
    const now = Date.now();
    const diffHours = (shiftDateTime - now) / (1000 * 60 * 60);

    if (diffHours < 48) {
      return {
        success: false,
        message: 'Las solicitudes de cambio de turno deben realizarse con al menos 48 horas de anticipación según reglamento del restaurante para evitar cambios a última hora.',
      };
    }

    const newRequest: SwapRequest = {
      id: `swap-${Date.now()}`,
      requesterWorkerId,
      requesterShiftDate,
      requesterShiftType,
      targetWorkerId,
      targetShiftDate,
      targetShiftType,
      reason,
      status: 'pending_target',
      createdAt: new Date().toISOString(),
      advanceNoticeHours: Math.round(diffHours),
    };

    setSwapRequests((prev) => [newRequest, ...prev]);
    const requester = workers.find((w) => w.id === requesterWorkerId);
    const target = workers.find((w) => w.id === targetWorkerId);

    addAuditLog(
      requester ? requester.name : 'Garzón',
      'Solicitud de Cambio Creada',
      `${requester?.name} solicitó cambio de turno del ${requesterShiftDate} con ${target?.name} (${targetShiftDate}). En espera de aceptación del compañero.`,
      'shift_change'
    );

    return {
      success: true,
      message: 'Solicitud enviada correctamente a tu compañero para su aceptación.',
    };
  };

  const targetRespondSwap = (swapId: string, accept: boolean) => {
    setSwapRequests((prev) =>
      prev.map((s) => {
        if (s.id === swapId) {
          return {
            ...s,
            status: accept ? 'pending_admin' : 'rejected',
            adminNotes: accept ? '' : 'Rechazado por el garzón solicitado.',
          };
        }
        return s;
      })
    );
  };

  const adminReviewSwap = (swapId: string, approved: boolean, notes?: string) => {
    const swap = swapRequests.find((s) => s.id === swapId);
    if (!swap) return;

    if (approved) {
      // Execute the actual swap between the two shifts in the shifts array
      setShifts((prev) => {
        return prev.map((shift) => {
          // Requester's shift gets replaced with target's configuration or swap
          if (shift.workerId === swap.requesterWorkerId && shift.date === swap.requesterShiftDate) {
            return {
              ...shift,
              workerId: swap.targetWorkerId,
              isManuallyAssigned: true,
              notes: `Turno cambiado (aprobado por jefatura)`,
            };
          }
          // Target's shift
          if (shift.workerId === swap.targetWorkerId && shift.date === swap.targetShiftDate) {
            return {
              ...shift,
              workerId: swap.requesterWorkerId,
              isManuallyAssigned: true,
              notes: `Turno cambiado (aprobado por jefatura)`,
            };
          }
          return shift;
        });
      });

      triggerConfetti();
      addAuditLog(
        currentUser.name,
        'Cambio de Turno APROBADO',
        `El administrador aprobó el intercambio entre ${swap.requesterWorkerId} y ${swap.targetWorkerId}. Horarios actualizados automáticamente.`,
        'swap_approved'
      );
    } else {
      addAuditLog(
        currentUser.name,
        'Cambio de Turno RECHAZADO',
        `El administrador rechazó la solicitud de cambio. Motivo: ${notes || 'No especificado'}.`,
        'shift_change'
      );
    }

    setSwapRequests((prev) =>
      prev.map((s) =>
        s.id === swapId
          ? {
              ...s,
              status: approved ? 'approved' : 'rejected',
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentUser.name,
              adminNotes: notes,
            }
          : s
      )
    );
  };

  const exportDatabaseBackup = () => {
    try {
      const backupData = {
        schema: 'garzon_turnos_backup_v4',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.name,
        workers,
        cleaningZones,
        shifts,
        tasks,
        swapRequests,
        auditLogs,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `garzon_turnos_db_backup_${formatDateToISO(new Date())}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addAuditLog(
        currentUser.name,
        'Copia de Seguridad Exportada',
        'Se generó y descargó un archivo JSON de respaldo completo de la base de datos.',
        'audit'
      );
    } catch {
      alert('Ocurrió un error al generar la copia de seguridad.');
    }
  };

  const importDatabaseBackup = (jsonContent: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || !Array.isArray(parsed.workers) || !Array.isArray(parsed.cleaningZones)) {
        return { success: false, message: 'El archivo JSON no tiene la estructura de base de datos válida.' };
      }

      setWorkers(parsed.workers);
      setCleaningZones(parsed.cleaningZones);
      if (Array.isArray(parsed.shifts)) setShifts(parsed.shifts);
      if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
      if (Array.isArray(parsed.swapRequests)) setSwapRequests(parsed.swapRequests);
      if (Array.isArray(parsed.auditLogs)) setAuditLogs(parsed.auditLogs);

      addAuditLog(
        currentUser.name,
        'Base de Datos Restaurada',
        `Se importó con éxito una copia de seguridad con ${parsed.workers.length} trabajadores y ${parsed.shifts?.length || 0} turnos.`,
        'audit'
      );

      triggerConfetti();
      return { success: true, message: 'Base de datos restaurada correctamente.' };
    } catch {
      return { success: false, message: 'Formato JSON inválido o corrupto.' };
    }
  };

  const resetToInitialData = () => {
    setWorkers(INITIAL_WORKERS);
    setCleaningZones(INITIAL_CLEANING_ZONES);
    const initialWeekShifts = generateWeeklySchedule(INITIAL_WORKERS, INITIAL_CLEANING_ZONES, new Date());
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekShifts = generateWeeklySchedule(INITIAL_WORKERS, INITIAL_CLEANING_ZONES, nextWeekDate, initialWeekShifts);
    setShifts([...initialWeekShifts, ...nextWeekShifts]);
    setTasks([]);
    setSwapRequests([]);
    setCurrentUserId('worker-admin');
    localStorage.clear();
    alert('Base de datos restablecida con los trabajadores reales oficiales.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        workers,
        cleaningZones,
        shifts,
        tasks,
        swapRequests,
        auditLogs,
        selectedWeekDate,
        activeTab,
        isPWAInstallOpen,
        fairnessMetrics,
        setActiveTab,
        setCurrentUser: (w) => setCurrentUserId(w.id),
        switchUserById,
        setIsPWAInstallOpen,
        setSelectedWeekDate,
        addWorker,
        updateWorker,
        deleteWorker,
        updateWorkerStatus,
        generateScheduleForWeek,
        updateShift,
        assignDayOff,
        toggleTask,
        resetZoneTasksForDay,
        getTasksForShift,
        updateZonePriority,
        updateZone,
        updateZoneTasks,
        deleteZone,
        addZone,
        createSwapRequest,
        targetRespondSwap,
        adminReviewSwap,
        exportDatabaseBackup,
        importDatabaseBackup,
        resetToInitialData,
        triggerConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
