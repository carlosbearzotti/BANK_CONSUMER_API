import { state } from './state.js';
import { authModule } from './auth.js';
import { passwordLabModule } from './password-lab.js';
import { loansModule } from './loans.js';
import { transactionsModule } from './transactions.js';
import { gpsModule } from './gps.js';
import { shortenerModule } from './shortener.js';

/**
 * Main Application Orchestrator
 */
class App {
  constructor() {
    this.toastContainer = document.getElementById('toastContainer');
    this.selectedLogIndex = 0;
  }

  init() {
    this.setupBaseUrlSync();
    this.setupTabNavigation();
    this.setupApiInspector();
    this.checkApiHealth();

    // Initialize all feature modules
    const showToast = this.showToast.bind(this);
    authModule.init(showToast);
    passwordLabModule.init(showToast);
    loansModule.init(showToast);
    transactionsModule.init(showToast);
    gpsModule.init(showToast);
    shortenerModule.init(showToast);
  }

  showToast(message, type = 'info') {
    // 1. Update global feedback state so the API Inspector displays the success/action message
    state.setLastFeedback({
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    });

    // 2. Render Toast Notification at bottom-right
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em;">${type.toUpperCase()}</div>
      <div>${message}</div>
    `;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  setupBaseUrlSync() {
    const input = document.getElementById('apiUrlInput');
    if (input) {
      input.value = state.baseUrl;
      input.addEventListener('change', () => {
        state.setBaseUrl(input.value);
        this.showToast(`URL base da API atualizada para: ${state.baseUrl}`, 'info');
        this.checkApiHealth();
      });
    }
  }

  async checkApiHealth() {
    const dot = document.getElementById('apiStatusDot');
    try {
      // Test ping to open endpoint
      const res = await fetch(`${state.baseUrl}/pois`, { method: 'GET' });
      if (dot) {
        if (res.ok || res.status === 401 || res.status === 403 || res.status === 404) {
          dot.className = 'api-status-dot';
          dot.title = 'API Online';
        } else {
          dot.className = 'api-status-dot offline';
          dot.title = 'API com erro de resposta';
        }
      }
    } catch {
      if (dot) {
        dot.className = 'api-status-dot offline';
        dot.title = 'API Offline - Inicie o backend Spring Boot na porta 8080';
      }
    }
  }

  setupTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-item-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        navButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        btn.classList.add('active');
        const activePane = document.getElementById(`tab-${targetTab}`);
        if (activePane) activePane.classList.add('active');

        state.activeTab = targetTab;
      });
    });
  }

  highlightJson(obj) {
    if (obj === undefined || obj === null) {
      return '<span class="json-null">null</span>';
    }
    let json = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    if (!json) return '<span class="json-null">null</span>';

    json = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }

  setupApiInspector() {
    const inspectorMethod = document.getElementById('inspectorMethod');
    const inspectorUrl = document.getElementById('inspectorUrl');
    const inspectorStatusBadge = document.getElementById('inspectorStatusBadge');
    const inspectorLatency = document.getElementById('inspectorLatency');
    const inspectorBanner = document.getElementById('inspectorBanner');
    const inspectorBannerIcon = document.getElementById('inspectorBannerIcon');
    const inspectorBannerTitle = document.getElementById('inspectorBannerTitle');
    const inspectorBannerMsg = document.getElementById('inspectorBannerMsg');
    const inspectorTimestamp = document.getElementById('inspectorTimestamp');
    const responsePre = document.getElementById('inspectorResponsePre');
    const requestPre = document.getElementById('inspectorRequestPre');
    const historyList = document.getElementById('inspectorHistoryList');
    const copyBtn = document.getElementById('copyInspectorBtn');
    const clearBtn = document.getElementById('clearInspectorBtn');
    const tabBtns = document.querySelectorAll('.inspector-tab-btn');
    const views = document.querySelectorAll('.inspector-view');

    let activeView = 'response';

    // Initial render for inspector views
    if (responsePre) {
      responsePre.innerHTML = this.highlightJson({
        status: 'Ready',
        message: 'Inicie qualquer ação nas abas acima para inspecionar os payloads em tempo real.'
      });
    }
    if (requestPre) {
      requestPre.innerHTML = this.highlightJson({
        info: 'Nenhum payload enviado ainda.'
      });
    }

    // View Tabs Switcher
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        activeView = view;

        tabBtns.forEach(b => b.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));

        btn.classList.add('active');
        const activeContainer = document.getElementById(`inspectorView${view.charAt(0).toUpperCase() + view.slice(1)}`);
        if (activeContainer) activeContainer.classList.add('active');
      });
    });

    // Copy JSON Action
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const currentLog = state.logs[this.selectedLogIndex] || state.logs[0];
        const dataToCopy = activeView === 'request'
          ? (currentLog?.requestPayload || { info: 'Sem corpo de requisição' })
          : (currentLog?.responsePayload || { status: 'Ready' });

        navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copiado!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 1800);
      });
    }

    // Clear Inspector Action
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.clearLogs();
        if (inspectorMethod) {
          inspectorMethod.textContent = 'GET';
          inspectorMethod.className = 'http-method method-get';
        }
        if (inspectorUrl) inspectorUrl.textContent = '/api/health';
        if (inspectorStatusBadge) {
          inspectorStatusBadge.className = 'inspector-status-badge status-info';
          inspectorStatusBadge.textContent = '● Pronto';
        }
        if (inspectorLatency) inspectorLatency.textContent = '⏱️ 0ms';
        if (inspectorBanner) {
          inspectorBanner.className = 'inspector-banner banner-info';
          if (inspectorBannerIcon) inspectorBannerIcon.textContent = 'ℹ️';
          if (inspectorBannerTitle) inspectorBannerTitle.textContent = 'Console Limpo';
          if (inspectorBannerMsg) inspectorBannerMsg.textContent = 'O histórico e console do Inspector foram resetados.';
        }
        if (responsePre) responsePre.innerHTML = this.highlightJson({ status: 'Cleared', message: 'Console limpo com sucesso.' });
        if (requestPre) requestPre.innerHTML = this.highlightJson({ info: 'Nenhum payload ativo.' });
        if (historyList) historyList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem;">Nenhum registro no histórico.</div>';
      });
    }

    const renderLog = (log) => {
      if (!log) return;

      if (inspectorMethod) {
        inspectorMethod.textContent = log.method;
        inspectorMethod.className = `http-method method-${log.method.toLowerCase()}`;
      }

      if (inspectorUrl) {
        inspectorUrl.textContent = log.endpoint;
        inspectorUrl.title = log.endpoint;
      }

      if (inspectorLatency) {
        inspectorLatency.textContent = `⏱️ ${log.duration}ms`;
      }

      if (inspectorTimestamp) {
        inspectorTimestamp.textContent = log.timestamp;
      }

      // Status Badge
      if (inspectorStatusBadge) {
        if (log.ok) {
          inspectorStatusBadge.className = 'inspector-status-badge status-success';
          inspectorStatusBadge.textContent = `✓ ${log.status} ${log.statusText || 'OK'}`;
        } else if (log.status === 'ERR' || log.status >= 400) {
          inspectorStatusBadge.className = 'inspector-status-badge status-error';
          inspectorStatusBadge.textContent = `✕ ${log.status} ${log.statusText || 'ERRO'}`;
        } else {
          inspectorStatusBadge.className = 'inspector-status-badge status-warning';
          inspectorStatusBadge.textContent = `⚠ ${log.status} ${log.statusText || 'AVISO'}`;
        }
      }

      // Status Banner
      if (inspectorBanner) {
        if (log.ok) {
          inspectorBanner.className = 'inspector-banner banner-success';
          if (inspectorBannerIcon) inspectorBannerIcon.textContent = '✅';
          if (inspectorBannerTitle) inspectorBannerTitle.textContent = `Sucesso (HTTP ${log.status} ${log.statusText || 'OK'})`;
          
          // Use feedback message or payload message or general confirmation
          const msg = state.lastFeedback?.message ||
                      log.responsePayload?.message ||
                      (log.status === 204 ? 'Operação validada com sucesso pelo backend!' : 'Requisição processada e confirmada com sucesso.');
          if (inspectorBannerMsg) inspectorBannerMsg.textContent = msg;
        } else {
          inspectorBanner.className = 'inspector-banner banner-error';
          if (inspectorBannerIcon) inspectorBannerIcon.textContent = '❌';
          if (inspectorBannerTitle) inspectorBannerTitle.textContent = `Falha na Requisição (HTTP ${log.status} ${log.statusText || 'ERRO'})`;
          const msg = log.responsePayload?.message ||
                      log.responsePayload?.error ||
                      state.lastFeedback?.message ||
                      'Ocorreu um erro no processamento da requisição.';
          if (inspectorBannerMsg) inspectorBannerMsg.textContent = msg;
        }
      }

      // Payloads
      if (responsePre) {
        responsePre.innerHTML = this.highlightJson(log.responsePayload ?? { message: 'Sem conteúdo no corpo da resposta' });
      }

      if (requestPre) {
        requestPre.innerHTML = this.highlightJson(log.requestPayload ?? { info: 'Nenhum corpo enviado (GET / Sem payload)' });
      }
    };

    // Subscribe to HTTP Logs
    state.subscribe('logs', (logs) => {
      if (!logs || logs.length === 0) return;
      this.selectedLogIndex = 0;
      renderLog(logs[0]);

      // Render History List
      if (historyList) {
        historyList.innerHTML = logs.map((item, idx) => `
          <div class="inspector-history-item ${item.ok ? 'item-success' : 'item-error'}" data-index="${idx}">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span class="http-method method-${item.method.toLowerCase()}">${item.method}</span>
              <span style="font-weight: 600;">${item.endpoint}</span>
              <span class="inspector-status-badge ${item.ok ? 'status-success' : 'status-error'}" style="padding: 0.1rem 0.35rem; font-size: 0.7rem;">${item.status}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-size: 0.75rem;">
              <span>⏱️ ${item.duration}ms</span>
              <span>${item.timestamp}</span>
            </div>
          </div>
        `).join('');

        // Attach click to history items
        historyList.querySelectorAll('.inspector-history-item').forEach(itemEl => {
          itemEl.addEventListener('click', () => {
            const idx = parseInt(itemEl.getAttribute('data-index'), 10);
            this.selectedLogIndex = idx;
            renderLog(logs[idx]);
          });
        });
      }
    });

    // Subscribe to Feedback / Toast Messages to immediately update inspector banner
    state.subscribe('feedback', (fb) => {
      if (!fb || !inspectorBanner) return;

      if (fb.type === 'success') {
        inspectorBanner.className = 'inspector-banner banner-success';
        if (inspectorBannerIcon) inspectorBannerIcon.textContent = '✅';
        if (inspectorBannerTitle) inspectorBannerTitle.textContent = 'Sucesso Confirmado';
        if (inspectorBannerMsg) inspectorBannerMsg.textContent = fb.message;
      } else if (fb.type === 'error') {
        inspectorBanner.className = 'inspector-banner banner-error';
        if (inspectorBannerIcon) inspectorBannerIcon.textContent = '❌';
        if (inspectorBannerTitle) inspectorBannerTitle.textContent = 'Erro';
        if (inspectorBannerMsg) inspectorBannerMsg.textContent = fb.message;
      } else if (fb.type === 'warning') {
        inspectorBanner.className = 'inspector-banner banner-warning';
        if (inspectorBannerIcon) inspectorBannerIcon.textContent = '⚠️';
        if (inspectorBannerTitle) inspectorBannerTitle.textContent = 'Atenção';
        if (inspectorBannerMsg) inspectorBannerMsg.textContent = fb.message;
      } else {
        inspectorBanner.className = 'inspector-banner banner-info';
        if (inspectorBannerIcon) inspectorBannerIcon.textContent = 'ℹ️';
        if (inspectorBannerTitle) inspectorBannerTitle.textContent = 'Informação';
        if (inspectorBannerMsg) inspectorBannerMsg.textContent = fb.message;
      }
      if (inspectorTimestamp) inspectorTimestamp.textContent = fb.timestamp;
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

