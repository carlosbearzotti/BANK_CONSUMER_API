import { apiRequest } from '../lib/api.js';

/**
 * Serviço de Operações Bancárias e Cofre Criptográfico
 */
export const bankingService = {
  async createTransaction(transactionData) {
    return await apiRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  },

  async getTransactions() {
    return await apiRequest('/api/transactions', {
      method: 'GET'
    });
  },

  async getStats() {
    return await apiRequest('/api/transactions/stats', {
      method: 'GET'
    });
  }
};
