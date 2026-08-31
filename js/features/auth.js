import { authService } from '../services/authService.js';
import { state } from '../lib/state.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Autenticação e Criação de Contas (Padrão Cortex Feature)
 */
export const authFeature = {
  init() {
    this.setupLoginForm();
    this.setupRegisterForm();
    this.setupDemoButtons();
    this.setupViewToggles();
    this.setupPasswordToggles();
  },

  setupLoginForm() {
    const loginForm = document.getElementById('gmailLoginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      if (!email || !password) {
        toast.warning('Informe o e-mail e a senha.');
        return;
      }

      try {
        const response = await authService.login({ email, password });
        const token = response.token || response.accessToken || response.jwt;

        let user = response.user || null;
        if (!user && token) {
          try {
            state.token = token;
            user = await authService.getProfile();
          } catch {
            user = {
              name: response.name || email.split('@')[0],
              email: response.email || email,
              id: response.userId || 1
            };
          }
        }

        state.setAuth(token, user);
        toast.success(`Bem-vindo ao LãoBank, ${user?.name || 'Cliente'}!`);
      } catch (err) {
        toast.error(`Falha no login: ${err.message || 'Credenciais inválidas'}`);
      }
    });
  },

  setupRegisterForm() {
    const registerForm = document.getElementById('gmailRegisterForm');
    if (!registerForm) return;

    // Medidor de senha forte em tempo real no cadastro
    const regPass = document.getElementById('regPassword');
    const fill = document.getElementById('regPwdMeterFill');
    const label = document.getElementById('regPwdMeterLabel');

    if (regPass && fill && label) {
      regPass.addEventListener('input', (e) => {
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
        fill.style.width = `${percent}%`;

        if (passed <= 2) {
          fill.style.backgroundColor = 'var(--status-danger)';
          label.textContent = '⚠️ Senha Fraca - Requer 8+ dígitos, maiúscula, minúscula e símbolo.';
        } else if (passed <= 4) {
          fill.style.backgroundColor = 'var(--status-warning)';
          label.textContent = '🟡 Senha Média - Quase pronta.';
        } else {
          fill.style.backgroundColor = 'var(--status-success)';
          label.textContent = '✅ Senha Forte e Segura aprovada!';
        }
      });
    }

    // Geolocalização
    const geoBtn = document.getElementById('getGeoBtn');
    if (geoBtn) {
      geoBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const latInput = document.getElementById('regLat');
              const lngInput = document.getElementById('regLng');
              if (latInput) latInput.value = pos.coords.latitude.toFixed(4);
              if (lngInput) lngInput.value = pos.coords.longitude.toFixed(4);
              toast.success('Geolocalização obtida!');
            },
            () => toast.warning('Não foi possível obter a localização.')
          );
        }
      });
    }

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const cpf = document.getElementById('regCpf')?.value.trim();
      const password = document.getElementById('regPassword')?.value;
      const income = parseFloat(document.getElementById('regIncome')?.value) || 7500.0;
      const age = parseInt(document.getElementById('regAge')?.value, 10) || 29;
      const latitude = parseFloat(document.getElementById('regLat')?.value) || -23.5505;
      const longitude = parseFloat(document.getElementById('regLng')?.value) || -46.6333;

      const payload = {
        name,
        email,
        cpf: cpf.replace(/\D/g, ''),
        password,
        income,
        age,
        latitude,
        longitude
      };

      try {
        await authService.register(payload);
        toast.success('Conta bancária criada com sucesso!');

        // Login automático após cadastro
        try {
          const loginRes = await authService.login({ email, password });
          const token = loginRes.token || loginRes.accessToken;
          state.setAuth(token, payload);
        } catch {
          document.getElementById('switchToLoginBtn')?.click();
          const loginEmail = document.getElementById('loginEmail');
          if (loginEmail) loginEmail.value = email;
        }
      } catch (err) {
        const failures = err.data?.failures ? ` (${err.data.failures.join(', ')})` : '';
        toast.error(`Erro ao criar conta: ${err.message}${failures}`);
      }
    });
  },

  setupDemoButtons() {
    const demoUser = document.getElementById('demoUserPill');
    const demoAutoLogin = document.getElementById('demoAutoLoginPill');

    if (demoUser) {
      demoUser.addEventListener('click', () => {
        const email = document.getElementById('loginEmail');
        const pass = document.getElementById('loginPassword');
        if (email) email.value = 'carlos@exemplo.com';
        if (pass) pass.value = 'SenhaForte@2026!';
        toast.info('Credenciais de Carlos preenchidas.');
      });
    }

    if (demoAutoLogin) {
      demoAutoLogin.addEventListener('click', async () => {
        const email = 'carlos@exemplo.com';
        const password = 'SenhaForte@2026!';
        try {
          const res = await authService.login({ email, password });
          const token = res.token || res.accessToken;
          state.setAuth(token, {
            id: res.userId || 1,
            name: res.name || 'Carlos Silva',
            email: res.email || email,
            cpf: '123.456.789-00',
            income: 7500,
            age: 29
          });
          toast.success('Acesso rápido 1-Clique autenticado!');
        } catch {
          // Se não existir, registra e loga
          try {
            await authService.register({
              name: 'Carlos Silva',
              email,
              cpf: '12345678900',
              password,
              income: 7500.0,
              age: 29,
              latitude: -23.5505,
              longitude: -46.6333
            });
            const res = await authService.login({ email, password });
            state.setAuth(res.token, {
              id: res.userId || 1,
              name: res.name || 'Carlos Silva',
              email,
              cpf: '123.456.789-00',
              income: 7500,
              age: 29
            });
            toast.success('Conta criada e autenticada com sucesso!');
          } catch (err) {
            toast.error(`Falha no acesso rápido: ${err.message}`);
          }
        }
      });
    }
  },

  setupViewToggles() {
    const toRegister = document.getElementById('switchToRegisterBtn');
    const toLogin = document.getElementById('switchToLoginBtn');
    const loginForm = document.getElementById('gmailLoginForm');
    const registerForm = document.getElementById('gmailRegisterForm');
    const cardTitle = document.getElementById('authCardTitle');
    const cardSubtitle = document.getElementById('authCardSubtitle');

    if (toRegister && toLogin && loginForm && registerForm) {
      toRegister.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        if (cardTitle) cardTitle.textContent = 'Criar sua Conta LãoBank';
        if (cardSubtitle) cardSubtitle.textContent = 'Abra sua conta digital com segurança e solidez bancária';
      });

      toLogin.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        if (cardTitle) cardTitle.textContent = 'Fazer login';
        if (cardSubtitle) cardSubtitle.textContent = 'Use sua Conta LãoBank para acessar os serviços bancários';
      });
    }
  },

  setupPasswordToggles() {
    const toggleLogin = document.getElementById('toggleLoginPasswordBtn');
    const toggleReg = document.getElementById('toggleRegPasswordBtn');
    const loginPass = document.getElementById('loginPassword');
    const regPass = document.getElementById('regPassword');

    if (toggleLogin && loginPass) {
      toggleLogin.addEventListener('click', () => {
        loginPass.type = loginPass.type === 'password' ? 'text' : 'password';
      });
    }

    if (toggleReg && regPass) {
      toggleReg.addEventListener('click', () => {
        regPass.type = regPass.type === 'password' ? 'text' : 'password';
      });
    }
  }
};
