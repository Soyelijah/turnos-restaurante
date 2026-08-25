import { describe, expect, it } from 'vitest';
import type { Worker } from '../types';
import { findWorkerByCredentials, sessionReducer } from './session';

const admin: Worker = {
  id: 'worker-admin',
  name: 'Carlos Mendoza',
  code: 'ADMIN',
  pin: '1234',
  email: 'admin@example.com',
  phone: '',
  avatar: 'https://example.com/admin.jpg',
  role: 'admin',
  status: 'active',
  color: '#6366f1',
  hireDate: '2022-01-15',
};

describe('session flow', () => {
  it('transitions to a logged-out state', () => {
    expect(sessionReducer({ isAuthenticated: true }, { type: 'logout' })).toEqual({
      isAuthenticated: false,
    });
  });

  it('starts a new session only with valid normalized credentials', () => {
    expect(findWorkerByCredentials([admin], ' admin ', '1234')?.id).toBe(admin.id);
    expect(findWorkerByCredentials([admin], 'ADMIN', 'incorrecto')).toBeNull();
  });
});
