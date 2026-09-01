import { state } from '../lib/state.js';
import { toast } from './toast.js';

/**
 * Orquestrador do AppShell (Padrão Cortex AppShell + NavegacaoLateral)
 */
export const appShell = {
  init() {
    this.setupViewSwitching();
    this.setupTabNavigation();
    this.setupSidebarToggle();
    this.setupBalanceToggle();
    this.setupApiInspector();
    this.checkApiHealth();
  },

  setupViewSwitching() {
    const authView = document.getElementById('view-auth-gmail');
    const bankView = document.getElementById('view-banking-app');

    const updateView = () => {
      const isAuth = Boolean(state.token);
      if (authView && bankView) {
        if (isAuth) {
          authView.classList.remove('active');
          bankView.classList.add('active');
        } else {
          bankView.classList.remove('active');
          authView.classList.add('active');
        }
      }
    };

    state.subscribe('auth', updateView);
    updateView();
  },

  setupTabNavigation() {
    const desktopBtns = document.querySelectorAll('.bank-nav-item-btn');
    const mobileBtns = document.querySelectorAll('.mobile-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    const switchTab = (targetTab) => {
      if (!targetTab) return;

      desktopBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTab);
      });

      mobileBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTab);
      });

      tabPanes.forEach((pane) => pane.classList.remove('active'));
      const activePane = document.getElementById(`tab-${targetTab}`);
      if (activePane) {
        activePane.classList.add('active');
      }

      document.body.style.overflow = '';
      state.setActiveTab(targetTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    desktopBtns.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    mobileBtns.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    // Perfil trigger no header
    const profileTrigger = document.getElementById('userProfileTrigger');
    if (profileTrigger) {
      profileTrigger.addEventListener('click', () => switchTab('profile'));
    }
  },

  setupSidebarToggle() {
    const sidebar = document.querySelector('.bank-sidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (!sidebar || !toggleBtn) return;

    const applyState = (expanded) => {
      sidebar.classList.toggle('expanded', expanded);
      const span = toggleBtn.querySelector('span');
      if (span) {
        span.textContent = expanded ? 'Recolher Menu' : 'Expandir';
      }
      toggleBtn.setAttribute('title', expanded ? 'Recolher barra lateral' : 'Expandir barra lateral');
      state.setSidebarExpanded(expanded);
    };

    applyState(state.sidebarExpanded);

    toggleBtn.addEventListener('click', () => {
      const nextState = !sidebar.classList.contains('expanded');
      applyState(nextState);
    });
  },

  setupBalanceToggle() {
    const toggleBtn = document.getElementById('toggleBalanceBtn');
    const eyeOpen = document.getElementById('eyeOpenIcon');
    const eyeClosed = document.getElementById('eyeClosedIcon');
    const balanceDisplay = document.getElementById('bankBalanceDisplay');

    const updateBalanceUI = (hide) => {
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = hide ? 'none' : 'block';
        eyeClosed.style.display = hide ? 'block' : 'none';
      }

      document.querySelectorAll('.balance-sensitive').forEach((el) => {
        el.classList.toggle('blurred', hide);
      });

      if (balanceDisplay) {
        balanceDisplay.classList.toggle('blurred', hide);
      }
    };

    updateBalanceUI(state.hideBalance);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const nextState = !state.hideBalance;
        state.setHideBalance(nextState);
        updateBalanceUI(nextState);
        toast.info(nextState ? 'Valores bancários ocultados.' : 'Valores bancários visíveis.');
      });
    }
  },

  setupApiInspector() {
    const fab = document.getElementById('inspectorFabBtn');
    const drawer = document.getElementById('inspectorDrawer');
    const closeBtn = document.getElementById('closeInspectorBtn');
    const fabCount = document.getElementById('fabReqCount');
    const copyBtn = document.getElementById('copyInspectorBtn');
    const clearBtn = document.getElementById('clearInspectorBtn');
    const tabs = document.querySelectorAll('.inspector-tab-btn');
    const preResponse = document.getElementById('inspectorResponsePre');
    const preRequest = document.getElementById('inspectorRequestPre');
    const methodBadge = document.getElementById('inspectorMethod');
    const urlSpan = document.getElementById('inspectorUrl');
    const statusBadge = document.getElementById('inspectorStatusBadge');
    const latencySpan = document.getElementById('inspectorLatency');

    if (fab && drawer) {
      fab.addEventListener('click', () => drawer.classList.toggle('active'));
      if (closeBtn) closeBtn.addEventListener('click', () => drawer.classList.remove('active'));
    }

    const renderSelectedLog = (log) => {
      if (!log) {
        if (preResponse) preResponse.textContent = '// Nenhuma requisição registrada ainda';
        if (preRequest) preRequest.textContent = '// Aguardando chamadas à API';
        return;
      }

      if (methodBadge) {
        methodBadge.textContent = log.method;
        methodBadge.className = `http-method method-${log.method.toLowerCase()}`;
      }
      if (urlSpan) urlSpan.textContent = log.endpoint || log.url;
      if (statusBadge) {
        statusBadge.textContent = `${log.status} ${log.statusText}`;
        statusBadge.className = `inspector-status-badge ${log.success ? 'status-success' : 'status-error'}`;
      }
      if (latencySpan) latencySpan.textContent = `⏱️ ${log.duration}ms`;

      if (preResponse) {
        preResponse.textContent = typeof log.responseBody === 'object'
          ? JSON.stringify(log.responseBody, null, 2)
          : String(log.responseBody);
      }
      if (preRequest) {
        preRequest.textContent = JSON.stringify({
          headers: log.requestHeaders,
          body: log.requestBody
        }, null, 2);
      }
    };

    const renderHistory = (logs) => {
      const historyList = document.getElementById('inspectorHistoryList');
      if (!historyList) return;
      if (logs.length === 0) {
        historyList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; padding: 1rem; text-align: center;">Nenhuma requisição no histórico.</div>';
        return;
      }
      historyList.innerHTML = logs.map((log) => `
        <div class="history-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid var(--bank-border-soft); border-radius: var(--radius-sm); cursor: pointer;" onclick="window.renderInspectorLog(${log.id})">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="http-method method-${log.method.toLowerCase()}">${log.method}</span>
            <span style="font-size: 0.8rem; font-family: var(--font-mono); color: #f1f5f9;">${log.endpoint || log.url}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="inspector-status-badge ${log.success ? 'status-success' : 'status-error'}">${log.status}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${log.duration}ms</span>
          </div>
        </div>
      `).join('');
    };

    window.renderInspectorLog = (id) => {
      const target = state.reqLogs.find((l) => l.id === id);
      if (target) {
        renderSelectedLog(target);
        const resTab = document.querySelector('[data-view="response"]');
        if (resTab) resTab.click();
      }
    };

    state.subscribe('apiLogs', (logs) => {
      if (fabCount) fabCount.textContent = String(logs.length);
      renderSelectedLog(logs[0]);
      renderHistory(logs);
    });

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const view = tab.getAttribute('data-view');
        const viewResponse = document.getElementById('inspectorViewResponse');
        const viewRequest = document.getElementById('inspectorViewRequest');
        const viewHistory = document.getElementById('inspectorViewHistory');

        if (viewResponse) viewResponse.style.display = view === 'response' ? 'block' : 'none';
        if (viewRequest) viewRequest.style.display = view === 'request' ? 'block' : 'none';
        if (viewHistory) viewHistory.style.display = view === 'history' ? 'block' : 'none';
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.clearApiLogs();
        toast.info('Histórico do API Inspector limpo.');
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = preResponse ? preResponse.textContent : '';
        navigator.clipboard.writeText(text);
        toast.success('Resposta da API copiada!');
      });
    }
  },

  async checkApiHealth() {
    const dot = document.getElementById('bankApiDot');
    const pill = document.getElementById('apiStatusPill');

    try {
      const res = await fetch(`${state.baseUrl}/api/transactions/stats`, {
        headers: { 'X-API-Key': state.apiKey }
      });

      if (dot) dot.style.backgroundColor = res.ok ? '#10b981' : '#f59e0b';
      if (pill) pill.setAttribute('title', res.ok ? 'API Online e Conectada (200 OK)' : 'API com instabilidade');
    } catch {
      if (dot) dot.style.backgroundColor = '#ef4444';
      if (pill) pill.setAttribute('title', 'API Offline ou Conexão Recusada');
    }
  }
};
