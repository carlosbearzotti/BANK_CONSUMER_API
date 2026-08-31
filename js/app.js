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

/**
 * Bootstrap Principal da Aplicação (Padrão Cortex Application Lifecycle)
 */
class Application {
  init() {
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

    console.info('🏦 LãoBank Digital Consumer v2.0 inicializado com sucesso (Padrão Cortex Architecture).');
  }
}

// Inicializar aplicação após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.init();
});
