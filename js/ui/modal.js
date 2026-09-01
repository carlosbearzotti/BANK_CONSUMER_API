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
    // Fechar modais ao clicar no backdrop ou tecla Escape (respeitando data-static="true")
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        const isStatic = e.target.getAttribute('data-static') === 'true' || e.target.dataset.static === 'true';
        if (isStatic) {
          const card = e.target.querySelector('.modal-card, .modal-sheet-content');
          if (card) {
            card.classList.remove('modal-shake');
            void card.offsetWidth; // Força reflow para reiniciar animação
            card.classList.add('modal-shake');
            setTimeout(() => card.classList.remove('modal-shake'), 400);
          }
          return;
        }
        this.close(e.target);
      }

      if (e.target.closest('[data-modal-close]')) {
        const modalBackdrop = e.target.closest('.modal-backdrop');
        if (modalBackdrop) {
          const isStatic = modalBackdrop.getAttribute('data-static') === 'true' || modalBackdrop.dataset.static === 'true';
          if (!isStatic) {
            this.close(modalBackdrop);
          }
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-backdrop.active');
        if (activeModal) {
          const isStatic = activeModal.getAttribute('data-static') === 'true' || activeModal.dataset.static === 'true';
          if (isStatic) {
            const card = activeModal.querySelector('.modal-card, .modal-sheet-content');
            if (card) {
              card.classList.remove('modal-shake');
              void card.offsetWidth;
              card.classList.add('modal-shake');
              setTimeout(() => card.classList.remove('modal-shake'), 400);
            }
            return;
          }
          this.close(activeModal);
        }
      }
    });
  }
};
