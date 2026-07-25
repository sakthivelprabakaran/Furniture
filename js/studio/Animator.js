import * as THREE from 'three';

export class Animator {
  constructor() {
    this._productGroup = null;
    this._originalPositions = new Map();
    this._explodedPositions = new Map();
    this._isExploded = false;
    this._isAnimating = false;
    this._animationProgress = 0;
    this._animationDuration = 900; // ms
    this._animationStart = 0;
    this._onProgress = null;
  }

  setProductGroup(productGroup, graph) {
    this._productGroup = productGroup;
    this._originalPositions.clear();
    this._explodedPositions.clear();
    this._isExploded = false;
    this._animationProgress = 0;

    if (!productGroup || !graph) return;

    const box = new THREE.Box3().setFromObject(productGroup);
    const center = box.getCenter(new THREE.Vector3());

    productGroup.children.forEach((child) => {
      const partId = child.userData?.partId;
      if (!partId) return;

      const original = child.position.clone();
      this._originalPositions.set(partId, original);

      const exploded = original.clone();

      if (partId.startsWith('conn_')) {
        // 3D Printed Connectors explode radially outward
        const dir = original.clone().sub(center);
        if (dir.length() < 0.001) dir.set(0, 1, 0);
        dir.normalize();
        exploded.add(dir.multiplyScalar(120));
      } else if (partId.startsWith('rod_v_')) {
        // Vertical Dowel Legs drop slightly or float up
        exploded.y += (original.y > center.y ? 40 : -40);
      } else if (partId.startsWith('slat_')) {
        // Slatted Dowel Platforms float upward
        exploded.y += 60;
      } else if (partId.startsWith('plant_pot_')) {
        // Plant pots float high up
        exploded.y += 140;
      } else if (partId.startsWith('pin_')) {
        // Wooden Cross-Pins slide out horizontally
        exploded.z += 150;
      } else if (partId.startsWith('collar_')) {
        const isTopCollar = partId.endsWith('tier3');
        const isMidCollar = partId.endsWith('tier2');
        exploded.y += isTopCollar ? 140 : (isMidCollar ? 70 : -15);
      } else if (partId.startsWith('top_peg_')) {
        exploded.y += 280;
      } else if (partId === 'shelf_top') {
        exploded.y += 200;
      } else if (partId === 'shelf_middle') {
        exploded.y += 95;
      } else if (partId === 'shelf_bottom') {
        exploded.y -= 25;
      } else if (partId.startsWith('pillar_')) {
        const dx = original.x > center.x ? 140 : -140;
        const dz = original.z > center.z ? 120 : -120;
        exploded.x += dx;
        exploded.z += dz;
      } else if (partId.startsWith('guard_rail_')) {
        exploded.z -= 160;
      } else if (partId.startsWith('jar_')) {
        const isMid = partId.startsWith('jar_mid');
        exploded.z -= 180;
        exploded.y += isMid ? 120 : 45;
      } else {
        const dir = original.clone().sub(center);
        if (dir.length() < 0.001) dir.set(0, 1, 0);
        dir.normalize();
        exploded.add(dir.multiplyScalar(100));
      }

      this._explodedPositions.set(partId, exploded);
    });
  }

  toggle() {
    if (this._isAnimating) return;
    this._isExploded ? this.assemble() : this.explode();
  }

  explode() {
    if (this._isAnimating || this._isExploded) return;
    this._startAnimation(true);
  }

  assemble() {
    if (this._isAnimating || !this._isExploded) return;
    this._startAnimation(false);
  }

  setProgress(t) {
    this._animationProgress = Math.max(0, Math.min(1, t));
    this._isExploded = t > 0.5;
    this._applyPositions(this._animationProgress);
  }

  reset() {
    this._isExploded = false;
    this._isAnimating = false;
    this._animationProgress = 0;
    this._applyPositions(0);
  }

  get isExploded() { return this._isExploded; }
  get isAnimating() { return this._isAnimating; }
  get progress() { return this._animationProgress; }

  onProgress(cb) {
    this._onProgress = cb;
  }

  update(time) {
    if (!this._isAnimating) return;

    const elapsed = time - this._animationStart;
    const rawProgress = Math.min(elapsed / this._animationDuration, 1);

    const eased = rawProgress < 0.5
      ? 4 * rawProgress * rawProgress * rawProgress
      : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

    this._animationProgress = this._targetExploded ? eased : 1 - eased;
    this._applyPositions(this._animationProgress);

    if (this._onProgress) {
      this._onProgress(this._animationProgress);
    }

    if (rawProgress >= 1) {
      this._isAnimating = false;
      this._isExploded = this._targetExploded;
    }
  }

  _startAnimation(toExploded) {
    this._isAnimating = true;
    this._targetExploded = toExploded;
    this._animationStart = performance.now();
  }

  _applyPositions(t) {
    if (!this._productGroup) return;

    this._productGroup.children.forEach((child) => {
      const partId = child.userData?.partId;
      if (!partId) return;

      const original = this._originalPositions.get(partId);
      const exploded = this._explodedPositions.get(partId);
      if (!original || !exploded) return;

      child.position.lerpVectors(original, exploded, t);
    });
  }
}
