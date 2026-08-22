export type UserRole = 'admin' | 'worker';

export type WorkerStatus = 'active' | 'vacation' | 'medical_leave' | 'resigned' | 'inactive';

export interface Worker {
  id: string;
  name: string;
  code: string; // e.g. "GZ-01" or username
  pin: string; // e.g. "1234"
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  status: WorkerStatus;
  preferredRestDay?: number; // 0 for Sunday, 1 for Monday, etc.
  color: string;
  hireDate: string;
  notes?: string;
}

export type ShiftSlotType = 'regular' | 'off';

export interface MealBreak {
  name: string;
  time: string;
  durationMinutes: number;
}

export interface ShiftDefinition {
  type: ShiftSlotType;
  label: string;
  startTime: string;
  endTime: string;
  grossHours: number;
  effectiveHours: number;
  mealBreaks: MealBreak[];
  badgeColor: string;
}

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  workerId: string;
  type: ShiftSlotType;
  startTime: string;
  endTime: string;
  grossHours?: number;
  effectiveHours?: number;
  mealBreaks?: MealBreak[];
  zoneId?: string;
  isSundayRandom?: boolean;
  isManuallyAssigned?: boolean;
  isOnGuard?: boolean; // Lunch guard duty (12:00 - 12:30)
  guardTime?: string;
  notes?: string;
}

export interface CleaningZone {
  id: string;
  name: string;
  priority: number; // 1 = highest importance, 2, 3, etc.
  color: string;
  iconName: string;
  description: string;
  estimatedMinutes: number;
  defaultTasks: string[];
}

export interface DailyTaskItem {
  id: string;
  shiftId: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  zoneId: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export type SwapStatus = 'pending_target' | 'pending_admin' | 'approved' | 'rejected' | 'cancelled';

export interface SwapRequest {
  id: string;
  requesterWorkerId: string;
  requesterShiftDate: string;
  requesterShiftType: ShiftSlotType;
  targetWorkerId: string;
  targetShiftDate: string;
  targetShiftType: ShiftSlotType;
  reason: string;
  status: SwapStatus;
  createdAt: string;
  advanceNoticeHours: number;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  type: 'shift_change' | 'swap_approved' | 'worker_status' | 'zone_reorder' | 'auto_schedule' | 'audit';
}

export interface FairnessMetric {
  workerId: string;
  workerName: string;
  totalShifts: number;
  totalHours: number;
  sundaysWorked: number;
  daysOffCount: number;
  heavyZoneCount: number; // Zones priority 1 & 2
  lightZoneCount: number; // Zones priority 4, 5, 6
  guardCount: number; // Lunch guard duty count
  sundayZoneHistory: { date: string; zoneId: string; zoneName: string }[];
  equityScore: number; // Percentage out of 100
}
