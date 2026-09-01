import { describe, it } from 'node:test';
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

import { authService } from './authService.js';

describe('Auth Service', () => {
  it('should call login endpoint with correct credentials', async () => {
    let calledUrl = '';
    let calledBody = '';

    globalThis.fetch = async (url, options) => {
      calledUrl = url;
      calledBody = options.body;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ token: '123' })
      };
    };

    const result = await authService.login({ email: 'test@test.com', password: 'password' });
    assert.strictEqual(calledUrl, 'http://localhost:8080/api/auth/login');
    assert.strictEqual(calledBody, JSON.stringify({ email: 'test@test.com', password: 'password' }));
    assert.deepStrictEqual(result, { token: '123' });
  });

  it('should call register endpoint with user data', async () => {
    let calledUrl = '';
    let calledBody = '';

    globalThis.fetch = async (url, options) => {
      calledUrl = url;
      calledBody = options.body;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 1 })
      };
    };

    const userData = { name: 'Test', email: 'test@test.com' };
    await authService.register(userData);
    assert.strictEqual(calledUrl, 'http://localhost:8080/api/auth/register');
    assert.strictEqual(calledBody, JSON.stringify(userData));
  });

  it('should get profile correctly', async () => {
    let calledUrl = '';

    globalThis.fetch = async (url) => {
      calledUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 1, name: 'User' })
      };
    };

    const res = await authService.getProfile();
    assert.strictEqual(calledUrl, 'http://localhost:8080/api/auth/me');
    assert.deepStrictEqual(res, { id: 1, name: 'User' });
  });
});
