import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  constructor(containerElement) {
    this._container = containerElement;
    this._scene = new THREE.Scene();
    this._camera = null;
    this._renderer = null;
    this._controls = null;
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._productGroup = null;
    this._hoverCallback = null;

    this._init();
  }

  _init() {
    const aspect = this._container.clientWidth / this._container.clientHeight;
    this._camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 100);
    this._camera.position.set(2.8, 2.2, 3.2);

    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(this._container.clientWidth, this._container.clientHeight);
    this._theme = 'light';
    this._renderer.setClearColor(0xf0f2f5);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.25;
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._container.appendChild(this._renderer.domElement);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.06;
    this._controls.minDistance = 0.4;
    this._controls.maxDistance = 12;
    this._controls.maxPolarAngle = Math.PI * 0.85;
    this._controls.target.set(0, 0.45, 0);

    this._setupLighting();
    this._setupGround();

    this._onResize = () => this.resize();
    this._onMouseMove = (e) => this._handleMouseMove(e);
    window.addEventListener('resize', this._onResize);
    this._container.addEventListener('mousemove', this._onMouseMove);

    this._animate();
  }

  _setupLighting() {
    // Ambient soft warmth
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.65));

    // Key Light (warm studio spotlight from top-left front)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    keyLight.position.set(-3.5, 6, 4.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0008;
    this._scene.add(keyLight);

    // Fill Light (cool fill from right)
    const fillLight = new THREE.DirectionalLight(0xdbe9ff, 0.6);
    fillLight.position.set(4.5, 3.5, -2.5);
    this._scene.add(fillLight);

    // Rim Light (back highlights)
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    rimLight.position.set(0, 3.5, -5);
    this._scene.add(rimLight);

    // Soft Hemisphere
    this._scene.add(new THREE.HemisphereLight(0xffffff, 0xd0d4dc, 0.45));
  }

  _setupGround() {
    // Ground Shadow Catcher
    const groundGeo = new THREE.PlaneGeometry(25, 25);
    this._groundMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const ground = new THREE.Mesh(groundGeo, this._groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.005;
    ground.receiveShadow = true;
    this._scene.add(ground);

    // Modern Subtle Grid
    this._grid = new THREE.GridHelper(10, 50, 0xadb5bd, 0xdee2e6);
    this._grid.material.opacity = 0.4;
    this._grid.material.transparent = true;
    this._scene.add(this._grid);
  }

  setTheme(themeName) {
    this._theme = themeName;
    if (themeName === 'dark') {
      this._renderer.setClearColor(0x0c0d14);
      if (this._groundMat) this._groundMat.opacity = 0.35;
      if (this._grid) {
        this._scene.remove(this._grid);
        this._grid = new THREE.GridHelper(10, 50, 0x333348, 0x181824);
        this._grid.material.opacity = 0.25;
        this._grid.material.transparent = true;
        this._scene.add(this._grid);
      }
    } else {
      this._renderer.setClearColor(0xf0f2f5);
      if (this._groundMat) this._groundMat.opacity = 0.18;
      if (this._grid) {
        this._scene.remove(this._grid);
        this._grid = new THREE.GridHelper(10, 50, 0xadb5bd, 0xdee2e6);
        this._grid.material.opacity = 0.4;
        this._grid.material.transparent = true;
        this._scene.add(this._grid);
      }
    }
  }

  setProductGroup(group) {
    if (this._productGroup) {
      this._scene.remove(this._productGroup);
    }
    this._productGroup = group;

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this._scene.add(group);
    this._fitCameraToGroup(group);
  }

  _fitCameraToGroup(group) {
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.2;

    this._controls.target.copy(center);
    this._camera.position.set(
      center.x + distance * 0.7,
      center.y + distance * 0.5,
      center.z + distance * 0.7
    );
    this._controls.update();
  }

  resetCamera() {
    if (this._productGroup) this._fitCameraToGroup(this._productGroup);
  }

  onHover(callback) {
    this._hoverCallback = callback;
  }

  _handleMouseMove(event) {
    const rect = this._container.getBoundingClientRect();
    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (this._productGroup && this._hoverCallback) {
      this._raycaster.setFromCamera(this._mouse, this._camera);
      const intersects = this._raycaster.intersectObjects(this._productGroup.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData?.partId) obj = obj.parent;
        this._hoverCallback(obj?.userData || null);
      } else {
        this._hoverCallback(null);
      }
    }
  }

  getProductGroup() { return this._productGroup; }
  getScene() { return this._scene; }
  getCamera() { return this._camera; }
  getRenderer() { return this._renderer; }
  getControls() { return this._controls; }

  resize() {
    const w = this._container.clientWidth;
    const h = this._container.clientHeight;
    if (w === 0 || h === 0) return;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this._controls.update();
    this._renderer.render(this._scene, this._camera);
  }
}
