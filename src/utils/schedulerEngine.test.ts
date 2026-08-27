import { afterEach, describe, expect, it, vi } from 'vitest';
import { WEEKLY_LEGAL_HOURS_TARGET } from '../data/initialData';
import type { CleaningZone, Worker } from '../types';
import { generateWeeklySchedule } from './schedulerEngine';

const workers: Worker[] = Array.from({ length: 5 }, (_, index) => ({
  id: `worker-${index + 1}`,
  name: `Garzón ${index + 1}`,
  code: `GZ-${index + 1}`,
  pin: '1234',
  email: `garzon${index + 1}@example.com`,
  phone: `+56 9 0000 000${index + 1}`,
  avatar: '',
  role: 'worker',
  status: 'active',
  color: '#3366ff',
  hireDate: '2026-01-01',
}));

const zones: CleaningZone[] = Array.from({ length: 5 }, (_, index) => ({
  id: `zone-${index + 1}`,
  name: `Zona ${index + 1}`,
  priority: index + 1,
  color: '#3366ff',
  iconName: 'sparkles',
  description: `Zona de prueba ${index + 1}`,
  estimatedMinutes: 30,
  defaultTasks: ['Limpiar'],
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generateWeeklySchedule guard rotation', () => {
  it('assigns only real opening guards once and preserves the weekly target', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);

    const shifts = generateWeeklySchedule(workers, zones, new Date(2026, 7, 24));
    const regularShifts = shifts.filter((shift) => shift.type === 'regular');
    const guards = regularShifts.filter((shift) => shift.isOnGuard);

    for (const date of [...new Set(regularShifts.map((shift) => shift.date))]) {
      const day = new Date(`${date}T12:00:00`).getDay();
      const expectedGuards = day === 0 || day === 6 ? 2 : 1;
      expect(guards.filter((shift) => shift.date === date)).toHaveLength(expectedGuards);
    }

    expect(guards.filter((shift) => new Date(`${shift.date}T12:00:00`).getDay() !== 0))
      .toSatisfy((weekdayGuards) => weekdayGuards.every((shift) => shift.startTime === '11:00'));

    const guardCounts = workers.map((worker) =>
      guards.filter((shift) => shift.workerId === worker.id).length,
    );
    expect(Math.max(...guardCounts) - Math.min(...guardCounts)).toBeLessThanOrEqual(1);

    for (const worker of workers) {
      const workerShifts = shifts.filter((shift) => shift.workerId === worker.id);
      expect(workerShifts.filter((shift) => shift.type === 'regular')).toHaveLength(6);
      expect(workerShifts.filter((shift) => shift.type === 'off')).toHaveLength(1);
      expect(workerShifts.reduce((total, shift) => total + (shift.effectiveHours ?? 0), 0))
        .toBeCloseTo(WEEKLY_LEGAL_HOURS_TARGET);
    }
  });
});
