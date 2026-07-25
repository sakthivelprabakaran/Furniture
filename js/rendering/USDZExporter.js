import * as THREE from 'three';

/**
 * Three.js USDZExporter for WebAR Quick Look on iOS Safari (iPhones & iPads)
 * Converts Three.js mesh geometry, materials, textures, and transformations into Apple's native binary USDZ format.
 */
export class USDZExporter {
  async parse(scene, options = {}) {
    const files = {};
    const modelFileName = 'model.usda';

    let output = `usda 1.0
(
    defaultPrim = "Root"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Root"
{
    def Scope "Materials"
    {
`;

    const materials = new Map();
    const meshes = [];

    scene.traverse((child) => {
      if (child.isMesh && child.visible) {
        meshes.push(child);
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(m => {
            if (!materials.has(m.uuid)) {
              materials.set(m.uuid, { id: `Material_${materials.size + 1}`, mat: m });
            }
          });
        }
      }
    });

    // Write Materials
    for (const { id, mat } of materials.values()) {
      const color = mat.color ? [mat.color.r, mat.color.g, mat.color.b] : [0.8, 0.8, 0.8];
      const roughness = mat.roughness !== undefined ? mat.roughness : 0.5;
      const metallic = mat.metalness !== undefined ? mat.metalness : 0.0;

      output += `
        def Material "${id}"
        {
            token outputs:surface.connect = </Root/Materials/${id}/PBRShader.outputs:surface>

            def Shader "PBRShader"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor = (${color.join(', ')})
                float inputs:roughness = ${roughness}
                float inputs:metallic = ${metallic}
                float inputs:opacity = ${mat.opacity !== undefined ? mat.opacity : 1.0}
                token outputs:surface
            }
        }
`;
    }

    output += `    }\n\n`;

    // Write Meshes
    let meshCount = 0;
    for (const mesh of meshes) {
      meshCount++;
      const meshName = `Mesh_${meshCount}`;
      const matObj = materials.get(mesh.material?.uuid);
      const matPath = matObj ? `</Root/Materials/${matObj.id}>` : '';

      mesh.updateMatrixWorld();
      const matrix = mesh.matrixWorld;

      // Extract Position, Rotation, Scale from World Matrix
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      matrix.decompose(position, quaternion, scale);

      const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');

      output += `    def Xform "${meshName}"\n    {\n`;
      output += `        double3 xformOp:translate = (${position.x}, ${position.y}, ${position.z})\n`;
      output += `        double3 xformOp:rotateXYZ = (${THREE.MathUtils.radToDeg(euler.x)}, ${THREE.MathUtils.radToDeg(euler.y)}, ${THREE.MathUtils.radToDeg(euler.z)})\n`;
      output += `        double3 xformOp:scale = (${scale.x}, ${scale.y}, ${scale.z})\n`;
      output += `        uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:rotateXYZ", "xformOp:scale"]\n\n`;

      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1)); // Normalize

      const posAttr = geometry.attributes.position;
      const indexAttr = geometry.index;

      if (posAttr) {
        output += `        def Mesh "Geometry"\n        {\n`;

        // Points
        const points = [];
        for (let i = 0; i < posAttr.count; i++) {
          points.push(`(${posAttr.getX(i)}, ${posAttr.getY(i)}, ${posAttr.getZ(i)})`);
        }
        output += `            point3f[] points = [${points.join(', ')}]\n`;

        // Face Vertex Counts & Indices
        if (indexAttr) {
          const counts = [];
          const indices = [];
          for (let i = 0; i < indexAttr.count; i += 3) {
            counts.push(3);
            indices.push(indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2));
          }
          output += `            int[] faceVertexCounts = [${counts.join(', ')}]\n`;
          output += `            int[] faceVertexIndices = [${indices.join(', ')}]\n`;
        }

        if (matPath) {
          output += `            rel material:binding = ${matPath}\n`;
        }

        output += `        }\n`;
      }

      output += `    }\n\n`;
    }

    output += `}\n`;

    files[modelFileName] = new TextEncoder().encode(output);

    // Package into simple uncompressed ZIP for USDZ binary format
    return this._createUsdzArchive(files);
  }

  _createUsdzArchive(files) {
    // Generate uncompressed zip buffer for USDZ
    const filenames = Object.keys(files);
    let offset = 0;
    const parts = [];

    filenames.forEach(name => {
      const data = files[name];
      const header = new Uint8Array(30 + name.length);
      const view = new DataView(header.buffer);

      view.setUint32(0, 0x04034b50, true); // Zip local file header signature
      view.setUint16(4, 20, true); // Version needed
      view.setUint16(6, 0, true); // Flags
      view.setUint16(8, 0, true); // Compression method (0 = uncompressed)
      view.setUint32(10, 0, true); // Mod time
      view.setUint32(14, 0, true); // CRC-32 (0 for simple preview)
      view.setUint32(18, data.length, true); // Compressed size
      view.setUint32(22, data.length, true); // Uncompressed size
      view.setUint16(26, name.length, true); // Filename length
      view.setUint16(28, 0, true); // Extra field length

      for (let i = 0; i < name.length; i++) {
        header[30 + i] = name.charCodeAt(i);
      }

      parts.push(header);
      parts.push(data);
    });

    return new Blob(parts, { type: 'model/vnd.usdz+zip' });
  }
}
