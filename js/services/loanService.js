import { apiRequest } from '../lib/api.js';

/**
 * Serviço de Análise e Simulação de Empréstimos
 */
export const loanService = {
  async simulate(customerData) {
    return await apiRequest('/customer-loans', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }
};
