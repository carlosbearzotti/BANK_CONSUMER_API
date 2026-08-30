/**
 * Global reactive state manager for the Integrados Frontend Consumer
 */

const STORAGE_KEYS = {
  TOKEN: 'integrados_jwt_token',
  USER: 'integrados_user_profile',
  BASE_URL: 'integrados_api_base_url'
};

export const state = {
  baseUrl: localStorage.getItem(STORAGE_KEYS.BASE_URL) || 'http://localhost:8080',
  token: localStorage.getItem(STORAGE_KEYS.TOKEN) || null,
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'),
  activeTab: 'auth',
  logs: [],
  lastFeedback: null,

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEYS.BASE_URL, this.baseUrl);
    this.notify('baseUrl', this.baseUrl);
  },

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
    this.notify('auth', { token, user });
  },

  setLastFeedback(feedback) {
    this.lastFeedback = feedback;
    this.notify('feedback', feedback);
  },

  addLog(logEntry) {
    this.logs.unshift(logEntry);
    if (this.logs.length > 50) this.logs.pop();
    this.notify('logs', this.logs);
  },

  clearLogs() {
    this.logs = [];
    this.notify('logs', this.logs);
  },

  // Simple PubSub event system
  listeners: {},
  subscribe(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },

  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
};
