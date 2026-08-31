/**
 * Gerenciador Atômico de Notificações Toast (Padrão Cortex UI)
 */
class ToastManager {
  constructor() {
    this.container = document.getElementById('toastContainer');
  }

  getContainer() {
    if (!this.container) {
      this.container = document.getElementById('toastContainer');
    }
    return this.container;
  }

  show(message, type = 'info', durationMs = 3500) {
    const container = this.getContainer();
    if (!container) return;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-weight: 800; font-size: 0.9rem;">${icons[type] || 'ℹ'}</span>
        <div style="font-size: 0.875rem; font-weight: 600; line-height: 1.4;">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px) scale(0.95)';
      toast.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => toast.remove(), 250);
    }, durationMs);
  }

  success(msg) { this.show(msg, 'success'); }
  error(msg) { this.show(msg, 'error', 4500); }
  warning(msg) { this.show(msg, 'warning'); }
  info(msg) { this.show(msg, 'info'); }
}

export const toast = new ToastManager();
