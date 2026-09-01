import { loanService } from '../services/loanService.js';
import { LOAN_MODALITY_CONFIG } from '../lib/config.js';
import { state } from '../lib/state.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';
import { utils } from '../lib/utils.js';

/**
 * Módulo de Simulação e Contratação Real de Empréstimos (Padrão Cortex Feature)
 */
export const loansFeature = {
  selectedLoan: null,
  activeLoans: [],

  init() {
    this.setupSimulationForm();
    this.setupContractingModal();
    this.setupActiveLoansListeners();
    this.autoFillUserData();
    this.loadContractedLoans();

    // Auto-carrega ofertas pré-aprovadas ao iniciar
    if (state.token) {
      this.loadPreApprovedOffers();
    }

    state.subscribe('auth', () => {
      this.autoFillUserData();
      this.loadContractedLoans();
      if (state.token) this.loadPreApprovedOffers();
    });

    window.loansFeature = this;
  },

  autoFillUserData() {
    const user = state.user;
    if (!user) return;

    const nameInput = document.getElementById('loanName');
    const cpfInput = document.getElementById('loanCpf');
    const ageInput = document.getElementById('loanAge');
    const incomeInput = document.getElementById('loanIncome');
    const locationInput = document.getElementById('loanLocation');

    if (nameInput && user.name) nameInput.value = user.name;
    if (cpfInput && user.cpf) cpfInput.value = utils.formatCPF(user.cpf);
    if (ageInput && user.age) ageInput.value = user.age;
    if (incomeInput && user.income) incomeInput.value = user.income;
    if (locationInput) locationInput.value = user.location || 'SP';
  },

  setupSimulationForm() {
    const form = document.getElementById('loanSimulateForm');
    const loadPreApprovedBtn = document.getElementById('loadPreApprovedBtn');
    const container = document.getElementById('loanResultsContainer');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('loanName')?.value.trim();
        const cpf = document.getElementById('loanCpf')?.value.trim();
        const age = parseInt(document.getElementById('loanAge')?.value, 10);
        const income = parseFloat(document.getElementById('loanIncome')?.value);
        const location = document.getElementById('loanLocation')?.value.trim() || 'SP';

        if (!name || isNaN(income) || isNaN(age)) {
          toast.warning('Preencha os campos obrigatórios para simular.');
          return;
        }

        try {
          toast.info('Consultando motor de crédito do Integrados Core API...');
          const res = await loanService.simulate({
            name,
            cpf: cpf.replace(/\D/g, ''),
            age,
            income,
            location
          });

          this.renderResults(container, res, income);
          toast.success(`Análise concluída: ${res.loans?.length || 0} modalidades disponíveis!`);
        } catch (err) {
          toast.error(`Erro na simulação: ${err.message}`);
        }
      });
    }

    if (loadPreApprovedBtn) {
      loadPreApprovedBtn.addEventListener('click', () => {
        this.loadPreApprovedOffers();
      });
    }
  },

  async loadPreApprovedOffers() {
    const container = document.getElementById('loanResultsContainer');
    const user = state.user;
    if (!state.token) {
      toast.warning('Faça login para consultar ofertas pré-aprovadas.');
      return;
    }

    try {
      const location = document.getElementById('loanLocation')?.value.trim() || 'SP';
      const res = await loanService.getMyPreApprovedLoans(location);
      const income = user?.income || 5000;
      this.renderResults(container, res, income);
      toast.success(`Ofertas pré-aprovadas carregadas para ${user?.name || 'Cliente'}!`);
    } catch (err) {
      console.warn('Erro ao puxar /api/loans/me:', err.message);
    }
  },

  renderResults(container, data, income = 5000) {
    if (!container) return;

    const customer = data.customer || data.customerName || state.user?.name || 'Cliente';
    const loans = data.loans || [];

    if (loans.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border: 1px dashed var(--bank-border-soft); border-radius: var(--radius-md);">
          Nenhuma linha de crédito disponível para o perfil informado no momento.
        </div>
      `;
      return;
    }

    container.innerHTML = loans.map((loan) => {
      const typeKey = loan.type || 'PERSONAL';
      const config = LOAN_MODALITY_CONFIG[typeKey] || LOAN_MODALITY_CONFIG.PERSONAL;
      const rate = loan.interestRate || config.interestRate;
      
      // Limite proporcional à renda e modalidade
      let maxMultiplier = 5;
      if (typeKey === 'GUARANTEED') maxMultiplier = 12;
      if (typeKey === 'CONSIGNMENT') maxMultiplier = 18;
      const maxLimit = Math.max(2000, income * maxMultiplier);

      return `
        <div class="loan-card available">
          <div class="loan-badge-row">
            <span class="badge ${config.badgeClass}">${config.name}</span>
            <span class="loan-rate-pill">${rate}% a.m.</span>
          </div>

          <div class="loan-value-highlight">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Beneficiário Aprovado:</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #ffffff;">${customer}</div>
          </div>

          <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; margin: 0.75rem 0;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Limite Pré-Aprovado:</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #34d399; font-family: var(--font-mono);">
              ${utils.formatCurrency(maxLimit)}
            </div>
          </div>

          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Linha de crédito sob o motor regulatório LãoBank com liquidação na hora.
          </p>

          <button type="button" class="btn btn-gradient btn-sm" style="width: 100%; margin-top: auto;" onclick="window.loansFeature.openContractModal('${typeKey}', ${rate}, ${maxLimit})">
            ✍️ Contratar Linha
          </button>
        </div>
      `;
    }).join('');
  },

  openContractModal(typeKey, rate, maxLimit) {
    const config = LOAN_MODALITY_CONFIG[typeKey] || LOAN_MODALITY_CONFIG.PERSONAL;
    this.selectedLoan = {
      typeKey,
      name: config.name,
      badgeClass: config.badgeClass,
      rate: rate || config.interestRate,
      maxLimit: maxLimit || 25000
    };

    const modalBadge = document.getElementById('modalLoanBadge');
    const modalTitle = document.getElementById('modalLoanTitle');
    const modalRate = document.getElementById('modalLoanRate');
    const maxLimitSpan = document.getElementById('modalLoanMaxLimit');
    const amountInput = document.getElementById('loanAmountInput');
    const pinInput = document.getElementById('loanContractPinInput');

    if (modalBadge) {
      modalBadge.className = `badge ${config.badgeClass}`;
      modalBadge.textContent = config.name.toUpperCase();
    }
    if (modalTitle) modalTitle.textContent = `Contratação de ${config.name}`;
    if (modalRate) modalRate.textContent = `${this.selectedLoan.rate}% ao mês`;
    if (maxLimitSpan) maxLimitSpan.textContent = utils.formatCurrency(this.selectedLoan.maxLimit);
    if (amountInput) {
      amountInput.max = this.selectedLoan.maxLimit;
      amountInput.value = Math.min(5000, this.selectedLoan.maxLimit);
    }
    if (pinInput) pinInput.value = '';

    this.recalculateModalValues();
    modal.open('contractLoanModal');
  },

  setupContractingModal() {
    const amountInput = document.getElementById('loanAmountInput');
    const installmentsSelect = document.getElementById('loanInstallmentsSelect');
    const form = document.getElementById('contractLoanForm');

    if (amountInput) {
      amountInput.addEventListener('input', () => this.recalculateModalValues());
    }

    if (installmentsSelect) {
      installmentsSelect.addEventListener('change', () => this.recalculateModalValues());
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleContractSubmit();
      });
    }
  },

  recalculateModalValues() {
    if (!this.selectedLoan) return;

    const amountInput = document.getElementById('loanAmountInput');
    const installmentsSelect = document.getElementById('loanInstallmentsSelect');
    const pmtValSpan = document.getElementById('modalLoanPmtVal');
    const totalValSpan = document.getElementById('modalLoanTotalVal');
    const iofValSpan = document.getElementById('modalLoanIofVal');

    const principal = parseFloat(amountInput?.value) || 1000;
    const installments = parseInt(installmentsSelect?.value, 10) || 12;
    const i = (this.selectedLoan.rate || 3.0) / 100; // Taxa mensal

    // Cálculo Tabela Price: PMT = P * [ i * (1+i)^n ] / [ (1+i)^n - 1 ]
    const factor = Math.pow(1 + i, installments);
    const pmt = (principal * (i * factor)) / (factor - 1);
    const total = pmt * installments;
    const iof = principal * 0.0038;

    if (pmtValSpan) pmtValSpan.textContent = utils.formatCurrency(pmt);
    if (totalValSpan) totalValSpan.textContent = utils.formatCurrency(total);
    if (iofValSpan) iofValSpan.textContent = utils.formatCurrency(iof);
  },

  handleContractSubmit() {
    const user = state.user;
    const email = user?.email || user?.id || 'guest';
    const amountInput = document.getElementById('loanAmountInput');
    const installmentsSelect = document.getElementById('loanInstallmentsSelect');
    const pinInput = document.getElementById('loanContractPinInput');

    const principal = parseFloat(amountInput?.value);
    const installments = parseInt(installmentsSelect?.value, 10);
    const inputPin = pinInput?.value.trim();

    if (!principal || isNaN(principal) || principal <= 0) {
      toast.warning('Informe um valor de empréstimo válido.');
      return;
    }

    const storedPin = state.getTempPin(email);
    if (!inputPin || inputPin !== storedPin) {
      toast.error('Senha do cartão incorreta! Digite seu PIN de 4 dígitos cadastrado.');
      return;
    }

    // Calcula parcelas
    const i = (this.selectedLoan.rate || 3.0) / 100;
    const factor = Math.pow(1 + i, installments);
    const pmt = (principal * (i * factor)) / (factor - 1);
    const total = pmt * installments;

    // Cria Contrato Real
    const contract = {
      id: `EMP-${Date.now().toString().slice(-6)}`,
      protocol: `#LÃO-${Math.floor(100000 + Math.random() * 900000)}`,
      typeKey: this.selectedLoan.typeKey,
      typeName: this.selectedLoan.name,
      badgeClass: this.selectedLoan.badgeClass,
      principal,
      rate: this.selectedLoan.rate,
      installments,
      paidInstallments: 0,
      pmt,
      total,
      contractedAt: new Date().toLocaleDateString('pt-BR'),
      status: 'ATIVO'
    };

    state.addContractedLoan(email, contract);
    modal.close('contractLoanModal');

    toast.success(`🎉 Empréstimo de ${utils.formatCurrency(principal)} contratado com sucesso! Saldo liberado na sua conta.`);
    this.loadContractedLoans();
  },

  setupActiveLoansListeners() {
    const myLoansBtn = document.getElementById('myLoansBtn');
    if (myLoansBtn) {
      myLoansBtn.addEventListener('click', () => {
        this.loadContractedLoans();
        const section = document.getElementById('activeLoansContainer');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
        toast.info('Contratos de empréstimo atualizados!');
      });
    }
  },

  loadContractedLoans() {
    const user = state.user;
    const email = user?.email || user?.id || 'guest';
    this.activeLoans = state.getUserLoans(email);

    const countSpan = document.getElementById('activeLoansCount');
    const container = document.getElementById('activeLoansContainer');

    if (countSpan) countSpan.textContent = this.activeLoans.length;
    if (!container) return;

    if (this.activeLoans.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border: 1px dashed var(--bank-border-soft); border-radius: var(--radius-md);">
          Você ainda não possui nenhum empréstimo contratado. Faça uma simulação acima para contratar.
        </div>
      `;
      return;
    }

    container.innerHTML = this.activeLoans.map((contract) => {
      const isFinished = contract.paidInstallments >= contract.installments;
      const remainingInstallments = contract.installments - contract.paidInstallments;
      const remainingBalance = remainingInstallments * contract.pmt;

      return `
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid ${isFinished ? 'rgba(52, 211, 153, 0.4)' : 'rgba(197, 160, 89, 0.35)'}; border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <span class="badge ${contract.badgeClass || 'badge-primary'}" style="font-size: 0.725rem;">${contract.typeName}</span>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.25rem;">${contract.protocol}</div>
              </div>
              <span class="badge ${isFinished ? 'badge-success' : 'badge-gold'}" style="font-size: 0.7rem;">
                ${isFinished ? '✅ QUITADO' : '🟢 EM DIA'}
              </span>
            </div>

            <div style="margin-bottom: 0.85rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Valor Contratado:</div>
              <div style="font-size: 1.35rem; font-weight: 800; color: #ffffff; font-family: var(--font-mono);">
                ${utils.formatCurrency(contract.principal)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.78rem; margin-bottom: 1rem;">
              <div>
                <div style="color: var(--text-muted);">Parcelas:</div>
                <strong style="color: #ffffff;">${contract.paidInstallments} de ${contract.installments} pagas</strong>
              </div>
              <div>
                <div style="color: var(--text-muted);">Valor da Parcela:</div>
                <strong style="color: #34d399;">${utils.formatCurrency(contract.pmt)} /mês</strong>
              </div>
              <div>
                <div style="color: var(--text-muted);">Saldo Devedor:</div>
                <strong style="color: var(--bank-gold-light);">${utils.formatCurrency(remainingBalance)}</strong>
              </div>
              <div>
                <div style="color: var(--text-muted);">Contratado em:</div>
                <strong style="color: #ffffff;">${contract.contractedAt}</strong>
              </div>
            </div>
          </div>

          <div>
            ${!isFinished ? `
              <button type="button" class="btn btn-secondary btn-sm" style="width: 100%; font-size: 0.78rem;" onclick="window.loansFeature.payInstallment('${contract.id}')">
                💳 Pagar Próxima Parcela (${utils.formatCurrency(contract.pmt)})
              </button>
            ` : `
              <div style="font-size: 0.8rem; font-weight: 700; color: #34d399; text-align: center; padding: 0.4rem; background: rgba(52, 211, 153, 0.1); border-radius: var(--radius-sm);">
                🎉 Contrato 100% Quitado
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  payInstallment(contractId) {
    const user = state.user;
    const email = user?.email || user?.id || 'guest';
    const loans = state.getUserLoans(email);
    const contract = loans.find((l) => l.id === contractId);

    if (!contract) return;

    if (contract.paidInstallments < contract.installments) {
      contract.paidInstallments += 1;
      if (contract.paidInstallments >= contract.installments) {
        contract.status = 'QUITADO';
        toast.success(`🎉 Parabéns! Você quitou todas as parcelas do contrato ${contract.protocol}!`);
      } else {
        toast.success(`Parcela ${contract.paidInstallments}/${contract.installments} paga com sucesso!`);
      }

      state.saveUserLoans(email, loans);
      this.loadContractedLoans();
    }
  }
};
