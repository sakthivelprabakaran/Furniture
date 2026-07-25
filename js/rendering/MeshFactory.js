import * as THREE from 'three';

export const SCALE_FACTOR = 0.005;

export class MeshFactory {
  constructor(materialLibrary) {
    this.materials = materialLibrary;
  }

  /**
   * Helper to build a true 3D Hollow Socket Sleeve Tube with chamfered lips and optional capped end
   */
  _createSocketTube(dowelRadius, socketLength, outerRadius, mat, isCapped) {
    const tubeGroup = new THREE.Group();

    if (isCapped) {
      // Outer Solid Cylinder + Rounded Dome Cap
      const outerGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, socketLength, 24);
      const outerMesh = new THREE.Mesh(outerGeo, mat);
      outerMesh.position.y = socketLength / 2;
      tubeGroup.add(outerMesh);

      const capGeo = new THREE.SphereGeometry(outerRadius * 0.98, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMesh = new THREE.Mesh(capGeo, mat);
      capMesh.position.y = socketLength;
      tubeGroup.add(capMesh);
    } else {
      // True Hollow 3D Sleeve Shell
      const boreRadius = dowelRadius + 0.4; // Clearance fit (+0.4mm)

      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

      const holePath = new THREE.Path();
      holePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
      shape.holes.push(holePath);

      const extrudeSettings = {
        depth: socketLength,
        bevelEnabled: true,
        bevelThickness: 1.0,
        bevelSize: 1.0,
        bevelSegments: 2
      };

      const sleeveGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const sleeveMesh = new THREE.Mesh(sleeveGeo, mat);
      sleeveMesh.rotation.x = -Math.PI / 2; // Orient along +Y axis
      tubeGroup.add(sleeveMesh);

      // Inner Dowel Stop Bumper inside the sleeve
      const stopGeo = new THREE.CylinderGeometry(boreRadius, boreRadius * 0.7, 3, 20);
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      const stopMesh = new THREE.Mesh(stopGeo, darkMat);
      stopMesh.position.y = 2.0;
      tubeGroup.add(stopMesh);
    }

    return tubeGroup;
  }

  /**
   * Create Directional 3D Printed 3-Way Corner Connector
   */
  create3WayCornerConnector(dowelDiameter, colorType, openPorts = {}, cornerType = 'front_left') {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(colorType || 'connector_forest_green');

    const dowelRadius = dowelDiameter / 2;
    const outerRadius = dowelRadius + 5.5;
    const socketLength = 35.0;

    // Central Core Sphere
    const sphereGeo = new THREE.SphereGeometry(outerRadius * 1.12, 24, 24);
    const sphereMesh = new THREE.Mesh(sphereGeo, mat);
    group.add(sphereMesh);

    // Socket +Y (Top Vertical Sleeve)
    const sockPY = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts.py);
    group.add(sockPY);

