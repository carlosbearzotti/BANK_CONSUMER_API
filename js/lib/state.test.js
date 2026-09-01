import { state } from './state.js';
import { STORAGE_KEYS } from './config.js';

describe('AppState Store', () => {
  beforeEach(() => {
    localStorage.clear();
    state.clearAuth();
    state.clearApiLogs();
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.reqLogs).toEqual([]);
    expect(state.activeTab).toBe('home');
  });

  it('should store auth token and user', () => {
    const mockUser = { id: 1, name: 'Test' };
    state.setAuth('test-token', mockUser);
    
    expect(state.token).toBe('test-token');
    expect(state.user).toEqual(mockUser);
    expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBe('test-token');
    expect(localStorage.getItem(STORAGE_KEYS.USER)).toBe(JSON.stringify(mockUser));
  });

  it('should clear auth correctly', () => {
    state.setAuth('test-token', { id: 1 });
    state.clearAuth();
    
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
  });

  it('should notify subscribers on state change', () => {
    const callback = jest.fn();
    state.subscribe('auth', callback);
    
    state.setAuth('token123', null);
    
    expect(callback).toHaveBeenCalledWith({ token: 'token123', user: null });
  });

  it('should log API requests', () => {
    state.addApiLog({ url: '/test', status: 200 });
    expect(state.reqLogs.length).toBe(1);
    expect(state.reqLogs[0].url).toBe('/test');
    expect(state.reqLogs[0].status).toBe(200);
  });
});
