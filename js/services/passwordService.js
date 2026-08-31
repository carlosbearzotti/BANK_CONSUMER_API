import { apiRequest } from '../lib/api.js';

/**
 * Serviço de Validação de Senhas Fortes (5 Regras da API)
 */
export const passwordService = {
  async validate(password) {
    return await apiRequest('/api/validate-password', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  }
};
