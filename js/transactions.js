import { bankingService } from './services/bankingService.js';

export const transactionsModule = {
  init(showToast) {
    const txForm = document.getElementById('txForm');
    const loadTxBtn = document.getElementById('loadTxBtn');
    const txTableBody = document.getElementById('txTableBody');
    const refreshExtratoBtn = document.getElementById('refreshExtratoBtn');

    const renderTransactions = (transactions) => {
      if (!txTableBody) return;
      if (!transactions || transactions.length === 0) {
        txTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhuma transação encontrada no cofre.</td></tr>`;
        return;
      }

      txTableBody.innerHTML = transactions.map(tx => `
        <tr>
          <td><strong>#${tx.id}</strong></td>
          <td>
            <span class="crypto-badge crypto-aes">AES-256</span>
            <span style="font-family: var(--font-mono); margin-left: 0.4rem; font-size: 0.8rem;">${tx.userDocument || 'N/A'}</span>
          </td>
          <td>
            <span class="crypto-badge crypto-rsa">RSA-2048</span>
            <span style="font-family: var(--font-mono); margin-left: 0.4rem; font-size: 0.8rem;">•••• ${String(tx.creditCardToken || '').slice(-4)}</span>
          </td>
          <td><strong style="color: #f1f5f9;">R$ ${((tx.value || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="alert('Auditoria LãoBank - Transação Criptográfica:\\nID: #${tx.id}\\nDocumento AES: ${tx.userDocument}\\nToken Cartão RSA: ${tx.creditCardToken}\\nValor: R$ ${((tx.value || 0) / 100).toFixed(2)}')">Detalhes</button>
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
          const res = await bankingService.createTransaction({
            userDocument,
            creditCardToken,
            value
          });

          showToast(`LãoBank Cofre: Transação #${res.id} protegida com AES-256 e RSA-2048!`, 'success');
          txForm.reset();
          loadTransactions();
        } catch (err) {
          showToast(`Erro ao criar transação no cofre: ${err.message}`, 'error');
        }
      });
    }

    const loadTransactions = async () => {
      try {
        const list = await bankingService.getTransactions();
        renderTransactions(list);
      } catch (err) {
        // Fallback demo row if offline
        renderTransactions([
          { id: 101, userDocument: 'bXljcGYxMjM=', creditCardToken: 'rsa_enc_token_4111_982', value: 15000 },
          { id: 102, userDocument: 'ZG9jdW1lbnRfYWVz', creditCardToken: 'rsa_enc_token_5502_114', value: 8900 }
        ]);
      }
    };

    if (loadTxBtn) {
      loadTxBtn.addEventListener('click', loadTransactions);
    }

    if (refreshExtratoBtn) {
      refreshExtratoBtn.addEventListener('click', () => {
        showToast('Extrato da conta atualizado!', 'info');
      });
    }

    // Auto-load once
    loadTransactions();
  }
};
