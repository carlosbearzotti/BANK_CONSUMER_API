import { toast } from '../ui/toast.js';

/**
 * Módulo de Cartões de Crédito e Cartão Virtual 3D (Padrão Cortex Feature)
 */
export const cardsFeature = {
  init() {
    this.setupCardFlip();
    this.setupCardActions();
    this.setupInvoicePayment();
  },

  setupCardFlip() {
    const cardEl = document.getElementById('interactiveCreditCard');
    if (!cardEl) return;

    cardEl.addEventListener('click', () => {
      cardEl.classList.toggle('flipped');
    });
  },

  setupCardActions() {
    const blockBtn = document.getElementById('toggleCardBlockBtn');
    let isBlocked = false;

    if (blockBtn) {
      blockBtn.addEventListener('click', () => {
        isBlocked = !isBlocked;
        blockBtn.textContent = isBlocked ? '🔓 Bloqueio Temporário: Ativado' : '🔒 Bloqueio Temporário: Desativado';
        blockBtn.className = isBlocked ? 'btn btn-danger' : 'btn btn-secondary';
        toast.info(isBlocked ? 'Cartão temporariamente bloqueado para compras.' : 'Cartão desbloqueado.');
      });
    }
  },

  setupInvoicePayment() {
    const openBtn = document.getElementById('openInvoiceModalBtn');
    const modalEl = document.getElementById('invoicePaymentModal');
    const form = document.getElementById('invoicePaymentForm');

    if (openBtn && modalEl) {
      openBtn.addEventListener('click', () => {
        // Here we could use a modal manager if it is exported from ui/modal.js
        modalEl.classList.add('active');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const method = document.querySelector('input[name="invoicePayMethod"]:checked')?.value;
        
        // Simular lógica de pagamento para anotação de backend
        toast.info('Processando pagamento da fatura...');
        
        setTimeout(() => {
          if (method === 'ACCOUNT_BALANCE') {
            toast.success('Fatura paga com sucesso usando o Saldo em Conta!');
          } else if (method === 'PIX') {
            toast.success('QR Code Pix gerado para pagamento da fatura.');
          } else {
            toast.success('Boleto bancário da fatura gerado e enviado por e-mail.');
          }
          
          if (modalEl) modalEl.classList.remove('active');
        }, 1200);
      });
    }
  }
};
