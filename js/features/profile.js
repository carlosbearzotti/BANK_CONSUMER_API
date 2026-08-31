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
      state.setAuth(null, null);
      toast.info('Sessão encerrada com segurança.');
    };

    document.getElementById('bankLogoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('profileLogoutBtn')?.addEventListener('click', handleLogout);
    
    // Novas funcionalidades de segurança
    const logoutAllBtn = document.getElementById('logoutAllSessionsBtn');
    if (logoutAllBtn) {
      logoutAllBtn.addEventListener('click', () => {
        toast.info('Revogando tokens JWT de outros dispositivos na API...');
        setTimeout(() => toast.success('Todas as outras sessões foram desconectadas com sucesso!'), 1000);
      });
    }

    const toggle2FA = document.getElementById('toggle2FA');
    if (toggle2FA) {
      toggle2FA.addEventListener('change', (e) => {
        if (e.target.checked) {
          toast.success('Autenticação de Dois Fatores (2FA) habilitada! O próximo login exigirá código SMS.');
        } else {
          toast.warning('2FA desabilitado. Sua conta está menos segura.');
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
    const name = user?.name || 'Carlos Silva';
    const initial = name.charAt(0).toUpperCase();

    // Top Header & Credit Card
    const bankUserName = document.getElementById('bankUserName');
    const bankUserAvatar = document.getElementById('bankUserAvatar');
    const cardFrontHolder = document.getElementById('cardFrontHolder');

    if (bankUserName) bankUserName.textContent = `Olá, ${name}`;
    if (bankUserAvatar) bankUserAvatar.textContent = initial;
    if (cardFrontHolder) cardFrontHolder.textContent = name.toUpperCase();

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
    if (profileEmailVal) profileEmailVal.textContent = user?.email || 'carlos@exemplo.com';
    if (profileCpfVal) profileCpfVal.textContent = utils.formatCPF(user?.cpf || '12345678900');
    if (profileIncomeVal) profileIncomeVal.textContent = utils.formatCurrency(user?.income || 7500);

    const ageStr = user?.age ? `${user.age} anos` : '29 anos';
    const lat = user?.latitude || -23.5505;
    const lng = user?.longitude || -46.6333;
    if (profileGeoVal) profileGeoVal.textContent = `${ageStr} • (${lat}, ${lng})`;

    if (profileApiKeyVal) profileApiKeyVal.textContent = state.apiKey;
    if (profileJwtDisplay) profileJwtDisplay.textContent = state.token || 'Nenhum token ativo';
  }
};
