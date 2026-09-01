import { appShell } from './ui/app-shell.js';
import { modal } from './ui/modal.js';
import { authFeature } from './features/auth.js';
import { contaFeature } from './features/conta.js';
import { pixFeature } from './features/pix.js';
import { cardsFeature } from './features/cards.js';
import { loansFeature } from './features/loans.js';
import { gpsFeature } from './features/gps.js';
import { shortenerFeature } from './features/shortener.js';
import { profileFeature } from './features/profile.js';
import { authService } from './services/authService.js';
import { state } from './lib/state.js';
import { toast } from './ui/toast.js';

/**
 * Bootstrap Principal da Aplicação (Padrão Cortex Application Lifecycle)
 */
class Application {
  async init() {
    // 1. Inicializar Presentation & Layout Shell
    appShell.init();
    modal.initAll();

    // 2. Inicializar Módulos de Domínio / Features
    authFeature.init();
    contaFeature.init();
    pixFeature.init();
    cardsFeature.init();
    loansFeature.init();
    gpsFeature.init();
    shortenerFeature.init();
    profileFeature.init();

    // 3. Validação Ativa de Sessão no Backend (Evita retenção de cache de contas excluídas)
    await this.validateSession();

    console.info('🏦 LãoBank Digital Consumer v2.0 inicializado com sucesso (Padrão Cortex Architecture).');
  }

  async validateSession() {
    if (!state.token) return;

    try {
      const user = await authService.getProfile();
      if (user && (user.email || user.id)) {
        state.setUser(user);
      } else {
        throw new Error('Conta não encontrada no banco de dados.');
      }
    } catch (err) {
      console.warn('⚠️ Sessão em cache expirada ou conta excluída no backend. Resetando para tela de login...', err.message);
      state.clearAuth();
      toast.info('Sessão expirada ou não encontrada no banco de dados. Faça login novamente.');
    }
  }
}

// Inicializar aplicação após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.init();
});
