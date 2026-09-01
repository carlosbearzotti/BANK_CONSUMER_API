import { authService } from './authService.js';
import * as apiLib from '../lib/api.js';

// Mock the apiRequest function
jest.mock('../lib/api.js', () => ({
  apiRequest: jest.fn()
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call login endpoint with correct credentials', async () => {
    apiLib.apiRequest.mockResolvedValueOnce({ token: '123' });
    
    const result = await authService.login({ email: 'test@test.com', password: 'password' });
    
    expect(apiLib.apiRequest).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'password' })
    });
    expect(result).toEqual({ token: '123' });
  });

  it('should call register endpoint with user data', async () => {
    apiLib.apiRequest.mockResolvedValueOnce({ id: 1 });
    
    const userData = { name: 'Test', email: 'test@test.com' };
    await authService.register(userData);
    
    expect(apiLib.apiRequest).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  });

  it('should get profile correctly', async () => {
    apiLib.apiRequest.mockResolvedValueOnce({ id: 1 });
    
    await authService.getProfile();
    expect(apiLib.apiRequest).toHaveBeenCalledWith('/api/auth/me', { method: 'GET' });
  });
});
