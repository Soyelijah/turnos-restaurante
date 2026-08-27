import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

type FetchEvent = {
  request: { method: string; url: string; mode?: string };
  respondWith: (response: Promise<unknown>) => void;
};

type FetchListener = (event: FetchEvent) => void;

function loadFetchListener(options?: { responseCacheControl?: string; fetchRejects?: boolean }) {
  let fetchListener: FetchListener | undefined;
  const cachePut = vi.fn().mockResolvedValue(undefined);
  const response = {
    ok: true,
    clone: () => response,
    headers: {
      get: (name: string) => name.toLowerCase() === 'cache-control'
        ? options?.responseCacheControl ?? ''
        : null,
    },
  };
  const context = {
    URL,
    fetch: options?.fetchRejects
      ? vi.fn().mockRejectedValue(new Error('offline'))
      : vi.fn().mockResolvedValue(response),
    caches: {
      keys: vi.fn().mockResolvedValue([]),
      open: vi.fn().mockResolvedValue({ addAll: vi.fn(), put: cachePut }),
      match: vi.fn().mockImplementation((request: string | { url: string }) => {
        return Promise.resolve(request === '/' ? { kind: 'app-shell' } : undefined);
      }),
      delete: vi.fn().mockResolvedValue(true),
    },
    self: {
      location: { origin: 'https://turnos.example' },
      addEventListener: (type: string, listener: FetchListener) => {
        if (type === 'fetch') fetchListener = listener;
      },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
    },
  };

  runInNewContext(readFileSync('public/sw.js', 'utf8'), context);
  if (!fetchListener) throw new Error('The service worker did not register a fetch listener.');

  return { fetchListener, cachePut };
}

describe('service worker cache policy', () => {
  it('leaves API requests network-only', () => {
    const { fetchListener } = loadFetchListener();
    const respondWith = vi.fn();

    fetchListener({
      request: { method: 'GET', url: 'https://turnos.example/api/v1/auth/session' },
      respondWith,
    });

    expect(respondWith).not.toHaveBeenCalled();
  });

  it('does not persist responses marked no-store', async () => {
    const { fetchListener, cachePut } = loadFetchListener({ responseCacheControl: 'no-store' });
    let handledResponse: Promise<unknown> | undefined;

    fetchListener({
      request: { method: 'GET', url: 'https://turnos.example/assets/app.js' },
      respondWith: (response) => { handledResponse = response; },
    });
    await handledResponse;
    await Promise.resolve();

    expect(cachePut).not.toHaveBeenCalled();
  });

  it('does not return the app shell for a missing static asset', async () => {
    const { fetchListener } = loadFetchListener({ fetchRejects: true });
    let handledResponse: Promise<unknown> | undefined;

    fetchListener({
      request: {
        method: 'GET',
        mode: 'no-cors',
        url: 'https://turnos.example/assets/missing.js',
      },
      respondWith: (response) => { handledResponse = response; },
    });

    await expect(handledResponse).rejects.toThrow('offline');
  });
});
