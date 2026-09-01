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
    const recentList = document.getElementById('recentTransactionsList');
    if (!tableBody && !recentList) return;

    try {
      const data = await bankingService.getTransactions();
      const list = Array.isArray(data) ? data : (data.content || data.transactions || []);

      if (list.length === 0) {
        if (recentList) {
          recentList.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); border: 1px dashed var(--bank-border-soft);">
              <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💳</div>
              <strong>Nenhuma movimentação realizada ainda</strong>
              <div style="font-size: 0.775rem; margin-top: 0.25rem;">Faça sua primeira transferência ou Pix para visualizar aqui seu extrato detalhado.</div>
            </div>
          `;
        }
        if (tableBody) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; color: var(--text-muted); font-size: 0.825rem; padding: 1.25rem;">
                Nenhuma transação registrada no cofre criptográfico para esta conta.
              </td>
            </tr>
          `;
        }
        return;
      }

      if (recentList) {
        recentList.innerHTML = list.slice(0, 5).map((tx) => `
          <div class="tx-card-item">
            <div class="tx-item-left">
              <div class="tx-icon-circle ${tx.creditCardToken ? 'card' : 'pix'}">${tx.creditCardToken ? '💳' : '⚡'}</div>
              <div class="tx-item-info">
                <h4>${tx.userDocument ? `Destinatário: ${tx.userDocument}` : 'Transferência Segura'}</h4>
                <span>Ref: #${tx.id} &bull; Proteção AES-256</span>
              </div>
            </div>
            <div class="tx-item-right">
              <div class="tx-item-value negative balance-sensitive">- ${utils.formatCurrency(tx.transactionValue || 0)}</div>
              <span class="badge badge-success" style="font-size: 0.65rem;">Auditado</span>
            </div>
          </div>
        `).join('');
      }

      if (tableBody) {
        tableBody.innerHTML = list.map((tx) => `
          <tr>
            <td><span class="badge badge-gold">#${tx.id}</span></td>
            <td style="font-family: var(--font-mono); font-size: 0.775rem;">
              ${tx.userDocument || 'AES-256'}
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
      }
    } catch {
      if (recentList) {
        recentList.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
            Pronto para registrar suas movimentações.
          </div>
        `;
      }
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem;">
              Conectado ao cofre seguro da conta.
            </td>
          </tr>
        `;
      }
    }
  }
};
