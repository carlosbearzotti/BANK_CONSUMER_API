import { request } from './api.js';
import { state } from './state.js';

export const transactionsModule = {
  init(showToast) {
    const txForm = document.getElementById('txForm');
    const loadTxBtn = document.getElementById('loadTxBtn');
    const txTableBody = document.getElementById('txTableBody');

    const renderTransactions = (transactions) => {
      if (!txTableBody) return;
      if (!transactions || transactions.length === 0) {
        txTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhuma transação encontrada.</td></tr>`;
        return;
      }

      txTableBody.innerHTML = transactions.map(tx => `
        <tr>
          <td><strong>#${tx.id}</strong></td>
          <td>
            <span class="crypto-badge crypto-aes">AES-256</span>
            <span style="font-family: var(--font-mono); margin-left: 0.4rem;">${tx.userDocument || 'N/A'}</span>
          </td>
          <td>
            <span class="crypto-badge crypto-rsa">RSA-2048</span>
            <span style="font-family: var(--font-mono); margin-left: 0.4rem;">•••• ${String(tx.creditCardToken || '').slice(-4)}</span>
          </td>
          <td><strong>R$ ${((tx.value || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="alert('Transação ID #${tx.id}\\nDocumento: ${tx.userDocument}\\nCartão: ${tx.creditCardToken}\\nValor: R$ ${((tx.value || 0) / 100)}')">Detalhes</button>
          </td>
        </tr>
      `).join('');
    };

    if (txForm) {
      txForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userDocument = document.getElementById('txDoc').value.trim();
        const creditCardToken = document.getElementById('txCard').value.trim();
        const rawValue = parseFloat(document.getElementById('txValue').value) || 0;
        const value = Math.round(rawValue * 100); // centavos

        try {
          const res = await request('/api/transactions', {
            method: 'POST',
            body: { userDocument, creditCardToken, value }
          });

          showToast(`Transação #${res.id} criada com criptografia híbrida AES/RSA!`, 'success');
          txForm.reset();
          loadTransactions();
        } catch (err) {
          showToast(`Erro ao criar transação: ${err.message}`, 'error');
        }
      });
    }

    const loadTransactions = async () => {
      try {
        const list = await request('/api/transactions');
        renderTransactions(list);
      } catch (err) {
        showToast(`Erro ao listar transações: ${err.message}`, 'error');
      }
    };

    if (loadTxBtn) {
      loadTxBtn.addEventListener('click', loadTransactions);
    }
  }
};
