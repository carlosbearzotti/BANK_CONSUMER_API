import { request } from './api.js';
import { state } from './state.js';

export const authModule = {
  init(showToast) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loadProfileBtn = document.getElementById('loadProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
          const res = await request('/api/auth/login', {
            method: 'POST',
            body: { email, password }
          });

          const token = res.token || res.jwt || res.accessToken;
          const user = {
            id: res.id || res.userId,
            name: res.name || res.username || email.split('@')[0],
            email: res.email || email
          };

          state.setAuth(token, user);
          showToast('Login efetuado com sucesso!', 'success');
          this.refreshProfileUI();
        } catch (err) {
          showToast(`Falha no login: ${err.message}`, 'error');
        }
      });
    }

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
          const res = await request('/api/auth/register', {
            method: 'POST',
            body: { name, email, password, cpf, income, age, latitude, longitude }
          });

          showToast('Usuário cadastrado com sucesso! Efetue login.', 'success');
          // Prefill login email
          const loginEmail = document.getElementById('loginEmail');
          if (loginEmail) loginEmail.value = email;
          registerForm.reset();
        } catch (err) {
          const failures = err.data?.failures ? ` (${err.data.failures.join(', ')})` : '';
          showToast(`Erro ao cadastrar: ${err.message}${failures}`, 'error');
        }
      });
    }

    if (loadProfileBtn) {
      loadProfileBtn.addEventListener('click', async () => {
        if (!state.token) {
          showToast('Você precisa estar autenticado para consultar o perfil!', 'warning');
          return;
        }
        try {
          const profile = await request('/api/auth/me');
          state.setAuth(state.token, { ...state.user, ...profile });
          this.refreshProfileUI();
          showToast('Perfil carregado com sucesso!', 'success');
        } catch (err) {
          showToast(`Erro ao carregar perfil: ${err.message}`, 'error');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        state.setAuth(null, null);
        this.refreshProfileUI();
        showToast('Você foi desconectado.', 'info');
      });
    }

    this.refreshProfileUI();
  },

  refreshProfileUI() {
    const profileDetails = document.getElementById('profileDetails');
    const authStatusBadge = document.getElementById('authStatusBadge');
    const headerUserBadge = document.getElementById('headerUserBadge');
    const headerUserName = document.getElementById('headerUserName');

    if (state.token && state.user) {
      if (authStatusBadge) {
        authStatusBadge.className = 'badge badge-success';
        authStatusBadge.textContent = 'Autenticado';
      }
      if (headerUserBadge) headerUserBadge.style.display = 'flex';
      if (headerUserName) headerUserName.textContent = state.user.name || state.user.email;

      if (profileDetails) {
        profileDetails.innerHTML = `
          <div style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.8;">
            <div><strong>ID:</strong> ${state.user.id || 'N/A'}</div>
            <div><strong>Nome:</strong> ${state.user.name || 'N/A'}</div>
            <div><strong>Email:</strong> ${state.user.email || 'N/A'}</div>
            <div><strong>CPF:</strong> ${state.user.cpf || 'N/A'}</div>
            <div><strong>Renda:</strong> R$ ${(state.user.income || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div><strong>Idade:</strong> ${state.user.age || 'N/A'} anos</div>
            <div><strong>Coordenadas:</strong> Lat: ${state.user.latitude || '0'}, Lng: ${state.user.longitude || '0'}</div>
          </div>
        `;
      }
    } else {
      if (authStatusBadge) {
        authStatusBadge.className = 'badge badge-warning';
        authStatusBadge.textContent = 'Não Autenticado';
      }
      if (headerUserBadge) headerUserBadge.style.display = 'none';
      if (profileDetails) {
        profileDetails.innerHTML = `<p style="color: var(--text-muted); font-size: 0.875rem;">Nenhum usuário autenticado no momento. Faça login ou cadastre-se ao lado.</p>`;
      }
    }
  }
};
