/**
 * Gerenciador Atômico de Modais e Dialogs (Padrão Cortex ConfirmDialog)
 */
export const modal = {
  open(modalId) {
    const el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (!el) return;

    el.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-focus no primeiro input ou botão
    const focusTarget = el.querySelector('input:not([disabled]), button:not([disabled])');
    if (focusTarget) setTimeout(() => focusTarget.focus(), 50);
  },

  close(modalId) {
    const el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (!el) return;

    el.classList.remove('active');
    document.body.style.overflow = '';
  },

  initAll() {
    // Fechar modais ao clicar no backdrop ou tecla Escape
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        this.close(e.target);
      }
      if (e.target.closest('[data-modal-close]')) {
        const modalBackdrop = e.target.closest('.modal-backdrop');
        if (modalBackdrop) this.close(modalBackdrop);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-backdrop.active');
        if (activeModal) this.close(activeModal);
      }
    });
  }
};
