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
    name: 'MODUPLANT — Modular Plant Stand System V2',
    icon: '🪴',
    category: 'plants',
    description: 'Clean Outer Dowel Skeleton (Ø20-25mm) + Overhang Square L-Notched MDF Shelf Panels + Practical 3D Printed Joints with Directional Socket Sleeves!',
    parameters: {
      centerTiers: { value: 3, min: 1, max: 5, step: 1, unit: ' tiers', label: 'Center Tower Tiers', group: 'Center Main Stand' },

      hasLeftWing: { value: false, options: [false, true], label: 'Add Left Extension Rack', group: 'Modular Extensions' },
      leftTiers: { value: 2, min: 1, max: 4, step: 1, unit: ' tiers', label: 'Left Extension Tiers', group: 'Modular Extensions' },

      hasRightWing: { value: false, options: [false, true], label: 'Add Right Extension Rack', group: 'Modular Extensions' },
      rightTiers: { value: 2, min: 1, max: 4, step: 1, unit: ' tiers', label: 'Right Extension Tiers', group: 'Modular Extensions' },

      extendLeftPort: { value: false, options: [false, true], label: 'Open Left Connector Ports', group: 'Connector Ports & Capping' },
      extendRightPort: { value: false, options: [false, true], label: 'Open Right Connector Ports', group: 'Connector Ports & Capping' },
      extendTopPort: { value: false, options: [false, true], label: 'Open Top Connector Ports', group: 'Connector Ports & Capping' },

      dowelDiameter: { value: 22, min: 20, max: 28, step: 1, unit: 'mm', label: 'Heavy Dowel Diameter', group: 'Dimensions & Materials' },
      bayWidth: { value: 340, min: 260, max: 480, step: 10, unit: 'mm', label: 'Bay Width', group: 'Dimensions & Materials' },
      bayDepth: { value: 320, min: 260, max: 420, step: 10, unit: 'mm', label: 'Rack Depth', group: 'Dimensions & Materials' },
      tierHeight: { value: 270, min: 200, max: 360, step: 10, unit: 'mm', label: 'Tier Height', group: 'Dimensions & Materials' },

      shelfMaterial: { value: 'mdf_natural', options: ['mdf_natural', 'mdf_black', 'beech_natural'], label: 'Shelf Panel Material', group: 'Dimensions & Materials' },
      woodFinish: { value: 'beech_natural', options: ['beech_natural', 'walnut_stain', 'black_stain'], label: 'Dowel Wood Finish', group: 'Dimensions & Materials' },
      connectorColor: { value: 'connector_forest_green', options: ['connector_forest_green', 'connector_terracotta', 'connector_stone_grey', 'connector_matte_black', 'connector_white'], label: '3D Printed Joint Color', group: 'Dimensions & Materials' }
    },
    buildGraph: (p) => {
      const graph = { dowelRods: [], mdfShelves: [], connectors: [], plantPots: [] };

      const dowelDia = p.dowelDiameter;
      const dowelRad = dowelDia / 2;
      const bayW = p.bayWidth;
      const bayD = p.bayDepth;
      const tH = p.tierHeight;

      const socketOffset = 22.0;

      const activeBaysList = [];
      if (p.hasLeftWing) {
        activeBaysList.push({ bIdx: -1, tiers: p.leftTiers, isCenter: false });
      }
      activeBaysList.push({ bIdx: 0, tiers: p.centerTiers, isCenter: true });
      if (p.hasRightWing) {
        activeBaysList.push({ bIdx: 1, tiers: p.rightTiers, isCenter: false });
      }

      const bayTierMap = new Map();
      activeBaysList.forEach(item => bayTierMap.set(item.bIdx, item.tiers));

      const minB = Math.min(...activeBaysList.map(a => a.bIdx));
      const maxB = Math.max(...activeBaysList.map(a => a.bIdx));

      const gridConnectors = new Map();
      const getCoordKey = (bIdx, tIdx, isBack) => `${bIdx}_${tIdx}_${isBack ? 'B' : 'F'}`;

      // 1. Vertical Posts & Node Grid
      for (let b = minB; b <= maxB + 1; b++) {
        const xPos = b * bayW;

        const leftT = bayTierMap.get(b - 1) || 0;
        const rightT = bayTierMap.get(b) || 0;
        const colTiers = Math.max(leftT, rightT);

        if (colTiers === 0) continue;

        for (let t = 0; t <= colTiers; t++) {
          const yPos = t * tH;

          gridConnectors.set(getCoordKey(b, t, false), { x: xPos, y: yPos, z: 0, b, t, isBack: false, maxColT: colTiers });
          gridConnectors.set(getCoordKey(b, t, true), { x: xPos, y: yPos, z: bayD, b, t, isBack: true, maxColT: colTiers });

          // Vertical Dowel Leg
          if (t > 0) {
            const rodLen = tH - 2 * socketOffset;
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

          // Side Depth Rails (Front-to-Back along Z)
          if (t > 0) {
            graph.dowelRods.push({
              id: `rod_h_z_b${b}_t${t}`,
              position: [xPos, yPos, bayD / 2],
              length: bayD - 2 * socketOffset,
              diameter: dowelDia,
              rotation: [Math.PI / 2, 0, 0],
              material: p.woodFinish
            });
          }
        }
      }

      // 2. Horizontal X-Rails & OVERHANG SQUARE L-NOTCHED MDF SHELVES
      activeBaysList.forEach((bayInfo) => {
        const b = bayInfo.bIdx;
        const xStart = b * bayW;
        const xMid = xStart + bayW / 2;
        const bTiers = bayInfo.tiers;

        for (let t = 1; t <= bTiers; t++) {
          const yPos = t * tH;

          // Front Horizontal Rail
          graph.dowelRods.push({
            id: `rod_h_x_front_b${b}_t${t}`,
            position: [xMid, yPos, 0],
            length: bayW - 2 * socketOffset,
            diameter: dowelDia,
            rotation: [0, 0, Math.PI / 2],
            material: p.woodFinish
          });

          // Back Horizontal Rail
          graph.dowelRods.push({
            id: `rod_h_x_back_b${b}_t${t}`,
            position: [xMid, yPos, bayD],
            length: bayW - 2 * socketOffset,
            diameter: dowelDia,
            rotation: [0, 0, Math.PI / 2],
            material: p.woodFinish
          });

          // OVERHANG SQUARE L-NOTCHED MDF SHELF PANEL
          // width = bayW + 4.0mm, depth = bayD + 4.0mm (generous +2mm outer lip over perimeter dowels)
          // notchSize = 37.5mm (+2.5mm assembly tolerance clearance from socket sleeve lip)
          const panelThickness = 12;
          const socketLength = 35.0;
          graph.mdfShelves.push({
            id: `mdf_shelf_b${b}_t${t}`,
            position: [xMid, yPos + dowelRad, bayD / 2],
            width: bayW + 4.0,
            depth: bayD + 4.0,
            thickness: panelThickness,
            notchSize: socketLength + 2.5, // 37.5mm clean square L-notch with generous assembly clearance
            dowelDiameter: dowelDia,
            material: p.shelfMaterial
          });

          // Ceramic Plant Pot sitting on top of the MDF shelf panel
          const potColors = ['ceramic_white', 'ceramic_terracotta', 'ceramic_charcoal'];
          graph.plantPots.push({
            id: `plant_pot_b${b}_t${t}`,
            position: [xMid, yPos + dowelRad + panelThickness + 1, bayD / 2],
            radius: 35,
            height: 60,
            color: potColors[Math.abs(b + t) % potColors.length]
          });
        }
      });

      // 3. Directional 3D Printed Connector Placement
      for (const [key, node] of gridConnectors.entries()) {
        const isBottom = node.t === 0;
        const b = node.b;
        const t = node.t;

        const isLeftBoundary = b === minB;
        const isRightBoundary = b === maxB + 1;
        const isTopBoundary = t === node.maxColT;

        const openPorts = {
          px: false,
          nx: false,
          py: false,
          ny: false,
          pz: true,
          nz: true
        };

        // Right (+X) Port
        const rightBayTiers = bayTierMap.get(b) || 0;
        if (b <= maxB && rightBayTiers >= t && t > 0) {
          openPorts.px = true;
        } else if (p.extendRightPort && t > 0) {
          openPorts.px = true;
        }

        // Left (-X) Port
        const leftBayTiers = bayTierMap.get(b - 1) || 0;
        if (b > minB && leftBayTiers >= t && t > 0) {
          openPorts.nx = true;
        } else if (p.extendLeftPort && t > 0) {
          openPorts.nx = true;
        }

        // Top (+Y) Port
        if (!isTopBoundary) {
          openPorts.py = true;
        } else if (p.extendTopPort) {
          openPorts.py = true;
        }

        // Bottom (-Y) Port
        if (!isBottom) {
          openPorts.ny = true;
        }

        let cornerType = 'front_left';
        if (isRightBoundary && !node.isBack) cornerType = 'front_right';
        else if (isLeftBoundary && node.isBack) cornerType = 'back_left';
        else if (isRightBoundary && node.isBack) cornerType = 'back_right';
        else if (node.isBack) cornerType = 'back';

        let connType = '3way';
        if (isBottom) {
          connType = 'foot';
        } else if (!isLeftBoundary && !isRightBoundary) {
          connType = '4way';
        }

        graph.connectors.push({
          id: `conn_${key}`,
          type: connType,
          position: [node.x, node.y, node.z],
          diameter: dowelDia,
          color: p.connectorColor,
          openPorts: openPorts,
          cornerType: cornerType
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
