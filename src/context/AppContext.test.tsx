import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AppProvider, useApp } from './AppContext';

const SessionProbe = () => {
  const { isAuthenticated } = useApp();
  return <span>{isAuthenticated ? 'authenticated' : 'anonymous'}</span>;
};

describe('AppProvider session bootstrap', () => {
  it('denies access by default when browser storage has no saved session', () => {
    const markup = renderToStaticMarkup(
      <AppProvider>
        <SessionProbe />
      </AppProvider>,
    );

    expect(markup).toContain('anonymous');
  });
});
