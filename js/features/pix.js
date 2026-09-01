import { utils } from '../lib/utils.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Pagamentos Instantâneos Pix (Padrão Cortex Feature)
 */
export const pixFeature = {
  init() {
    const pixForm = document.getElementById('pixTransferForm');
    if (pixForm) {
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

    const copyBtn = document.getElementById('copyMyPixKeyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const user = state.user;
        const key = user?.email || user?.cpf || 'chave-pix-laobank';
        const name = user?.name || 'Cliente LãoBank';
        const payloadPix = `00020126580014br.gov.bcb.pix0136${key}5204000053039865802BR59${String(name.length).padStart(2, '0')}${name}6009Sao Paulo62070503***6304`;
        try {
          await navigator.clipboard.writeText(payloadPix);
          toast.success(`Chave Pix copiada (${key})!`);
        } catch {
          toast.info(`Sua chave Pix é: ${key}`);
        }
      });
    }
  }
};
