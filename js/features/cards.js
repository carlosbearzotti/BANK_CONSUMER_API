import { toast } from '../ui/toast.js';
import { state } from '../lib/state.js';
import { CARD_PLANS_CONFIG } from '../lib/config.js';

/**
 * Módulo de Cartões de Crédito e Cartão Virtual 3D (Padrão Cortex Feature)
 */
export const cardsFeature = {
  invoiceAmount: 0.00,
  cards: [],

  init() {
    this.loadCards();
    this.setupCardFlip();
    this.setupCardActions();
    this.setupInvoicePayment();

    state.subscribe('auth', () => {
      this.loadCards();
      this.refreshCardMetrics();
    });
    this.refreshCardMetrics();
  },

  loadCards() {
    const user = state.user;
    const userEmail = user?.email || user?.id || 'guest';
    const stored = localStorage.getItem(`laobank_cards_${userEmail}`);
    if (stored) {
      try {
        this.cards = JSON.parse(stored);
      } catch {
        this.cards = [];
      }
    } else {
      // Cria o cartão físico padrão baseado no plano de contratação
      const userIncome = user?.income || 0;
      const initialLimit = userIncome > 0 ? userIncome * 0.8 : 0;
      const planKey = localStorage.getItem(`laobank_user_plan_${userEmail}`) || 'FREE';
      const planConfig = CARD_PLANS_CONFIG[planKey] || CARD_PLANS_CONFIG.FREE;
      const storedPin = localStorage.getItem(`laobank_card_pin_${userEmail}`) || '1234';

      this.cards = [
        {
          id: 'card-physical-1',
          type: 'PHYSICAL',
          name: planConfig.cardName,
          planId: planConfig.id,
          planName: planConfig.name,
          number: '•••• •••• •••• 8824',
          last4: '8824',
          expiry: '08/32',
          cvv: '592',
          cardPin: storedPin,
          isBlocked: false,
          onlineLimit: initialLimit,
          isVirtual: false,
          colorGrad: planConfig.colorGrad,
          accentColor: planConfig.accentColor
        }
      ];
      this.saveCards();
    }
  },

  saveCards() {
    const user = state.user;
    localStorage.setItem(`laobank_cards_${user?.id || user?.email || 'guest'}`, JSON.stringify(this.cards));
    this.renderCardsGrid();
    this.updateSelectBlockDropdown();
  },

  renderCardsGrid() {
    const grid = document.getElementById('cardsListGrid');
    const totalCount = document.getElementById('totalCardsCount');
    if (!grid) return;

    if (totalCount) totalCount.textContent = this.cards.length;

    grid.innerHTML = this.cards.map((card, index) => {
      const user = state.user;
      const holderName = (user?.name || 'TITULAR DA CONTA').toUpperCase();
      const statusBadge = card.isBlocked 
        ? '<span class="badge badge-danger">🔒 Bloqueado</span>' 
        : '<span class="badge badge-success">✓ Ativo</span>';
      const typeBadge = card.isVirtual
        ? '<span class="badge badge-primary">🌐 Virtual Dinâmico</span>'
        : '<span class="badge badge-gold">💳 Físico Contactless</span>';

      return `
        <div class="card" style="padding: 1.25rem; background: rgba(15,23,42,0.6); border: 1px solid ${card.isBlocked ? 'rgba(239,68,68,0.4)' : 'var(--bank-border-soft)'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              ${typeBadge}
              ${statusBadge}
            </div>
            <span style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted);">#${card.last4}</span>
          </div>

          <!-- 3D Mini Card Interactive -->
          <div class="credit-card-perspective" id="cardEl_${card.id}" onclick="this.classList.toggle('flipped')" style="max-width: 320px; height: 190px; margin-bottom: 1rem;">
            <div class="credit-card-inner">
              <!-- Front -->
              <div class="credit-card-front" style="background: ${card.colorGrad}; border-color: ${card.accentColor};">
                <div class="card-chip-row">
                  <div class="card-emv-chip"></div>
                  <div style="font-size: 0.75rem; font-weight: 700; color: ${card.accentColor};">LãoBank ${card.isVirtual ? 'Virtual' : 'Prestige'}</div>
                </div>
                <div class="card-number-display" style="font-size: 1.05rem; letter-spacing: 0.12em;">${card.number}</div>
                <div class="card-meta-row">
                  <div>
                    <div style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">Titular</div>
                    <div class="card-holder-name" style="font-size: 0.75rem;">${holderName}</div>
                  </div>
                  <div>
                    <div style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">Validade</div>
                    <div class="card-expiry" style="font-size: 0.75rem;">${card.expiry}</div>
                  </div>
                  <div style="font-weight: 800; font-size: 1.1rem; font-style: italic; color: #ffffff;">VISA</div>
                </div>
              </div>
              <!-- Back -->
              <div class="credit-card-back" style="background: #080c16;">
                <div class="card-black-stripe" style="margin-top: 0.5rem;"></div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; margin-top: 0.5rem;">
                  <span style="font-size: 0.65rem; color: #94a3b8;">CVV DE SEGURANÇA:</span>
                  <div class="card-cvv-box" style="padding: 0.2rem 0.6rem; font-size: 0.85rem;">${card.cvv}</div>
                </div>
                <div style="font-size: 0.6rem; color: #64748b; text-align: center; margin-top: 0.5rem;">
                  ${card.isVirtual ? 'Cartão temporário protegido para compras online' : 'LãoBank S.A. • Proteção Criptográfica 24h'}
                </div>
              </div>
            </div>
          </div>

          <!-- Limite Para Compras Online & Ações do Cartão -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--bank-border-subtle); border-radius: var(--radius-md); padding: 0.75rem; margin-top: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; font-size: 0.8rem;">
              <span style="color: var(--text-secondary);">🌐 Limite para Compras Online:</span>
              <strong style="color: #60a5fa;" id="onlineLimitText_${card.id}">R$ ${card.onlineLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.6rem; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.75rem;" onclick="window.cardsFeature.adjustOnlineLimit('${card.id}')">
                ⚙️ Limite Online
              </button>
              <button class="btn ${card.isBlocked ? 'btn-success' : 'btn-danger'} btn-sm" style="font-size: 0.75rem;" onclick="window.cardsFeature.toggleSingleCardBlock('${card.id}')">
                ${card.isBlocked ? '🔓 Desbloquear' : '🔒 Bloquear'}
              </button>
              ${card.isVirtual ? `
                <button class="btn btn-danger btn-sm" style="font-size: 0.75rem;" title="Excluir Cartão Virtual" onclick="window.cardsFeature.deleteVirtualCard('${card.id}')">
                  🗑️ Excluir
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  deleteVirtualCard(cardId) {
    const card = this.cards.find((c) => c.id === cardId);
    if (!card) return;
    if (!card.isVirtual) {
      toast.warning('O Cartão Físico principal da conta não pode ser excluído.');
      return;
    }

    if (confirm(`Deseja realmente excluir o Cartão Virtual •••• ${card.last4}?\n\n⚠️ Atenção: Quaisquer compras ou gastos já lançados permanecerão computados na fatura geral da conta.`)) {
      this.cards = this.cards.filter((c) => c.id !== cardId);
      this.saveCards();
      this.refreshCardMetrics();
      toast.success(`🗑️ Cartão Virtual •••• ${card.last4} excluído! Seus lançamentos continuam registrados na fatura geral.`);
    }
  },

  updateSelectBlockDropdown() {
    const select = document.getElementById('selectCardToBlock');
    if (!select) return;
    select.innerHTML = this.cards.map((c) => {
      const typeLabel = c.isVirtual ? 'Virtual' : 'Físico';
      const statusLabel = c.isBlocked ? '(BLOQUEADO)' : '(ATIVO)';
      return `<option value="${c.id}">${typeLabel} •••• ${c.last4} ${statusLabel}</option>`;
    }).join('');
  },

  toggleSingleCardBlock(cardId) {
    const card = this.cards.find((c) => c.id === cardId);
    if (!card) return;
    card.isBlocked = !card.isBlocked;
    this.saveCards();
    this.refreshCardMetrics();
    toast.info(card.isBlocked ? `Cartão •••• ${card.last4} foi bloqueado temporariamente.` : `Cartão •••• ${card.last4} foi desbloqueado com sucesso!`);
  },

  adjustOnlineLimit(cardId) {
    const card = this.cards.find((c) => c.id === cardId);
    if (!card) return;
    const current = card.onlineLimit || 0;
    const input = prompt(`Informe o novo limite de compras online para o cartão •••• ${card.last4} (Valor atual: R$ ${current.toFixed(2)}):`, current);
    if (input !== null) {
      const parsed = parseFloat(input.replace(',', '.'));
      if (!isNaN(parsed) && parsed >= 0) {
        card.onlineLimit = parsed;
        this.saveCards();
        this.refreshCardMetrics();
        toast.success(`Limite online do cartão •••• ${card.last4} atualizado para R$ ${parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}!`);
      } else {
        toast.warning('Valor de limite inválido.');
      }
    }
  },

  generateVirtualCard() {
    const user = state.user;
    const count = this.cards.filter((c) => c.isVirtual).length + 1;
    const rand4 = Math.floor(1000 + Math.random() * 9000).toString();
    const randCvv = Math.floor(100 + Math.random() * 900).toString();
    const userIncome = user?.income || 0;
    const defaultOnlineLimit = userIncome > 0 ? userIncome * 0.5 : 1000.00;

    const newVirtual = {
      id: `card-virtual-${Date.now()}`,
      type: 'VIRTUAL',
      name: `Cartão Virtual 0${count}`,
      number: `•••• •••• •••• ${rand4}`,
      last4: rand4,
      expiry: '12/28',
      cvv: randCvv,
      isBlocked: false,
      onlineLimit: defaultOnlineLimit,
      isVirtual: true,
      colorGrad: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)',
      accentColor: '#34d399'
    };

    this.cards.push(newVirtual);
    this.saveCards();
    this.refreshCardMetrics();
    toast.success(`✨ Novo Cartão Virtual final •••• ${rand4} emitido com sucesso! Limite online: R$ ${defaultOnlineLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  },

  refreshCardMetrics() {
    const user = state.user;
    const income = user?.income || 0;
    const totalLimit = income > 0 ? income * 0.8 : 0;
    const availableLimit = Math.max(0, totalLimit - this.invoiceAmount);
    const progressPercent = totalLimit > 0 ? ((this.invoiceAmount / totalLimit) * 100).toFixed(0) : 0;

    const availableLimitEl = document.getElementById('cardAvailableLimit');
    const totalLimitEl = document.getElementById('cardTotalLimit');
    const progressFillEl = document.getElementById('cardLimitProgressFill');
    const invoiceTextEl = document.getElementById('cardInvoiceText');
    const cardsTabInvoiceDisplay = document.getElementById('cardsTabInvoiceDisplay');
    const modalInvoiceValueDisplay = document.getElementById('modalInvoiceValueDisplay');

    if (availableLimitEl) availableLimitEl.textContent = `R$ ${availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (totalLimitEl) totalLimitEl.textContent = `R$ ${totalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (progressFillEl) progressFillEl.style.width = `${progressPercent}%`;
    if (invoiceTextEl) invoiceTextEl.textContent = `R$ ${this.invoiceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (cardsTabInvoiceDisplay) cardsTabInvoiceDisplay.textContent = `R$ ${this.invoiceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (modalInvoiceValueDisplay) modalInvoiceValueDisplay.textContent = `R$ ${this.invoiceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    this.renderCardsGrid();
    this.updateSelectBlockDropdown();
  },

  setupCardFlip() {
    const cardEl = document.getElementById('interactiveCreditCard');
    if (!cardEl) return;
    cardEl.addEventListener('click', () => {
      cardEl.classList.toggle('flipped');
    });
  },

  setupCardActions() {
    const generateBtn = document.getElementById('generateNewVirtualCardBtn');
    const modalEl = document.getElementById('virtualCardConfirmModal');
    const form = document.getElementById('virtualCardPasswordForm');
    const pinInput = document.getElementById('virtualCardPinInput');

    if (generateBtn && modalEl) {
      generateBtn.addEventListener('click', () => {
        if (pinInput) pinInput.value = '';
        modalEl.classList.add('active');
        if (pinInput) pinInput.focus();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = state.user;
        const inputPin = pinInput?.value.trim();
        const storedPin = localStorage.getItem(`laobank_card_pin_${user?.email || user?.id}`) || '1234';

        if (!inputPin || inputPin.length !== 4) {
          toast.warning('A senha do cartão deve conter exatamente 4 dígitos.');
          return;
        }

        if (inputPin !== storedPin) {
          toast.error('Senha do cartão incorreta! Verifique o PIN cadastrado.');
          return;
        }

        modalEl.classList.remove('active');
        this.generateVirtualCard();
      });
    }

    const toggleSelectedBtn = document.getElementById('toggleSelectedCardBlockBtn');
    if (toggleSelectedBtn) {
      toggleSelectedBtn.addEventListener('click', () => {
        const select = document.getElementById('selectCardToBlock');
        const selectedId = select?.value;
        if (selectedId) {
          this.toggleSingleCardBlock(selectedId);
        } else {
          toast.warning('Selecione um cartão para bloquear ou desbloquear.');
        }
      });
    }
  },

  setupInvoicePayment() {
    const openBtn = document.getElementById('openInvoiceModalBtn');
    const modalEl = document.getElementById('invoicePaymentModal');
    const form = document.getElementById('invoicePaymentForm');
    const balanceSpan = document.getElementById('modalCurrentBalance');

    if (openBtn && modalEl) {
      openBtn.addEventListener('click', () => {
        const user = state.user;
        const currentBalance = user?.balance != null ? user.balance : 0.00;
        if (balanceSpan) {
          balanceSpan.textContent = `R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
        this.refreshCardMetrics();
        modalEl.classList.add('active');
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const method = document.querySelector('input[name="invoicePayMethod"]:checked')?.value;
        const user = state.user;
        const userEmail = user?.email || 'correntista@laobank.com.br';
        const userName = user?.name || 'Correntista LãoBank';

        if (this.invoiceAmount <= 0) {
          toast.info('Não há fatura pendente para pagamento (R$ 0,00).');
          if (modalEl) modalEl.classList.remove('active');
          return;
        }

        toast.info('Processando operação de pagamento...');

        if (method === 'ACCOUNT_BALANCE') {
          const currentBalance = user?.balance != null ? user.balance : 0.00;
          if (currentBalance < this.invoiceAmount) {
            toast.warning(`Saldo insuficiente (R$ ${currentBalance.toFixed(2)}) para quitar a fatura de R$ ${this.invoiceAmount.toFixed(2)}.`);
          } else {
            toast.success(`Fatura de R$ ${this.invoiceAmount.toFixed(2)} paga com sucesso via Saldo em Conta!`);
            this.invoiceAmount = 0;
            this.refreshCardMetrics();
          }
          if (modalEl) modalEl.classList.remove('active');

        } else if (method === 'PIX') {
          const pixCode = `00020126580014br.gov.bcb.pix0136laobank-faturas@laobank.com.br5204000053039865802BR5915LAOBANK DIGITAL6009SAO PAULO62170513FATURA${Date.now()}6304`;
          try {
            await navigator.clipboard.writeText(pixCode);
            toast.success('Código Pix Copia e Cola gerado e copiado para a área de transferência!');
          } catch {
            toast.info('Código Pix gerado com sucesso!');
          }
          if (modalEl) modalEl.classList.remove('active');

        } else if (method === 'BOLETO') {
          const barcode = `07790.00018 04829.400014 00000.000000 1 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
          const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

          try {
            await navigator.clipboard.writeText(barcode);
          } catch {}

          try {
            await fetch('http://localhost:3002/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: userEmail,
                name: userName,
                template: 'boleto',
                amount: `R$ ${this.invoiceAmount.toFixed(2)}`,
                barcode: barcode,
                dueDate: dueDate,
                subject: `📄 Boleto Bancário LãoBank - Fatura R$ ${this.invoiceAmount.toFixed(2)}`
              })
            });

            toast.success(`Boleto emitido! Linha digitável copiada e boleto enviado para ${userEmail} no Notify Hub (Porta 3002).`);
          } catch {
            toast.success(`Boleto emitido! Linha digitável: ${barcode} (Copiada para a área de transferência).`);
          }

          if (modalEl) modalEl.classList.remove('active');
        }
      });
    }
  }
};

// Vincula globalmente para chamadas nos botões inline
window.cardsFeature = cardsFeature;

