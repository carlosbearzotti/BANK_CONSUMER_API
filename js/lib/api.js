import { state } from './state.js';

/**
 * Cliente HTTP Unificado com Suporte Multi-Tenant e Logging
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${state.baseUrl}${endpoint}`;
  const startTime = performance.now();

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': state.apiKey,
    ...(options.headers || {})
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const reqConfig = {
    ...options,
    headers
  };

  let response;
  let responseData = null;
  let status = 0;
  let statusText = '';
  let isOk = false;

  try {
    response = await fetch(url, reqConfig);
    status = response.status;
    statusText = response.statusText;
    isOk = response.ok;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }

    const duration = Math.round(performance.now() - startTime);

    state.addApiLog({
      method: reqConfig.method || 'GET',
      url,
      endpoint,
      status,
      statusText,
      duration,
      requestHeaders: headers,
      requestBody: reqConfig.body ? (typeof reqConfig.body === 'string' ? JSON.parse(reqConfig.body) : reqConfig.body) : null,
      responseBody: responseData,
      timestamp: new Date().toLocaleTimeString(),
      success: isOk
    });

    if (!isOk) {
      if (status === 401 || (status === 404 && endpoint.includes('/api/auth/me'))) {
        state.clearAuth();
      }

      const errorMsg = (responseData && (responseData.message || responseData.error || responseData.details)) ||
        `Erro HTTP ${status}: ${statusText}`;
      const err = new Error(errorMsg);
      err.status = status;
      err.data = responseData;
      throw err;
    }

    return responseData;
  } catch (error) {
    if (!status) {
      const duration = Math.round(performance.now() - startTime);
      state.addApiLog({
        method: reqConfig.method || 'GET',
        url,
        endpoint,
        status: 0,
        statusText: 'Network Error / Refused',
        duration,
        requestHeaders: headers,
        requestBody: reqConfig.body ? (typeof reqConfig.body === 'string' ? JSON.parse(reqConfig.body) : reqConfig.body) : null,
        responseBody: { error: error.message },
        timestamp: new Date().toLocaleTimeString(),
        success: false
      });
    }
    throw error;
  }
}
