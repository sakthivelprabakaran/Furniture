/**
 * DrawingExporter.js — Technical Drawing & Engineering Blueprint Generator
 * Supports MODUPLANT Modular Plant Stand & Achuva Spice Rack
 */

export class DrawingExporter {
  constructor(engine) {
    this.engine = engine;
  }

  generateModuplantFrontView(params) {
    const activeBays = Math.min(params.bays, 4);
    const bayHeights = [params.leftTierCount, params.centerTierCount, params.rightTierCount, params.rightTierCount];
    const maxTiers = Math.max(...bayHeights);

    const w = activeBays * params.bayWidth;
    const h = maxTiers * params.tierHeight + 60;
    const scale = 0.55;
    const paddingX = 50;
    const paddingY = 40;
    const svgW = w * scale + paddingX * 2;
    const svgH = h * scale + paddingY * 2;

    const yBase = svgH - paddingY;

    let svgContent = '';

    // Ground datum
    svgContent += `<line x1="15" y1="${yBase}" x2="${svgW - 15}" y2="${yBase}" stroke="#666" stroke-dasharray="4,2" stroke-width="1"/>`;
    svgContent += `<text x="20" y="${yBase + 16}" fill="#888" font-size="9" font-weight="bold">DATUM FLOOR LEVEL (0,0)</text>`;

    // Render Grid Pillars & Shelves
    for (let b = 0; b <= activeBays; b++) {
      const xPos = paddingX + b * params.bayWidth * scale;

      let leftB = Math.max(0, b - 1);
      let rightB = Math.min(activeBays - 1, b);
      let colTiers = Math.max(bayHeights[leftB] || 1, bayHeights[rightB] || 1);

      const colH = colTiers * params.tierHeight * scale;
      const yTop = yBase - colH;

      // Vertical Pillar Line
      svgContent += `<rect x="${xPos - 5}" y="${yTop}" width="10" height="${colH}" fill="none" stroke="#d4a373" stroke-width="1.5" class="cad-shape-pillar"/>`;

      // 3D Printed Connector Dots
      for (let t = 0; t <= colTiers; t++) {
        const yNode = yBase - t * params.tierHeight * scale;
        const color = t === 0 ? '#486e42' : '#ff9800';
        svgContent += `<circle cx="${xPos}" cy="${yNode}" r="6" fill="none" stroke="${color}" stroke-width="1.5"/>`;
      }
    }

    // Render Horizontal Bay Rails & Plant Pots
    for (let b = 0; b < activeBays; b++) {
      const xStart = paddingX + b * params.bayWidth * scale;
      const xEnd = xStart + params.bayWidth * scale;
      const xMid = (xStart + xEnd) / 2;
      const bTiers = bayHeights[b] || 1;

      for (let t = 1; t <= bTiers; t++) {
        const yNode = yBase - t * params.tierHeight * scale;

        // Slatted Shelf Rail
        svgContent += `<line x1="${xStart + 6}" y1="${yNode}" x2="${xEnd - 6}" y2="${yNode}" stroke="#4fc3f7" stroke-width="3"/>`;

        // Plant Pot Icon
        svgContent += `<rect x="${xMid - 10}" y="${yNode - 22}" width="20" height="22" fill="none" stroke="#26a69a" stroke-width="1.5" rx="3"/>`;
        svgContent += `<circle cx="${xMid}" cy="${yNode - 28}" r="8" fill="none" stroke="#26a69a" stroke-width="1.2" stroke-dasharray="2,2"/>`;
      }
    }

    // Dimensions
    svgContent += `
      <line x1="${paddingX}" y1="${yBase + 35}" x2="${paddingX + w * scale}" y2="${yBase + 35}" stroke="#4fc3f7" stroke-width="1" marker-start="url(#arrBlue)" marker-end="url(#arrBlue)"/>
      <text x="${paddingX + w * scale / 2}" y="${yBase + 28}" fill="#4fc3f7" font-size="10" font-weight="bold" text-anchor="middle" class="dim-blue">TOTAL RACK WIDTH: ${w} mm (${activeBays} BAYS)</text>
    `;

    return `
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" class="cad-svg">
        <defs>
          <marker id="arrBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4fc3f7" />
          </marker>
        </defs>
        ${svgContent}
      </svg>
    `;
  }

