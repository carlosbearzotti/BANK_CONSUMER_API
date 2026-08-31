import { STORAGE_KEYS, DEFAULT_CONFIG } from './config.js';

/**
 * Store Reativa de Estado Global (Padrão Cortex Store + PubSub)
 */
class AppState {
  constructor() {
    this.baseUrl = localStorage.getItem(STORAGE_KEYS.API_BASE_URL) || DEFAULT_CONFIG.BASE_URL;
    this.apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || DEFAULT_CONFIG.API_KEY;
    this.token = localStorage.getItem(STORAGE_KEYS.TOKEN) || null;
    this.user = this.loadStoredUser();
    this.hideBalance = localStorage.getItem(STORAGE_KEYS.HIDE_BALANCE) === 'true';
    this.sidebarExpanded = localStorage.getItem(STORAGE_KEYS.SIDEBAR_EXPANDED) !== 'false';
    this.activeTab = 'home';
    this.lastFeedback = null;
    this.reqLogs = [];

    this.listeners = new Map();
  }

  loadStoredUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  notify(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Erro no listener do evento '${event}':`, err);
        }
      });
    }
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;

    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }

    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }

    this.notify('auth', { token, user });
    this.notify('view', token ? 'banking' : 'auth');
  }

  setApiKey(key) {
    this.apiKey = key || DEFAULT_CONFIG.API_KEY;
    localStorage.setItem(STORAGE_KEYS.API_KEY, this.apiKey);
    this.notify('apiKey', this.apiKey);
  }

  setHideBalance(hide) {
    this.hideBalance = Boolean(hide);
    localStorage.setItem(STORAGE_KEYS.HIDE_BALANCE, String(this.hideBalance));
    this.notify('balanceVisibility', this.hideBalance);
  }

  setSidebarExpanded(expanded) {
    this.sidebarExpanded = Boolean(expanded);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_EXPANDED, String(this.sidebarExpanded));
    this.notify('sidebar', this.sidebarExpanded);
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    this.notify('tab', tab);
  }

  addApiLog(log) {
    this.reqLogs.unshift({
      id: Date.now(),
      ...log
    });
    if (this.reqLogs.length > 50) this.reqLogs.pop();
    this.notify('apiLogs', this.reqLogs);
  }

  clearApiLogs() {
    this.reqLogs = [];
    this.notify('apiLogs', this.reqLogs);
  }
}

export const state = new AppState();
