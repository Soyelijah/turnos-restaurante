import type { z } from 'zod';

export const STORAGE_KEYS = {
  VERSION: 'garzon_turnos_schema_v13',
  WORKERS: 'garzon_turnos_workers_v13',
  ZONES: 'garzon_turnos_zones_v13',
  SHIFTS: 'garzon_turnos_shifts_v13',
  TASKS: 'garzon_turnos_tasks_v13',
  SWAPS: 'garzon_turnos_swaps_v13',
  LOGS: 'garzon_turnos_logs_v13',
  CURRENT_USER_ID: 'garzon_turnos_current_user_id_v13',
  SESSION: 'garzon_turnos_session_v13',
} as const;

export function loadValidatedArray<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    const result = schema.safeParse(JSON.parse(value));
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // The UI remains usable when storage is unavailable or quota is exhausted.
    return false;
  }
}

export function loadText(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function saveText(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep the active session in memory when browser storage is unavailable.
  }
}

export function clearAppStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
