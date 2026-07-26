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
   * Features: Rounded square wall plate, cylindrical standoff stem, and correct socket tubes to fix floating dowels.
   */
  createWallMountConnector(dowelDiameter, colorType, openPorts = {}) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(colorType || 'connector_terracotta');
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });

    const dowelRadius = dowelDiameter / 2;
    const outerRadius = dowelRadius + 5.5;
    const socketLength = 35.0; // CRITICAL: Must be 35.0 so dowels don't float!
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
    plateMesh.position.z = -outerRadius - standoffLength - plateThickness / 2;
    group.add(plateMesh);

    // 2 Countersunk Screw Hole Insets on Backing Plate
    const holeGeo = new THREE.CylinderGeometry(2.2, 2.2, plateThickness + 2, 16);
    const holeOffsets = [[-14, 0], [14, 0]];
    holeOffsets.forEach(([hx, hy]) => {
      const screwHeadGeo = new THREE.CylinderGeometry(3.8, 2.2, 3.0, 16);
      const screwHeadMesh = new THREE.Mesh(screwHeadGeo, metalMat);
      screwHeadMesh.position.set(hx, hy, -outerRadius - standoffLength + 1.5);
      screwHeadMesh.rotation.x = Math.PI / 2;
      group.add(screwHeadMesh);
    });

    // 2. Cylindrical Standoff Stem extending from wall to central joint
    const stemRadius = dowelRadius + 2.5;
    const stemGeo = new THREE.CylinderGeometry(stemRadius, stemRadius * 1.1, standoffLength, 24);
    const stemMesh = new THREE.Mesh(stemGeo, mat);
    stemMesh.position.z = -outerRadius - standoffLength / 2;
    stemMesh.rotation.x = Math.PI / 2;
    group.add(stemMesh);

    // 3. Central Sleek Core Cylinder (Replaces bulbous sphere)
    const coreGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, outerRadius * 2, 24);
    const coreMesh = new THREE.Mesh(coreGeo, mat);
    group.add(coreMesh);

    // 4. Socket +X (Right)
    const sockPX = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts.px);
    sockPX.rotation.z = -Math.PI / 2;
    group.add(sockPX);

    // 5. Socket -X (Left)
    const sockNX = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts.nx);
    sockNX.rotation.z = Math.PI / 2;
    group.add(sockNX);

    // 6. Socket +Y (Top)
    const sockPY = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts.py);
    group.add(sockPY);

    // 7. Socket -Y (Bottom)
    const sockNY = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !(openPorts.ny !== undefined ? openPorts.ny : true));
    sockNY.rotation.x = Math.PI;
    group.add(sockNY);

    // 8. Socket +Z (Front Depth Arm)
    const sockPZ = this._createSocketTube(dowelRadius, socketLength, outerRadius, mat, !openPorts.pz);
    sockPZ.rotation.x = Math.PI / 2;
    group.add(sockPZ);

    // 9. Side Allen Key Fastener Bolt (Matching Reference Image)
    const boltGeo = new THREE.CylinderGeometry(3.5, 3.5, 4.0, 16);
    const boltMesh = new THREE.Mesh(boltGeo, metalMat);
    boltMesh.position.set(outerRadius - 0.5, 0, 0);
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
   * Create AXILOCK Chamfered Polyhedron Hub Connector (Truncated Cube with Circular Socket Bores & Smooth Helical Ramps)
   */
  createAxilockHub(dowelDiameter = 22, hubColor = 'axilock_hub_charcoal', portConfig = {}, showCutaway = false) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(hubColor || 'axilock_hub_charcoal');
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.85 });
    const orangeMat = this.materials.getMaterial('axilock_ramp_orange');

    const dowelRadius = dowelDiameter / 2;
    const connRadius = dowelRadius + 1.5; // End connector OD radius (12.5mm for 22mm dowel)
    const boreRadius = connRadius + 0.3; // Socket bore radius (12.8mm)
    const hubH = 26.0; // Half-width = 26mm (Overall 52mm block)
    const chamfer = 6.0;
    const A = hubH - chamfer; // 20mm
    const socketDepth = 22.0;

    // Build chamfered polyhedron hub body with 6 socket bore openings
    const hubGeo = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];

    function addTriangle(p1, p2, p3, norm) {
      vertices.push(...p1, ...p2, ...p3);
      normals.push(...norm, ...norm, ...norm);
      uvs.push(0, 0, 1, 0, 0.5, 1);
    }

    function addQuad(p1, p2, p3, p4, norm) {
      addTriangle(p1, p2, p3, norm);
      addTriangle(p1, p3, p4, norm);
    }

    // 1. CORNER TRUNCATIONS (8 Triangular faces)
    const cornerSign = [
      [1, 1, 1], [-1, 1, 1], [-1, -1, 1], [1, -1, 1],
      [1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]
    ];
    cornerSign.forEach(([sx, sy, sz]) => {
      // If cutaway mode is enabled, skip the front-top-right corner to open a clean inspection window
      if (showCutaway && sx > 0 && sy > 0 && sz > 0) return;

      const v1 = [sx * A, sy * hubH, sz * A];
      const v2 = [sx * hubH, sy * A, sz * A];
      const v3 = [sx * A, sy * A, sz * hubH];
      const n = new THREE.Vector3(sx, sy, sz).normalize().toArray();
      if ((sx * sy * sz) > 0) {
        addTriangle(v1, v2, v3, n);
      } else {
        addTriangle(v1, v3, v2, n);
      }
    });

    // 2. EDGE CHAMFERS (12 Rectangular faces)
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sy, sz]) => {
      if (showCutaway && sy > 0 && sz > 0) return; // Skip front-top cutaway edge
      const p1 = [-A, sy * hubH, sz * A];
      const p2 = [A, sy * hubH, sz * A];
      const p3 = [A, sy * A, sz * hubH];
      const p4 = [-A, sy * A, sz * hubH];
      const n = new THREE.Vector3(0, sy, sz).normalize().toArray();
      if (sy * sz > 0) addQuad(p1, p2, p3, p4, n);
      else addQuad(p1, p4, p3, p2, n);
    });

    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
      if (showCutaway && sx > 0 && sz > 0) return;
      const p1 = [sx * hubH, -A, sz * A];
      const p2 = [sx * hubH, A, sz * A];
      const p3 = [sx * A, A, sz * hubH];
      const p4 = [sx * A, -A, sz * hubH];
      const n = new THREE.Vector3(sx, 0, sz).normalize().toArray();
      if (sx * sz < 0) addQuad(p1, p2, p3, p4, n);
      else addQuad(p1, p4, p3, p2, n);
    });

    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sy]) => {
      if (showCutaway && sx > 0 && sy > 0) return;
      const p1 = [sx * A, sy * hubH, -A];
      const p2 = [sx * A, sy * hubH, A];
      const p3 = [sx * hubH, sy * A, A];
      const p4 = [sx * hubH, sy * A, -A];
      const n = new THREE.Vector3(sx, sy, 0).normalize().toArray();
      if (sx * sy > 0) addQuad(p1, p2, p3, p4, n);
      else addQuad(p1, p4, p3, p2, n);
    });

    // 3. MAIN FACES WITH CIRCULAR SOCKET HOLES (6 faces)
    const N = 24;
    const circlePts = [];
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      circlePts.push([Math.cos(ang) * boreRadius, Math.sin(ang) * boreRadius]);
    }

    const faces = [
      { dir: [0, 1, 0], rot: [0, 0, 0], key: 'py' },
      { dir: [0, -1, 0], rot: [Math.PI, 0, 0], key: 'ny' },
      { dir: [1, 0, 0], rot: [0, 0, -Math.PI / 2], key: 'px' },
      { dir: [-1, 0, 0], rot: [0, 0, Math.PI / 2], key: 'nx' },
      { dir: [0, 0, 1], rot: [Math.PI / 2, 0, 0], key: 'pz' },
      { dir: [0, 0, -1], rot: [-Math.PI / 2, 0, 0], key: 'nz' }
    ];

    faces.forEach(f => {
      const isActive = portConfig[f.key] !== false;

      const dummy = new THREE.Object3D();
      dummy.rotation.set(...f.rot);
      dummy.position.set(f.dir[0] * hubH, f.dir[1] * hubH, f.dir[2] * hubH);
      dummy.updateMatrix();

      if (isActive) {
        for (let i = 0; i < N; i++) {
          const nextI = (i + 1) % N;
          const c1 = circlePts[i];
          const c2 = circlePts[nextI];

          const ang1 = (i / N) * Math.PI * 2;
          const ang2 = (nextI / N) * Math.PI * 2;

          const getSquarePt = (a) => {
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            const scale = A / Math.max(Math.abs(cos), Math.abs(sin) === 0 ? 0.0001 : Math.abs(sin));
            return [cos * scale, sin * scale];
          };

          const sq1 = getSquarePt(ang1);
          const sq2 = getSquarePt(ang2);

          const p1 = new THREE.Vector3(sq1[0], 0, sq1[1]).applyMatrix4(dummy.matrix).toArray();
          const p2 = new THREE.Vector3(sq2[0], 0, sq2[1]).applyMatrix4(dummy.matrix).toArray();
          const p3 = new THREE.Vector3(c2[0], 0, c2[1]).applyMatrix4(dummy.matrix).toArray();
          const p4 = new THREE.Vector3(c1[0], 0, c1[1]).applyMatrix4(dummy.matrix).toArray();

          addQuad(p1, p2, p3, p4, f.dir);
        }
      } else {
        const p1 = new THREE.Vector3(-A, 0, -A).applyMatrix4(dummy.matrix).toArray();
        const p2 = new THREE.Vector3(A, 0, -A).applyMatrix4(dummy.matrix).toArray();
        const p3 = new THREE.Vector3(A, 0, A).applyMatrix4(dummy.matrix).toArray();
        const p4 = new THREE.Vector3(-A, 0, A).applyMatrix4(dummy.matrix).toArray();
        addQuad(p1, p2, p3, p4, f.dir);
      }
    });

    hubGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    hubGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    hubGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const hubMesh = new THREE.Mesh(hubGeo, mat);
    group.add(hubMesh);

    // ===== 4. INTERNAL SOCKET CYLINDERS & SMOOTH HELICAL CAM RAMPS =====
    faces.forEach(f => {
      const isActive = portConfig[f.key] !== false;
      if (!isActive) return;

      const portGroup = new THREE.Group();
      portGroup.rotation.set(...f.rot);

      // Dark internal socket cylinder bore
      const socketTubeGeo = new THREE.CylinderGeometry(boreRadius, boreRadius, socketDepth, 24, 1, true);
      const socketTubeMesh = new THREE.Mesh(socketTubeGeo, darkMat);
      socketTubeMesh.position.y = hubH - socketDepth / 2;
      portGroup.add(socketTubeMesh);

      // Socket bottom stop plate
      const stopGeo = new THREE.CircleGeometry(boreRadius, 24);
      const stopMesh = new THREE.Mesh(stopGeo, darkMat);
      stopMesh.position.y = hubH - socketDepth;
      stopMesh.rotation.x = Math.PI / 2;
      portGroup.add(stopMesh);

      // Socket mouth chamfer lip ring
      const lipGeo = new THREE.RingGeometry(boreRadius, boreRadius + 1.2, 24);
      const lipMesh = new THREE.Mesh(lipGeo, mat);
      lipMesh.position.y = hubH + 0.1;
      lipMesh.rotation.x = -Math.PI / 2;
      portGroup.add(lipMesh);

      // 3 Smooth Continuous Helical Cam Ramp Tracks (Orange) inside socket wall
      for (let i = 0; i < 3; i++) {
        const baseAngle = (i * Math.PI * 2) / 3;
        const curvePoints = [];
        const arcAngle = (25 * Math.PI) / 180;
        const rise = 3.0;

        for (let j = 0; j <= 20; j++) {
          const t = j / 20;
          const ang = baseAngle + t * arcAngle;
          const yPos = (hubH - socketDepth + 3.0) + t * rise;
          curvePoints.push(new THREE.Vector3(
            Math.cos(ang) * (boreRadius - 0.4),
            yPos,
            Math.sin(ang) * (boreRadius - 0.4)
          ));
        }

        const helixCurve = new THREE.CatmullRomCurve3(curvePoints);
        const rampGeo = new THREE.TubeGeometry(helixCurve, 20, 0.7, 8, false);
        const rampMesh = new THREE.Mesh(rampGeo, orangeMat);
        portGroup.add(rampMesh);

        // Detent bump at end of helical ramp
        const detentGeo = new THREE.SphereGeometry(1.0, 12, 12);
        const detentMesh = new THREE.Mesh(detentGeo, orangeMat);
        detentMesh.position.copy(curvePoints[20]);
        portGroup.add(detentMesh);
      }

      group.add(portGroup);
    });

    group.userData = { partType: 'axilock_hub' };
    return group;
  }

  /**
   * Create AXILOCK End Connector (Smooth White Sleeve with Integrated Helical Locking Ribs)
   */
  createAxilockEndConnector(dowelDiameter = 22, connectorColor = 'axilock_connector_white', tabColor = 'axilock_tab_blue', showTabs = true) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(connectorColor || 'axilock_connector_white');
    const tabMat = this.materials.getMaterial(tabColor || 'axilock_tab_blue');
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.85 });

    const dowelRadius = dowelDiameter / 2;
    const bodyOD = dowelRadius + 1.5; // 12.5mm radius = 25mm OD for 22mm dowel
    const bodyLength = 24.0;
    const bore = dowelRadius + 0.1;

    // 1. Sleek cylindrical sleeve body (Extruded along Y)
    const shape = new THREE.Shape();
    shape.absarc(0, 0, bodyOD, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, bore, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings = { depth: bodyLength, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 2 };
    const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const bodyMesh = new THREE.Mesh(bodyGeo, mat);
    bodyMesh.rotation.x = -Math.PI / 2; // Orient along +Y axis (y = 0 to y = bodyLength)
    group.add(bodyMesh);

    // 2. Lead-in chamfer at insertion end (y = bodyLength)
    const chamferGeo = new THREE.CylinderGeometry(bodyOD - 0.8, bodyOD, 1.2, 24);
    const chamferMesh = new THREE.Mesh(chamferGeo, mat);
    chamferMesh.position.y = bodyLength + 0.6;
    group.add(chamferMesh);

    // 3. Three Smooth Continuous Helical Locking Ribs (Blue) integrated on outer barrel
    if (showTabs) {
      for (let i = 0; i < 3; i++) {
        const baseAngle = (i * Math.PI * 2) / 3;
        const curvePoints = [];
        const arcAngle = (25 * Math.PI) / 180;
        const rise = 3.0;

        for (let j = 0; j <= 20; j++) {
          const t = j / 20;
          const ang = baseAngle + t * arcAngle;
          const yPos = (bodyLength - 14.0) + t * rise;
          curvePoints.push(new THREE.Vector3(
            Math.cos(ang) * bodyOD,
            yPos,
            Math.sin(ang) * bodyOD
          ));
        }

        const helixCurve = new THREE.CatmullRomCurve3(curvePoints);
        const tabGeo = new THREE.TubeGeometry(helixCurve, 20, 0.7, 8, false);
        const tabMesh = new THREE.Mesh(tabGeo, tabMat);
        group.add(tabMesh);

        // Detent bump at tab tip
        const detentGeo = new THREE.SphereGeometry(0.9, 12, 12);
        const detentMesh = new THREE.Mesh(detentGeo, tabMat);
        detentMesh.position.copy(curvePoints[20]);
        group.add(detentMesh);
      }
    }

    // Screw counterbore indicator at rear face (y = 0)
    const screwIndicatorGeo = new THREE.CircleGeometry(bore, 24);
    const screwIndicatorMesh = new THREE.Mesh(screwIndicatorGeo, darkMat);
    screwIndicatorMesh.position.y = -0.1;
    screwIndicatorMesh.rotation.x = Math.PI / 2;
    group.add(screwIndicatorMesh);

    group.userData = { partType: 'axilock_end_connector' };
    return group;
  }

  /**
   * Create AXILOCK Female Threaded Socket Hub ("The Nut / Socket Hub")
   */
  createAxilockThreadedHub(dowelDiameter = 22, hubColor = 'axilock_hub_charcoal', portConfig = {}) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(hubColor || 'axilock_hub_charcoal');
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.85 });
    const threadMat = this.materials.getMaterial('connector_stone_grey');

    const dowelRadius = dowelDiameter / 2;
    const hubH = 26.0; // Half-width = 26mm (Overall 52mm block)
    const chamfer = 6.0;
    const A = hubH - chamfer;
    const boreRadius = dowelRadius + 1.2; // 12.2mm radius = 24.4mm ID female socket bore
    const socketDepth = 20.0;

    // 1. Chamfered polyhedron hub core with circular female socket holes on 6 faces
    const hubGeo = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];

    function addTriangle(p1, p2, p3, norm) {
      vertices.push(...p1, ...p2, ...p3);
      normals.push(...norm, ...norm, ...norm);
      uvs.push(0, 0, 1, 0, 0.5, 1);
    }

    function addQuad(p1, p2, p3, p4, norm) {
      addTriangle(p1, p2, p3, norm);
      addTriangle(p1, p3, p4, norm);
    }

    // Corner truncations
    const cornerSign = [
      [1, 1, 1], [-1, 1, 1], [-1, -1, 1], [1, -1, 1],
      [1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]
    ];
    cornerSign.forEach(([sx, sy, sz]) => {
      const v1 = [sx * A, sy * hubH, sz * A];
      const v2 = [sx * hubH, sy * A, sz * A];
      const v3 = [sx * A, sy * A, sz * hubH];
      const n = new THREE.Vector3(sx, sy, sz).normalize().toArray();
      if ((sx * sy * sz) > 0) addTriangle(v1, v2, v3, n);
      else addTriangle(v1, v3, v2, n);
    });

    // Edge chamfers
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sy, sz]) => {
      const p1 = [-A, sy * hubH, sz * A];
      const p2 = [A, sy * hubH, sz * A];
      const p3 = [A, sy * A, sz * hubH];
      const p4 = [-A, sy * A, sz * hubH];
      const n = new THREE.Vector3(0, sy, sz).normalize().toArray();
      if (sy * sz > 0) addQuad(p1, p2, p3, p4, n);
      else addQuad(p1, p4, p3, p2, n);
    });

    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
      const p1 = [sx * hubH, -A, sz * A];
      const p2 = [sx * hubH, A, sz * A];
      const p3 = [sx * A, A, sz * hubH];
      const p4 = [sx * A, -A, sz * hubH];
      const n = new THREE.Vector3(sx, 0, sz).normalize().toArray();
      if (sx * sz < 0) addQuad(p1, p2, p3, p4, n);
      else addQuad(p1, p4, p3, p2, n);
    });

    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sy]) => {
      const p1 = [sx * A, sy * hubH, -A];
      const p2 = [sx * A, sy * hubH, A];
      const p3 = [sx * hubH, sy * A, A];
      const p4 = [sx * hubH, sy * A, -A];
      const n = new THREE.Vector3(sx, sy, 0).normalize().toArray();
      if (sx * sy > 0) addQuad(p1, p2, p3, p4, n);
      else addQuad(p1, p4, p3, p2, n);
    });

    // Main faces with circular female socket holes
    const N = 24;
    const circlePts = [];
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      circlePts.push([Math.cos(ang) * boreRadius, Math.sin(ang) * boreRadius]);
    }

    const faces = [
      { dir: [0, 1, 0], rot: [0, 0, 0], key: 'py' },
      { dir: [0, -1, 0], rot: [Math.PI, 0, 0], key: 'ny' },
      { dir: [1, 0, 0], rot: [0, 0, -Math.PI / 2], key: 'px' },
      { dir: [-1, 0, 0], rot: [0, 0, Math.PI / 2], key: 'nx' },
      { dir: [0, 0, 1], rot: [Math.PI / 2, 0, 0], key: 'pz' },
      { dir: [0, 0, -1], rot: [-Math.PI / 2, 0, 0], key: 'nz' }
    ];

    faces.forEach(f => {
      const isActive = portConfig[f.key] !== false;
      const dummy = new THREE.Object3D();
      dummy.rotation.set(...f.rot);
      dummy.position.set(f.dir[0] * hubH, f.dir[1] * hubH, f.dir[2] * hubH);
      dummy.updateMatrix();

      if (isActive) {
        for (let i = 0; i < N; i++) {
          const nextI = (i + 1) % N;
          const c1 = circlePts[i];
          const c2 = circlePts[nextI];
          const ang1 = (i / N) * Math.PI * 2;
          const ang2 = (nextI / N) * Math.PI * 2;

          const getSquarePt = (a) => {
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            const scale = A / Math.max(Math.abs(cos), Math.abs(sin) === 0 ? 0.0001 : Math.abs(sin));
            return [cos * scale, sin * scale];
          };

          const sq1 = getSquarePt(ang1);
          const sq2 = getSquarePt(ang2);

          const p1 = new THREE.Vector3(sq1[0], 0, sq1[1]).applyMatrix4(dummy.matrix).toArray();
          const p2 = new THREE.Vector3(sq2[0], 0, sq2[1]).applyMatrix4(dummy.matrix).toArray();
          const p3 = new THREE.Vector3(c2[0], 0, c2[1]).applyMatrix4(dummy.matrix).toArray();
          const p4 = new THREE.Vector3(c1[0], 0, c1[1]).applyMatrix4(dummy.matrix).toArray();

          addQuad(p1, p2, p3, p4, f.dir);
        }
      } else {
        const p1 = new THREE.Vector3(-A, 0, -A).applyMatrix4(dummy.matrix).toArray();
        const p2 = new THREE.Vector3(A, 0, -A).applyMatrix4(dummy.matrix).toArray();
        const p3 = new THREE.Vector3(A, 0, A).applyMatrix4(dummy.matrix).toArray();
        const p4 = new THREE.Vector3(-A, 0, A).applyMatrix4(dummy.matrix).toArray();
        addQuad(p1, p2, p3, p4, f.dir);
      }
    });

    hubGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    hubGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    hubGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const hubMesh = new THREE.Mesh(hubGeo, mat);
    group.add(hubMesh);

    // 2. Internal Female Threaded Bores inside active faces
    faces.forEach(f => {
      const isActive = portConfig[f.key] !== false;
      if (!isActive) return;

      const portGroup = new THREE.Group();
      portGroup.rotation.set(...f.rot);

      // Dark internal socket cylinder bore
      const socketTubeGeo = new THREE.CylinderGeometry(boreRadius, boreRadius, socketDepth, 24, 1, true);
      const socketTubeMesh = new THREE.Mesh(socketTubeGeo, darkMat);
      socketTubeMesh.position.y = hubH - socketDepth / 2;
      portGroup.add(socketTubeMesh);

      // Socket bottom stop plate
      const stopGeo = new THREE.CircleGeometry(boreRadius, 24);
      const stopMesh = new THREE.Mesh(stopGeo, darkMat);
      stopMesh.position.y = hubH - socketDepth;
      stopMesh.rotation.x = Math.PI / 2;
      portGroup.add(stopMesh);

      // Smooth 3D Female ACME Thread Helix inside socket bore
      const threadPoints = [];
      const turns = 4;
      const totalSteps = turns * 20;
      for (let j = 0; j <= totalSteps; j++) {
        const t = j / totalSteps;
        const ang = t * Math.PI * 2 * turns;
        const y = (hubH - socketDepth + 2.0) + t * (socketDepth - 4.0);
        threadPoints.push(new THREE.Vector3(
          Math.cos(ang) * (boreRadius - 0.4),
          y,
          Math.sin(ang) * (boreRadius - 0.4)
        ));
      }
      const threadCurve = new THREE.CatmullRomCurve3(threadPoints);
      const threadGeo = new THREE.TubeGeometry(threadCurve, totalSteps, 0.8, 8, false);
      const threadMesh = new THREE.Mesh(threadGeo, threadMat);
      portGroup.add(threadMesh);

      group.add(portGroup);
    });

    group.userData = { partType: 'axilock_threaded_hub' };
    return group;
  }

  /**
   * Create AXILOCK Dowel Male Threaded Stud Cap ("The Bolt Stud Cap")
   */
  createAxilockNutCollar(dowelDiameter = 22, connectorColor = 'axilock_connector_white') {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial(connectorColor || 'axilock_connector_white');
    const threadMat = this.materials.getMaterial('connector_stone_grey');

    const dowelRadius = dowelDiameter / 2;
    const collarOD = dowelRadius + 3.5; // 14.5mm radius = 29mm OD collar
    const collarLength = 14.0;
    const studRadius = dowelRadius + 1.0; // 12mm radius = 24mm OD male stud
    const studLength = 18.0;

    // 1. Male Threaded Stud pointing forward (y = 0 to y = studLength = 18mm)
    const studCylGeo = new THREE.CylinderGeometry(studRadius, studRadius, studLength, 24);
    const studCylMesh = new THREE.Mesh(studCylGeo, mat);
    studCylMesh.position.y = studLength / 2;
    group.add(studCylMesh);

    // Lead-in chamfer tip at front tip of stud (y = 0)
    const chamferGeo = new THREE.CylinderGeometry(studRadius - 1.5, studRadius, 1.5, 24);
    const chamferMesh = new THREE.Mesh(chamferGeo, mat);
    chamferMesh.position.y = 0.75;
    group.add(chamferMesh);

    // Smooth 3D Male ACME Thread Helix along stud (y = 2 to y = 16)
    const threadPoints = [];
    const turns = 4;
    const totalSteps = turns * 20;
    for (let j = 0; j <= totalSteps; j++) {
      const t = j / totalSteps;
      const ang = t * Math.PI * 2 * turns;
      const y = 2.0 + t * (studLength - 4.0);
      threadPoints.push(new THREE.Vector3(
        Math.cos(ang) * studRadius,
        y,
        Math.sin(ang) * studRadius
      ));
    }
    const threadCurve = new THREE.CatmullRomCurve3(threadPoints);
    const threadGeo = new THREE.TubeGeometry(threadCurve, totalSteps, 0.85, 8, false);
    const threadMesh = new THREE.Mesh(threadGeo, threadMat);
    group.add(threadMesh);

    // 2. Dowel Attachment Collar Sleeve (y = studLength to y = studLength + collarLength = 32mm)
    const shape = new THREE.Shape();
    shape.absarc(0, 0, collarOD, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, dowelRadius + 0.1, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings = { depth: collarLength, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 2 };
    const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const bodyMesh = new THREE.Mesh(bodyGeo, mat);
    bodyMesh.position.y = studLength;
    bodyMesh.rotation.x = -Math.PI / 2;
    group.add(bodyMesh);

    // 3. 24 Vertical Ergonomic Knurling Ribs around collar barrel
    const ribCount = 24;
    for (let i = 0; i < ribCount; i++) {
      const ang = (i / ribCount) * Math.PI * 2;
      const ribGeo = new THREE.CylinderGeometry(0.6, 0.6, collarLength - 2, 8);
      const ribMesh = new THREE.Mesh(ribGeo, mat);
      ribMesh.position.set(
        Math.cos(ang) * (collarOD + 0.2),
        studLength + collarLength / 2,
        Math.sin(ang) * (collarOD + 0.2)
      );
      group.add(ribMesh);
    }

    group.userData = { partType: 'axilock_nut_collar' };
    return group;
  }

  /**
   * Create AXILOCK M4 Screw
   */
  createAxilockM4Screw(length) {
    const group = new THREE.Group();
    const mat = this.materials.getMaterial('axilock_metal_brushed');
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    // Pan head
    const headCylGeo = new THREE.CylinderGeometry(3.5, 3.5, 1.5, 20);
    const headCylMesh = new THREE.Mesh(headCylGeo, mat);
    headCylMesh.position.y = length;
    group.add(headCylMesh);

    const headDomeGeo = new THREE.SphereGeometry(3.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const headDomeMesh = new THREE.Mesh(headDomeGeo, mat);
    headDomeMesh.position.y = length + 0.75;
    group.add(headDomeMesh);

    // Phillips drive
    const driveGeo = new THREE.BoxGeometry(4, 1, 1);
    const drive1 = new THREE.Mesh(driveGeo, darkMat);
    drive1.position.y = length + 1.25;
    group.add(drive1);
    const drive2 = new THREE.Mesh(driveGeo, darkMat);
    drive2.position.y = length + 1.25;
    drive2.rotation.y = Math.PI / 2;
    group.add(drive2);

    // Shank
    const shankGeo = new THREE.CylinderGeometry(1.5, 1.5, length - 2, 16);
    const shankMesh = new THREE.Mesh(shankGeo, mat);
    shankMesh.position.y = length / 2;
    group.add(shankMesh);

    // Tip
    const tipGeo = new THREE.ConeGeometry(1.5, 2, 16);
    const tipMesh = new THREE.Mesh(tipGeo, mat);
    tipMesh.position.y = 1;
    group.add(tipMesh);

    // Thread helix
    const helixPoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const angle = t * Math.PI * 2 * 10;
      const r = t > 0.9 ? 1.5 * (1 - (t - 0.9) * 10) : 1.5;
      helixPoints.push(new THREE.Vector3(Math.cos(angle) * r, (1 - t) * (length - 2) + 2, Math.sin(angle) * r));
    }
    const helixCurve = new THREE.CatmullRomCurve3(helixPoints);
    const helixGeo = new THREE.TubeGeometry(helixCurve, 100, 0.4, 8, false);
    const helixMesh = new THREE.Mesh(helixGeo, mat);
    group.add(helixMesh);

    group.userData = { partType: 'axilock_screw' };
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
        } else if (conn.openPorts && Object.values(conn.openPorts).some(v => v)) {
          mesh = this.create4WayCrossConnector(conn.diameter, conn.color, conn.openPorts, conn.cornerType);
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

    if (graph.axilockHubs) {
      for (const hub of graph.axilockHubs) {
        const dowelDia = hub.diameter !== undefined ? hub.diameter : (hub.dowelDiameter || 22);
        const colorMat = hub.color || hub.hubColor || 'axilock_hub_charcoal';
        const mesh = this.createAxilockHub(dowelDia, colorMat, hub.portConfig, hub.showCutaway);
        mesh.position.set(...hub.position);
        if (hub.rotation) {
          mesh.rotation.set(...hub.rotation);
        }
        mesh.userData.partId = hub.id;
        mesh.userData.partType = 'axilock_hub';
        mesh.name = hub.id;
        root.add(mesh);
      }
    }

    if (graph.axilockEndConnectors) {
      for (const conn of graph.axilockEndConnectors) {
        const dowelDia = conn.diameter !== undefined ? conn.diameter : (conn.dowelDiameter || 22);
        const colorMat = conn.color || conn.connectorColor || 'axilock_connector_white';
        const mesh = this.createAxilockEndConnector(dowelDia, colorMat, conn.tabColor, conn.showTabs);
        mesh.position.set(...conn.position);
        if (conn.rotation) {
          mesh.rotation.set(...conn.rotation);
        }
        mesh.userData.partId = conn.id;
        mesh.userData.partType = 'axilock_end_connector';
        mesh.name = conn.id;
        root.add(mesh);
      }
    }

    if (graph.axilockScrews) {
      for (const screw of graph.axilockScrews) {
        const mesh = this.createAxilockM4Screw(screw.length);
        mesh.position.set(...screw.position);
        if (screw.rotation) {
          mesh.rotation.set(...screw.rotation);
        }
        mesh.userData.partId = screw.id;
        mesh.userData.partType = 'axilock_screw';
        mesh.name = screw.id;
        root.add(mesh);
      }
    }

    if (graph.axilockThreadedHubs) {
      for (const hub of graph.axilockThreadedHubs) {
        const dowelDia = hub.diameter !== undefined ? hub.diameter : (hub.dowelDiameter || 22);
        const colorMat = hub.color || hub.hubColor || 'axilock_hub_charcoal';
        const mesh = this.createAxilockThreadedHub(dowelDia, colorMat, hub.portConfig);
        mesh.position.set(...hub.position);
        if (hub.rotation) {
          mesh.rotation.set(...hub.rotation);
        }
        mesh.userData.partId = hub.id;
        mesh.userData.partType = 'axilock_threaded_hub';
        mesh.name = hub.id;
        root.add(mesh);
      }
    }

    if (graph.axilockNutCollars) {
      for (const conn of graph.axilockNutCollars) {
        const dowelDia = conn.diameter !== undefined ? conn.diameter : (conn.dowelDiameter || 22);
        const colorMat = conn.color || conn.connectorColor || 'axilock_connector_white';
        const mesh = this.createAxilockNutCollar(dowelDia, colorMat);
        mesh.position.set(...conn.position);
        if (conn.rotation) {
          mesh.rotation.set(...conn.rotation);
        }
        mesh.userData.partId = conn.id;
        mesh.userData.partType = 'axilock_nut_collar';
        mesh.name = conn.id;
        root.add(mesh);
      }
    }

    return root;
  }
}
