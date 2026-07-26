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
    id: 'moduwall_system',
    name: 'MODUWALL — 3D Parametric Wall Storage System',
    icon: '🧱',
    category: 'wall_mounted',
    description: '3D Box Skeleton with Wall Anchor Flanges + Ø25mm Beech Dowel Grid + Floating L-Notched MDF Shelves!',
    parameters: {
      gridColumns: { value: 3, min: 1, max: 5, step: 1, unit: ' bays', label: 'Grid Columns (Bays)', group: 'Grid Setup' },
      gridRows: { value: 3, min: 1, max: 4, step: 1, unit: ' rows', label: 'Grid Rows (Levels)', group: 'Grid Setup' },
      bayWidth: { value: 340, min: 260, max: 480, step: 10, unit: 'mm', label: 'Bay Width', group: 'Grid Setup' },
      bayHeight: { value: 300, min: 220, max: 420, step: 10, unit: 'mm', label: 'Row Height', group: 'Grid Setup' },
      rackDepth: { value: 180, min: 140, max: 260, step: 10, unit: 'mm', label: 'Shelf Depth', group: 'Grid Setup' },

      hasCoatPegs: { value: true, options: [false, true], label: 'Add Coat & Headphone Pegs', group: 'Attachments' },

      dowelDiameter: { value: 22, min: 20, max: 28, step: 1, unit: 'mm', label: 'Dowel Diameter', group: 'Materials & Colors' },
      woodFinish: { value: 'beech_natural', options: ['beech_natural', 'walnut_stain', 'black_stain'], label: 'Wood Dowel Finish', group: 'Materials & Colors' },
      shelfMaterial: { value: 'mdf_natural', options: ['mdf_natural', 'mdf_black', 'beech_natural'], label: 'Shelf Board Finish', group: 'Materials & Colors' },
      connectorColor: { value: 'connector_terracotta', options: ['connector_terracotta', 'connector_forest_green', 'connector_stone_grey', 'connector_matte_black', 'connector_white'], label: '3D Joint & Flange Color', group: 'Materials & Colors' }
    },
    buildGraph: (p) => {
      const graph = { dowelRods: [], mdfShelves: [], connectors: [], wallConnectors: [], wallFlanges: [], hangingPegs: [] };

      const dowelDia = p.dowelDiameter;
      const dowelRad = dowelDia / 2;
      const colCount = p.gridColumns;
      const rowCount = p.gridRows;
      const bayW = p.bayWidth;
      const bayH = p.bayHeight;
      const bayD = p.rackDepth;

      const socketOffset = 22.0;

      // 1. REAR WALL FRAME (Z = 0)
      for (let c = 0; c <= colCount; c++) {
        const xPos = c * bayW;
        for (let r = 1; r <= rowCount; r++) {
          const yMid = (r - 0.5) * bayH;
          graph.dowelRods.push({
            id: `rod_v_rear_c${c}_r${r}`,
            position: [xPos, yMid, 0],
            length: bayH - 2 * socketOffset,
            diameter: dowelDia,
            material: p.woodFinish
          });
        }
      }

      for (let r = 0; r <= rowCount; r++) {
        const yPos = r * bayH;
        for (let c = 1; c <= colCount; c++) {
          const xMid = (c - 0.5) * bayW;
          graph.dowelRods.push({
            id: `rod_h_rear_c${c}_r${r}`,
            position: [xMid, yPos, 0],
            length: bayW - 2 * socketOffset,
            diameter: dowelDia,
            rotation: [0, 0, Math.PI / 2],
            material: p.woodFinish
          });
        }
      }

      // 2. FRONT STRUCTURAL FRAME (Z = bayD)
      for (let c = 0; c <= colCount; c++) {
        const xPos = c * bayW;
        for (let r = 1; r <= rowCount; r++) {
          const yMid = (r - 0.5) * bayH;
          graph.dowelRods.push({
            id: `rod_v_front_c${c}_r${r}`,
            position: [xPos, yMid, bayD],
            length: bayH - 2 * socketOffset,
            diameter: dowelDia,
            material: p.woodFinish
          });
        }
      }

      for (let r = 1; r <= rowCount; r++) {
        const yPos = r * bayH;
        for (let c = 1; c <= colCount; c++) {
          const xMid = (c - 0.5) * bayW;
          graph.dowelRods.push({
            id: `rod_h_front_c${c}_r${r}`,
            position: [xMid, yPos, bayD],
            length: bayW - 2 * socketOffset,
            diameter: dowelDia,
            rotation: [0, 0, Math.PI / 2],
            material: p.woodFinish
          });
        }
      }

      // 3. DEPTH BRIDGE ARMS
      for (let c = 0; c <= colCount; c++) {
        const xPos = c * bayW;
        for (let r = 0; r <= rowCount; r++) {
          const yPos = r * bayH;
          graph.dowelRods.push({
            id: `rod_z_c${c}_r${r}`,
            position: [xPos, yPos, bayD / 2],
            length: bayD - 2 * socketOffset,
            diameter: dowelDia,
            rotation: [Math.PI / 2, 0, 0],
            material: p.woodFinish
          });
        }
      }

      // 4. REAR WALL CONNECTORS & FRONT CONNECTORS
      for (let c = 0; c <= colCount; c++) {
        const xPos = c * bayW;
        for (let r = 0; r <= rowCount; r++) {
          const yPos = r * bayH;

          // Rear Wall Connector
          graph.wallConnectors.push({
            id: `wall_conn_c${c}_r${r}`,
            position: [xPos, yPos, 0],
            diameter: dowelDia,
            color: p.connectorColor,
            openPorts: {
              px: c < colCount,
              nx: c > 0,
              py: r < rowCount,
              ny: r > 0,
              pz: true
            }
          });

          // Front Connector (Created at ALL rows r=0..rowCount to prevent floating bottom feet!)
          graph.connectors.push({
            id: `conn_front_c${c}_r${r}`,
            type: (c === 0 || c === colCount) ? '3way' : '4way',
            position: [xPos, yPos, bayD],
            diameter: dowelDia,
            color: p.connectorColor,
            openPorts: {
              px: c < colCount,
              nx: c > 0,
              py: r < rowCount,
              ny: r > 0,
              pz: false,
              nz: true
            },
            cornerType: c === 0 ? 'front_left' : 'front_right'
          });
        }
      }

      // 5. MDF SHELF PANELS
      for (let c = 1; c <= colCount; c++) {
        const xMid = (c - 0.5) * bayW;
        for (let r = 1; r <= rowCount; r++) {
          const yPos = r * bayH;
          graph.mdfShelves.push({
            id: `shelf_c${c}_r${r}`,
            position: [xMid, yPos + dowelRad, bayD / 2],
            width: bayW - 3.0,
            depth: bayD,
            thickness: 12,
            notchSize: 40.0,
            dowelDiameter: dowelDia,
            material: p.shelfMaterial
          });
        }
      }

      return graph;
    }
  },
  {
    id: 'moduwall_wall_grid',
    name: 'MODUWALL Grid — Wall-Mounted Organizer (Exact Reference Design)',
    icon: '🧱',
    category: 'wall_mounted',
    description: 'Single 2D plane dowel system matching reference image! Features Terracotta Wall Anchor Brackets and 2D T & Cross Joints!',
    parameters: {
      gridColumns: { value: 3, min: 1, max: 5, step: 1, unit: ' bays', label: 'Grid Columns (Bays)', group: 'Grid Setup' },
      gridRows: { value: 3, min: 1, max: 4, step: 1, unit: ' rows', label: 'Grid Rows (Levels)', group: 'Grid Setup' },
      bayWidth: { value: 340, min: 260, max: 480, step: 10, unit: 'mm', label: 'Bay Width', group: 'Grid Setup' },
      bayHeight: { value: 300, min: 220, max: 420, step: 10, unit: 'mm', label: 'Row Height', group: 'Grid Setup' },

      dowelDiameter: { value: 22, min: 20, max: 28, step: 1, unit: 'mm', label: 'Dowel Diameter', group: 'Materials & Colors' },
      woodFinish: { value: 'beech_natural', options: ['beech_natural', 'walnut_stain', 'black_stain'], label: 'Wood Dowel Finish', group: 'Materials & Colors' },
      connectorColor: { value: 'connector_terracotta', options: ['connector_terracotta', 'connector_forest_green', 'connector_stone_grey', 'connector_matte_black', 'connector_white'], label: '3D Joint & Flange Color', group: 'Materials & Colors' }
    },
    buildGraph: (p) => {
      const graph = { dowelRods: [], mdfShelves: [], connectors: [], wallConnectors: [], wallFlanges: [] };

      const dowelDia = p.dowelDiameter;
      const colCount = p.gridColumns;
      const rowCount = p.gridRows;
      const bayW = p.bayWidth;
      const bayH = p.bayHeight;

      const socketOffset = 22.0;

      // 1. VERTICAL DOWEL COLUMNS (Single 2D Plane at Z = 0)
      for (let c = 0; c <= colCount; c++) {
        const xPos = c * bayW;
        for (let r = 1; r <= rowCount; r++) {
          const yMid = (r - 0.5) * bayH;
          graph.dowelRods.push({
            id: `grid_rod_v_c${c}_r${r}`,
            position: [xPos, yMid, 0],
            length: bayH - 2 * socketOffset,
            diameter: dowelDia,
            material: p.woodFinish
          });
        }
      }

      // 2. HORIZONTAL DOWEL RAILS (Single 2D Plane at Z = 0)
      for (let r = 0; r <= rowCount; r++) {
        const yPos = r * bayH;
        for (let c = 1; c <= colCount; c++) {
          const xMid = (c - 0.5) * bayW;
          graph.dowelRods.push({
            id: `grid_rod_h_c${c}_r${r}`,
            position: [xMid, yPos, 0],
            length: bayW - 2 * socketOffset,
            diameter: dowelDia,
            rotation: [0, 0, Math.PI / 2],
            material: p.woodFinish
          });
        }
      }

      // 3. WALL MOUNT ANCHORS & 2D SLEEVE CONNECTORS (At Z = 0 Nodes)
      for (let c = 0; c <= colCount; c++) {
        const xPos = c * bayW;
        for (let r = 0; r <= rowCount; r++) {
          const yPos = r * bayH;
          const isWallAnchor = (r === 0 || r === rowCount); // Top & bottom ends mount to wall studs

          const openPorts = {
            px: c < colCount,
            nx: c > 0,
            py: r < rowCount,
            ny: r > 0,
            pz: false
          };

          if (isWallAnchor) {
            graph.wallConnectors.push({
              id: `grid_wall_conn_c${c}_r${r}`,
              position: [xPos, yPos, 0],
              diameter: dowelDia,
              color: p.connectorColor,
              openPorts: openPorts
            });
          } else {
            graph.connectors.push({
              id: `grid_conn_c${c}_r${r}`,
              type: (c === 0 || c === colCount) ? '3way' : '4way',
              position: [xPos, yPos, 0],
              diameter: dowelDia,
              color: p.connectorColor,
              openPorts: openPorts,
              cornerType: c === 0 ? 'front_left' : 'front_right'
            });
          }
        }
      }

      return graph;
    }
  },
  {
    id: 'moduplant_infinite',
    name: 'MODUPLANT — Modular Plant Stand System V2',
    icon: '🪴',
    category: 'plants',
    description: 'Clean Outer Dowel Skeleton (Ø20-25mm) + Standardized Flat-Pack Modular MDF Shelf Panels + Practical 3D Printed Joints!',
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

      // 2. Horizontal X-Rails & STANDARDIZED INDIVIDUAL MODULAR MDF SHELF PANELS (With 3.0mm Modular Seam Gap!)
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

          // STANDARDIZED INDIVIDUAL MODULAR MDF SHELF PANEL
          // width = bayW - 3.0mm (leaves a clean 3.0mm modular expansion seam gap between adjacent bay shelf panels!)
          // notchSize = 40.0mm (+5.0mm generous clearance from socket sleeve lip)
          const panelThickness = 12;
          const socketLength = 35.0;
          graph.mdfShelves.push({
            id: `mdf_shelf_b${b}_t${t}`,
            position: [xMid, yPos + dowelRad, bayD / 2],
            width: bayW - 3.0,
            depth: bayD,
            thickness: panelThickness,
            notchSize: socketLength + 5.0, // 40.0mm clean square L-notch
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
  },
  {
    id: 'axilock_visualizer',
    name: 'AXILOCK — Helical Cam-Ramp Connector System',
    icon: '🔩',
    category: 'connector_hardware',
    description: 'Interactive 3D visualization of the patentable AXILOCK modular dowel connection system with helical cam-ramp locking.',
    parameters: {
      mechanismType: { value: 'threaded_bolt_nut', options: ['threaded_bolt_nut', 'helical_cam'], label: 'Locking Mechanism', group: 'Hub Configuration' },
      hubPorts: { value: 4, min: 2, max: 6, step: 1, unit: ' ports', label: 'Active Hub Ports', group: 'Hub Configuration' },
      dowelDiameter: { value: 22, options: [18, 22, 25], unit: 'mm', label: 'Dowel Diameter', group: 'Hub Configuration' },
      dowelLength: { value: 300, min: 150, max: 500, step: 10, unit: 'mm', label: 'Dowel Length', group: 'Hub Configuration' },
      showCutaway: { value: false, options: [false, true], label: 'Show Internal Cutaway', group: 'Visualization' },
      showTabs: { value: true, options: [false, true], label: 'Highlight Locking Tabs', group: 'Visualization' },
      hubColor: { value: 'axilock_hub_charcoal', options: ['axilock_connector_white', 'axilock_hub_charcoal', 'connector_terracotta', 'connector_forest_green', 'connector_stone_grey', 'connector_matte_black'], label: 'Hub Color', group: 'Materials & Colors' },
      connectorColor: { value: 'axilock_connector_white', options: ['axilock_connector_white', 'connector_terracotta', 'connector_forest_green', 'connector_stone_grey', 'connector_matte_black'], label: 'End Connector Color', group: 'Materials & Colors' },
      woodFinish: { value: 'beech_natural', options: ['beech_natural', 'walnut_stain', 'black_stain'], label: 'Dowel Wood Finish', group: 'Materials & Colors' }
    },
    buildGraph: (p) => {
      const graph = {
        dowelRods: [],
        axilockHubs: [],
        axilockEndConnectors: [],
        axilockScrews: [],
        axilockThreadedHubs: [],
        axilockNutCollars: []
      };

      const dowelDia = p.dowelDiameter;
      const dowelRad = dowelDia / 2;
      const dowelLen = p.dowelLength;
      const connectorLength = 24.0;
      const numPorts = p.hubPorts;
      const mechanism = p.mechanismType || 'threaded_bolt_nut';

      // Port axis definitions: direction vectors and Euler rotation angles
      const allAxes = [
        { key: 'px', dir: [1, 0, 0], rot: [0, 0, -Math.PI / 2] },
        { key: 'nx', dir: [-1, 0, 0], rot: [0, 0, Math.PI / 2] },
        { key: 'py', dir: [0, 1, 0], rot: [0, 0, 0] },
        { key: 'ny', dir: [0, -1, 0], rot: [Math.PI, 0, 0] },
        { key: 'pz', dir: [0, 0, 1], rot: [Math.PI / 2, 0, 0] },
        { key: 'nz', dir: [0, 0, -1], rot: [-Math.PI / 2, 0, 0] }
      ];

      // Determine which ports are active
      const activeAxes = allAxes.slice(0, numPorts);
      const portConfig = {};
      allAxes.forEach(a => portConfig[a.key] = false);
      activeAxes.forEach(a => portConfig[a.key] = true);

      const hubH = 26.0; // Hub half-width

      if (mechanism === 'threaded_bolt_nut') {
        // ===== MECHANISM 2: THREADED BOLT & NUT SYSTEM (REVERSED: HUB = FEMALE SOCKET, DOWEL = MALE BOLT STUD) =====
        const socketDepth = 16.0; // Male stud screws 16mm inside female socket
        const studLength = 18.0;
        const collarLength = 14.0;

        // 1. Female Threaded Socket Hub at origin ("The Nut Hub")
        graph.axilockThreadedHubs.push({
          id: 'axilock_threaded_hub_main',
          position: [0, 0, 0],
          diameter: dowelDia,
          color: p.hubColor,
          portConfig: portConfig
        });

        // 2. Male Threaded Stud Dowel Caps + Dowels for each active port
        activeAxes.forEach((axis) => {
          const [dx, dy, dz] = axis.dir;

          // Cap base position: male stud tip starts 10mm inside socket bore (10mm from center)
          const capOffset = hubH - socketDepth; // 10mm from center
          const capPos = [
            dx * capOffset,
            dy * capOffset,
            dz * capOffset
          ];

          graph.axilockNutCollars.push({
            id: `axilock_nut_${axis.key}`,
            position: capPos,
            rotation: axis.rot,
            diameter: dowelDia,
            color: p.connectorColor
          });

          // Dowel rod starts at back face of collar sleeve (42mm from center)
          const dowelStartOffset = capOffset + studLength + collarLength; // 42mm from center
          const effectiveDowelLen = dowelLen - socketDepth;
          const dowelCenterOffset = dowelStartOffset + effectiveDowelLen / 2;
          const dowelCenter = [
            dx * dowelCenterOffset,
            dy * dowelCenterOffset,
            dz * dowelCenterOffset
          ];

          graph.dowelRods.push({
            id: `axilock_dowel_${axis.key}`,
            position: dowelCenter,
            length: effectiveDowelLen,
            diameter: dowelDia,
            rotation: axis.rot,
            material: p.woodFinish
          });
        });
      } else {
        // ===== MECHANISM 1: HELICAL CAM-RAMP SYSTEM =====
        const insertionDepth = 12.0;

        graph.axilockHubs.push({
          id: 'axilock_hub_main',
          position: [0, 0, 0],
          diameter: dowelDia,
          color: p.hubColor,
          portConfig: portConfig,
          showCutaway: p.showCutaway
        });

        activeAxes.forEach((axis) => {
          const [dx, dy, dz] = axis.dir;

          const connCenterOffset = (hubH - insertionDepth) + connectorLength / 2;
          const connectorPos = [
            dx * connCenterOffset,
            dy * connCenterOffset,
            dz * connCenterOffset
          ];

          graph.axilockEndConnectors.push({
            id: `axilock_conn_${axis.key}`,
            position: connectorPos,
            rotation: axis.rot,
            diameter: dowelDia,
            color: p.connectorColor,
            tabColor: 'axilock_tab_blue',
            showTabs: p.showTabs
          });

          const dowelStartOffset = (hubH - insertionDepth) + connectorLength;
          const effectiveDowelLen = dowelLen - insertionDepth;
          const dowelCenterOffset = dowelStartOffset + (effectiveDowelLen - connectorLength) / 2;
          const dowelCenter = [
            dx * dowelCenterOffset,
            dy * dowelCenterOffset,
            dz * dowelCenterOffset
          ];

          graph.dowelRods.push({
            id: `axilock_dowel_${axis.key}`,
            position: dowelCenter,
            length: effectiveDowelLen,
            diameter: dowelDia,
            rotation: axis.rot,
            material: p.woodFinish
          });

          graph.axilockScrews.push({
            id: `axilock_screw_${axis.key}`,
            position: connectorPos,
            rotation: axis.rot,
            length: 30
          });
        });
      }

      return graph;
    }
  }
];
