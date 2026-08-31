import { apiRequest } from '../lib/api.js';

/**
 * Serviço de Encurtamento de URLs e Métricas de Cliques
 */
export const urlService = {
  async shorten(originalUrl) {
    return await apiRequest('/shorten-url', {
      method: 'POST',
      body: JSON.stringify({
        url: originalUrl,
        originalUrl
      })
    });
  },

  async getStats(shortCode) {
    return await apiRequest(`/shorten-url/${encodeURIComponent(shortCode)}/stats`, {
      method: 'GET'
    });
  }
};
