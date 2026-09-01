import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for Node native test environment
if (!globalThis.localStorage) {
  let store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

import { apiRequest } from './api.js';
import { state } from './state.js';

describe('API Library', () => {
  beforeEach(() => {
    state.clearAuth();
    state.clearApiLogs();
  });

  it('should make a successful GET request', async () => {
    const mockResponse = { data: 'test' };
    globalThis.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/test');
      assert.strictEqual(options.headers['Content-Type'], 'application/json');
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      };
    };

    const result = await apiRequest('/api/test');
    assert.deepStrictEqual(result, mockResponse);
  });

  it('should include Authorization header if token exists', async () => {
    state.setAuth('fake-token', { id: 1 });
    let passedHeaders = null;

    globalThis.fetch = async (url, options) => {
      passedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      };
    };

    await apiRequest('/api/secure');
    assert.strictEqual(passedHeaders['Authorization'], 'Bearer fake-token');
  });

  it('should handle API errors and throw', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Invalid data' })
    });

    await assert.rejects(
      async () => { await apiRequest('/api/error'); },
      { message: 'Invalid data' }
    );
  });

  it('should clear auth on 401 Unauthorized', async () => {
    state.setAuth('fake-token', { id: 1 });
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Token expired' })
    });

    await assert.rejects(
      async () => { await apiRequest('/api/secure'); },
      { message: 'Token expired' }
    );
    assert.strictEqual(state.token, null);
  });
});