  generateModuplantSideView(params) {
    const d = params.bayDepth;
    const h = params.centerTierCount * params.tierHeight + 60;
    const scale = 0.6;
    const paddingX = 50;
    const paddingY = 40;
    const svgW = d * scale + paddingX * 2;
    const svgH = h * scale + paddingY * 2;

    const yBase = svgH - paddingY;

    return `
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" class="cad-svg">
        <defs>
          <marker id="arrSide" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4fc3f7" />
          </marker>
        </defs>
        <line x1="15" y1="${yBase}" x2="${svgW - 15}" y2="${yBase}" stroke="#666" stroke-dasharray="4,2" stroke-width="1"/>
        <rect x="${paddingX}" y="${yBase - params.centerTierCount * params.tierHeight * scale}" width="10" height="${params.centerTierCount * params.tierHeight * scale}" fill="none" stroke="#d4a373" stroke-width="1.5" class="cad-shape-pillar"/>
        <rect x="${paddingX + d * scale - 10}" y="${yBase - params.centerTierCount * params.tierHeight * scale}" width="10" height="${params.centerTierCount * params.tierHeight * scale}" fill="none" stroke="#d4a373" stroke-width="1.5" class="cad-shape-pillar"/>
        <line x1="${paddingX}" y1="${yBase + 35}" x2="${paddingX + d * scale}" y2="${yBase + 35}" stroke="#4fc3f7" stroke-width="1" marker-start="url(#arrSide)" marker-end="url(#arrSide)"/>
        <text x="${paddingX + d * scale / 2}" y="${yBase + 28}" fill="#4fc3f7" font-size="10" font-weight="bold" text-anchor="middle" class="dim-blue">FRAME DEPTH: ${d} mm</text>
      </svg>
    `;
  }

  // --- Legacy Assembly & Shop Drawing Generators ---
  generateFrontAssemblyView(params) {
    const w = params.width || 460;
    const h = 2 * (params.tierHeight || 130) + (params.panelThickness || 16) + (params.baseClearance || 40) + 30;
    const scale = 0.7;
    const paddingX = 60;
    const paddingY = 55;
    const svgW = w * scale + paddingX * 2;
    const svgH = h * scale + paddingY * 2;

    const yBase = svgH - paddingY;
    const yBottomShelf = yBase - ((params.baseClearance || 40) + (params.panelThickness || 16) / 2) * scale;
    const yMiddleShelf = yBottomShelf - (params.tierHeight || 130) * scale;
    const yTopShelf = yMiddleShelf - (params.tierHeight || 130) * scale;

    const xLeftPillar = paddingX + 28 * scale;
    const xRightPillar = paddingX + (w - 28) * scale;

    return `
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" class="cad-svg">
        <defs>
          <marker id="arrBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4fc3f7" />
          </marker>
        </defs>
        <line x1="15" y1="${yBase}" x2="${svgW - 15}" y2="${yBase}" stroke="#666" stroke-dasharray="4,2" stroke-width="1"/>
        <rect x="${paddingX}" y="${yBottomShelf - 8*scale}" width="${w*scale}" height="12" fill="none" stroke="#f0f2f8" stroke-width="1.5" rx="3" class="cad-shape-shelf"/>
        <rect x="${paddingX}" y="${yMiddleShelf - 8*scale}" width="${w*scale}" height="12" fill="none" stroke="#f0f2f8" stroke-width="1.5" rx="3" class="cad-shape-shelf"/>
        <rect x="${paddingX}" y="${yTopShelf - 8*scale}" width="${w*scale}" height="12" fill="none" stroke="#f0f2f8" stroke-width="1.5" rx="3" class="cad-shape-shelf"/>
        <rect x="${xLeftPillar - 8*scale}" y="${yTopShelf - 20*scale}" width="16" height="${h*scale}" fill="none" stroke="#d4a373" stroke-width="1.5" class="cad-shape-pillar"/>
        <rect x="${xRightPillar - 8*scale}" y="${yTopShelf - 20*scale}" width="16" height="${h*scale}" fill="none" stroke="#d4a373" stroke-width="1.5" class="cad-shape-pillar"/>
        <line x1="${paddingX}" y1="${yBase + 35}" x2="${paddingX + w*scale}" y2="${yBase + 35}" stroke="#4fc3f7" stroke-width="1" marker-start="url(#arrBlue)" marker-end="url(#arrBlue)"/>
        <text x="${paddingX + w*scale/2}" y="${yBase + 28}" fill="#4fc3f7" font-size="10" font-weight="bold" text-anchor="middle" class="dim-blue">TOTAL RACK WIDTH: ${w} mm</text>
      </svg>
    `;
  }

  generateSideAssemblyView(params) {
    const d = params.depth || 140;
    const h = 2 * (params.tierHeight || 130) + 70;
    const scale = 0.75;
    const paddingX = 60;
    const paddingY = 55;
    const svgW = d * scale + paddingX * 2;
    const svgH = h * scale + paddingY * 2;

    const yBase = svgH - paddingY;

    return `
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" class="cad-svg">
        <line x1="15" y1="${yBase}" x2="${svgW - 15}" y2="${yBase}" stroke="#666" stroke-dasharray="4,2" stroke-width="1"/>
        <rect x="${paddingX}" y="${yBase - h * scale + 30}" width="${d*scale}" height="12" fill="none" stroke="#f0f2f8" stroke-width="1.5" class="cad-shape-shelf"/>
        <text x="${paddingX + d*scale/2}" y="${yBase + 28}" fill="#4fc3f7" font-size="10" font-weight="bold" text-anchor="middle" class="dim-blue">DEPTH: ${d} mm</text>
      </svg>
    `;
  }

