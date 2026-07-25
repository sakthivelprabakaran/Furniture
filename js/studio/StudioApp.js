import { ParametricEngine } from '../engine/ParametricEngine.js';
import { SceneManager } from '../rendering/SceneManager.js';
import { MeshFactory } from '../rendering/MeshFactory.js';
import { MaterialLibrary } from '../rendering/MaterialLibrary.js';
import { UIController } from './UIController.js';
import { Animator } from './Animator.js';
import { DrawingExporter } from './DrawingExporter.js';
import { ARController } from './ARController.js';

class StudioApp {
  constructor() {
    this.engine = new ParametricEngine();
    this.materials = new MaterialLibrary();
    this.meshFactory = new MeshFactory(this.materials);
    this.scene = null;
    this.ui = new UIController();
    this.animator = new Animator();
    this.exporter = new DrawingExporter(this.engine);
    this.arController = new ARController();

    this._init();
  }

  _init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._setup());
    } else {
      this._setup();
    }
  }

  _setup() {
    const viewport = document.getElementById('viewport');
    if (!viewport) {
      console.error('StudioApp: #viewport element not found');
      return;
    }
    this.scene = new SceneManager(viewport);

    // Load MODUPLANT Modular Plant Stand as default model!
    this.engine.loadProduct('moduplant_infinite');

    // Initialize UI bindings
    this.ui.init(this.engine, {
      onParameterChange: (key, value) => this._updateParameter(key, value),
      onProductSwitch: (productId) => this._switchProduct(productId),
      onExplodeToggle: () => this._toggleExplode(),
      onResetCamera: () => this.scene.resetCamera(),
      onAnimSliderChange: (progress) => this._onAnimSlider(progress),
      onExportDrawing: () => this._showBlueprintModal(),
      onLaunchAR: () => this.arController.launchAR(this.scene.getProductGroup())
    });

    // Rebuild initial 3D model
    this._rebuildScene();
    this.ui.updateParameters();

    // Listen for animator updates
    this.animator.onProgress((progress) => {
      this.ui.setExplodeState(this.animator.isExploded, progress);
    });

    // Engine change listener
    this.engine.onChange((graph, bom) => {
      this.ui.updateBOM(bom);
    });

    // Raycast hover listener
    this.scene.onHover((userData) => {
      this.ui.showPartInfo(userData);
    });

    // Start animation loop
    this._animationLoop();

    console.log('🪵 Achuva 3D Preview Engine: MODUPLANT System Loaded');
  }

  _switchProduct(productId) {
    this.engine.loadProduct(productId);
    this._rebuildScene();
    this.ui.updateParameters();
    this.scene.resetCamera();
  }

  _updateParameter(key, value) {
    this.engine.setParameter(key, value);
    this._rebuildScene();
  }

  _rebuildScene() {
    const graph = this.engine.getGraph();
    if (!graph) return;

    // Build 3D mesh hierarchy
    const productGroup = this.meshFactory.buildFromGraph(graph);

    // Add to Three.js scene
    this.scene.setProductGroup(productGroup);

    // Configure animation positions
    this.animator.setProductGroup(productGroup, graph);

    // Update BOM in UI
    const bom = this.engine.getBOM();
    this.ui.updateBOM(bom);
  }

  _toggleExplode() {
    this.animator.toggle();
  }

  _onAnimSlider(progress) {
    this.animator.setProgress(progress);
    this.ui.setExplodeState(progress > 0.5, progress);
  }

  _showBlueprintModal() {
    const container = document.getElementById('blueprint-modal-container');
    if (!container) return;

    container.innerHTML = this.exporter.renderBlueprintModal();

    const closeBtn = document.getElementById('btn-close-blueprint');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        container.innerHTML = '';
      });
    }
  }

  _animationLoop() {
    const loop = (time) => {
      requestAnimationFrame(loop);
      this.animator.update(time);
    };
    requestAnimationFrame(loop);
  }
}

const app = new StudioApp();
export default app;
