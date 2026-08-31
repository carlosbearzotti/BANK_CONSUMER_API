import { apiRequest } from '../lib/api.js';

/**
 * Serviço de Pontos de Interesse (POIs) e Agências
 */
export const poiService = {
  async getAll() {
    return await apiRequest('/pois', {
      method: 'GET'
    });
  },

  async create(poiData) {
    return await apiRequest('/pois', {
      method: 'POST',
      body: JSON.stringify(poiData)
    });
  },

  async findNearby(x, y, dmax) {
    return await apiRequest(`/pois/proximidade?x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}&dmax=${encodeURIComponent(dmax)}`, {
      method: 'GET'
    });
  }
};
