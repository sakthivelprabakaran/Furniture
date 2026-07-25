import { ProductTemplates } from './ProductTemplates.js';

export class ParametricEngine {
  constructor() {
    this._currentProduct = null;
    this._parameters = {};
    this._graph = null;
    this._bom = null;
    this._listeners = [];
  }

  loadProduct(productId) {
    const template = ProductTemplates.getTemplate(productId);
    if (!template) return;

    this._currentProduct = template;
    this._parameters = {};

    for (const [key, spec] of Object.entries(template.parameters)) {
      this._parameters[key] = spec.value;
    }

    this._rebuild();
  }

  setParameter(key, value) {
    if (this._parameters[key] !== undefined) {
      this._parameters[key] = value;
      this._rebuild();
    }
  }

  getParameter(key) {
    return this._parameters[key];
  }

  getAllParameters() {
    if (!this._currentProduct) return {};
    const result = {};
    for (const [key, spec] of Object.entries(this._currentProduct.parameters)) {
      result[key] = {
        ...spec,
        value: this._parameters[key] ?? spec.value
      };
    }
    return result;
  }

  getGraph() {
    return this._graph;
  }

  getBOM() {
    return this._bom;
  }

  onChange(callback) {
    this._listeners.push(callback);
  }

  _rebuild() {
    if (!this._currentProduct) return;

    this._graph = this._currentProduct.buildGraph(this._parameters);
    this._computeBOM();

    for (const listener of this._listeners) {
      listener(this._graph, this._bom);
    }
  }

  _computeBOM() {
    if (!this._graph) return;

    const bom = {
      dowelRods: [],
      mdfShelves: [],
      connectors: [],
      plantPots: [],
      panels: [],
      pillars: [],
      collars: [],
      pins: [],
      guardRails: [],
      topPegs: [],
      jars: [],
      totalParts: 0
    };

    // 1. MODUPLANT System Dowel Cut List
    if (this._graph.dowelRods) {
      const rodMap = new Map();
      this._graph.dowelRods.forEach(r => {
        const key = `Ø${r.diameter}mm x ${Math.round(r.length)}mm`;
        rodMap.set(key, (rodMap.get(key) || 0) + 1);
      });

      for (const [spec, count] of rodMap.entries()) {
        bom.dowelRods.push({
          name: `${(this._parameters.woodFinish || 'beech').replace('_', ' ').toUpperCase()} Structural Outer Dowels`,
          spec: spec,
          count: count
        });
      }
    }

    // 2. MDF Shelf Panels
    if (this._graph.mdfShelves) {
      bom.mdfShelves.push({
        name: 'MDF / Wood Shelf Insert Panels',
        spec: `${Math.round(this._graph.mdfShelves[0]?.width || 300)}x${Math.round(this._graph.mdfShelves[0]?.depth || 300)}x12mm`,
        count: this._graph.mdfShelves.length
      });
    }

    // 3. MODUPLANT System Practical 3D Printed Connectors
    if (this._graph.connectors) {
      const connMap = new Map();
      this._graph.connectors.forEach(c => {
        const typeName = c.type === '3way' ? '3-Way Corner Joint' : (c.type === '4way' ? '4-Way Cross Joint' : (c.type === '5way' ? '5-Way Hub Joint' : 'End Cap Foot'));
        const key = `Practical 3D Printed ${typeName} (Ø${c.diameter}mm Socket)`;
        connMap.set(key, (connMap.get(key) || 0) + 1);
      });

      for (const [name, count] of connMap.entries()) {
        bom.connectors.push({
          name: name,
          spec: `${(this._parameters.connectorColor || 'green').replace('connector_', '').toUpperCase()} PETG/ABS`,
          count: count
        });
      }
    }

    // 4. Ceramic Plant Pots
    if (this._graph.plantPots) {
      bom.plantPots.push({
        name: 'Ceramic Plant Pots with Foliage',
        spec: 'Ø70mm x 60mm Height',
        count: this._graph.plantPots.length
      });
    }

    // 5. Legacy Spice Rack Nodes
    if (this._graph.panels) {
      bom.panels.push({
        name: `${(this._parameters.woodMaterial || 'acacia').replace('_', ' ').toUpperCase()} Solid Wood Shelves`,
        spec: `${this._parameters.width}x${this._parameters.depth}x${this._parameters.panelThickness}mm (4 Corner Holes)`,
        count: this._graph.panels.length
      });
    }

    if (this._graph.pillars) {
      bom.pillars.push({
        name: 'Continuous Turned Wood Pillars with Cross-Pin Holes',
        spec: `Ø${this._parameters.dowelDiameter || 16}mm x ${this._graph.pillars[0]?.height || 280}mm`,
        count: this._graph.pillars.length
      });
    }

    if (this._graph.collars) {
      bom.collars.push({
        name: 'Separate Turned Wood Support Collars',
        spec: `Ø${(this._parameters.dowelDiameter || 16) + 9}mm Outer Collar`,
        count: this._graph.collars.length
      });
    }

    if (this._graph.pins) {
      bom.pins.push({
        name: 'Wooden Cross-Pin Locking Keys (Toolless Lock)',
        spec: `Ø4.8mm x ${(this._parameters.dowelDiameter || 16) + 12}mm`,
        count: this._graph.pins.length
      });
    }

    if (this._graph.guardRails) {
      bom.guardRails.push({
        name: 'Front Wooden Guard Rails',
        spec: `Ø${Math.round((this._parameters.dowelDiameter || 16) * 0.65)}mm`,
        count: this._graph.guardRails.length
      });
    }

    if (this._graph.topPegs) {
      bom.topPegs.push({
        name: 'Top Wooden Finial Locking Pegs',
        spec: `Ø${this._parameters.dowelDiameter || 16}mm`,
        count: this._graph.topPegs.length
      });
    }

    if (this._graph.jars) {
      bom.jars.push({
        name: 'Glass Spice Jars with Chalkboard Labels',
        spec: '17x54mm',
        count: this._graph.jars.length
      });
    }

    bom.totalParts = (this._graph.dowelRods?.length || 0) +
                     (this._graph.mdfShelves?.length || 0) +
                     (this._graph.connectors?.length || 0) +
                     (this._graph.plantPots?.length || 0) +
                     (this._graph.panels?.length || 0) +
                     (this._graph.pillars?.length || 0) +
                     (this._graph.collars?.length || 0) +
                     (this._graph.pins?.length || 0) +
                     (this._graph.guardRails?.length || 0) +
                     (this._graph.topPegs?.length || 0) +
                     (this._graph.jars?.length || 0);

    this._bom = bom;
  }
}
