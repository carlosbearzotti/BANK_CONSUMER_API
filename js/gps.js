import { poiService } from './services/poiService.js';

export const gpsModule = {
  pois: [],
  radarSearch: null,

  init(showToast) {
    const canvas = document.getElementById('gpsCanvas');
    const createForm = document.getElementById('poiCreateForm');
    const searchForm = document.getElementById('poiSearchForm');
    const refreshBtn = document.getElementById('refreshPoisBtn');
    const coordsOverlay = document.getElementById('canvasCoords');
    const poiList = document.getElementById('poiListContainer');

    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height || 340);
      this.drawRadar(ctx, canvas);
    };

    window.addEventListener('resize', resizeCanvas);
    if (window.ResizeObserver && canvas.parentElement) {
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(canvas.parentElement);
    }

    // Trigger redraw when GPS tab is clicked
    document.querySelectorAll('[data-tab="gps"]').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => resizeCanvas(), 100);
      });
    });

    // Canvas click to select coordinate
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Map canvas pixel coords to GPS space (0 -> 50)
      const mappedX = Math.round((clickX / canvas.width) * 50);
      const mappedY = Math.round(((canvas.height - clickY) / canvas.height) * 50);

      const targetX = document.getElementById('poiX');
      const targetY = document.getElementById('poiY');
      const searchX = document.getElementById('searchX');
      const searchY = document.getElementById('searchY');

      if (targetX && targetY) {
        targetX.value = mappedX;
        targetY.value = mappedY;
      }
      if (searchX && searchY) {
        searchX.value = mappedX;
        searchY.value = mappedY;
      }

      if (coordsOverlay) {
        coordsOverlay.textContent = `X: ${mappedX}, Y: ${mappedY}`;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const mappedX = Math.round((clickX / canvas.width) * 50);
      const mappedY = Math.round(((canvas.height - clickY) / canvas.height) * 50);
      if (coordsOverlay) {
        coordsOverlay.textContent = `X: ${mappedX} | Y: ${mappedY}`;
      }
    });

    if (createForm) {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('poiName').value.trim();
        const x = parseInt(document.getElementById('poiX').value, 10);
        const y = parseInt(document.getElementById('poiY').value, 10);

        try {
          const res = await poiService.create({ name, x, y });

          showToast(`LãoBank: Agência / POI '${name}' cadastrado com sucesso!`, 'success');
          createForm.reset();
          await this.loadPois(showToast, ctx, canvas, poiList);
        } catch (err) {
          showToast(`Erro ao cadastrar POI: ${err.message}`, 'error');
        }
      });
    }

    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const x = parseInt(document.getElementById('searchX').value, 10);
        const y = parseInt(document.getElementById('searchY').value, 10);
        const dmax = parseFloat(document.getElementById('searchDmax').value);

        try {
          const list = await poiService.getNearby(x, y, dmax);
          this.radarSearch = { x, y, dmax, results: list };
          this.renderPoiList(list, poiList);
          this.drawRadar(ctx, canvas);
          showToast(`Radar LãoBank: ${list.length} ponto(s) no raio de ${dmax}m`, 'success');
        } catch (err) {
          showToast(`Erro na busca do radar: ${err.message}`, 'error');
        }
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        this.radarSearch = null;
        await this.loadPois(showToast, ctx, canvas, poiList);
        showToast('Radar de agências LãoBank recarregado!', 'info');
      });
    }

    setTimeout(() => {
      resizeCanvas();
      this.loadPois(showToast, ctx, canvas, poiList);
    }, 150);
  },

  async loadPois(showToast, ctx, canvas, poiList) {
    try {
      this.pois = await poiService.getAll();
      this.renderPoiList(this.pois, poiList);
      this.drawRadar(ctx, canvas);
    } catch (err) {
      // Offline fallback mock data for smooth UI preview
      if (!this.pois || this.pois.length === 0) {
        this.pois = [
          { id: 1, name: 'Agência Centro Finanças', x: 20, y: 10 },
          { id: 2, name: 'Caixa 24h Shopping', x: 27, y: 12 },
          { id: 3, name: 'Agência Paulista', x: 35, y: 30 }
        ];
        this.renderPoiList(this.pois, poiList);
        this.drawRadar(ctx, canvas);
      }
    }
  },

  renderPoiList(list, container) {
    if (!container) return;
    if (!list || list.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">Nenhum ponto encontrado.</p>`;
      return;
    }

    container.innerHTML = list.map(poi => {
      const distance = poi.distance != null ? `<span class="badge badge-primary">${poi.distance.toFixed(1)}m</span>` : '';
      return `
        <div class="poi-item">
          <div class="poi-info">
            <h4>${poi.name}</h4>
            <span>(X: ${poi.x}, Y: ${poi.y})</span>
          </div>
          ${distance}
        </div>
      `;
    }).join('');
  },

  drawRadar(ctx, canvas) {
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#08090d';
    ctx.fillRect(0, 0, w, h);

    // Radar Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const gridSteps = 10;
    for (let i = 0; i <= gridSteps; i++) {
      const x = (w / gridSteps) * i;
      const y = (h / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Convert (x, y) [0-50] to canvas pixel coords
    const toPx = (x, y) => ({
      px: (x / 50) * w,
      py: h - (y / 50) * h
    });

    // Draw Radar search circle if active
    if (this.radarSearch) {
      const center = toPx(this.radarSearch.x, this.radarSearch.y);
      const radiusPx = (this.radarSearch.dmax / 50) * w;

      ctx.beginPath();
      ctx.arc(center.px, center.py, radiusPx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Search origin point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(center.px, center.py, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw POIs
    this.pois.forEach(poi => {
      const { px, py } = toPx(poi.x, poi.y);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(poi.name, px + 8, py - 4);
    });
  }
};
