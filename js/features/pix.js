import { utils } from '../lib/utils.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Pagamentos Instantâneos Pix (Padrão Cortex Feature)
 */
export const pixFeature = {
  init() {
    const pixForm = document.getElementById('pixTransferForm');
    if (!pixForm) return;

    pixForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const key = document.getElementById('pixKeyInput')?.value.trim();
      const amount = parseFloat(document.getElementById('pixAmountInput')?.value);

      if (!key || isNaN(amount) || amount <= 0) {
        toast.warning('Informe a chave Pix e um valor válido.');
        return;
      }

      toast.success(`⚡ Pix de ${utils.formatCurrency(amount)} enviado instantaneamente para ${key}!`);
      pixForm.reset();
    });
  }
};
