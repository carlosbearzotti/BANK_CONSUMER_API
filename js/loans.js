import { request } from './api.js';
import { state } from './state.js';

export const loansModule = {
  init(showToast) {
    const simulateForm = document.getElementById('loanSimulateForm');
    const myLoansBtn = document.getElementById('myLoansBtn');
    const resultsContainer = document.getElementById('loanResultsContainer');

    const renderLoanCards = (customer, loans) => {
      if (!resultsContainer) return;
      if (!loans || loans.length === 0) {
        resultsContainer.innerHTML = `<p style="color: var(--text-muted);">Nenhuma modalidade de empréstimo disponível para este perfil.</p>`;
        return;
      }

      resultsContainer.innerHTML = loans.map(loan => {
        const rate = loan.interest_rate ?? loan.interestRate ?? 0;
        const type = loan.type || 'EMPRÉSTIMO';
        return `
          <div class="loan-card available">
            <div class="loan-card-header">
              <span class="badge badge-success">${type}</span>
              <span class="badge badge-primary">Elegível</span>
            </div>
            <div>
              <div class="loan-rate">${rate}<span>% a.m.</span></div>
              <p style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.5rem;">
                Taxa especial calculada para ${customer || 'cliente'}.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="alert('Solicitação de ${type} encaminhada!')">Contratar</button>
          </div>
        `;
      }).join('');
    };

    if (simulateForm) {
      simulateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('loanName').value.trim();
        const cpf = document.getElementById('loanCpf').value.trim();
        const age = parseInt(document.getElementById('loanAge').value, 10);
        const income = parseFloat(document.getElementById('loanIncome').value);
        const location = document.getElementById('loanLocation').value.trim();

        try {
          const res = await request('/customer-loans', {
            method: 'POST',
            body: { name, cpf, age, income, location }
          });

          renderLoanCards(res.customer, res.loans);
          showToast(`Simulação concluída! ${res.loans?.length || 0} modalidade(s) elegível(is).`, 'success');
        } catch (err) {
          showToast(`Erro na simulação: ${err.message}`, 'error');
        }
      });
    }

    if (myLoansBtn) {
      myLoansBtn.addEventListener('click', async () => {
        if (!state.token) {
          showToast('Você precisa estar autenticado para consultar seus empréstimos!', 'warning');
          return;
        }

        try {
          const res = await request('/api/loans/me');
          renderLoanCards(res.customer || state.user?.name, res.loans);
          showToast('Empréstimos do perfil autenticado carregados!', 'success');
        } catch (err) {
          showToast(`Erro ao carregar empréstimos: ${err.message}`, 'error');
        }
      });
    }
  }
};
