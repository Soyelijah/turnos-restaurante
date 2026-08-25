import type { Worker } from '../types';

export interface SessionState {
  isAuthenticated: boolean;
}

export type SessionAction = { type: 'login' } | { type: 'logout' };

export function sessionReducer(_state: SessionState, action: SessionAction): SessionState {
  return { isAuthenticated: action.type === 'login' };
}

export function findWorkerByCredentials(
  workers: Worker[],
  identifier: string,
  pin: string,
): Worker | null {
  const normalizedIdentifier = identifier.trim().toLocaleLowerCase('es');
  const normalizedPin = pin.trim();

  return workers.find((worker) =>
    (worker.code.toLocaleLowerCase('es') === normalizedIdentifier ||
      worker.email.toLocaleLowerCase('es') === normalizedIdentifier) &&
    worker.pin === normalizedPin,
  ) ?? null;
}
