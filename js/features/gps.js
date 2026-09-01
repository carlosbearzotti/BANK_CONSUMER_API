import { poiService } from '../services/poiService.js';
import { state } from '../lib/state.js';
import { toast } from '../ui/toast.js';

/**
 * Módulo de Radar GPS de Agências & Caixas 24h (Recomendações B2C)
 */
export const gpsFeature = {
  pois: [],
  userCoords: { x: 20, y: 20 },
  searchRadius: 15,
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.getElementById('gpsCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setupCanvas();
    }

    this.setupListeners();
    this.updateUserLocation();
    this.loadRecommendations();

    state.subscribe('auth', () => {
      this.updateUserLocation();
      this.loadRecommendations();
    });
  },

  updateUserLocation() {
    const user = state.user;
    if (user?.latitude != null && user?.longitude != null) {
      // Mapeia coordenadas reais (ex: SP -23.55, -46.63) para grade relativa do radar (0-50)
      const refX = Math.abs(Math.round((user.longitude + 46.63) * 100)) % 36 + 7;
      const refY = Math.abs(Math.round((user.latitude + 23.55) * 100)) % 36 + 7;
      this.userCoords = { x: refX, y: refY };
    } else {
      this.userCoords = { x: 20, y: 20 };
    }

    // Atualiza labels visuais de localização
    const addrLabel = document.getElementById('radarUserAddressLabel');
    const coordsLabel = document.getElementById('radarUserCoordsLabel');

    if (addrLabel) {
      addrLabel.textContent = user?.name ? `Localização Residencial de ${user.name.split(' ')[0]}` : 'Endereço Cadastrado na Conta';
    }

    if (coordsLabel) {
      const latStr = user?.latitude != null ? user.latitude.toFixed(4) : '-23.5505';
      const lngStr = user?.longitude != null ? user.longitude.toFixed(4) : '-46.6333';
      coordsLabel.textContent = `GPS: (${latStr}, ${lngStr}) • Ponto Central no Radar: (${this.userCoords.x}, ${this.userCoords.y})`;
    }
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
      if (coordsDisplay) coordsDisplay.textContent = `Cursor: (${x}, ${y})`;
    });
  },

  setupListeners() {
    const refreshBtn = document.getElementById('refreshPoisBtn');
    const radiusSelect = document.getElementById('radarRadiusSelect');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.updateUserLocation();
        this.loadRecommendations();
        toast.info('Proximidade recalculada com base no seu endereço!');
      });
    }

    if (radiusSelect) {
      radiusSelect.addEventListener('change', (e) => {
        this.searchRadius = parseInt(e.target.value, 10) || 15;
        this.loadRecommendations();
      });
    }
  },

  async loadRecommendations() {
    try {
      const data = await poiService.getAll();
      const list = Array.isArray(data) ? data : (data.content || []);
      this.pois = list.length > 0 ? list : this.getFallbackPois();
    } catch {
      this.pois = this.getFallbackPois();
    }

    // Calcula distância euclidiana para cada ponto em relação ao endereço do usuário
    this.pois = this.pois.map((p) => {
      const dx = p.x - this.userCoords.x;
      const dy = p.y - this.userCoords.y;
      const rawDist = Math.sqrt(dx * dx + dy * dy);
      const distKm = (rawDist * 0.45).toFixed(1);
      const estMinutes = Math.max(2, Math.round(rawDist * 1.8));

      return {
        ...p,
        rawDist,
        distKm: parseFloat(distKm),
        estMinutes,
        type: p.name?.toLowerCase().includes('caixa') ? 'ATM' : 'AGENCIA'
      };
    });

    // Ordena do mais próximo para o mais distante
    this.pois.sort((a, b) => a.rawDist - b.rawDist);

    this.drawRadar();
    this.renderPoiList();
  },

  getFallbackPois() {
    return [
      { id: 1, name: 'LãoBank Agência Paulista', x: 22, y: 23 },
      { id: 2, name: 'Caixa 24h Shopping Cidade', x: 18, y: 19 },
      { id: 3, name: 'LãoBank Agência Faria Lima', x: 26, y: 15 },
      { id: 4, name: 'Caixa 24h Estação Central', x: 14, y: 25 },
      { id: 5, name: 'LãoBank Prime Jardins', x: 28, y: 26 }
    ];
  },

  drawRadar() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scale = w / 50;

    ctx.clearRect(0, 0, w, h);

    // 1. Grade do Radar
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

    // 2. Círculo de Proximidade em volta do Usuário
    const userPx = this.userCoords.x * scale;
    const userPy = h - (this.userCoords.y * scale);
    const radiusPx = this.searchRadius * scale;

    ctx.beginPath();
    ctx.arc(userPx, userPy, radiusPx, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(197, 160, 89, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]); // Restaura traço contínuo

    // 3. Renderizar POIs Recomendados
    this.pois.forEach((p, idx) => {
      const px = p.x * scale;
      const py = h - (p.y * scale);
      const isClosest = idx === 0;

      ctx.beginPath();
      ctx.arc(px, py, isClosest ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isClosest ? '#dfb76c' : '#34d399';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isClosest ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = isClosest ? '#dfb76c' : '#f1f5f9';
      ctx.font = isClosest ? 'bold 10px sans-serif' : '10px sans-serif';
      ctx.fillText(p.name, px + 9, py + 3);
    });

    // 4. Marcador do Usuário ("Você está aqui")
    ctx.beginPath();
    ctx.arc(userPx, userPy, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('📍 Você', userPx + 12, userPy + 4);
  },

  renderPoiList() {
    const container = document.getElementById('poiListContainer');
    if (!container) return;

    const nearbyCount = this.pois.filter((p) => p.rawDist <= this.searchRadius).length;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--bank-gold-light); text-transform: uppercase; letter-spacing: 0.05em;">
          Recomendações por Proximidade (${this.pois.length})
        </div>
        <span class="badge badge-primary" style="font-size: 0.7rem;">${nearbyCount} no seu raio de ${this.searchRadius}km</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.65rem; max-height: 280px; overflow-y: auto;">
        ${this.pois.map((p, idx) => {
          const isClosest = idx === 0;
          const isInsideRadius = p.rawDist <= this.searchRadius;

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0.95rem; background: ${isClosest ? 'rgba(197, 160, 89, 0.08)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isClosest ? 'rgba(197, 160, 89, 0.4)' : 'var(--bank-border-soft)'}; border-radius: var(--radius-md); transition: all 0.2s;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="font-size: 1.3rem;">
                  ${p.type === 'ATM' ? '🏧' : '🏛️'}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <span style="font-size: 0.875rem; font-weight: 700; color: #ffffff;">${p.name}</span>
                    ${isClosest ? '<span class="badge badge-warning" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">⭐ Mais Próxima</span>' : ''}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                    Distância: <strong style="color: #38bdf8;">~${p.distKm} km</strong> • Tempo estimado: <strong style="color: #34d399;">~${p.estMinutes} min</strong>
                  </div>
                </div>
              </div>

              <div>
                <span class="badge ${isInsideRadius ? 'badge-gold' : 'badge-secondary'}" style="font-size: 0.7rem;">
                  ${isInsideRadius ? 'No seu raio' : 'Fora do raio'}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
