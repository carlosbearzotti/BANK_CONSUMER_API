import { authService } from './services/authService.js';
import { state } from './state.js';

export const authModule = {
  init(showToast) {
    const loginForm = document.getElementById('gmailLoginForm');
    const registerForm = document.getElementById('gmailRegisterForm');
    const switchToRegisterBtn = document.getElementById('switchToRegisterBtn');
    const switchToLoginBtn = document.getElementById('switchToLoginBtn');
    const authCardTitle = document.getElementById('authCardTitle');
    const authCardSubtitle = document.getElementById('authCardSubtitle');
    const toggleLoginPasswordBtn = document.getElementById('toggleLoginPasswordBtn');
    const toggleRegPasswordBtn = document.getElementById('toggleRegPasswordBtn');
    const loginPasswordInput = document.getElementById('loginPassword');
    const regPasswordInput = document.getElementById('regPassword');
    const getGeoBtn = document.getElementById('getGeoBtn');
    const demoUserPill = document.getElementById('demoUserPill');
    const demoAutoLoginPill = document.getElementById('demoAutoLoginPill');
    const loadProfileBtn = document.getElementById('loadProfileBtn');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    const bankLogoutBtn = document.getElementById('bankLogoutBtn');
    const authApiUrlInput = document.getElementById('authApiUrlInput');

    // Sync API URL in auth view
    if (authApiUrlInput) {
      authApiUrlInput.value = state.baseUrl;
      authApiUrlInput.addEventListener('change', () => {
        state.setBaseUrl(authApiUrlInput.value);
        showToast(`URL base da API atualizada: ${state.baseUrl}`, 'info');
      });
    }

    // Toggle Login <-> Register Modes (Google Style)
    if (switchToRegisterBtn) {
      switchToRegisterBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        if (authCardTitle) authCardTitle.textContent = 'Criar sua Conta LãoBank';
        if (authCardSubtitle) authCardSubtitle.textContent = 'Acesse todos os serviços bancários clássicos e digitais';
      });
    }

    if (switchToLoginBtn) {
      switchToLoginBtn.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        if (authCardTitle) authCardTitle.textContent = 'Fazer login';
        if (authCardSubtitle) authCardSubtitle.textContent = 'Use sua Conta LãoBank para acessar os serviços bancários';
      });
    }

    // Password Visibility Toggles
    const setupPasswordToggle = (btn, input) => {
      if (!btn || !input) return;
      btn.addEventListener('click', () => {
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        btn.innerHTML = isPassword
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      });
    };

    setupPasswordToggle(toggleLoginPasswordBtn, loginPasswordInput);
    setupPasswordToggle(toggleRegPasswordBtn, regPasswordInput);

    // Register Form Real-time Password Strength Meter
    if (regPasswordInput) {
      const meterFill = document.getElementById('regPwdMeterFill');
      const meterLabel = document.getElementById('regPwdMeterLabel');

      regPasswordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const checks = [
          val.length >= 8,
          /[A-Z]/.test(val),
          /[a-z]/.test(val),
          /[0-9]/.test(val),
          /[\W_]/.test(val)
        ];
        const passed = checks.filter(Boolean).length;
        const percent = (passed / 5) * 100;

        if (meterFill) {
          meterFill.style.width = `${percent}%`;
          if (passed <= 2) meterFill.style.backgroundColor = 'var(--status-danger)';
          else if (passed <= 4) meterFill.style.backgroundColor = 'var(--status-warning)';
          else meterFill.style.backgroundColor = 'var(--status-success)';
        }

        if (meterLabel) {
          if (val.length === 0) meterLabel.textContent = 'Digite uma senha com 8+ caracteres, maiúscula, minúscula, número e símbolo.';
          else if (passed <= 2) meterLabel.textContent = '⚠️ Senha Fraca - Requer mais complexidade para atender às regras do banco';
          else if (passed <= 4) meterLabel.textContent = '🟡 Senha Média - Quase pronta';
          else meterLabel.textContent = '✅ Senha Forte e Segura! Padrão bancário aprovado.';
        }
      });
    }

    // Geolocation Helper
    if (getGeoBtn) {
      getGeoBtn.addEventListener('click', () => {
        if ('geolocation' in navigator) {
          showToast('Obtendo localização GPS...', 'info');
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const latEl = document.getElementById('regLat');
              const lngEl = document.getElementById('regLng');
              if (latEl) latEl.value = pos.coords.latitude.toFixed(4);
              if (lngEl) lngEl.value = pos.coords.longitude.toFixed(4);
              showToast('Localização obtida com sucesso!', 'success');
            },
            () => {
              const latEl = document.getElementById('regLat');
              const lngEl = document.getElementById('regLng');
              if (latEl) latEl.value = '-23.5505';
              if (lngEl) lngEl.value = '-46.6333';
              showToast('Localização preenchida com coordenadas padrão (SP).', 'info');
            }
          );
        }
      });
    }

    // Demo Fill Pill
    if (demoUserPill) {
      demoUserPill.addEventListener('click', () => {
        const email = document.getElementById('loginEmail');
        const pass = document.getElementById('loginPassword');
        if (email) email.value = 'carlos@exemplo.com';
        if (pass) pass.value = 'SenhaForte@2026!';
        showToast('Credenciais padrão preenchidas! Clique em Avançar.', 'info');
      });
    }

    // Auto Register & Login with Genuine JWT Token (1-Click)
    if (demoAutoLoginPill) {
      demoAutoLoginPill.addEventListener('click', async () => {
        showToast('Autenticando na API Spring Boot...', 'info');

        const defaultUser = {
          name: 'Carlos Silva',
          email: 'carlos@exemplo.com',
          password: 'SenhaForte@2026!',
          cpf: '123.456.789-00',
          income: 7500.00,
          age: 29,
          latitude: -23.5505,
          longitude: -46.6333
        };

        // 1. Ensure user is registered on backend
        try {
          await authService.register(defaultUser);
        } catch {
          // Ignora se já estiver cadastrado
        }

        // 2. Perform Login to obtain real JWT Token
        try {
          const res = await authService.login({ email: defaultUser.email, password: defaultUser.password });

          const token = res.token || res.jwt || res.accessToken;
          const user = {
            id: res.userId || res.id || 1,
            name: res.name || defaultUser.name,
            email: res.email || defaultUser.email,
            cpf: defaultUser.cpf,
            income: defaultUser.income,
            age: defaultUser.age,
            latitude: defaultUser.latitude,
            longitude: defaultUser.longitude
          };

          state.setAuth(token, user);
          showToast(`LãoBank: Conectado com sucesso via JWT Token oficial!`, 'success');
          this.refreshProfileUI();
        } catch (err) {
          showToast(`Erro na autenticação: ${err.message}`, 'error');
        }
      });
    }

    // Handle Login Submit
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
          const res = await authService.login({ email, password });

          const token = res.token || res.jwt || res.accessToken;
          const user = {
            id: res.id || res.userId || 1,
            name: res.name || res.username || email.split('@')[0],
            email: res.email || email,
            cpf: res.cpf || '123.456.789-00',
            income: res.income || 5000.00,
            age: res.age || 28
          };

          state.setAuth(token, user);
          showToast(`Bem-vindo ao LãoBank, ${user.name}! Acesso liberado.`, 'success');
          this.refreshProfileUI();
        } catch (err) {
          if (err.status === 401) {
            showToast('Credenciais inválidas ou usuário não cadastrado. Se for novo aqui, clique em "Criar conta" ou use "1-Clique".', 'error');
          } else {
            showToast(`Falha no login: ${err.message}`, 'error');
          }
        }
      });
    }

    // Handle Register Submit
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const cpf = document.getElementById('regCpf').value.trim();
        const income = parseFloat(document.getElementById('regIncome').value) || 0;
        const age = parseInt(document.getElementById('regAge').value, 10) || 0;
        const latitude = parseFloat(document.getElementById('regLat').value) || 0;
        const longitude = parseFloat(document.getElementById('regLng').value) || 0;

        try {
          await authService.register({ name, email, password, cpf, income, age, latitude, longitude });

          showToast('Conta LãoBank criada com sucesso! Efetuando login automático...', 'success');

          // Auto-login immediately after register
          try {
            const loginRes = await authService.login({ email, password });

            const token = loginRes.token || loginRes.jwt || loginRes.accessToken;
            const user = {
              id: loginRes.userId || loginRes.id || 1,
              name: loginRes.name || name,
              email: loginRes.email || email,
              cpf,
              income,
              age,
              latitude,
              longitude
            };

            state.setAuth(token, user);
            registerForm.reset();
            this.refreshProfileUI();
          } catch {
            registerForm.reset();
            if (switchToLoginBtn) switchToLoginBtn.click();
            const loginEmail = document.getElementById('loginEmail');
            if (loginEmail) loginEmail.value = email;
          }
        } catch (err) {
          const failures = err.data?.failures ? ` (${err.data.failures.join(', ')})` : '';
          showToast(`Erro ao criar conta: ${err.message}${failures}`, 'error');
        }
      });
    }

    // Copy JWT Token Button
    const copyJwtBtn = document.getElementById('copyJwtTokenBtn');
    if (copyJwtBtn) {
      copyJwtBtn.addEventListener('click', () => {
        if (state.token) {
          navigator.clipboard.writeText(state.token);
          showToast('Bearer JWT Token copiado para a área de transferência!', 'success');
        }
      });
    }

    // Profile Interactive Password Validation
    const profilePwdInput = document.getElementById('profilePwdTestInput');
    const profilePwdFill = document.getElementById('profilePwdMeterFill');
    const profilePwdLabel = document.getElementById('profilePwdMeterLabel');
    const pRuleLength = document.getElementById('pRuleLength');
    const pRuleUpper = document.getElementById('pRuleUpper');
    const pRuleLower = document.getElementById('pRuleLower');
    const pRuleDigit = document.getElementById('pRuleDigit');
    const pRuleSpecial = document.getElementById('pRuleSpecial');
    const profileValidatePwdBtn = document.getElementById('profileValidatePwdBtn');

    if (profilePwdInput) {
      profilePwdInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const checks = {
          length: val.length >= 8,
          upper: /[A-Z]/.test(val),
          lower: /[a-z]/.test(val),
          digit: /[0-9]/.test(val),
          special: /[\W_]/.test(val)
        };

        const updateRule = (el, valid) => {
          if (!el) return;
          if (valid) {
            el.className = 'password-rule-item valid';
            el.querySelector('.rule-icon').textContent = '✓';
          } else {
            el.className = 'password-rule-item invalid';
            el.querySelector('.rule-icon').textContent = '✗';
          }
        };

        updateRule(pRuleLength, checks.length);
        updateRule(pRuleUpper, checks.upper);
        updateRule(pRuleLower, checks.lower);
        updateRule(pRuleDigit, checks.digit);
        updateRule(pRuleSpecial, checks.special);

        const passed = Object.values(checks).filter(Boolean).length;
        const percent = (passed / 5) * 100;

        if (profilePwdFill) {
          profilePwdFill.style.width = `${percent}%`;
          if (passed <= 2) profilePwdFill.style.backgroundColor = 'var(--status-danger)';
          else if (passed <= 4) profilePwdFill.style.backgroundColor = 'var(--status-warning)';
          else profilePwdFill.style.backgroundColor = 'var(--status-success)';
        }

        if (profilePwdLabel) {
          if (val.length === 0) profilePwdLabel.textContent = 'Digite uma senha com 8+ caracteres, maiúscula, minúscula, número e símbolo.';
          else if (passed <= 2) profilePwdLabel.textContent = '⚠️ Senha Fraca - Requer mais complexidade';
          else if (passed <= 4) profilePwdLabel.textContent = '🟡 Senha Média - Quase pronta';
          else profilePwdLabel.textContent = '✅ Senha Forte e Segura! Padrão bancário aprovado.';
        }
      });
    }

    if (profileValidatePwdBtn) {
      profileValidatePwdBtn.addEventListener('click', async () => {
        const password = profilePwdInput ? profilePwdInput.value : '';
        if (!password) {
          showToast('Digite uma senha para testar na API!', 'warning');
          return;
        }
        try {
          const { passwordService } = await import('./services/passwordService.js');
          await passwordService.validate(password);
          showToast('API Spring Boot: Senha aprovada com sucesso nos 5 critérios de segurança!', 'success');
        } catch (err) {
          const failures = err.data?.failures ? ` (${err.data.failures.join(', ')})` : '';
          showToast(`API: Senha não atende aos requisitos${failures}`, 'error');
        }
      });
    }

    // Profile Load (Me)
    if (loadProfileBtn) {
      loadProfileBtn.addEventListener('click', async () => {
        if (!state.token) {
          showToast('Você precisa estar autenticado!', 'warning');
          return;
        }
        try {
          const profile = await authService.getProfile();
          state.setAuth(state.token, { ...state.user, ...profile });
          this.refreshProfileUI();
          showToast('Dados cadastrais atualizados do servidor!', 'success');
        } catch (err) {
          if (err.status === 401) {
            showToast('Sessão expirada ou token inválido. Por favor, refaça o login.', 'warning');
            state.setAuth(null, null);
          } else {
            showToast(`Erro ao carregar perfil: ${err.message}`, 'error');
          }
        }
      });
    }

    // Logout Handlers
    const handleLogout = () => {
      state.setAuth(null, null);
      this.refreshProfileUI();
      showToast('Sua sessão foi encerrada com segurança.', 'info');
    };

    if (bankLogoutBtn) bankLogoutBtn.addEventListener('click', handleLogout);
    if (profileLogoutBtn) profileLogoutBtn.addEventListener('click', handleLogout);

    // Initial Profile Render
    this.refreshProfileUI();
  },

  refreshProfileUI() {
    const bankUserName = document.getElementById('bankUserName');
    const bankUserAvatar = document.getElementById('bankUserAvatar');
    const cardFrontHolder = document.getElementById('cardFrontHolder');

    const profileHeroName = document.getElementById('profileHeroName');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    const profileNameVal = document.getElementById('profileNameVal');
    const profileEmailVal = document.getElementById('profileEmailVal');
    const profileCpfVal = document.getElementById('profileCpfVal');
    const profileIncomeVal = document.getElementById('profileIncomeVal');
    const profileGeoVal = document.getElementById('profileGeoVal');
    const profileApiKeyVal = document.getElementById('profileApiKeyVal');
    const profileJwtDisplay = document.getElementById('profileJwtDisplay');

    if (state.user) {
      const name = state.user.name || 'Carlos Silva';
      const initial = name.charAt(0).toUpperCase();

      if (bankUserName) bankUserName.textContent = `Olá, ${name}`;
      if (bankUserAvatar) bankUserAvatar.textContent = initial;
      if (cardFrontHolder) cardFrontHolder.textContent = name.toUpperCase();

      if (profileHeroName) profileHeroName.textContent = name;
      if (profileAvatarLarge) profileAvatarLarge.textContent = initial;
      if (profileNameVal) profileNameVal.textContent = name;
      if (profileEmailVal) profileEmailVal.textContent = state.user.email || 'carlos@exemplo.com';
      if (profileCpfVal) profileCpfVal.textContent = state.user.cpf || '123.456.789-00';
      if (profileIncomeVal) profileIncomeVal.textContent = `R$ ${(state.user.income || 7500).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      
      const ageStr = state.user.age ? `${state.user.age} anos` : '29 anos';
      const lat = state.user.latitude || -23.5505;
      const lng = state.user.longitude || -46.6333;
      if (profileGeoVal) profileGeoVal.textContent = `${ageStr} • (${lat}, ${lng})`;

      if (profileApiKeyVal) profileApiKeyVal.textContent = state.apiKey || 'fintech-startup-key-12345';
      if (profileJwtDisplay) profileJwtDisplay.textContent = state.token || 'Nenhum token ativo no momento';
    }
  }
};
