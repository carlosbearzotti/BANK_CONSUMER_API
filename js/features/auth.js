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
    this.setupCepLookup();
    this.setupViewToggles();
    this.setupPasswordToggles();
    this.setupPasswordRecovery();
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

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const cpf = document.getElementById('regCpf')?.value.trim();
      const password = document.getElementById('regPassword')?.value;
      const income = parseFloat(document.getElementById('regIncome')?.value);
      const age = parseInt(document.getElementById('regAge')?.value, 10);
      const latVal = document.getElementById('regLat')?.value;
      const lngVal = document.getElementById('regLng')?.value;
      const latitude = latVal ? parseFloat(latVal) : null;
      const longitude = lngVal ? parseFloat(lngVal) : null;

      if (!name || !email || !cpf || !password || isNaN(income) || isNaN(age)) {
        toast.warning('Preencha todos os campos obrigatórios do formulário.');
        return;
      }

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
        toast.success('Conta bancária criada com sucesso! Faça login com suas credenciais.');

        // Disparo assíncrono de e-mail de boas-vindas / cartão emitido (Porta 3002)
        fetch('http://localhost:3002/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            name: name,
            template: 'card_issued',
            last4: '8824',
            deliveryDays: 7,
            subject: '💳 Seu Cartão LãoBank foi emitido! Físico em até 7 dias e Virtual liberado'
          })
        }).catch(() => {});

        // Redireciona para o modo "Fazer login" de forma limpa
        document.getElementById('switchToLoginBtn')?.click();
        const loginEmail = document.getElementById('loginEmail');
        const loginPass = document.getElementById('loginPassword');
        if (loginEmail) loginEmail.value = email;
        if (loginPass) {
          loginPass.value = '';
          loginPass.focus();
        }
      } catch (err) {
        const failures = err.data?.failures ? ` (${err.data.failures.join(', ')})` : '';
        toast.error(`Erro ao criar conta: ${err.message}${failures}`);
      }
    });
  },

  setupCepLookup() {
    const cepInput = document.getElementById('regCep');
    const searchBtn = document.getElementById('searchCepBtn');
    const resultBox = document.getElementById('addressResultBox');
    const streetText = document.getElementById('resolvedStreetText');
    const detailsText = document.getElementById('resolvedDetailsText');
    const latInput = document.getElementById('regLat');
    const lngInput = document.getElementById('regLng');

    if (!cepInput) return;

    // Máscara 00000-000
    cepInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 5) {
        v = v.substring(0, 5) + '-' + v.substring(5, 8);
      }
      e.target.value = v;

      const clean = v.replace(/\D/g, '');
      if (clean.length === 8) {
        this.resolveAddressAndGps(clean);
      }
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const clean = cepInput.value.replace(/\D/g, '');
        if (clean.length === 8) {
          this.resolveAddressAndGps(clean);
        } else {
          toast.warning('Digite um CEP válido com 8 dígitos.');
        }
      });
    }
  },

  async resolveAddressAndGps(cep) {
    const resultBox = document.getElementById('addressResultBox');
    const streetText = document.getElementById('resolvedStreetText');
    const detailsText = document.getElementById('resolvedDetailsText');
    const latInput = document.getElementById('regLat');
    const lngInput = document.getElementById('regLng');

    if (resultBox) resultBox.style.display = 'block';
    if (streetText) streetText.textContent = '🔍 Consultando Base de Endereços...';
    if (detailsText) detailsText.textContent = 'Resolvendo endereço e coordenadas GPS gratuitas...';

    const cleanCep = cep.replace(/\D/g, '');
    let street = '';
    let neighborhood = '';
    let city = '';
    let state = '';
    let lat = null;
    let lng = null;

    try {
      // 1. Tenta AwesomeAPI (Retorna endereço completo + Latitude/Longitude exata nativamente)
      try {
        const awesomeRes = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
        if (awesomeRes.ok) {
          const aData = await awesomeRes.json();
          street = aData.address || aData.address_name || '';
          neighborhood = aData.district || '';
          city = aData.city || '';
          state = aData.state || '';
          if (aData.lat && aData.lng) {
            lat = parseFloat(aData.lat);
            lng = parseFloat(aData.lng);
          }
        }
      } catch (e1) {
        console.warn('AwesomeAPI falhou, tentando ViaCEP:', e1.message);
      }

      // 2. Se não pegou endereço, tenta ViaCEP (Base mais completa do Brasil)
      if (!street || !city) {
        try {
          const viaRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          if (viaRes.ok) {
            const vData = await viaRes.json();
            if (!vData.erro) {
              street = vData.logradouro || street;
              neighborhood = vData.bairro || neighborhood;
              city = vData.localidade || city;
              state = vData.uf || state;
            }
          }
        } catch (e2) {
          console.warn('ViaCEP falhou, tentando BrasilAPI:', e2.message);
        }
      }

      // 3. Se ainda faltar endereço, tenta BrasilAPI v1
      if (!street || !city) {
        try {
          const bRes = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
          if (bRes.ok) {
            const bData = await bRes.json();
            street = bData.street || street;
            neighborhood = bData.neighborhood || neighborhood;
            city = bData.city || city;
            state = bData.state || state;
          }
        } catch (e3) {}
      }

      // 4. Se temos endereço/cidade mas não temos Lat/Lng, busca no OpenStreetMap Nominatim
      if ((!lat || !lng) && city) {
        try {
          const q = encodeURIComponent(`${street ? street + ', ' : ''}${neighborhood ? neighborhood + ', ' : ''}${city}, ${state}, Brasil`);
          const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
          if (osmRes.ok) {
            const osmData = await osmRes.json();
            if (osmData && osmData.length > 0) {
              lat = parseFloat(osmData[0].lat);
              lng = parseFloat(osmData[0].lon);
            }
          }
        } catch (e4) {
          console.warn('Nominatim falhou:', e4.message);
        }
      }

      if (!city && !street) {
        throw new Error('CEP não localizado nas bases públicas.');
      }

      // Fallback seguro de coordenadas caso offline
      lat = lat || -23.5505;
      lng = lng || -46.6333;

      if (latInput) latInput.value = lat;
      if (lngInput) lngInput.value = lng;

      if (streetText) streetText.textContent = `📍 ${street ? street : 'Região'}${neighborhood ? ' - ' + neighborhood : ''}`;
      if (detailsText) detailsText.textContent = `${city} - ${state} | GPS: (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

      toast.success(`Endereço localizado: ${city}/${state}!`);
    } catch (err) {
      if (streetText) streetText.textContent = '⚠️ CEP não identificado';
      if (detailsText) detailsText.textContent = 'Coordenadas da região metropolitana aplicadas.';
      toast.warning('CEP não identificado nas bases. Coordenadas padrão aplicadas.');
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
  },

  setupPasswordRecovery() {
    const forgotLink = document.getElementById('forgotPasswordLink');
    const modalEl = document.getElementById('passwordRecoveryModal');
    const formStep1 = document.getElementById('forgotPasswordForm');
    const formStep2 = document.getElementById('resetPasswordForm');
    const step1El = document.getElementById('recoveryStep1');
    const step2El = document.getElementById('recoveryStep2');

    let recoveryEmail = '';

    if (forgotLink && modalEl) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        step1El.style.display = 'block';
        step2El.style.display = 'none';
        modalEl.classList.add('active');
        const prefill = document.getElementById('loginEmail')?.value;
        if (prefill && document.getElementById('recoveryEmail')) {
          document.getElementById('recoveryEmail').value = prefill;
        }
      });
    }

    if (formStep1) {
      formStep1.addEventListener('submit', async (e) => {
        e.preventDefault();
        recoveryEmail = document.getElementById('recoveryEmail')?.value.trim();
        if (!recoveryEmail) return;

        try {
          toast.info('Solicitando redefinição de acesso ao Integrados Core API...');
          await authService.forgotPassword(recoveryEmail);

          toast.success(`E-mail com token enviado para ${recoveryEmail}! Abra o Notify Hub (Porta 3002) para ver seu código.`);
          step1El.style.display = 'none';
          step2El.style.display = 'block';
          const codeInput = document.getElementById('recoveryCodeInput');
          if (codeInput) {
            codeInput.value = '';
            codeInput.focus();
          }
        } catch (err) {
          toast.error(`Falha ao solicitar recuperação: ${err.message}`);
        }
      });
    }

    // Medidor de senha no reset
    const newPass = document.getElementById('recoveryNewPassword');
    const fill = document.getElementById('recoveryPwdMeterFill');
    const label = document.getElementById('recoveryPwdMeterLabel');

    if (newPass && fill && label) {
      newPass.addEventListener('input', (e) => {
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

    if (formStep2) {
      formStep2.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('recoveryCodeInput')?.value.trim();
        const newPassword = document.getElementById('recoveryNewPassword')?.value;

        if (!code || !newPassword) return;

        try {
          toast.info('Validando conformidade e atualizando senha...');
          await authService.resetPassword(recoveryEmail, code, newPassword);
          toast.success('Senha de acesso redefinida com sucesso!');
          modalEl?.classList.remove('active');

          const loginEmail = document.getElementById('loginEmail');
          const loginPass = document.getElementById('loginPassword');
          if (loginEmail) loginEmail.value = recoveryEmail;
          if (loginPass) {
            loginPass.value = newPassword;
            loginPass.focus();
          }
        } catch (err) {
          const failures = err.data?.failures ? ` (${err.data.failures.join(', ')})` : '';
          toast.error(`Erro ao redefinir senha: ${err.message}${failures}`);
        }
      });
    }
  }
};
