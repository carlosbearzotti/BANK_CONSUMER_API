import { poiService } from '../services/poiService.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Radar GPS de Agências e POIs (Padrão Cortex Feature)
 */
export const gpsFeature = {
  pois: [],
  searchCircle: null,
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.getElementById('gpsCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setupCanvas();
    }

    this.setupForms();
    this.loadAllPois();
  },

  setupCanvas() {
    const resize = () => {
      const parent = this.canvas.parentElement;
      if (!parent) return;
      this.canvas.width = parent.clientWidth || 320;
      this.canvas.height = 320;
      this.drawRadar();
    };

    window.addEventListener('resize', resize);
    setTimeout(resize, 100);

    const coordsDisplay = document.getElementById('canvasCoords');
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / (this.canvas.width / 50));
      const y = Math.round((this.canvas.height - (e.clientY - rect.top)) / (this.canvas.height / 50));
      if (coordsDisplay) coordsDisplay.textContent = `X: ${x} | Y: ${y}`;
    });
  },

  setupForms() {
    const createForm = document.getElementById('poiCreateForm');
    const searchForm = document.getElementById('poiSearchForm');
    const refreshBtn = document.getElementById('refreshPoisBtn');

    if (createForm) {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('poiName')?.value.trim();
        const x = parseInt(document.getElementById('poiX')?.value, 10);
        const y = parseInt(document.getElementById('poiY')?.value, 10);

        if (!name || isNaN(x) || isNaN(y)) {
          toast.warning('Informe o nome e as coordenadas X e Y.');
          return;
        }

        try {
          await poiService.create({ name, x, y });
          toast.success(`Agência '${name}' cadastrada no mapa!`);
          createForm.reset();
          await this.loadAllPois();
        } catch (err) {
          toast.error(`Erro ao cadastrar agência: ${err.message}`);
        }
      });
    }

    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const x = parseInt(document.getElementById('searchX')?.value, 10);
        const y = parseInt(document.getElementById('searchY')?.value, 10);
        const dmax = parseInt(document.getElementById('searchDmax')?.value, 10);

        try {
          const res = await poiService.findNearby(x, y, dmax);
          const list = Array.isArray(res) ? res : (res.pois || []);
          this.searchCircle = { x, y, dmax };
          this.drawRadar();
          this.renderPoiList(list, `Agências no raio de ${dmax}m de (${x}, ${y})`);
          toast.info(`${list.length} agências encontradas no raio.`);
        } catch (err) {
          toast.error(`Erro na busca por raio: ${err.message}`);
        }
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.searchCircle = null;
        this.loadAllPois();
        toast.info('Radar recarregado.');
      });
    }
  },

  async loadAllPois() {
    try {
      const data = await poiService.getAll();
      this.pois = Array.isArray(data) ? data : (data.content || []);
      this.drawRadar();
      this.renderPoiList(this.pois, 'Todas as Agências e Caixas 24h');
    } catch {
      this.pois = [
        { id: 1, name: 'LãoBank Matriz', x: 20, y: 10 },
        { id: 2, name: 'Caixa 24h Paulista', x: 15, y: 8 },
        { id: 3, name: 'Agência Faria Lima', x: 28, y: 14 }
      ];
      this.drawRadar();
      this.renderPoiList(this.pois, 'Agências Ativas');
    }
  },

  drawRadar() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scale = w / 50;

    ctx.clearRect(0, 0, w, h);

    // Fundo Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Raio de busca ativo
    if (this.searchCircle) {
      const cx = this.searchCircle.x * scale;
      const cy = h - (this.searchCircle.y * scale);
      const r = this.searchCircle.dmax * scale;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(197, 160, 89, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(197, 160, 89, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Renderizar POIs
    this.pois.forEach((p) => {
      const px = p.x * scale;
      const py = h - (p.y * scale);

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '10px sans-serif';
      ctx.fillText(p.name, px + 8, py + 3);
    });
  },

  renderPoiList(list, title) {
    const container = document.getElementById('poiListContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="font-size: 0.8rem; font-weight: 700; color: var(--bank-gold-light); margin-bottom: 0.75rem;">
        ${title} (${list.length})
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 280px; overflow-y: auto;">
        ${list.map((p) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: rgba(255,255,255,0.03); border: 1px solid var(--bank-border-soft); border-radius: var(--radius-sm);">
            <div>
              <div style="font-size: 0.85rem; font-weight: 600; color: #ffffff;">${p.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Coordenadas: (${p.x}, ${p.y})</div>
            </div>
            <span class="badge badge-gold">Disponível</span>
          </div>
        `).join('')}
      </div>
    `;
  }
};
