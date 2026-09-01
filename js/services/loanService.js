import { apiRequest } from '../lib/api.js';

/**
 * Serviço de Análise, Simulação e Contratação de Empréstimos
 */
export const loanService = {
  async simulate(customerData) {
    return await apiRequest('/customer-loans', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  },

  async getMyPreApprovedLoans(location = 'SP') {
    return await apiRequest(`/api/loans/me?location=${encodeURIComponent(location)}`, {
      method: 'GET'
    });
  }
};
