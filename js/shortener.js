import { request } from './api.js';
import { state } from './state.js';

export const shortenerModule = {
  init(showToast) {
    const form = document.getElementById('shortenerForm');
    const resultBox = document.getElementById('shortResultBox');
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');
    const copyBtn = document.getElementById('copyShortUrlBtn');
    const statsBtn = document.getElementById('checkStatsBtn');
    const statsResult = document.getElementById('shortStatsResult');

    let currentShortCode = null;

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('originalUrlInput').value.trim();

        try {
          const res = await request('/shorten-url', {
            method: 'POST',
            body: { url }
          });

          const code = res.shortCode || res.code || (res.shortUrl ? res.shortUrl.split('/').pop() : '');
          currentShortCode = code;
          const fullShortUrl = `${state.baseUrl}/${code}`;

          if (shortUrlDisplay) shortUrlDisplay.textContent = fullShortUrl;
          if (resultBox) resultBox.style.display = 'flex';
          if (statsResult) statsResult.innerHTML = '';

          showToast('Link encurtado com sucesso!', 'success');
        } catch (err) {
          showToast(`Erro ao encurtar URL: ${err.message}`, 'error');
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (shortUrlDisplay && shortUrlDisplay.textContent) {
          navigator.clipboard.writeText(shortUrlDisplay.textContent);
          showToast('Link copiado para a área de transferência!', 'success');
        }
      });
    }

    if (statsBtn) {
      statsBtn.addEventListener('click', async () => {
        const inputCode = document.getElementById('statsCodeInput').value.trim() || currentShortCode;
        if (!inputCode) {
          showToast('Informe o código da URL para consultar as métricas!', 'warning');
          return;
        }

        try {
          const stats = await request(`/shorten-url/${inputCode}/stats`);
          if (statsResult) {
            statsResult.innerHTML = `
              <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.85rem;">
                <div><strong>Código:</strong> ${stats.shortCode || inputCode}</div>
                <div><strong>URL Original:</strong> <a href="${stats.originalUrl}" target="_blank" style="color: #f87171;">${stats.originalUrl}</a></div>
                <div><strong>Acessos Totais:</strong> <span class="badge badge-primary">${stats.accessCount ?? stats.clicks ?? 0}</span></div>
                <div><strong>Expira em:</strong> ${stats.expiresAt ? new Date(stats.expiresAt).toLocaleDateString() : '30 dias'}</div>
              </div>
            `;
          }
          showToast('Métricas carregadas!', 'success');
        } catch (err) {
          showToast(`Erro ao consultar estatísticas: ${err.message}`, 'error');
        }
      });
    }
  }
};
