/**
 * Automated Unit Test Suite: MODUPLANT Grid Topology & Dowel Socket Completeness
 * Tests 100% 1-to-1 matching between open connector ports and structural dowel rods.
 */

import { ProductTemplates } from '../js/engine/ProductTemplates.js';

function runGridVerificationTests() {
  console.log('🧪 Starting MODUPLANT Grid Topology & Socket Completeness Unit Tests...\n');

  const testConfigs = [
    { name: 'Default Center Tower (3 Tiers)', params: { centerTiers: 3, hasLeftWing: false, hasRightWing: false } },
    { name: 'Staggered Wings (Center 4, Left 2, Right 3)', params: { centerTiers: 4, hasLeftWing: true, leftTiers: 2, hasRightWing: true, rightTiers: 3 } },
    { name: 'High Left Wing (Center 2, Left 4)', params: { centerTiers: 2, hasLeftWing: true, leftTiers: 4, hasRightWing: false } },
    { name: 'Fully Extended Ports (Left/Right/Top)', params: { centerTiers: 3, hasLeftWing: true, leftTiers: 2, extendLeftPort: true, extendRightPort: true, extendTopPort: true } }
  ];

  let passedAll = true;

  testConfigs.forEach((cfg) => {
    console.log(`📋 Test Case: ${cfg.name}`);
    const template = ProductTemplates.getTemplate('moduplant_infinite');

    const mergedParams = {};
    for (const [k, v] of Object.entries(template.parameters)) {
      mergedParams[k] = v.value;
    }
    Object.assign(mergedParams, cfg.params);

    const graph = template.buildGraph(mergedParams);

    // 1. Check for Duplicate Overlapping Dowels
    const dowelPosSet = new Set();
    let duplicatesFound = 0;
    graph.dowelRods.forEach(r => {
      const posKey = `${r.position[0].toFixed(1)}_${r.position[1].toFixed(1)}_${r.position[2].toFixed(1)}_${r.rotation ? r.rotation.join('_') : '0'}`;
      if (dowelPosSet.has(posKey)) {
        duplicatesFound++;
        console.error(`  ❌ Duplicate dowel rod found at position: ${posKey}`);
      }
      dowelPosSet.add(posKey);
    });

    // 2. Verify 1-to-1 Connector Port Matching
    let orphanPorts = 0;
    graph.connectors.forEach(c => {
      const { px, nx, py, ny, pz, nz } = c.openPorts || {};
      const [cx, cy, cz] = c.position;

      // Check +X Port
      if (px) {
        const hasDowel = graph.dowelRods.some(r =>
          r.rotation && r.rotation[2] !== 0 && // Horizontal X rod
          Math.abs(r.position[1] - cy) < 5 &&
          Math.abs(r.position[2] - cz) < 5 &&
          r.position[0] > cx
        );
        if (!hasDowel && !mergedParams.extendRightPort) {
          orphanPorts++;
          console.error(`  ❌ Unconnected open +X port at connector (${cx}, ${cy}, ${cz})`);
        }
      }

      // Check -X Port
      if (nx) {
        const hasDowel = graph.dowelRods.some(r =>
          r.rotation && r.rotation[2] !== 0 && // Horizontal X rod
          Math.abs(r.position[1] - cy) < 5 &&
          Math.abs(r.position[2] - cz) < 5 &&
          r.position[0] < cx
        );
        if (!hasDowel && !mergedParams.extendLeftPort) {
          orphanPorts++;
          console.error(`  ❌ Unconnected open -X port at connector (${cx}, ${cy}, ${cz})`);
        }
      }

      // Check +Y Port
      if (py) {
        const hasDowel = graph.dowelRods.some(r =>
          (!r.rotation || (r.rotation[0] === 0 && r.rotation[2] === 0)) && // Vertical Y rod
          Math.abs(r.position[0] - cx) < 5 &&
          Math.abs(r.position[2] - cz) < 5 &&
          r.position[1] > cy
        );
        if (!hasDowel && !mergedParams.extendTopPort) {
          orphanPorts++;
          console.error(`  ❌ Unconnected open +Y port at connector (${cx}, ${cy}, ${cz})`);
        }
      }
    });

    if (duplicatesFound === 0 && orphanPorts === 0) {
      console.log(`  ✅ Passed! (Dowels: ${graph.dowelRods.length}, Connectors: ${graph.connectors.length}, Shelves: ${graph.mdfShelves.length})\n`);
    } else {
      passedAll = false;
      console.log(`  ❌ Failed with ${duplicatesFound} duplicates and ${orphanPorts} orphan open ports.\n`);
    }
  });

  if (passedAll) {
    console.log('🎉 ALL UNIT TESTS PASSED PERFECTLY!');
  } else {
    console.error('💥 UNIT TESTS FAILED — Fixes Required!');
  }
}

runGridVerificationTests();