  renderBlueprintModal() {
    const isModuplant = this.engine._currentProduct?.id === 'moduplant_infinite';
    const params = this.engine.getAllParameters();
    const rawParams = {};
    for (const [k, v] of Object.entries(params)) rawParams[k] = v.value;

    const bom = this.engine.getBOM();

    if (isModuplant) {
      const frontSvg = this.generateModuplantFrontView(rawParams);
      const sideSvg = this.generateModuplantSideView(rawParams);

      return `
        <div class="blueprint-modal-overlay" id="blueprint-modal">
          <div class="blueprint-container">
            <div class="blueprint-header">
              <div class="blueprint-title-block">
                <h2>📐 MODUPLANT MODULAR PLANT STAND — TECHNICAL BLUEPRINT</h2>
                <span class="blueprint-subtitle">HEAVY-DUTY DOWEL (Ø${rawParams.dowelDiameter}mm) + 3D PRINTED PETG CONNECTOR SYSTEM</span>
              </div>
              <div class="blueprint-actions">
                <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save PDF Blueprint</button>
                <button class="btn btn-secondary" id="btn-close-blueprint">✕ Close</button>
              </div>
            </div>

            <div class="blueprint-body">
              <div class="blueprint-card page-break-after">
                <h3 class="blueprint-card-title">PAGE 1: MULTI-BAY GRID ASSEMBLY ORTHOGRAPHIC SUITE</h3>
                <div class="drawings-grid">
                  <div class="drawing-box">
                    <div class="drawing-label">FRONT ELEVATION GRID ASSEMBLY</div>
                    ${frontSvg}
                  </div>
                  <div class="drawing-box">
                    <div class="drawing-label">SIDE ELEVATION FRAME VIEW</div>
                    ${sideSvg}
                  </div>
                </div>
              </div>

              <div class="blueprint-card">
                <h3 class="blueprint-card-title">PAGE 2: BILL OF MATERIALS & DOWEL CUT LIST</h3>
                <table class="blueprint-table">
                  <thead>
                    <tr><th>Item #</th><th>Part Name</th><th>Specification</th><th>Qty</th></tr>
                  </thead>
                  <tbody>
                    ${bom.dowelRods?.map((r, i) => `<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.spec}</td><td>${r.count}</td></tr>`).join('') || ''}
                    ${bom.connectors?.map((c, i) => `<tr><td>${(bom.dowelRods?.length || 0) + i + 1}</td><td>${c.name}</td><td>${c.spec}</td><td>${c.count}</td></tr>`).join('') || ''}
                    ${bom.plantPots?.map((p, i) => `<tr><td>${(bom.dowelRods?.length || 0) + (bom.connectors?.length || 0) + i + 1}</td><td>${p.name}</td><td>${p.spec}</td><td>${p.count}</td></tr>`).join('') || ''}
                  </tbody>
                </table>
              </div>

              <div class="blueprint-title-footer">
                <div class="footer-box"><div class="lbl">PROJECT</div><div class="val">MODUPLANT SYSTEM</div></div>
                <div class="footer-box"><div class="lbl">DOWEL DIA</div><div class="val">Ø${rawParams.dowelDiameter} MM</div></div>
                <div class="footer-box"><div class="lbl">CONNECTOR</div><div class="val">3D PRINTED PETG</div></div>
                <div class="footer-box"><div class="lbl">BAYS</div><div class="val">${rawParams.bays} BAYS</div></div>
                <div class="footer-box"><div class="lbl">TOTAL PARTS</div><div class="val">${bom.totalParts} PCS</div></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Fallback Spice Rack Blueprint
    const frontSvg = this.generateFrontAssemblyView(rawParams);
    const sideSvg = this.generateSideAssemblyView(rawParams);

    return `
      <div class="blueprint-modal-overlay" id="blueprint-modal">
        <div class="blueprint-container">
          <div class="blueprint-header">
            <div class="blueprint-title-block">
              <h2>📐 2-TIER WOODEN SPICE RACK — TECHNICAL BLUEPRINT</h2>
            </div>
            <div class="blueprint-actions">
              <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save PDF Blueprint</button>
              <button class="btn btn-secondary" id="btn-close-blueprint">✕ Close</button>
            </div>
          </div>
          <div class="blueprint-body">
            <div class="blueprint-card">
              <div class="drawings-grid">
                <div class="drawing-box">${frontSvg}</div>
                <div class="drawing-box">${sideSvg}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
