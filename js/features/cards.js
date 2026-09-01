import { toast } from '../ui/toast.js';
import { state } from '../lib/state.js';

/**
 * Módulo de Cartões de Crédito e Cartão Virtual 3D (Padrão Cortex Feature)
 */
export const cardsFeature = {
  invoiceAmount: 0.00,

  init() {
    this.setupCardFlip();
    this.setupCardActions();
    this.setupInvoicePayment();

    state.subscribe('auth', () => this.refreshCardMetrics());
    this.refreshCardMetrics();
  },

  refreshCardMetrics() {
    const user = state.user;
    const income = user?.income || 0;
    // Para conta real recém-criada: fatura zerada ou calculada, limite proporcional à renda
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
  },

  setupCardFlip() {
    const cardEl = document.getElementById('interactiveCreditCard');
    if (!cardEl) return;

    cardEl.addEventListener('click', () => {
      cardEl.classList.toggle('flipped');
    });
  },

  setupCardActions() {
    const blockBtn = document.getElementById('toggleCardBlockBtn');
    let isBlocked = false;

    if (blockBtn) {
      blockBtn.addEventListener('click', () => {
        isBlocked = !isBlocked;
        blockBtn.textContent = isBlocked ? '🔓 Bloqueio Temporário: Ativado' : '🔒 Bloqueio Temporário: Desativado';
        blockBtn.className = isBlocked ? 'btn btn-danger' : 'btn btn-secondary';
        toast.info(isBlocked ? 'Cartão temporariamente bloqueado para compras.' : 'Cartão desbloqueado.');
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
        const userIncome = state.user?.income || 0;
        if (balanceSpan) {
          balanceSpan.textContent = `R$ ${userIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
          // 1. Pagamento com Saldo em Conta Real
          const currentBalance = user?.income || 0;
          if (currentBalance < this.invoiceAmount) {
            toast.warning(`Saldo insuficiente (R$ ${currentBalance.toFixed(2)}) para quitar a fatura de R$ ${this.invoiceAmount.toFixed(2)}.`);
          } else {
            toast.success(`Fatura de R$ ${this.invoiceAmount.toFixed(2)} paga com sucesso via Saldo em Conta!`);
            this.invoiceAmount = 0;
            this.refreshCardMetrics();
          }
          if (modalEl) modalEl.classList.remove('active');

        } else if (method === 'PIX') {
          // 2. Pagamento via Pix com Código Copia e Cola
          const pixCode = `00020126580014br.gov.bcb.pix0136laobank-faturas@laobank.com.br5204000053039865802BR5915LAOBANK DIGITAL6009SAO PAULO62170513FATURA${Date.now()}6304`;
          try {
            await navigator.clipboard.writeText(pixCode);
            toast.success('Código Pix Copia e Cola gerado e copiado para a área de transferência!');
          } catch {
            toast.info('Código Pix gerado com sucesso!');
          }
          if (modalEl) modalEl.classList.remove('active');

        } else if (method === 'BOLETO') {
          // 3. Emissão de Boleto Bancário com Disparo Real de E-mail
          const barcode = `07790.00018 04829.400014 00000.000000 1 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
          const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

          try {
            await navigator.clipboard.writeText(barcode);
          } catch {}

          try {
            // Disparo de e-mail real para o middleware consumerNotification (Porta 3002)
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
          } catch (err) {
            toast.success(`Boleto emitido! Linha digitável: ${barcode} (Copiada para a área de transferência).`);
          }

          if (modalEl) modalEl.classList.remove('active');
        }
      });
    }
  }
};

