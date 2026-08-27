import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider, useApp } from './AppContext';
import { STORAGE_KEYS } from '../lib/storage';

const SessionProbe = () => {
  const { isAuthenticated } = useApp();
  return <span>{isAuthenticated ? 'authenticated' : 'anonymous'}</span>;
};

describe('AppProvider session bootstrap', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('denies access by default when browser storage has no saved session', () => {
    const markup = renderToStaticMarkup(
      <AppProvider>
        <SessionProbe />
      </AppProvider>,
    );

    expect(markup).toContain('anonymous');
  });

  it('denies access when browser storage contains an invalid session value', () => {
    values.set(STORAGE_KEYS.SESSION, 'invalid');

    const markup = renderToStaticMarkup(
      <AppProvider>
        <SessionProbe />
      </AppProvider>,
    );

    expect(markup).toContain('anonymous');
  });
});
