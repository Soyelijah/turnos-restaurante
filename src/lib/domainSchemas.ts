import { z } from 'zod';

const id = z.string().trim().min(1).max(120);
const shortText = z.string().trim().max(240);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.string().datetime({ offset: true });
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const remoteAvatar = z.string().trim().url().max(2_048);
const uploadedAvatar = z.string()
  .max(2_800_000)
  .regex(/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i);
const optionalEmail = z.union([z.literal(''), z.string().trim().email().max(254)]);

export const workerSchema = z.object({
  id,
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(24),
  pin: z.string().trim().min(4).max(12),
  email: optionalEmail,
  phone: shortText,
  avatar: z.union([z.literal(''), remoteAvatar, uploadedAvatar]),
  role: z.enum(['admin', 'worker']),
  status: z.enum(['active', 'vacation', 'medical_leave', 'resigned', 'inactive']),
  preferredRestDay: z.number().int().min(0).max(6).optional(),
  color,
  hireDate: date,
  notes: z.string().trim().max(1_000).optional(),
}).strict();

const mealBreakSchema = z.object({
  name: shortText,
  time: shortText,
  durationMinutes: z.number().int().min(0).max(240),
}).strict();

export const shiftSchema = z.object({
  id,
  date,
  workerId: id,
  type: z.enum(['regular', 'off']),
  startTime: shortText,
  endTime: shortText,
  grossHours: z.number().min(0).max(24).optional(),
  effectiveHours: z.number().min(0).max(24).optional(),
  mealBreaks: z.array(mealBreakSchema).max(6).optional(),
  zoneId: id.optional(),
  isSundayRandom: z.boolean().optional(),
  isManuallyAssigned: z.boolean().optional(),
  isOnGuard: z.boolean().optional(),
  guardTime: shortText.optional(),
  notes: z.string().trim().max(1_000).optional(),
}).strict();

export const cleaningZoneSchema = z.object({
  id,
  name: z.string().trim().min(2).max(100),
  priority: z.number().int().min(1).max(100),
  color,
  iconName: id,
  description: z.string().trim().min(2).max(1_500),
  estimatedMinutes: z.number().int().min(1).max(480),
  defaultTasks: z.array(z.string().trim().min(2).max(300)).min(1).max(50),
}).strict();

export const taskSchema = z.object({
  id,
  shiftId: id,
  workerId: id,
  date,
  zoneId: id,
  title: z.string().trim().min(2).max(300),
  completed: z.boolean(),
  completedAt: isoDateTime.optional(),
  completedBy: id.optional(),
  notes: z.string().trim().max(1_000).optional(),
}).strict();

export const swapRequestSchema = z.object({
  id,
  requesterWorkerId: id,
  requesterShiftDate: date,
  requesterShiftType: z.enum(['regular', 'off']),
  targetWorkerId: id,
  targetShiftDate: date,
  targetShiftType: z.enum(['regular', 'off']),
  reason: z.string().trim().min(4).max(1_000),
  status: z.enum(['pending_target', 'pending_admin', 'approved', 'rejected', 'cancelled']),
  createdAt: isoDateTime,
  advanceNoticeHours: z.number().int().min(0).max(8_760),
  adminNotes: z.string().trim().max(1_000).optional(),
  reviewedAt: isoDateTime.optional(),
  reviewedBy: shortText.optional(),
}).strict();

export const auditLogSchema = z.object({
  id,
  timestamp: isoDateTime,
  actorId: id,
  actorName: shortText,
  action: shortText,
  details: z.string().trim().max(2_000),
  type: z.enum(['shift_change', 'swap_approved', 'worker_status', 'zone_reorder', 'auto_schedule', 'audit']),
}).strict();

export const backupSchema = z.object({
  schema: z.literal('garzon_turnos_backup_v5'),
  exportedAt: isoDateTime,
  exportedBy: shortText,
  workers: z.array(workerSchema).min(1).max(50),
  cleaningZones: z.array(cleaningZoneSchema).min(1).max(100),
  shifts: z.array(shiftSchema).max(20_000),
  tasks: z.array(taskSchema).max(50_000),
  swapRequests: z.array(swapRequestSchema).max(10_000),
  auditLogs: z.array(auditLogSchema).max(5_000),
}).strict();
