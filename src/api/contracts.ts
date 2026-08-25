export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_REQUIRED'
  | 'AUTH_FORBIDDEN'
  | 'AUTH_RATE_LIMITED'
  | 'CSRF_INVALID'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_ERROR';

export type ApiError = {
  success: false;
  code: ApiErrorCode;
  message: string;
  errors?: Record<string, string[]>;
};

export type SessionUser = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'admin' | 'worker';
  status: 'active' | 'vacation' | 'medical_leave' | 'resigned' | 'inactive';
};

export type LoginRequest = {
  identifier: string;
  pin: string;
};

export type CsrfData = {
  csrfToken: string;
};

export type LogoutData = {
  authenticated: false;
};

export type HealthData = {
  status: 'ok';
  timestamp: string;
};
