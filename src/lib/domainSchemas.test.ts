import { describe, expect, it } from 'vitest';
import { backupSchema, workerSchema } from './domainSchemas';

describe('domain validation', () => {
  const worker = {
    id: 'worker-1', name: 'Ana Pérez', code: 'GZ-01', pin: '1234',
    email: 'ana@example.com', phone: '+56 9 0000 0000',
    avatar: 'https://example.com/avatar.jpg', role: 'worker' as const,
    status: 'active' as const, preferredRestDay: 1, color: '#3366ff',
    hireDate: '2026-01-10', notes: 'Salón principal',
  };

  it('accepts a bounded worker record', () => {
    expect(workerSchema.parse(worker)).toEqual(worker);
  });

  it('rejects executable or unbounded backup shapes', () => {
    const result = backupSchema.safeParse({ schema: 'garzon_turnos_backup_v5', workers: [worker] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid roles and malformed dates', () => {
    expect(workerSchema.safeParse({ ...worker, role: 'owner', hireDate: '10/01/2026' }).success).toBe(false);
  });
});

