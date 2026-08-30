import { state } from './state.js';

/**
 * Robust Centralized HTTP Client with automatic Bearer Injection and API Inspector Logging
 */
export async function request(endpoint, options = {}) {
  const url = `${state.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const startTime = performance.now();
  let status = 0;
  let responseData = null;
  let ok = false;

  try {
    const fetchOptions = {
      method,
      headers
    };

    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    } else if (options.body) {
      fetchOptions.body = options.body;
    }

    const res = await fetch(url, fetchOptions);
    status = res.status;
    ok = res.ok;

    // Check for empty body / 204 No Content
    const text = await res.text();
    if (text) {
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    } else {
      responseData = null;
    }

    const duration = Math.round(performance.now() - startTime);

    state.addLog({
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      duration,
      ok,
      requestPayload: options.body,
      responsePayload: responseData
    });

    if (!ok) {
      const errorMsg = responseData?.message || responseData?.error || `HTTP ${status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = status;
      err.data = responseData;
      throw err;
    }

    return responseData;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    if (!status) {
      state.addLog({
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint,
        status: 'ERR',
        duration,
        ok: false,
        requestPayload: options.body,
        responsePayload: { error: err.message }
      });
    }
    throw err;
  }
}
