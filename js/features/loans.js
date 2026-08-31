import { loanService } from '../services/loanService.js';
import { LOAN_MODALITY_CONFIG } from '../lib/config.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Simulação de Empréstimos (Padrão Cortex Feature)
 */
export const loansFeature = {
  init() {
    const form = document.getElementById('loanSimulateForm');
    const myLoansBtn = document.getElementById('myLoansBtn');
    const container = document.getElementById('loanResultsContainer');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('loanName')?.value.trim();
        const cpf = document.getElementById('loanCpf')?.value.trim();
        const age = parseInt(document.getElementById('loanAge')?.value, 10);
        const income = parseFloat(document.getElementById('loanIncome')?.value);
        const location = document.getElementById('loanLocation')?.value.trim();

        if (!name || isNaN(income) || isNaN(age)) {
          toast.warning('Preencha os campos obrigatórios para simular.');
          return;
        }

        try {
          const res = await loanService.simulate({
            name,
            cpf: cpf.replace(/\D/g, ''),
            age,
            income,
            location
          });

          this.renderResults(container, res);
          toast.success(`Análise concluída: ${res.loans?.length || 0} modalidades disponíveis!`);
        } catch (err) {
          toast.error(`Erro na simulação: ${err.message}`);
        }
      });
    }

    if (myLoansBtn) {
      myLoansBtn.addEventListener('click', () => {
        toast.info('Consultando contratos de empréstimo ativos...');
      });
    }
  },

  renderResults(container, data) {
    if (!container) return;

    const customer = data.customer || data.customerName || 'Cliente';
    const loans = data.loans || [];

    if (loans.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--text-muted);">
          Nenhuma modalidade de crédito disponível para o perfil informado no momento.
        </div>
      `;
      return;
    }

    container.innerHTML = loans.map((loan) => {
      const typeKey = loan.type || 'PERSONAL';
      const config = LOAN_MODALITY_CONFIG[typeKey] || LOAN_MODALITY_CONFIG.PERSONAL;
      const rate = loan.interestRate || config.interestRate;

      return `
        <div class="loan-card available">
          <div class="loan-badge-row">
            <span class="badge ${config.badgeClass}">${config.name}</span>
            <span class="loan-rate-pill">${rate}% a.m.</span>
          </div>

          <div class="loan-value-highlight">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Beneficiário:</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">${customer}</div>
          </div>

          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.5rem 0;">
            Linha de crédito pré-aprovada sob o motor de regras da API LãoBank.
          </p>

          <button class="btn btn-gradient btn-sm" style="width: 100%; margin-top: auto;" onclick="alert('Proposta de ${config.name} enviada para formalização digital!');">
            Contratar Linha
          </button>
        </div>
      `;
    }).join('');
  }
};
