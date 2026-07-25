export class ProductTemplates {
  static getAll() {
    return ALL_PRODUCTS.map(p => ({
      id: p.id, name: p.name, icon: p.icon, description: p.description, category: p.category
    }));
  }
  static getTemplate(id) {
    return ALL_PRODUCTS.find(p => p.id === id) || ALL_PRODUCTS[0];
  }
}

const ALL_PRODUCTS = [
  {
    id: 'moduplant_infinite',
    name: 'MODUPLANT — Infinite Modular Plant Stand System',
    icon: '🪴',
    category: 'plants',
    description: 'Modular Dowel Rod (Ø20-25mm) + 3D Printed PETG Connector System. Customisable multi-bay and multi-tier grid extension (e.g. 4-tier center tower with 2-tier side wings)!',
    parameters: {
      bays: { value: 3, min: 1, max: 4, step: 1, unit: ' bays', label: 'Horizontal Bays', group: 'Grid Extension' },
      leftTierCount: { value: 2, min: 1, max: 4, step: 1, unit: ' tiers', label: 'Left Wing Tiers', group: 'Grid Extension' },
      centerTierCount: { value: 4, min: 1, max: 5, step: 1, unit: ' tiers', label: 'Center Tower Tiers', group: 'Grid Extension' },
      rightTierCount: { value: 3, min: 1, max: 4, step: 1, unit: ' tiers', label: 'Right Wing Tiers', group: 'Grid Extension' },
      dowelDiameter: { value: 22, min: 20, max: 28, step: 1, unit: 'mm', label: 'Heavy Dowel Diameter', group: 'Dimensions' },
      bayWidth: { value: 320, min: 240, max: 450, step: 10, unit: 'mm', label: 'Bay Width', group: 'Dimensions' },
      bayDepth: { value: 300, min: 240, max: 400, step: 10, unit: 'mm', label: 'Rack Depth', group: 'Dimensions' },
      tierHeight: { value: 260, min: 200, max: 350, step: 10, unit: 'mm', label: 'Tier Height', group: 'Dimensions' },
      woodFinish: { value: 'beech_natural', options: ['beech_natural', 'walnut_stain', 'black_stain'], label: 'Dowel Wood Finish', group: 'Material' },
      connectorColor: { value: 'connector_forest_green', options: ['connector_forest_green', 'connector_terracotta', 'connector_stone_grey', 'connector_matte_black', 'connector_white'], label: '3D Printed Joint Color', group: 'Material' }
    },
    buildGraph: (p) => {
      const graph = { dowelRods: [], connectors: [], plantPots: [] };

      const dowelDia = p.dowelDiameter;
      const bayW = p.bayWidth;
      const bayD = p.bayDepth;
      const tH = p.tierHeight;

      const bayHeights = [p.leftTierCount, p.centerTierCount, p.rightTierCount, p.rightTierCount];
      const activeBays = Math.min(p.bays, 4);

      // Node Key Map to store connector types at grid coordinates (bayIndex, tierIndex, front/back)
      const gridConnectors = new Map();

      const getCoordKey = (bIdx, tIdx, isBack) => `${bIdx}_${tIdx}_${isBack ? 'B' : 'F'}`;

      // Build Horizontal & Vertical Structural Frame Grid
      for (let b = 0; b <= activeBays; b++) {
        const xPos = b * bayW;

        // Max tier height for this pillar column
        let leftB = Math.max(0, b - 1);
        let rightB = Math.min(activeBays - 1, b);
        let colTiers = Math.max(bayHeights[leftB] || 1, bayHeights[rightB] || 1);

        for (let t = 0; t <= colTiers; t++) {
          const yPos = t * tH;

          // Front Pillar Node (xPos, yPos, 0)
          gridConnectors.set(getCoordKey(b, t, false), { x: xPos, y: yPos, z: 0, b, t, isBack: false });
          // Back Pillar Node (xPos, yPos, bayD)
          gridConnectors.set(getCoordKey(b, t, true), { x: xPos, y: yPos, z: bayD, b, t, isBack: true });

          // Vertical Dowel Leg Segment (between t-1 and t)
          if (t > 0) {
            const rodLen = tH - dowelDia;
            const midY = yPos - tH / 2;

            graph.dowelRods.push({
              id: `rod_v_front_b${b}_t${t}`,
              position: [xPos, midY, 0],
              length: rodLen,
              diameter: dowelDia,
              material: p.woodFinish
            });

            graph.dowelRods.push({
              id: `rod_v_back_b${b}_t${t}`,
              position: [xPos, midY, bayD],
              length: rodLen,
              diameter: dowelDia,
              material: p.woodFinish
            });
          }
        }
      }

      // Horizontal Connecting Rails & Slatted Dowel Platforms
      for (let b = 0; b < activeBays; b++) {
        const xStart = b * bayW;
        const xMid = xStart + bayW / 2;
        const maxTiers = bayHeights[b] || 1;

        for (let t = 1; t <= maxTiers; t++) {
          const yPos = t * tH;

          // Front Horizontal Depth Rail
          graph.dowelRods.push({
            id: `rod_h_x_front_b${b}_t${t}`,
            position: [xMid, yPos, 0],
            length: bayW - dowelDia,
            diameter: dowelDia,
            rotation: [0, 0, Math.PI / 2],
            material: p.woodFinish
          });

          // Back Horizontal Depth Rail
          graph.dowelRods.push({
            id: `rod_h_x_back_b${b}_t${t}`,
            position: [xMid, yPos, bayD],
            length: bayW - dowelDia,
            diameter: dowelDia,
            rotation: [0, 0, Math.PI / 2],
            material: p.woodFinish
          });

          // Side Depth Tie Rods
          graph.dowelRods.push({
            id: `rod_h_z_left_b${b}_t${t}`,
            position: [xStart, yPos, bayD / 2],
            length: bayD - dowelDia,
            diameter: dowelDia,
            rotation: [Math.PI / 2, 0, 0],
            material: p.woodFinish
          });

          // 4 Slatted Platform Dowels per tier
          const slatCount = 4;
          const slatSpacing = (bayD - 40) / (slatCount - 1);
          for (let s = 0; s < slatCount; s++) {
            const zSlat = 20 + s * slatSpacing;
            graph.dowelRods.push({
              id: `slat_b${b}_t${t}_s${s}`,
              position: [xMid, yPos + 6, zSlat],
              length: bayW - 10,
              diameter: dowelDia * 0.75,
              rotation: [0, 0, Math.PI / 2],
              material: p.woodFinish
            });
          }

          // Ceramic Plant Pot on Top of Tier
          const potColors = ['ceramic_white', 'ceramic_terracotta', 'ceramic_charcoal'];
          graph.plantPots.push({
            id: `plant_pot_b${b}_t${t}`,
            position: [xMid, yPos + 12, bayD / 2],
            radius: 32,
            height: 55,
            color: potColors[(b + t) % potColors.length]
          });
        }
      }

      // Generate 3D Printed Connectors at Grid Nodes
      for (const [key, node] of gridConnectors.entries()) {
        const isBottom = node.t === 0;

        let connType = '3way';
        if (isBottom) {
          connType = 'foot';
        } else if (node.b > 0 && node.b < activeBays) {
          connType = '4way';
        }

        graph.connectors.push({
          id: `conn_${key}`,
          type: connType,
          position: [node.x, node.y, node.z],
          diameter: dowelDia,
          color: p.connectorColor
        });
      }

      return graph;
    }
  },
  {
    id: 'achuva_spice_rack',
    name: '2-Tier Wooden Spice Rack (Cross-Pin Collar Lock Joinery)',
    icon: '🪵',
    category: 'kitchen',
    description: '100% Solid Wood zero-tool assembly. Features separate turned support collars & wooden cross-pin keys that slide through the pillars underneath each shelf.',
    parameters: {
      width: { value: 460, min: 320, max: 600, step: 10, unit: 'mm', label: 'Rack Width', group: 'Dimensions' },
      depth: { value: 140, min: 110, max: 200, step: 10, unit: 'mm', label: 'Shelf Depth', group: 'Dimensions' },
      baseClearance: { value: 40, min: 20, max: 80, step: 5, unit: 'mm', label: 'Floor Clearance (Feet)', group: 'Dimensions' },
      tierHeight: { value: 130, min: 90, max: 180, step: 5, unit: 'mm', label: 'Tier Height', group: 'Dimensions' },
      jarCountPerTier: { value: 8, min: 4, max: 12, step: 1, unit: '', label: 'Jars per Tier', group: 'Design' },
      woodMaterial: { value: 'acacia', options: ['acacia', 'rubber_wood'], label: 'Wood Finish', group: 'Material' },
      panelThickness: { value: 16, min: 12, max: 22, step: 1, unit: 'mm', label: 'Shelf Thickness', group: 'Material' },
      dowelDiameter: { value: 16, min: 14, max: 20, step: 1, unit: 'mm', label: 'Pillar Diameter', group: 'Material' }
    },
    buildGraph: (p) => {
      const graph = { panels: [], pillars: [], collars: [], pins: [], topPegs: [], guardRails: [], jars: [] };

      const pillarInsetX = 28;
      const pillarInsetZ = 24;

      const yBottom = p.baseClearance + p.panelThickness / 2;
      const yMiddle = yBottom + p.tierHeight;
      const yTop = yMiddle + p.tierHeight;
      const totalPillarHeight = yTop + p.panelThickness / 2 + 14;

      const holeRadius = p.dowelDiameter / 2 + 0.8;
      const holeSpecs = [
        { x: -p.width / 2 + pillarInsetX, y: -p.depth / 2 + pillarInsetZ, radius: holeRadius },
        { x: p.width / 2 - pillarInsetX, y: -p.depth / 2 + pillarInsetZ, radius: holeRadius },
        { x: p.width / 2 - pillarInsetX, y: p.depth / 2 - pillarInsetZ, radius: holeRadius },
        { x: -p.width / 2 + pillarInsetX, y: p.depth / 2 - pillarInsetZ, radius: holeRadius }
      ];

      graph.panels.push({
        id: 'shelf_bottom',
        position: [p.width / 2, yBottom, p.depth / 2],
        dimensions: [p.width, p.depth, p.panelThickness],
        rotation: [-Math.PI / 2, 0, 0],
        material: p.woodMaterial,
        holes: holeSpecs
      });

      graph.panels.push({
        id: 'shelf_middle',
        position: [p.width / 2, yMiddle, p.depth / 2],
        dimensions: [p.width, p.depth, p.panelThickness],
        rotation: [-Math.PI / 2, 0, 0],
        material: p.woodMaterial,
        holes: holeSpecs
      });

      graph.panels.push({
        id: 'shelf_top',
        position: [p.width / 2, yTop, p.depth / 2],
        dimensions: [p.width, p.depth, p.panelThickness],
        rotation: [-Math.PI / 2, 0, 0],
        material: p.woodMaterial,
        holes: holeSpecs
      });

      const pinHeights = [
        yBottom - p.panelThickness / 2 - 5,
        yMiddle - p.panelThickness / 2 - 5,
        yTop - p.panelThickness / 2 - 5
      ];

      const railY_middle = yMiddle + 26;
      const railY_bottom = yBottom + 26;

      const corners = [
        { x: pillarInsetX, z: pillarInsetZ, name: 'front_left', isFront: true },
        { x: p.width - pillarInsetX, z: pillarInsetZ, name: 'front_right', isFront: true },
        { x: p.width - pillarInsetX, z: p.depth - pillarInsetZ, name: 'back_right', isFront: false },
        { x: pillarInsetX, z: p.depth - pillarInsetZ, name: 'back_left', isFront: false }
      ];

      corners.forEach((c) => {
        graph.pillars.push({
          id: `pillar_${c.name}`,
          position: [c.x, c.z],
          height: totalPillarHeight,
          diameter: p.dowelDiameter,
          pinHoleHeights: pinHeights,
          material: p.woodMaterial
        });

        pinHeights.forEach((yPos, idx) => {
          const collarId = `collar_${c.name}_tier${idx + 1}`;
          const pinId = `pin_${c.name}_tier${idx + 1}`;

          graph.collars.push({
            id: collarId,
            position: [c.x, yPos, c.z],
            diameter: p.dowelDiameter,
            material: p.woodMaterial
          });

          graph.pins.push({
            id: pinId,
            position: [c.x, yPos, c.z],
            diameter: p.dowelDiameter,
            material: 'rubber_wood'
          });
        });

        graph.topPegs.push({
          id: `top_peg_${c.name}`,
          position: [c.x, yTop + p.panelThickness / 2 + 1, c.z],
          diameter: p.dowelDiameter,
          material: p.woodMaterial
        });
      });

      const railLength = p.width - 2 * pillarInsetX - p.dowelDiameter;

      graph.guardRails.push({
        id: 'guard_rail_middle',
        position: [p.width / 2, railY_middle, pillarInsetZ],
        length: railLength,
        diameter: p.dowelDiameter * 0.65,
        material: p.woodMaterial
      });

      graph.guardRails.push({
        id: 'guard_rail_bottom',
        position: [p.width / 2, railY_bottom, pillarInsetZ],
        length: railLength,
        diameter: p.dowelDiameter * 0.65,
        material: p.woodMaterial
      });

      const spiceSpecs = [
        { name: 'Cumin', material: 'spice_cumin' },
        { name: 'Oregano', material: 'spice_oregano' },
        { name: 'Corio', material: 'spice_coriander' },
        { name: 'Paprika', material: 'spice_paprika' },
        { name: 'Tandoori', material: 'spice_tandoori' },
        { name: 'Turmeric', material: 'spice_turmeric' },
        { name: 'Cinnamon', material: 'spice_cinnamon' },
        { name: 'Chili', material: 'spice_chili' }
      ];

      const jarMargin = 48;
      const jarSpacing = (p.width - 2 * jarMargin) / (p.jarCountPerTier - 1);
      const jarZ = p.depth / 2 + 5;

      for (let i = 0; i < p.jarCountPerTier; i++) {
        const xPos = jarMargin + i * jarSpacing;
        const spec = spiceSpecs[i % spiceSpecs.length];
        graph.jars.push({
          id: `jar_bot_${i}`,
          tier: 'bottom',
          name: spec.name,
          spiceMaterial: spec.material,
          position: [xPos, yBottom + p.panelThickness / 2 + 27, jarZ],
          radius: 17,
          height: 54,
          fillRatio: 0.7 + (i % 3) * 0.1,
          capType: i % 2 === 0 ? 'cork' : 'metal'
        });
      }

      for (let i = 0; i < p.jarCountPerTier; i++) {
        const xPos = jarMargin + i * jarSpacing;
        const spec = spiceSpecs[(i + 3) % spiceSpecs.length];
        graph.jars.push({
          id: `jar_mid_${i}`,
          tier: 'middle',
          name: spec.name,
          spiceMaterial: spec.material,
          position: [xPos, yMiddle + p.panelThickness / 2 + 27, jarZ],
          radius: 17,
          height: 54,
          fillRatio: 0.65 + (i % 4) * 0.08,
          capType: i % 2 === 1 ? 'cork' : 'metal'
        });
      }

      return graph;
    }
  }
];
