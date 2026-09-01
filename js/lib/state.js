import { STORAGE_KEYS, DEFAULT_CONFIG } from './config.js';

// Fallback de armazenamento seguro para ambientes sem DOM / Node.js
const memoryStore = new Map();
const storage = typeof localStorage !== 'undefined' ? localStorage : {
  getItem: (key) => memoryStore.get(key) || null,
  setItem: (key, val) => { memoryStore.set(key, String(val)); },
  removeItem: (key) => { memoryStore.delete(key); },
  clear: () => { memoryStore.clear(); }
};

/**
 * Store Reativa de Estado Global (Padrão Cortex Store + PubSub)
 */
class AppState {
  constructor() {
    this.baseUrl = storage.getItem(STORAGE_KEYS.API_BASE_URL) || DEFAULT_CONFIG.BASE_URL;
    this.apiKey = storage.getItem(STORAGE_KEYS.API_KEY) || DEFAULT_CONFIG.API_KEY;
    this.token = storage.getItem(STORAGE_KEYS.TOKEN) || null;
    this.user = this.loadStoredUser();
    this.hideBalance = storage.getItem(STORAGE_KEYS.HIDE_BALANCE) === 'true';
    this.sidebarExpanded = storage.getItem(STORAGE_KEYS.SIDEBAR_EXPANDED) !== 'false';
    this.activeTab = 'home';
    this.lastFeedback = null;
    this.reqLogs = [];

    this.listeners = new Map();
  }

  loadStoredUser() {
    try {
      const raw = storage.getItem(STORAGE_KEYS.USER);
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
      storage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      storage.removeItem(STORAGE_KEYS.TOKEN);
    }

    if (user) {
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      storage.removeItem(STORAGE_KEYS.USER);
    }

    this.notify('auth', { token, user });
    this.notify('view', token ? 'banking' : 'auth');
  }

  setUser(user) {
    this.user = user;
    if (user) {
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      storage.removeItem(STORAGE_KEYS.USER);
    }
    this.notify('auth', { token: this.token, user });
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    storage.removeItem(STORAGE_KEYS.TOKEN);
    storage.removeItem(STORAGE_KEYS.USER);
    this.notify('auth', { token: null, user: null });
    this.notify('view', 'auth');
  }

  setApiKey(key) {
    this.apiKey = key || DEFAULT_CONFIG.API_KEY;
    storage.setItem(STORAGE_KEYS.API_KEY, this.apiKey);
    this.notify('apiKey', this.apiKey);
  }

  setHideBalance(hide) {
    this.hideBalance = Boolean(hide);
    storage.setItem(STORAGE_KEYS.HIDE_BALANCE, String(this.hideBalance));
    this.notify('balanceVisibility', this.hideBalance);
  }

  setSidebarExpanded(expanded) {
    this.sidebarExpanded = Boolean(expanded);
    storage.setItem(STORAGE_KEYS.SIDEBAR_EXPANDED, String(this.sidebarExpanded));
    this.notify('sidebar', this.sidebarExpanded);
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    this.notify('tab', tab);
  }

  setupUserEnvironment(email, initialCards, finalPin, planKey) {
    storage.setItem(`laobank_cards_${email}`, JSON.stringify(initialCards));
    storage.setItem(`laobank_card_pin_${email}`, finalPin);
    storage.setItem(`laobank_temp_pin_${email}`, finalPin);
    storage.setItem(`laobank_pin_needs_change_${email}`, 'true');
    storage.setItem(`laobank_user_plan_${email}`, planKey);
  }

  needsPinChange(email) {
    return storage.getItem(`laobank_pin_needs_change_${email}`) === 'true';
  }

  clearUserPinChangeState(email) {
    storage.removeItem(`laobank_pin_needs_change_${email}`);
  }

  getUserPlan(email) {
    return storage.getItem(`laobank_user_plan_${email}`) || 'FREE';
  }

  getTempPin(email) {
    return storage.getItem(`laobank_temp_pin_${email}`) || storage.getItem(`laobank_card_pin_${email}`) || '1234';
  }

  updateUserPin(email, newPin) {
    storage.setItem(`laobank_card_pin_${email}`, newPin);
    this.clearUserPinChangeState(email);
  }

  getUserCards(email) {
    try {
      const stored = storage.getItem(`laobank_cards_${email}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  updateUserCards(email, cards) {
    storage.setItem(`laobank_cards_${email}`, JSON.stringify(cards));
  }

  getUserLoans(email) {
    try {
      const stored = storage.getItem(`laobank_contracted_loans_${email}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveUserLoans(email, loans) {
    storage.setItem(`laobank_contracted_loans_${email}`, JSON.stringify(loans));
    this.notify('loans', loans);
  }

  addContractedLoan(email, loanContract) {
    const loans = this.getUserLoans(email);
    loans.unshift(loanContract);
    this.saveUserLoans(email, loans);
    return loans;
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
export { storage };

