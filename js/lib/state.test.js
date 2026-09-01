import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { state, storage } from './state.js';
import { STORAGE_KEYS } from './config.js';

describe('AppState Store', () => {
  beforeEach(() => {
    storage.clear();
    state.clearAuth();
    state.clearApiLogs();
  });

  it('should initialize with default values', () => {
    assert.strictEqual(state.token, null);
    assert.strictEqual(state.user, null);
    assert.deepStrictEqual(state.reqLogs, []);
    assert.strictEqual(state.activeTab, 'home');
  });

  it('should store auth token and user', () => {
    const mockUser = { id: 1, name: 'Test' };
    state.setAuth('test-token', mockUser);
    
    assert.strictEqual(state.token, 'test-token');
    assert.deepStrictEqual(state.user, mockUser);
    assert.strictEqual(storage.getItem(STORAGE_KEYS.TOKEN), 'test-token');
    assert.strictEqual(storage.getItem(STORAGE_KEYS.USER), JSON.stringify(mockUser));
  });

  it('should clear auth correctly', () => {
    state.setAuth('test-token', { id: 1 });
    state.clearAuth();
    
    assert.strictEqual(state.token, null);
    assert.strictEqual(state.user, null);
    assert.strictEqual(storage.getItem(STORAGE_KEYS.TOKEN), null);
  });

  it('should notify subscribers on state change', () => {
    let notifiedData = null;
    state.subscribe('auth', (data) => {
      notifiedData = data;
    });
    
    state.setAuth('token123', null);
    assert.deepStrictEqual(notifiedData, { token: 'token123', user: null });
  });

  it('should log API requests', () => {
    state.addApiLog({ url: '/test', status: 200 });
    assert.strictEqual(state.reqLogs.length, 1);
    assert.strictEqual(state.reqLogs[0].url, '/test');
    assert.strictEqual(state.reqLogs[0].status, 200);
  });
});
