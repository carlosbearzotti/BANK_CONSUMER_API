import { apiRequest } from './api.js';
import { state } from './state.js';

describe('API Library', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    state.clearAuth();
    state.clearApiLogs();
    jest.clearAllMocks();
  });

  it('should make a successful GET request', async () => {
    const mockResponse = { data: 'test' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse
    });

    const result = await apiRequest('/api/test');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/test', expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      })
    }));
    expect(result).toEqual(mockResponse);
  });

  it('should include Authorization header if token exists', async () => {
    state.setAuth('fake-token', { id: 1 });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({})
    });

    await apiRequest('/api/secure');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/secure', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer fake-token'
      })
    }));
  });

  it('should handle API errors and throw', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Invalid data' })
    });

    await expect(apiRequest('/api/error')).rejects.toThrow('Invalid data');
  });

  it('should clear auth on 401 Unauthorized', async () => {
    state.setAuth('fake-token', { id: 1 });
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Token expired' })
    });

    await expect(apiRequest('/api/secure')).rejects.toThrow('Token expired');
    expect(state.token).toBeNull();
  });
});
