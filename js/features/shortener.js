import { urlService } from '../services/urlService.js';
import { state } from '../lib/state.js';
import { utils } from '../lib/utils.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Cobranças, Links e Campanha CDB (Padrão Cortex Feature)
 */
export const shortenerFeature = {
  init() {
    const form = document.getElementById('shortenerForm');
    const resultBox = document.getElementById('shortResultBox');
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');
    const copyBtn = document.getElementById('copyShortUrlBtn');
    const statsBtn = document.getElementById('checkStatsBtn');
    const statsResult = document.getElementById('shortStatsResult');
    const generateCdbBtn = document.getElementById('generateCdbLinkBtn');

    let currentShortCode = null;

    if (generateCdbBtn) {
      generateCdbBtn.addEventListener('click', async () => {
        const userName = (state.user?.name || 'cliente').toLowerCase().replace(/\s+/g, '-');
        const cdbPromoUrl = `https://laobank.com.br/promocoes/cdb-15-amigos?ref=${userName}&id=${state.user?.id || 1}`;

        try {
          const res = await urlService.shorten(cdbPromoUrl);
          const code = res.shortCode || res.code || (res.shortUrl ? res.shortUrl.split('/').pop() : '');
          currentShortCode = code;
          const fullShortUrl = `${state.baseUrl}/${code}`;

          if (shortUrlDisplay) shortUrlDisplay.textContent = fullShortUrl;
          if (resultBox) resultBox.style.display = 'flex';
          const statsCodeInput = document.getElementById('statsCodeInput');
          if (statsCodeInput) statsCodeInput.value = code;

          toast.success('🎁 Link exclusivo da Campanha CDB gerado com sucesso!');
        } catch (err) {
          toast.error(`Erro ao gerar link da campanha: ${err.message}`);
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('originalUrlInput')?.value.trim();

        if (!url) {
          toast.warning('Informe a URL para encurtar.');
          return;
        }

        try {
          const res = await urlService.shorten(url);
          const code = res.shortCode || res.code || (res.shortUrl ? res.shortUrl.split('/').pop() : '');
          currentShortCode = code;
          const fullShortUrl = `${state.baseUrl}/${code}`;

          if (shortUrlDisplay) shortUrlDisplay.textContent = fullShortUrl;
          if (resultBox) resultBox.style.display = 'flex';
          if (statsResult) statsResult.innerHTML = '';

          toast.success('Link de cobrança encurtado com sucesso!');
        } catch (err) {
          toast.error(`Erro ao encurtar link: ${err.message}`);
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const text = shortUrlDisplay?.textContent;
        if (text) {
          await utils.copyToClipboard(text);
          toast.success('Link copiado para a área de transferência!');
        }
      });
    }

    if (statsBtn) {
      statsBtn.addEventListener('click', async () => {
        const inputCode = document.getElementById('statsCodeInput')?.value.trim() || currentShortCode;
        if (!inputCode) {
          toast.warning('Informe o código do link para consultar as métricas.');
          return;
        }

        try {
          const stats = await urlService.getStats(inputCode);
          if (statsResult) {
            statsResult.innerHTML = `
              <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--bank-border-soft); border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 0.85rem;">
                <div><strong>Código:</strong> ${stats.shortCode || inputCode}</div>
                <div style="margin: 0.35rem 0; word-break: break-all;"><strong>URL Original:</strong> <a href="${stats.originalUrl}" target="_blank" style="color: var(--status-info);">${stats.originalUrl}</a></div>
                <div><strong>Total de Cliques:</strong> <span class="badge badge-success">${stats.accessCount ?? stats.clicks ?? 0} acessos</span></div>
              </div>
            `;
          }
          toast.info('Métricas carregadas.');
        } catch (err) {
          toast.error(`Erro ao consultar métricas: ${err.message}`);
        }
      });
    }
  }
};
