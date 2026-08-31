import { apiRequest } from '../lib/api.js';

/**
 * Serviço de Autenticação e Perfil de Usuário
 */
export const authService = {
  async register(userData) {
    return await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async login(credentials) {
    return await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  async getProfile() {
    return await apiRequest('/api/auth/me', {
      method: 'GET'
    });
  },

  async forgotPassword(email) {
    return await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(email, resetCode, newPassword) {
    return await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetCode, newPassword })
    });
  }
};
