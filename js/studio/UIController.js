import { ProductTemplates } from '../engine/ProductTemplates.js';

export class UIController {
  constructor() {
    this.engine = null;
    this.callbacks = {};

    this.elHeader = null;
    this.elSidebar = null;
    this.elBom = null;
    this.elInspector = null;
    this.elBtnExplode = null;
    this.elBtnResetCam = null;
    this.elBtnExportDrawing = null;
    this.elAnimSlider = null;
    this.elBadge = null;
    this.elInfo = null;
  }

  init(engine, callbacks) {
    this.engine = engine;
    this.callbacks = callbacks || {};

    this.elHeader = document.getElementById('studio-header');
    this.elSidebar = document.getElementById('param-sidebar');
    this.elBom = document.getElementById('bom-panel');
    this.elInspector = document.getElementById('inspector-panel');
    this.elBtnExplode = document.getElementById('btn-explode');
    this.elBtnResetCam = document.getElementById('btn-reset-camera');
    this.elBtnExportDrawing = document.getElementById('btn-export-drawing');
    this.elAnimSlider = document.getElementById('anim-slider');
    this.elBadge = document.getElementById('view-badge');
    this.elInfo = document.getElementById('viewport-info');

    this._bindEvents();
  }

  _bindEvents() {
    if (this.elBtnExplode) {
      this.elBtnExplode.addEventListener('click', () => {
        if (this.callbacks.onExplodeToggle) this.callbacks.onExplodeToggle();
      });
    }

    if (this.elBtnResetCam) {
      this.elBtnResetCam.addEventListener('click', () => {
        if (this.callbacks.onResetCamera) this.callbacks.onResetCamera();
      });
    }

    if (this.elBtnExportDrawing) {
      this.elBtnExportDrawing.addEventListener('click', () => {
        if (this.callbacks.onExportDrawing) this.callbacks.onExportDrawing();
      });
    }

    if (this.elAnimSlider) {
      this.elAnimSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.callbacks.onAnimSliderChange) this.callbacks.onAnimSliderChange(val);
      });
    }
  }

  updateParameters() {
    if (!this.elSidebar || !this.engine) return;

    const allTemplates = ProductTemplates.getAll();
    const currentTemplate = this.engine._currentProduct;

    const params = this.engine.getAllParameters();
    this.elSidebar.innerHTML = `
      <div class="param-item" style="margin-bottom:12px;">
        <div class="param-header">
          <span style="font-weight:700;color:var(--accent-wood);">📦 Select Product Model</span>
        </div>
        <select class="select-input" id="template-selector">
          ${allTemplates.map(t => `<option value="${t.id}" ${t.id === currentTemplate.id ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
      </div>

      <div class="panel-title">
        <span>⚙️</span> Parametric Controls
      </div>
    `;

    const selector = document.getElementById('template-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        if (this.callbacks.onProductSwitch) this.callbacks.onProductSwitch(e.target.value);
      });
    }

    const groupMap = new Map();
    for (const [key, p] of Object.entries(params)) {
      const groupName = p.group || 'General';
      if (!groupMap.has(groupName)) groupMap.set(groupName, []);
      groupMap.get(groupName).push({ key, ...p });
    }

    for (const [groupName, items] of groupMap.entries()) {
      const groupEl = document.createElement('div');
      groupEl.className = 'param-group';

      let itemsHtml = `<div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-top:4px;">${groupName}</div>`;

      for (const item of items) {
        if (item.options) {
          itemsHtml += `
            <div class="param-item">
              <div class="param-header">
                <span>${item.label}</span>
                <span class="param-value">${item.value}</span>
              </div>
              <select class="select-input" data-key="${item.key}">
                ${item.options.map(opt => `<option value="${opt}" ${opt === item.value ? 'selected' : ''}>${opt.replace('_', ' ').toUpperCase()}</option>`).join('')}
              </select>
            </div>
          `;
        } else {
          itemsHtml += `
            <div class="param-item">
              <div class="param-header">
                <span>${item.label}</span>
                <span class="param-value" id="val-${item.key}">${item.value}${item.unit || ''}</span>
              </div>
              <input type="range" class="slider" data-key="${item.key}" min="${item.min}" max="${item.max}" step="${item.step}" value="${item.value}">
            </div>
          `;
        }
      }

      groupEl.innerHTML = itemsHtml;
      this.elSidebar.appendChild(groupEl);
    }

    this.elSidebar.querySelectorAll('input.slider').forEach((slider) => {
      slider.addEventListener('input', (e) => {
        const key = e.target.dataset.key;
        const val = parseFloat(e.target.value);
        const valEl = document.getElementById(`val-${key}`);
        if (valEl) {
          const unit = params[key]?.unit || '';
          valEl.textContent = `${val}${unit}`;
        }
        if (this.callbacks.onParameterChange) this.callbacks.onParameterChange(key, val);
      });
    });

    this.elSidebar.querySelectorAll('select.select-input').forEach((select) => {
      if (select.id === 'template-selector') return;
      select.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        const val = e.target.value;
        if (this.callbacks.onParameterChange) this.callbacks.onParameterChange(key, val);
      });
    });
  }

  setExplodeState(isExploded, progress = 0) {
    if (this.elBtnExplode) {
      if (isExploded) {
        this.elBtnExplode.classList.add('exploded');
        this.elBtnExplode.innerHTML = '🧩 Assemble View';
      } else {
        this.elBtnExplode.classList.remove('exploded');
        this.elBtnExplode.innerHTML = '💥 Explode View';
      }
    }

    if (this.elBadge) {
      if (isExploded) {
        this.elBadge.innerHTML = '<span class="badge-dot exploded"></span> Exploded View';
      } else {
        this.elBadge.innerHTML = '<span class="badge-dot"></span> Assembled View';
      }
    }

    if (this.elAnimSlider && document.activeElement !== this.elAnimSlider) {
      this.elAnimSlider.value = progress;
    }
  }

  showPartInfo(userData) {
    if (!this.elInfo) return;
    if (!userData || !userData.partType) {
      this.elInfo.style.opacity = '0';
      return;
    }

    this.elInfo.style.opacity = '1';
    if (userData.partType === 'dowel_rod') {
      this.elInfo.innerHTML = `🥖 <strong>Structural Dowel Rod</strong> (Heavy-Duty Solid Wood)`;
    } else if (userData.partType === 'connector') {
      this.elInfo.innerHTML = `🧩 <strong>3D Printed PETG/ABS Joint Connector</strong> (Push-Fit Socket)`;
    } else if (userData.partType === 'plant_pot') {
      this.elInfo.innerHTML = `🪴 <strong>Ceramic Plant Pot with Foliage</strong>`;
    } else if (userData.partType === 'spice_jar') {
      this.elInfo.innerHTML = `🫙 <strong>Spice Jar</strong>: ${userData.labelName || 'Spice'} (${userData.spiceType?.replace('spice_', '').toUpperCase()})`;
    } else if (userData.partType === 'panel') {
      this.elInfo.innerHTML = `🪵 <strong>Solid Wood Shelf Panel (4 Corner Holes)</strong>`;
    } else if (userData.partType === 'turned_pillar') {
      this.elInfo.innerHTML = `🦵 <strong>Continuous Turned Wood Pillar</strong>`;
    } else if (userData.partType === 'support_collar') {
      this.elInfo.innerHTML = `⭕ <strong>Separate Wooden Support Collar</strong>`;
    } else if (userData.partType === 'cross_pin') {
      this.elInfo.innerHTML = `🔑 <strong>Wooden Cross-Pin Key</strong>`;
    } else {
      this.elInfo.innerHTML = `🔩 <strong>Part</strong>: ${userData.partId}`;
    }
  }

  updateBOM(bom) {
    if (!this.elBom || !bom) return;

    const totalEl = document.getElementById('bom-total');
    if (totalEl) totalEl.textContent = `${bom.totalParts} total components`;

    const gridEl = document.getElementById('bom-grid');
    if (gridEl) {
      let html = '';

      // MODUPLANT Nodes
      bom.dowelRods?.forEach(r => {
        html += `<div class="bom-item"><span>${r.name} (${r.spec})</span><strong>x${r.count}</strong></div>`;
      });
      bom.connectors?.forEach(c => {
        html += `<div class="bom-item"><span>${c.name}</span><strong>x${c.count}</strong></div>`;
      });
      bom.plantPots?.forEach(p => {
        html += `<div class="bom-item"><span>${p.name}</span><strong>x${p.count}</strong></div>`;
      });

      // Legacy Nodes
      bom.panels?.forEach(p => {
        html += `<div class="bom-item"><span>${p.name}</span><strong>x${p.count}</strong></div>`;
      });
      bom.pillars?.forEach(p => {
        html += `<div class="bom-item"><span>${p.name} (${p.spec})</span><strong>x${p.count}</strong></div>`;
      });
      bom.collars?.forEach(c => {
        html += `<div class="bom-item"><span>${c.name}</span><strong>x${c.count}</strong></div>`;
      });
      bom.pins?.forEach(pin => {
        html += `<div class="bom-item"><span>${pin.name}</span><strong>x${pin.count}</strong></div>`;
      });
      bom.jars?.forEach(j => {
        html += `<div class="bom-item"><span>${j.name}</span><strong>x${j.count}</strong></div>`;
      });

      gridEl.innerHTML = html;
    }

    this._updateInspectorPanel(bom);
  }

  _updateInspectorPanel(bom) {
    if (!this.elInspector) return;

    const isModuplant = this.engine._currentProduct?.id === 'moduplant_infinite';
    const listEl = document.getElementById('jar-list');
    if (!listEl) return;

    if (isModuplant) {
      this.elInspector.querySelector('.panel-title').innerHTML = '🪴 MODUPLANT Features';
      listEl.innerHTML = `
        <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;">
          • <strong>Heavy-Duty Dowels</strong>: Ø20-25mm solid wood rods.<br>
          • <strong>3D Printed Joints</strong>: High-strength PETG push-fit connectors.<br>
          • <strong>Infinite Grid Extension</strong>: Add/remove bays and tiers anytime!
        </div>
      `;
    } else {
      this.elInspector.querySelector('.panel-title').innerHTML = '🫙 Spice Jars & Contents';
      const jars = [
        { name: 'Cumin', color: '#8a7048' },
        { name: 'Oregano', color: '#485828' },
        { name: 'Coriander', color: '#9a8550' },
        { name: 'Paprika', color: '#aa2810' }
      ];
      listEl.innerHTML = jars.map(j => `
        <div class="jar-card">
          <div class="jar-swatch" style="background:${j.color}"></div>
          <span><strong>${j.name}</strong> Jar (Glass + Label)</span>
        </div>
      `).join('');
    }
  }
}
