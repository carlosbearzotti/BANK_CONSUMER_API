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
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="font-weight: 600;">${type.toUpperCase()}</div>
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

  setupApiInspector() {
    const inspectorMethod = document.getElementById('inspectorMethod');
    const inspectorUrl = document.getElementById('inspectorUrl');
    const inspectorLatency = document.getElementById('inspectorLatency');
    const inspectorBody = document.getElementById('inspectorBody');

    state.subscribe('logs', (logs) => {
      if (!logs || logs.length === 0) return;
      const latest = logs[0];

      if (inspectorMethod) {
        inspectorMethod.textContent = latest.method;
        inspectorMethod.className = `http-method method-${latest.method.toLowerCase()}`;
      }

      if (inspectorUrl) {
        inspectorUrl.textContent = `${latest.endpoint} [${latest.status}]`;
      }

      if (inspectorLatency) {
        inspectorLatency.textContent = `${latest.duration}ms`;
      }

      if (inspectorBody) {
        inspectorBody.innerHTML = `<pre>${JSON.stringify(latest.responsePayload ?? {}, null, 2)}</pre>`;
      }
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