    // Socket -Y (Bottom Vertical Sleeve)
    const sockNY = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !(openPorts.ny !== undefined ? openPorts.ny : true));
    sockNY.rotation.x = Math.PI;
    group.add(sockNY);

    let xDir = 1;
    let zDir = 1;

    if (cornerType === 'front_right' || cornerType === 'back_right') xDir = -1;
    if (cornerType === 'back_left' || cornerType === 'back_right') zDir = -1;

    // Horizontal X Sleeve
    const isXCapped = xDir > 0 ? !openPorts.px : !openPorts.nx;
    const sockX = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, isXCapped);
    sockX.rotation.z = xDir > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(sockX);

    // Depth Z Sleeve
    const isZCapped = zDir > 0 ? !openPorts.pz : !openPorts.nz;
    const sockZ = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, isZCapped);
    sockZ.rotation.x = zDir > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(sockZ);

    group.userData = { partType: '3way_connector' };
    return group;
  }

  /**
   * Create Directional 3D Printed 4-Way Cross Connector
   */
  create4WayCrossConnector(dowelDiameter, colorType, openPorts = {}, cornerType = 'front') {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(colorType || 'connector_forest_green');

    const dowelRadius = dowelDiameter / 2;
    const outerRadius = dowelRadius + 5.5;
    const socketLength = 35.0;

    const sphereGeo = new THREE.SphereGeometry(outerRadius * 1.15, 24, 24);
    const sphereMesh = new THREE.Mesh(sphereGeo, mat);
    group.add(sphereMesh);

    // +X (Right)
    const sockPX = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts.px);
    sockPX.rotation.z = -Math.PI / 2;
    group.add(sockPX);

    // -X (Left)
    const sockNX = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts.nx);
    sockNX.rotation.z = Math.PI / 2;
    group.add(sockNX);

    // +Y (Top)
    const sockPY = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts.py);
    group.add(sockPY);

    // -Y (Bottom)
    const sockNY = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !(openPorts.ny !== undefined ? openPorts.ny : true));
    sockNY.rotation.x = Math.PI;
    group.add(sockNY);

    // Z Depth Sleeve
    const zDir = (cornerType === 'back' || cornerType === 'back_middle') ? -1 : 1;
    const isZCapped = zDir > 0 ? !openPorts.pz : !openPorts.nz;
    const sockZ = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, isZCapped);
    sockZ.rotation.x = zDir > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(sockZ);

    group.userData = { partType: '4way_connector' };
    return group;
  }

  /**
   * Create Practical 3D Printed 5-Way Hub Connector
   */
  create5WayHubConnector(dowelDiameter, colorType, openPorts = { px: true, nx: true, py: true, ny: true, pz: true }) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(colorType || 'connector_forest_green');

    const dowelRadius = dowelDiameter / 2;
    const outerRadius = dowelRadius + 5.5;
    const socketLength = 35.0;

    const sphereGeo = new THREE.SphereGeometry(outerRadius * 1.2, 24, 24);
    const sphereMesh = new THREE.Mesh(sphereGeo, mat);
    group.add(sphereMesh);

    const axes = [
      { key: 'px', rot: [0, 0, -Math.PI / 2] },
      { key: 'nx', rot: [0, 0, Math.PI / 2] },
      { key: 'py', rot: [0, 0, 0] },
      { key: 'ny', rot: [Math.PI, 0, 0] },
      { key: 'pz', rot: [Math.PI / 2, 0, 0] }
    ];

    axes.forEach(a => {
      const sock = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts[a.key]);
      sock.rotation.set(...a.rot);
      group.add(sock);
    });

    group.userData = { partType: '5way_connector' };
    return group;
  }

  /**
   * Create Practical 3D Printed End Cap Foot
   */
  createEndCapFoot(dowelDiameter, colorType) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(colorType || 'connector_forest_green');

    const dowelRadius = dowelDiameter / 2;
    const outerRadius = dowelRadius + 5.5;
    const capHeight = 35.0;

    const capGeo = new THREE.CylinderGeometry(outerRadius, outerRadius * 0.85, capHeight, 24);
    const capMesh = new THREE.Mesh(capGeo, mat);
    capMesh.position.y = capHeight / 2;
    group.add(capMesh);

    const innerBoreGeo = new THREE.CylinderGeometry(dowelRadius + 0.4, dowelRadius + 0.4, capHeight * 0.7, 20);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const innerBoreMesh = new THREE.Mesh(innerBoreGeo, darkMat);
    innerBoreMesh.position.y = capHeight * 0.65;
    group.add(innerBoreMesh);

    group.userData = { partType: 'end_cap_foot' };
    return group;
  }

  /**
   * Create 3D Printed Heavy-Duty Wall Mount Bracket Flange (4 Screw Holes)
   */
  createWallMountFlange(dowelDiameter, colorType) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(colorType || 'connector_terracotta');

    const dowelRadius = dowelDiameter / 2;
    const outerRadius = dowelRadius + 5.5;
    const flangeWidth = 60.0;
    const flangeHeight = 60.0;
    const baseThickness = 8.0;
    const socketLength = 35.0;

    // Square Backing Plate (Mounts flush against wall)
    const baseGeo = new THREE.BoxGeometry(flangeWidth, flangeHeight, baseThickness);
    const baseMesh = new THREE.Mesh(baseGeo, mat);
    baseMesh.position.z = -baseThickness / 2;
    group.add(baseMesh);

    // 4 Countersunk Screw Hole Insets
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const holeRadius = 2.5;
    const holeGeo = new THREE.CylinderGeometry(holeRadius, holeRadius, baseThickness + 2, 16);

    const holeOffsets = [
      [-flangeWidth * 0.35, flangeHeight * 0.35],
      [flangeWidth * 0.35, flangeHeight * 0.35],
      [-flangeWidth * 0.35, -flangeHeight * 0.35],
      [flangeWidth * 0.35, -flangeHeight * 0.35]
    ];

    holeOffsets.forEach(([hx, hy]) => {
      const holeMesh = new THREE.Mesh(holeGeo, darkMat);
      holeMesh.position.set(hx, hy, -baseThickness / 2);
      holeMesh.rotation.x = Math.PI / 2;
      group.add(holeMesh);
    });

    // Front Socket Tube extending forward (+Z)
    const socketGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, socketLength, 24);
    const socketMesh = new THREE.Mesh(socketGeo, mat);
    socketMesh.position.z = socketLength / 2;
    socketMesh.rotation.x = Math.PI / 2;
    group.add(socketMesh);

    // Inner Bore Tube
    const boreGeo = new THREE.CylinderGeometry(dowelRadius + 0.4, dowelRadius + 0.4, socketLength + 1, 20);
    const boreMesh = new THREE.Mesh(boreGeo, darkMat);
    boreMesh.position.z = socketLength / 2;
    boreMesh.rotation.x = Math.PI / 2;
    group.add(boreMesh);

    group.userData = { partType: 'wall_flange' };
    return group;
  }

  /**
   * Create Sleek Wall Mount Bracket & Node Connector (Matching Reference Hardware Design)
   * Features: Rounded square wall plate, cylindrical standoff stem, smooth dowel bore sleeves, & Allen key fasteners.
   */
  createWallMountConnector(dowelDiameter, colorType, openPorts = {}) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(colorType || 'connector_terracotta');
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });

    const dowelRadius = dowelDiameter / 2;
    const sleeveRadius = dowelRadius + 4.0;
    const sleeveLength = 48.0;
    const standoffLength = 32.0;

    // 1. Sleek Wall Plate with Rounded Corners (48mm x 48mm, thickness 6mm)
    const plateWidth = 48.0;
    const plateThickness = 6.0;
    const plateShape = new THREE.Shape();
    const r = 8.0; // corner radius
    const hw = plateWidth / 2;
    plateShape.moveTo(-hw + r, -hw);
    plateShape.lineTo(hw - r, -hw);
    plateShape.quadraticCurveTo(hw, -hw, hw, -hw + r);
    plateShape.lineTo(hw, hw - r);
    plateShape.quadraticCurveTo(hw, hw, hw - r, hw);
    plateShape.lineTo(-hw + r, hw);
    plateShape.quadraticCurveTo(-hw, hw, -hw, hw - r);
    plateShape.lineTo(-hw, -hw + r);
    plateShape.quadraticCurveTo(-hw, -hw, -hw + r, -hw);

    const plateGeo = new THREE.ExtrudeGeometry(plateShape, { depth: plateThickness, bevelEnabled: false });
    plateGeo.center();
    const plateMesh = new THREE.Mesh(plateGeo, mat);
    plateMesh.position.z = -standoffLength - plateThickness / 2;
    group.add(plateMesh);

    // 2 Countersunk Screw Hole Insets on Backing Plate
    const holeGeo = new THREE.CylinderGeometry(2.2, 2.2, plateThickness + 2, 16);
    const holeOffsets = [[-14, 0], [14, 0]];
    holeOffsets.forEach(([hx, hy]) => {
      const screwHeadGeo = new THREE.CylinderGeometry(3.8, 2.2, 3.0, 16);
      const screwHeadMesh = new THREE.Mesh(screwHeadGeo, metalMat);
      screwHeadMesh.position.set(hx, hy, -standoffLength + 1.5);
      screwHeadMesh.rotation.x = Math.PI / 2;
      group.add(screwHeadMesh);
    });

    // 2. Cylindrical Standoff Stem extending from wall to dowel sleeve
    const stemRadius = dowelRadius + 2.5;
    const stemGeo = new THREE.CylinderGeometry(stemRadius, stemRadius * 1.1, standoffLength, 24);
    const stemMesh = new THREE.Mesh(stemGeo, mat);
    stemMesh.position.z = -standoffLength / 2;
    stemMesh.rotation.x = Math.PI / 2;
    group.add(stemMesh);

    // 3. Main Vertical / Cross Sleeve Cylinder
    const sleeveGeo = new THREE.CylinderGeometry(sleeveRadius, sleeveRadius, sleeveLength, 28);
    const sleeveMesh = new THREE.Mesh(sleeveGeo, mat);
    group.add(sleeveMesh);

    // Inner Bore Dark Inset
    const boreGeo = new THREE.CylinderGeometry(dowelRadius + 0.3, dowelRadius + 0.3, sleeveLength + 1, 24);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const boreMesh = new THREE.Mesh(boreGeo, darkMat);
    group.add(boreMesh);

    // 4. Branch Socket for Horizontal Dowels (If open)
    if (openPorts.px || openPorts.nx) {
      const branchGeo = new THREE.CylinderGeometry(sleeveRadius, sleeveRadius, 24.0, 24);
      const branchMesh = new THREE.Mesh(branchGeo, mat);
      branchMesh.rotation.z = Math.PI / 2;
      group.add(branchMesh);
    }

    // 5. Side Allen Key Fastener Bolt (Matching Reference Image!)
    const boltGeo = new THREE.CylinderGeometry(3.5, 3.5, 4.0, 16);
    const boltMesh = new THREE.Mesh(boltGeo, metalMat);
    boltMesh.position.set(sleeveRadius - 0.5, 0, 0);
    boltMesh.rotation.z = -Math.PI / 2;
    group.add(boltMesh);

    group.userData = { partType: 'wall_connector' };
    return group;
  }

  /**
   * Create Hanging Dowel Peg (For Coat/Headphone Wall Attachments)
   */
  createHangingPeg(length = 80, diameter = 18, materialType = 'beech_natural') {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(materialType);
    const radius = diameter / 2;

    // Main Peg Body
    const pegGeo = new THREE.CylinderGeometry(radius, radius * 0.85, length, 24);
    const pegMesh = new THREE.Mesh(pegGeo, mat);
    pegMesh.position.z = length / 2;
    pegMesh.rotation.x = Math.PI / 2;
    group.add(pegMesh);

    // Rounded End Knob
    const knobGeo = new THREE.SphereGeometry(radius * 1.15, 20, 20);
    const knobMesh = new THREE.Mesh(knobGeo, mat);
    knobMesh.position.z = length;
    group.add(knobMesh);

    group.userData = { partType: 'hanging_peg' };
    return group;
  }

  /**
   * Create Heavy-Duty Structural Wooden Dowel Rod (Ø20-25mm)
   */
  createDowelRod(length, diameter, materialType) {
    const mat = this.materials.getMaterial(materialType || 'beech_natural');
    const radius = diameter / 2;

    const rodGeo = new THREE.CylinderGeometry(radius, radius, length, 24);
    const rodMesh = new THREE.Mesh(rodGeo, mat);

    rodMesh.userData = { partType: 'dowel_rod' };
    return rodMesh;
  }

  /**
   * Create Practical Corner-Notched MDF Shelf Panel (With 40.0mm L-Cutouts for Generous +5.0mm Zero-Collision Clearance!)
   */
  createMDFShelfPanel(width, depth, thickness = 12, materialType = 'mdf_natural', notchSize = 40.0) {
    const mat = this.materials.getMaterial(materialType);

    const w2 = width / 2;
    const d2 = depth / 2;
    const nx = notchSize;
    const nz = notchSize;

    // 2D Profile with 4 Clean Rectangular L-Notches at all 4 corners
    const shape = new THREE.Shape();

    // 1. Top Edge
    shape.moveTo(-w2 + nx, d2);
    shape.lineTo(w2 - nx, d2);

    // 2. Top-Right L-Notch
    shape.lineTo(w2 - nx, d2 - nz);
    shape.lineTo(w2, d2 - nz);

    // 3. Right Edge
    shape.lineTo(w2, -d2 + nz);

    // 4. Bottom-Right L-Notch
    shape.lineTo(w2 - nx, -d2 + nz);
    shape.lineTo(w2 - nx, -d2);

    // 5. Bottom Edge
    shape.lineTo(-w2 + nx, -d2);

    // 6. Bottom-Left L-Notch
    shape.lineTo(-w2 + nx, -d2 + nz);
    shape.lineTo(-w2, -d2 + nz);

    // 7. Left Edge
    shape.lineTo(-w2, d2 - nz);

    // 8. Top-Left L-Notch
    shape.lineTo(-w2 + nx, d2 - nz);
    shape.lineTo(-w2 + nx, d2);

    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 1.0,
      bevelSize: 1.0,
      bevelSegments: 2
    };

    const panelGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    const panelMesh = new THREE.Mesh(panelGeo, mat);
    panelMesh.rotation.x = -Math.PI / 2; // Orient flat along XZ plane with extrusion going +Y

    panelMesh.userData = { partType: 'mdf_shelf' };
    return panelMesh;
  }

  /**
   * Create Ceramic Plant Pot with Foliage
   */
  createPlantPotWithFoliage(potRadius = 35, potHeight = 60, potColor = 'ceramic_white') {
    const plantGroup = new THREE.Group();

    // Ceramic Pot Body
    const potGeo = new THREE.CylinderGeometry(potRadius, potRadius * 0.78, potHeight, 24);
    const potMat = this.materials.getMaterial(potColor);
    const potMesh = new THREE.Mesh(potGeo, potMat);
    potMesh.position.y = potHeight / 2;
    plantGroup.add(potMesh);

    // Soil Layer
    const soilGeo = new THREE.CylinderGeometry(potRadius * 0.95, potRadius * 0.95, 4, 20);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = potHeight - 2;
    plantGroup.add(soilMesh);

    // Plant Foliage Leaves
    const foliageGroup = new THREE.Group();
    foliageGroup.position.y = potHeight + 5;

    const leafMat = this.materials.getMaterial('foliage_green');
    const leafGeo = new THREE.SphereGeometry(18, 12, 12);
    leafGeo.scale(1, 0.4, 1.8);

    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const angle = (i / 7) * Math.PI * 2;
      leaf.position.set(Math.cos(angle) * 12, (i % 3) * 4, Math.sin(angle) * 12);
      leaf.rotation.set(0.4, angle, 0.3);
      foliageGroup.add(leaf);
    }

    plantGroup.add(foliageGroup);
    plantGroup.userData = { partType: 'plant_pot' };
    return plantGroup;
  }

  // --- Legacy Spice Rack Helpers ---
  createPanel(width, height, thickness, materialType, holeSpecs = []) {
    const shape = new THREE.Shape();
    const radius = Math.min(8, thickness / 2);
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    if (holeSpecs && holeSpecs.length > 0) {
      holeSpecs.forEach((h) => {
        const holePath = new THREE.Path();
        holePath.absarc(h.x, h.y, h.radius, 0, Math.PI * 2, true);
        shape.holes.push(holePath);
      });
    }

    const extrudeSettings = { depth: thickness, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 3 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const material = this.materials.getMaterial(materialType);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { partType: 'panel' };
    return mesh;
  }

  createDowelPillar(totalHeight, diameter, pinHoleHeights, materialType) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(materialType);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x22140a, roughness: 0.9 });
    const radius = diameter / 2;

    const shaftGeo = new THREE.CylinderGeometry(radius, radius, totalHeight, 24);
    const shaftMesh = new THREE.Mesh(shaftGeo, mat);
    shaftMesh.position.y = totalHeight / 2;
    group.add(shaftMesh);

    if (pinHoleHeights) {
      pinHoleHeights.forEach((yPos) => {
        const holeGeo = new THREE.CylinderGeometry(2.7, 2.7, diameter + 2, 16);
        const holeMesh = new THREE.Mesh(holeGeo, darkMat);
        holeMesh.position.set(0, yPos, 0);
        holeMesh.rotation.x = Math.PI / 2;
        group.add(holeMesh);
      });
    }

    group.userData = { partType: 'turned_pillar' };
    return group;
  }

  createSupportCollar(diameter, materialType) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(materialType);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x22140a, roughness: 0.9 });

    const dowelRadius = diameter / 2;
    const collarRadius = dowelRadius + 4.5;
    const collarHeight = 12;

    const shape = new THREE.Shape();
    shape.absarc(0, 0, collarRadius, 0, Math.PI * 2, false);

    const innerHole = new THREE.Path();
    innerHole.absarc(0, 0, dowelRadius + 0.5, 0, Math.PI * 2, true);
    shape.holes.push(innerHole);

    const extrudeSettings = { depth: collarHeight, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 2 };
    const collarGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    collarGeo.center();

    const collarMesh = new THREE.Mesh(collarGeo, mat);
    collarMesh.rotation.x = Math.PI / 2;
    group.add(collarMesh);

    const pinHoleRadius = 2.7;
    const pinHoleGeo = new THREE.CylinderGeometry(pinHoleRadius, pinHoleRadius, collarRadius * 2 + 3, 16);
    const pinHoleMesh = new THREE.Mesh(pinHoleGeo, darkMat);
    pinHoleMesh.rotation.x = Math.PI / 2;
    group.add(pinHoleMesh);

    group.userData = { partType: 'support_collar' };
    return group;
  }

  createWoodenCrossPin(diameter, materialType) {
    const mat = this.materials.getMaterial(materialType);
    const pinRadius = 2.4;
    const pinLength = diameter + 14;

    const pinGeo = new THREE.CylinderGeometry(pinRadius, pinRadius, pinLength, 16);
    const pinMesh = new THREE.Mesh(pinGeo, mat);
    pinMesh.rotation.x = Math.PI / 2;

    pinMesh.userData = { partType: 'cross_pin' };
    return pinMesh;
  }

  createGuardRailWithTenons(length, diameter, materialType) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(materialType);
    const tenonMat = new THREE.MeshStandardMaterial({ color: 0xc8985c, roughness: 0.7 });

    const railRadius = diameter / 2;
    const tenonRadius = railRadius * 0.6;
    const tenonLength = 16;

    const railGeo = new THREE.CylinderGeometry(railRadius, railRadius, length, 24);
    const railMesh = new THREE.Mesh(railGeo, mat);
    railMesh.rotation.z = Math.PI / 2;
    group.add(railMesh);

    const leftTenonGeo = new THREE.CylinderGeometry(tenonRadius, tenonRadius, tenonLength, 16);
    const leftTenonMesh = new THREE.Mesh(leftTenonGeo, tenonMat);
    leftTenonMesh.position.x = -length / 2 - tenonLength / 2;
    leftTenonMesh.rotation.z = Math.PI / 2;
    group.add(leftTenonMesh);

    const rightTenonGeo = new THREE.CylinderGeometry(tenonRadius, tenonRadius, tenonLength, 16);
    const rightTenonMesh = new THREE.Mesh(rightTenonGeo, tenonMat);
    rightTenonMesh.position.x = length / 2 + tenonLength / 2;
    rightTenonMesh.rotation.z = Math.PI / 2;
    group.add(rightTenonMesh);

    group.userData = { partType: 'guard_rail' };
    return group;
  }

  createTopWoodenLockingPeg(diameter, materialType) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(materialType);
    const radius = diameter / 2;

    const baseGeo = new THREE.CylinderGeometry(radius * 1.3, radius * 1.3, 6, 24);
    const baseMesh = new THREE.Mesh(baseGeo, mat);
    baseMesh.position.y = 3;
    group.add(baseMesh);

    const sphereGeo = new THREE.SphereGeometry(radius * 1.25, 20, 20);
    const sphereMesh = new THREE.Mesh(sphereGeo, mat);
    sphereMesh.position.y = 12;
    group.add(sphereMesh);

    group.userData = { partType: 'wooden_locking_peg' };
    return group;
  }

  createSpiceJar(spec) {
    const jarGroup = new THREE.Group();
    const jarRadius = spec.radius || 17;
    const jarHeight = spec.height || 54;
    const wallThickness = 2.2;

    const glassGeo = new THREE.CylinderGeometry(jarRadius, jarRadius, jarHeight, 24);
    const glassMat = this.materials.getMaterial('glass_jar');
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    jarGroup.add(glassMesh);

    const fillHeight = jarHeight * (spec.fillRatio || 0.75);
    const fillRadius = jarRadius - wallThickness;
    const fillGeo = new THREE.CylinderGeometry(fillRadius, fillRadius, fillHeight, 20);
    const fillMat = this.materials.getMaterial(spec.spiceMaterial || 'spice_paprika');
    const fillMesh = new THREE.Mesh(fillGeo, fillMat);
    fillMesh.position.y = - (jarHeight - fillHeight) / 2 + 1.5;
    jarGroup.add(fillMesh);

    const capType = spec.capType || 'cork';
    if (capType === 'cork') {
      const corkGeo = new THREE.CylinderGeometry(jarRadius * 0.9, jarRadius * 0.78, 12, 20);
      const corkMat = this.materials.getMaterial('cork_stopper');
      const corkMesh = new THREE.Mesh(corkGeo, corkMat);
      corkMesh.position.y = jarHeight / 2 + 6;
      jarGroup.add(corkMesh);
    } else {
      const metalGeo = new THREE.CylinderGeometry(jarRadius * 1.04, jarRadius * 1.04, 10, 24);
      const metalMat = this.materials.getMaterial('metal_cap');
      const metalMesh = new THREE.Mesh(metalGeo, metalMat);
      metalMesh.position.y = jarHeight / 2 + 5;
      jarGroup.add(metalMesh);
    }

    const labelWidth = jarRadius * 1.4;
    const labelHeight = jarHeight * 0.45;
    const labelGeo = new THREE.PlaneGeometry(labelWidth, labelHeight);
    const labelTex = this.materials.createLabelTexture(spec.name || 'Spice');
    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTex,
      roughness: 0.8,
      metalness: 0.05,
      transparent: true
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, 0, jarRadius + 0.5);
    jarGroup.add(labelMesh);

    jarGroup.userData = {
      partId: spec.id,
      partType: 'spice_jar',
      labelName: spec.name,
      spiceType: spec.spiceMaterial
    };

    return jarGroup;
  }

  buildFromGraph(graph) {
    const root = new THREE.Group();
    root.scale.setScalar(SCALE_FACTOR);

    // 1. Build Dowel Rods
    if (graph.dowelRods) {
      for (const rod of graph.dowelRods) {
        const mesh = this.createDowelRod(rod.length, rod.diameter, rod.material);
        mesh.position.set(...rod.position);
        if (rod.rotation) {
          mesh.rotation.set(...rod.rotation);
        }
        mesh.userData.partId = rod.id;
        mesh.userData.partType = 'dowel_rod';
        mesh.name = rod.id;
        root.add(mesh);
      }
    }

    // 2. Build Zero-Collision MDF Shelf Panels
    if (graph.mdfShelves) {
      for (const shelf of graph.mdfShelves) {
        const notchSize = shelf.notchSize || 40.0;
        const mesh = this.createMDFShelfPanel(shelf.width, shelf.depth, shelf.thickness, shelf.material, notchSize);
        mesh.position.set(...shelf.position);
        mesh.userData.partId = shelf.id;
        mesh.userData.partType = 'mdf_shelf';
        mesh.name = shelf.id;
        root.add(mesh);
      }
    }

    // 3. Build Directional 3D Printed Connectors
    if (graph.connectors) {
      for (const conn of graph.connectors) {
        let mesh;
        if (conn.type === '3way') {
          mesh = this.create3WayCornerConnector(conn.diameter, conn.color, conn.openPorts, conn.cornerType);
        } else if (conn.type === '4way') {
          mesh = this.create4WayCrossConnector(conn.diameter, conn.color, conn.openPorts, conn.cornerType);
        } else if (conn.type === '5way') {
          mesh = this.create5WayHubConnector(conn.diameter, conn.color, conn.openPorts);
        } else {
          mesh = this.createEndCapFoot(conn.diameter, conn.color);
        }

        mesh.position.set(...conn.position);
        if (conn.rotation) {
          mesh.rotation.set(...conn.rotation);
        }
        mesh.userData.partId = conn.id;
        mesh.userData.partType = 'connector';
        mesh.name = conn.id;
        root.add(mesh);
      }
    }

    // 4. Build Plant Pots
    if (graph.plantPots) {
      for (const pot of graph.plantPots) {
        const mesh = this.createPlantPotWithFoliage(pot.radius, pot.height, pot.color);
        mesh.position.set(...pot.position);
        mesh.userData.partId = pot.id;
        mesh.userData.partType = 'plant_pot';
        mesh.name = pot.id;
        root.add(mesh);
      }
    }

    // 5. Build Wall Mount Connectors
    if (graph.wallConnectors) {
      for (const conn of graph.wallConnectors) {
        const mesh = this.createWallMountConnector(conn.diameter, conn.color, conn.openPorts);
        mesh.position.set(...conn.position);
        if (conn.rotation) {
          mesh.rotation.set(...conn.rotation);
        }
        mesh.userData.partId = conn.id;
        mesh.userData.partType = 'wall_connector';
        mesh.name = conn.id;
        root.add(mesh);
      }
    }

    // 6. Build Wall Mount Flanges
    if (graph.wallFlanges) {
      for (const flange of graph.wallFlanges) {
        const mesh = this.createWallMountFlange(flange.diameter, flange.color);
        mesh.position.set(...flange.position);
        if (flange.rotation) {
          mesh.rotation.set(...flange.rotation);
        }
        mesh.userData.partId = flange.id;
        mesh.userData.partType = 'wall_flange';
        mesh.name = flange.id;
        root.add(mesh);
      }
    }

    // 6. Build Hanging Pegs
    if (graph.hangingPegs) {
      for (const peg of graph.hangingPegs) {
        const mesh = this.createHangingPeg(peg.length, peg.diameter, peg.material);
        mesh.position.set(...peg.position);
        if (peg.rotation) {
          mesh.rotation.set(...peg.rotation);
        }
        mesh.userData.partId = peg.id;
        mesh.userData.partType = 'hanging_peg';
        mesh.name = peg.id;
        root.add(mesh);
      }
    }

    // 7. Legacy Spice Rack Nodes
    if (graph.panels) {
      for (const panel of graph.panels) {
        const mesh = this.createPanel(
          panel.dimensions[0],
          panel.dimensions[1],
          panel.dimensions[2],
          panel.material,
          panel.holes || []
        );
        mesh.position.set(panel.position[0], panel.position[1], panel.position[2]);
        if (panel.rotation) {
          mesh.rotation.set(panel.rotation[0], panel.rotation[1], panel.rotation[2]);
        }
        mesh.userData.partId = panel.id;
        mesh.userData.partType = 'panel';
        mesh.name = panel.id;
        root.add(mesh);
      }
    }

    if (graph.pillars) {
      for (const pillar of graph.pillars) {
        const mesh = this.createDowelPillar(
          pillar.height,
          pillar.diameter,
          pillar.pinHoleHeights,
          pillar.material
        );
        mesh.position.set(pillar.position[0], 0, pillar.position[1]);
        mesh.userData.partId = pillar.id;
        mesh.userData.partType = 'turned_pillar';
        mesh.name = pillar.id;
        root.add(mesh);
      }
    }

    if (graph.collars) {
      for (const collar of graph.collars) {
        const mesh = this.createSupportCollar(collar.diameter, collar.material);
        mesh.position.set(collar.position[0], collar.position[1], collar.position[2]);
        mesh.userData.partId = collar.id;
        mesh.userData.partType = 'support_collar';
        mesh.name = collar.id;
        root.add(mesh);
      }
    }

    if (graph.pins) {
      for (const pin of graph.pins) {
        const mesh = this.createWoodenCrossPin(pin.diameter, pin.material);
        mesh.position.set(pin.position[0], pin.position[1], pin.position[2]);
        mesh.userData.partId = pin.id;
        mesh.userData.partType = 'cross_pin';
        mesh.name = pin.id;
        root.add(mesh);
      }
    }

    if (graph.topPegs) {
      for (const peg of graph.topPegs) {
        const mesh = this.createTopWoodenLockingPeg(peg.diameter, peg.material);
        mesh.position.set(peg.position[0], peg.position[1], peg.position[2]);
        mesh.userData.partId = peg.id;
        mesh.userData.partType = 'wooden_locking_peg';
        mesh.name = peg.id;
        root.add(mesh);
      }
    }

    if (graph.guardRails) {
      for (const rail of graph.guardRails) {
        const mesh = this.createGuardRailWithTenons(rail.length, rail.diameter, rail.material);
        mesh.position.set(rail.position[0], rail.position[1], rail.position[2]);
        mesh.userData.partId = rail.id;
        mesh.userData.partType = 'guard_rail';
        mesh.name = rail.id;
        root.add(mesh);
      }
    }

    if (graph.jars) {
      for (const jarSpec of graph.jars) {
        const jarMesh = this.createSpiceJar(jarSpec);
        jarMesh.position.set(...jarSpec.position);
        if (jarSpec.rotation) {
          jarMesh.rotation.set(...jarSpec.rotation);
        }
        root.add(jarMesh);
      }
    }

    return root;
  }
}
