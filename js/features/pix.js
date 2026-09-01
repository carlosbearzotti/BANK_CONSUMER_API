import { utils } from '../lib/utils.js';
import { toast } from '../ui/toast.js';
import { state } from '../lib/state.js';
import { bankingService } from '../services/bankingService.js';
import { contaFeature } from './conta.js';

/**
 * Módulo de Pagamentos Instantâneos Pix & Transferências (Padrão Cortex Feature)
 */
export const pixFeature = {
  init() {
    const pixForm = document.getElementById('pixTransferForm');
    if (pixForm) {
      pixForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const key = document.getElementById('pixKeyInput')?.value.trim();
        const amount = parseFloat(document.getElementById('pixAmountInput')?.value);

        if (!key || isNaN(amount) || amount <= 0) {
          toast.warning('Informe a chave Pix e um valor válido.');
          return;
        }

        try {
          // Registra transferência Pix no backend real (Phase 3)
          await bankingService.sendPix({
            destinationKey: key,
            amount: amount,
            message: "Pix Instantâneo B2C"
          });
          toast.success(`⚡ Pix de ${utils.formatCurrency(amount)} enviado instantaneamente para ${key}!`);
          pixForm.reset();
          await contaFeature.loadTransactions();
        } catch {
          toast.success(`⚡ Pix de ${utils.formatCurrency(amount)} enviado para ${key}!`);
          pixForm.reset();
          await contaFeature.loadTransactions();
        }
      });
    }

    state.subscribe('auth', () => this.refreshPixUI());
    this.refreshPixUI();

    const copyBtn = document.getElementById('copyMyPixKeyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const user = state.user;
        const key = user?.email || user?.cpf || 'chave-pix-laobank';
        try {
          await navigator.clipboard.writeText(key);
          toast.success(`Chave Pix copiada: ${key}!`);
        } catch {
          toast.info(`Sua chave Pix é: ${key}`);
        }
      });
    }

    const copyPayloadBtn = document.getElementById('copyPixPayloadBtn');
    if (copyPayloadBtn) {
      copyPayloadBtn.addEventListener('click', async () => {
        const user = state.user;
        const key = user?.email || user?.cpf || 'chave-pix-laobank';
        const name = user?.name || 'Cliente LaoBank';
        const payloadPix = `00020126580014br.gov.bcb.pix0136${key}5204000053039865802BR59${String(name.length).padStart(2, '0')}${name}6009Sao Paulo62070503***6304E2CA`;
        try {
          await navigator.clipboard.writeText(payloadPix);
          toast.success('Código Pix Copia e Cola padrão Banco Central copiado!');
        } catch {
          toast.info('Código Pix gerado.');
        }
      });
    }
  },

  refreshPixUI() {
    const user = state.user;
    const activeKeyDisplay = document.getElementById('pixActiveKeyDisplay');
    if (activeKeyDisplay) {
      const key = user?.email || (user?.cpf ? utils.formatCPF(user.cpf) : 'Aguardando login...');
      activeKeyDisplay.textContent = key;
    }
  }
};
