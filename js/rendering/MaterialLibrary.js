import * as THREE from 'three';

export class MaterialLibrary {
  constructor() {
    this.materials = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this._initMaterials();
  }

  _initMaterials() {
    // 1. Wood & MDF Finishes
    this.materials.set('beech_natural', new THREE.MeshStandardMaterial({
      color: 0xe2b988,
      roughness: 0.45,
      metalness: 0.02
    }));

    this.materials.set('mdf_natural', new THREE.MeshStandardMaterial({
      color: 0xc49a6c,
      roughness: 0.7,
      metalness: 0.02
    }));

    this.materials.set('mdf_black', new THREE.MeshStandardMaterial({
      color: 0x242426,
      roughness: 0.65,
      metalness: 0.05
    }));

    this.materials.set('walnut_stain', new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.6,
      metalness: 0.05
    }));

    this.materials.set('black_stain', new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7,
      metalness: 0.05
    }));

    this.materials.set('acacia', new THREE.MeshStandardMaterial({
      color: 0xba8c54,
      roughness: 0.55,
      metalness: 0.05
    }));

    this.materials.set('rubber_wood', new THREE.MeshStandardMaterial({
      color: 0xd9ac75,
      roughness: 0.5,
      metalness: 0.05
    }));

    // 2. 3D Printed PETG / ABS Connector Materials
    this.materials.set('connector_forest_green', new THREE.MeshStandardMaterial({
      color: 0x3b6635,
      roughness: 0.35,
      metalness: 0.1
    }));

    this.materials.set('connector_terracotta', new THREE.MeshStandardMaterial({
      color: 0xce5a37,
      roughness: 0.4,
      metalness: 0.1
    }));

    this.materials.set('connector_stone_grey', new THREE.MeshStandardMaterial({
      color: 0x787d85,
      roughness: 0.3,
      metalness: 0.15
    }));

    this.materials.set('connector_matte_black', new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,
      roughness: 0.45,
      metalness: 0.1
    }));

    this.materials.set('connector_white', new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.25,
      metalness: 0.05
    }));

    // 2b. AXILOCK Connector System Materials
    this.materials.set('axilock_hub_charcoal', new THREE.MeshStandardMaterial({
      color: 0x3a3d42,
      roughness: 0.35,
      metalness: 0.12
    }));

    this.materials.set('axilock_connector_white', new THREE.MeshStandardMaterial({
      color: 0xf2f0ed,
      roughness: 0.28,
      metalness: 0.06
    }));

    this.materials.set('axilock_tab_blue', new THREE.MeshStandardMaterial({
      color: 0x3b7dd8,
      roughness: 0.3,
      metalness: 0.15
    }));

    this.materials.set('axilock_ramp_orange', new THREE.MeshStandardMaterial({
      color: 0xe07830,
      roughness: 0.3,
      metalness: 0.15
    }));

    this.materials.set('axilock_metal_brushed', new THREE.MeshStandardMaterial({
      color: 0xc8c8c8,
      roughness: 0.2,
      metalness: 0.85
    }));

    // 3. Plant Pots & Foliage
    this.materials.set('ceramic_white', new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.2,
      metalness: 0.05
    }));

    this.materials.set('ceramic_terracotta', new THREE.MeshStandardMaterial({
      color: 0xbd5338,
      roughness: 0.6,
      metalness: 0.05
    }));

    this.materials.set('ceramic_charcoal', new THREE.MeshStandardMaterial({
      color: 0x2c3036,
      roughness: 0.4,
      metalness: 0.1
    }));

    this.materials.set('foliage_green', new THREE.MeshStandardMaterial({
      color: 0x2d8a4e,
      roughness: 0.6,
      metalness: 0.05
    }));

    // 4. Legacy Spice Rack Materials
    this.materials.set('glass_jar', new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 1.2
    }));

    this.materials.set('cork_stopper', new THREE.MeshStandardMaterial({
      color: 0xb58855,
      roughness: 0.8,
      metalness: 0.0
    }));

    this.materials.set('metal_cap', new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      roughness: 0.2,
      metalness: 0.8
    }));

    this.materials.set('spice_paprika', new THREE.MeshStandardMaterial({ color: 0xb52414, roughness: 0.8 }));
    this.materials.set('spice_turmeric', new THREE.MeshStandardMaterial({ color: 0xdb9d14, roughness: 0.8 }));
    this.materials.set('spice_oregano', new THREE.MeshStandardMaterial({ color: 0x485828, roughness: 0.9 }));
    this.materials.set('spice_cumin', new THREE.MeshStandardMaterial({ color: 0x8a7048, roughness: 0.85 }));
    this.materials.set('spice_coriander', new THREE.MeshStandardMaterial({ color: 0x9a8550, roughness: 0.85 }));
    this.materials.set('spice_cinnamon', new THREE.MeshStandardMaterial({ color: 0x7a3c20, roughness: 0.8 }));
    this.materials.set('spice_chili', new THREE.MeshStandardMaterial({ color: 0x881408, roughness: 0.85 }));
    this.materials.set('spice_tandoori', new THREE.MeshStandardMaterial({ color: 0xc43c14, roughness: 0.8 }));
  }

  getMaterial(name) {
    return this.materials.get(name) || this.materials.get('beech_natural');
  }

  createLabelTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}
