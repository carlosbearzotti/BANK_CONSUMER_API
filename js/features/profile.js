import { authService } from '../services/authService.js';
import { passwordService } from '../services/passwordService.js';
import { state } from '../lib/state.js';
import { utils } from '../lib/utils.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Perfil do Usuário e Segurança (Padrão Cortex Feature)
 */
export const profileFeature = {
  init() {
    this.setupProfileData();
    this.setupPasswordValidator();
    this.setupLogout();
    this.setupTokenCopy();

    state.subscribe('auth', () => this.refreshUI());
    this.refreshUI();
  },

  setupProfileData() {
    const loadBtn = document.getElementById('loadProfileBtn');
    if (loadBtn) {
      loadBtn.addEventListener('click', async () => {
        if (!state.token) {
          toast.warning('Autentique-se para consultar os dados.');
          return;
        }

        try {
          const profile = await authService.getProfile();
          state.setAuth(state.token, { ...state.user, ...profile });
          this.refreshUI();
          toast.success('Dados cadastrais atualizados do servidor!');
        } catch (err) {
          if (err.status === 401) {
            toast.warning('Sessão expirada. Refaça o login.');
            state.setAuth(null, null);
          } else {
            toast.error(`Erro ao carregar perfil: ${err.message}`);
          }
        }
      });
    }
  },

  setupPasswordValidator() {
    const input = document.getElementById('profilePwdTestInput');
    const fill = document.getElementById('profilePwdMeterFill');
    const label = document.getElementById('profilePwdMeterLabel');
    const validateBtn = document.getElementById('profileValidatePwdBtn');

    const rules = {
      length: document.getElementById('pRuleLength'),
      upper: document.getElementById('pRuleUpper'),
      lower: document.getElementById('pRuleLower'),
      digit: document.getElementById('pRuleDigit'),
      special: document.getElementById('pRuleSpecial')
    };

    if (input) {
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        const checks = {
          length: val.length >= 8,
          upper: /[A-Z]/.test(val),
          lower: /[a-z]/.test(val),
          digit: /[0-9]/.test(val),
          special: /[\W_]/.test(val)
        };

        const updateRuleEl = (el, valid) => {
          if (!el) return;
          el.className = `password-rule-item ${valid ? 'valid' : 'invalid'}`;
          const icon = el.querySelector('.rule-icon');
          if (icon) icon.textContent = valid ? '✓' : '✗';
        };

        updateRuleEl(rules.length, checks.length);
        updateRuleEl(rules.upper, checks.upper);
        updateRuleEl(rules.lower, checks.lower);
        updateRuleEl(rules.digit, checks.digit);
        updateRuleEl(rules.special, checks.special);

        const passed = Object.values(checks).filter(Boolean).length;
        const percent = (passed / 5) * 100;

        if (fill) {
          fill.style.width = `${percent}%`;
          if (passed <= 2) fill.style.backgroundColor = 'var(--status-danger)';
          else if (passed <= 4) fill.style.backgroundColor = 'var(--status-warning)';
          else fill.style.backgroundColor = 'var(--status-success)';
        }

        if (label) {
          if (val.length === 0) label.textContent = 'Digite uma senha com 8+ caracteres, maiúscula, minúscula, número e símbolo.';
          else if (passed <= 2) label.textContent = '⚠️ Senha Fraca - Requer mais complexidade';
          else if (passed <= 4) label.textContent = '🟡 Senha Média - Quase pronta';
          else label.textContent = '✅ Senha Forte e Segura! Padrão bancário aprovado.';
        }
      });
    }

    if (validateBtn) {
      validateBtn.addEventListener('click', async () => {
        const password = input?.value || '';
        if (!password) {
          toast.warning('Digite uma senha para testar na API.');
          return;
        }

        try {
          await passwordService.validate(password);
          toast.success('API Spring Boot: Senha aprovada em todos os 5 critérios de segurança!');
        } catch (err) {
          const failures = err.data?.failures ? ` (${err.data.failures.join(', ')})` : '';
          toast.error(`API: Senha rejeitada${failures}`);
        }
      });
    }
  },

  setupTokenCopy() {
    const copyBtn = document.getElementById('copyJwtTokenBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (state.token) {
          await utils.copyToClipboard(state.token);
          toast.success('Bearer JWT Token copiado!');
        }
      });
    }
  },

  setupLogout() {
    const handleLogout = () => {
      // 1. Limpa estado e LocalStorage
      state.setAuth(null, null);

      // 2. Garante que a tela de auth volte para o formulário de LOGIN
      const loginForm = document.getElementById('gmailLoginForm');
      const registerForm = document.getElementById('gmailRegisterForm');
      const cardTitle = document.getElementById('authCardTitle');
      const cardSubtitle = document.getElementById('authCardSubtitle');

      if (loginForm && registerForm) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginForm.reset();
        registerForm.reset();
      }

      if (cardTitle) cardTitle.textContent = 'Fazer login';
      if (cardSubtitle) cardSubtitle.textContent = 'Use sua Conta LãoBank para acessar os serviços bancários';

      toast.info('Sessão encerrada com segurança.');
    };

    document.getElementById('bankLogoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('profileLogoutBtn')?.addEventListener('click', handleLogout);
    
    // Funcionalidades de segurança
    const logoutAllBtn = document.getElementById('logoutAllSessionsBtn');
    if (logoutAllBtn) {
      logoutAllBtn.addEventListener('click', () => {
        handleLogout();
      });
    }

    const toggle2FA = document.getElementById('toggle2FA');
    if (toggle2FA) {
      toggle2FA.addEventListener('change', (e) => {
        if (e.target.checked) {
          toast.success('Autenticação de Dois Fatores (2FA) habilitada!');
        } else {
          toast.warning('2FA desabilitado.');
        }
      });
    }

    const timeoutSelect = document.getElementById('timeoutSelect');
    if (timeoutSelect) {
      timeoutSelect.addEventListener('change', (e) => {
        toast.success(`Timeout de inatividade configurado para ${e.target.value} minutos.`);
      });
    }
  },

  refreshUI() {
    const user = state.user;
    const name = user?.name || 'Cliente';
    const initial = name.charAt(0).toUpperCase();

    // Top Header & Credit Card & Home Balance Displays
    const bankUserName = document.getElementById('bankUserName');
    const bankUserAvatar = document.getElementById('bankUserAvatar');
    const cardFrontHolder = document.getElementById('cardFrontHolder');
    const bankBalanceDisplay = document.getElementById('bankBalanceDisplay');
    const homeAccountBalanceSub = document.getElementById('homeAccountBalanceSub');
    const homeIncomeSub = document.getElementById('homeIncomeSub');
    const homeCreditLimitSub = document.getElementById('homeCreditLimitSub');

    // Para conta recém-criada:
    // Saldo em Conta Corrente: inicia em R$ 0,00 (ou o valor de saldo real)
    // Renda Cadastral: valor declarado no registro (ex: R$ 5.000,00)
    // Limite de Crédito Aprovado: proporcional à renda (ex: 80% da renda)
    const userIncome = user?.income || 0;
    const accountBalance = user?.balance != null ? user.balance : 0.00;
    const creditLimit = userIncome > 0 ? userIncome * 0.8 : 0.00;

    if (bankUserName) bankUserName.textContent = `Olá, ${name}`;
    if (bankUserAvatar) bankUserAvatar.textContent = initial;
    if (cardFrontHolder) cardFrontHolder.textContent = name.toUpperCase();

    if (bankBalanceDisplay) {
      bankBalanceDisplay.textContent = accountBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    if (homeAccountBalanceSub) {
      homeAccountBalanceSub.textContent = `R$ ${accountBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    if (homeIncomeSub) {
      homeIncomeSub.textContent = `R$ ${userIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    if (homeCreditLimitSub) {
      homeCreditLimitSub.textContent = `R$ ${creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    // Nubank Profile Screen
    const profileHeroName = document.getElementById('profileHeroName');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    const profileNameVal = document.getElementById('profileNameVal');
    const profileEmailVal = document.getElementById('profileEmailVal');
    const profileCpfVal = document.getElementById('profileCpfVal');
    const profileIncomeVal = document.getElementById('profileIncomeVal');
    const profileGeoVal = document.getElementById('profileGeoVal');
    const profileApiKeyVal = document.getElementById('profileApiKeyVal');
    const profileJwtDisplay = document.getElementById('profileJwtDisplay');

    if (profileHeroName) profileHeroName.textContent = name;
    if (profileAvatarLarge) profileAvatarLarge.textContent = initial;
    if (profileNameVal) profileNameVal.textContent = name;
    if (profileEmailVal) profileEmailVal.textContent = user?.email || '-';
    if (profileCpfVal) profileCpfVal.textContent = user?.cpf ? utils.formatCPF(user.cpf) : '-';
    if (profileIncomeVal) profileIncomeVal.textContent = user?.income ? utils.formatCurrency(user.income) : utils.formatCurrency(0);

    const ageStr = user?.age ? `${user.age} anos` : '';
    const lat = user?.latitude != null ? user.latitude.toFixed(4) : '';
    const lng = user?.longitude != null ? user.longitude.toFixed(4) : '';
    if (profileGeoVal) profileGeoVal.textContent = lat && lng ? `${ageStr} • (${lat}, ${lng})` : ageStr;

    if (profileApiKeyVal) profileApiKeyVal.textContent = state.apiKey;
    if (profileJwtDisplay) profileJwtDisplay.textContent = state.token || 'Nenhum token ativo';
  }
};
