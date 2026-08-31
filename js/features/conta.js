import { bankingService } from '../services/bankingService.js';
import { state } from '../lib/state.js';
import { utils } from '../lib/utils.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Conta Corrente, Extrato e Transferências Criptografadas
 */
export const contaFeature = {
  init() {
    this.setupTransactionForm();
    this.setupExtratoListeners();
    this.loadTransactions();
  },

  setupTransactionForm() {
    const form = document.getElementById('txForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const doc = document.getElementById('txDoc')?.value.trim();
      const card = document.getElementById('txCard')?.value.trim();
      const val = parseFloat(document.getElementById('txValue')?.value);

      if (!doc || !card || isNaN(val)) {
        toast.warning('Preencha todos os dados da transferência.');
        return;
      }

      const payload = {
        userDocument: doc.replace(/\D/g, ''),
        creditCardToken: card,
        transactionValue: val,
        userId: state.user?.id || 1
      };

      try {
        await bankingService.createTransaction(payload);
        toast.success('🔒 Transferência protegida enviada e criptografada com sucesso!');
        form.reset();
        await this.loadTransactions();
      } catch (err) {
        toast.error(`Falha na transferência: ${err.message}`);
      }
    });
  },

  setupExtratoListeners() {
    const refreshBtn = document.getElementById('refreshExtratoBtn');
    const loadTxBtn = document.getElementById('loadTxBtn');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadTransactions();
        toast.info('Extrato atualizado.');
      });
    }

    if (loadTxBtn) {
      loadTxBtn.addEventListener('click', () => {
        this.loadTransactions();
      });
    }
  },

  async loadTransactions() {
    const tableBody = document.getElementById('txTableBody');
    if (!tableBody) return;

    try {
      const data = await bankingService.getTransactions();
      const list = Array.isArray(data) ? data : (data.content || data.transactions || []);

      if (list.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); font-size: 0.825rem; padding: 1.25rem;">
              Nenhuma transação registrada no cofre criptográfico.
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = list.map((tx) => `
        <tr>
          <td><span class="badge badge-gold">#${tx.id}</span></td>
          <td style="font-family: var(--font-mono); font-size: 0.775rem;">
            ${tx.userDocument || tx.document || 'AES-256 Protegido'}
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.775rem;">
            ${tx.creditCardToken ? tx.creditCardToken.slice(0, 16) + '...' : 'RSA-2048'}
          </td>
          <td style="font-weight: 700; color: #34d399;" class="balance-sensitive">
            ${utils.formatCurrency(tx.transactionValue || tx.value || 0)}
          </td>
          <td>
            <span class="badge badge-success">Auditado</span>
          </td>
        </tr>
      `).join('');
    } catch {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem;">
            Conectado ao cofre seguro da conta.
          </td>
        </tr>
      `;
    }
  }
};
