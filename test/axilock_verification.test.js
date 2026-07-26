/**
 * Automated Unit Test Suite: AXILOCK Visualizer System Verification
 * Verifies hub node generation, end connector counts, M4 screw counts, port configuration, and multi-diameter support.
 */

import { ProductTemplates } from '../js/engine/ProductTemplates.js';

function testAxilockSystem() {
  console.log('🧪 Running AXILOCK Visualizer Automated Unit Test Suite...\n');

  const template = ProductTemplates.getTemplate('axilock_visualizer');
  let passedAll = true;

  if (!template || template.id !== 'axilock_visualizer') {
    console.error('❌ FAILED: Could not load axilock_visualizer product template!');
    process.exit(1);
  }

  function buildGraph(params) {
    const mergedParams = {};
    for (const [k, v] of Object.entries(template.parameters)) {
      mergedParams[k] = v.value;
    }
    Object.assign(mergedParams, params);
    return template.buildGraph(mergedParams);
  }

  // -------------------------------------------------------------
  // TEST 1: 4-Way Port Configuration (Default)
  // -------------------------------------------------------------
  console.log('📋 Test 1: Default 4-Way Port Hub Configuration');
  const g1 = buildGraph({ hubPorts: 4, dowelDiameter: 22 });

  if (g1.axilockHubs.length !== 1) {
    console.error(`  ❌ FAILED: Expected 1 hub, found ${g1.axilockHubs.length}`);
    passedAll = false;
  } else {
    console.log('  ✅ Central AXILOCK Hub exists.');
  }

  if (g1.axilockEndConnectors.length !== 4) {
    console.error(`  ❌ FAILED: Expected 4 end connectors, found ${g1.axilockEndConnectors.length}`);
    passedAll = false;
  } else {
    console.log('  ✅ End connector count matches active ports (4 connectors).');
  }

  if (g1.dowelRods.length !== 4) {
    console.error(`  ❌ FAILED: Expected 4 dowel rods, found ${g1.dowelRods.length}`);
    passedAll = false;
  } else {
    console.log('  ✅ Dowel rod count matches active ports (4 dowels).');
  }

  if (g1.axilockScrews.length !== 4) {
    console.error(`  ❌ FAILED: Expected 4 screws, found ${g1.axilockScrews.length}`);
    passedAll = false;
  } else {
    console.log('  ✅ Screw count matches active ports (4 screws).');
  }

  // -------------------------------------------------------------
  // TEST 2: 6-Way Port Configuration (Full Node)
  // -------------------------------------------------------------
  console.log('\n📋 Test 2: Full 6-Way Port Hub Configuration');
  const g2 = buildGraph({ hubPorts: 6, dowelDiameter: 25 });

  if (g2.axilockEndConnectors.length !== 6 || g2.dowelRods.length !== 6 || g2.axilockScrews.length !== 6) {
    console.error(`  ❌ FAILED: 6-way config count mismatch! Connectors: ${g2.axilockEndConnectors.length}, Dowels: ${g2.dowelRods.length}, Screws: ${g2.axilockScrews.length}`);
    passedAll = false;
  } else {
    console.log('  ✅ 6-Way full node generates exact component counts (6 connectors, 6 dowels, 6 screws).');
  }

  // -------------------------------------------------------------
  // TEST 3: Multi-Diameter Support (Ø18mm, Ø22mm, Ø25mm)
  // -------------------------------------------------------------
  console.log('\n📋 Test 3: Multi-Diameter Parameter Support');
  [18, 22, 25].forEach(dia => {
    const gDia = buildGraph({ hubPorts: 3, dowelDiameter: dia });
    if (gDia.axilockHubs[0].diameter === dia && gDia.axilockEndConnectors[0].diameter === dia) {
      console.log(`  ✅ Ø${dia}mm dowel diameter correctly propagated to hub and connectors.`);
    } else {
      console.error(`  ❌ FAILED: Ø${dia}mm parameter propagation failed!`);
      passedAll = false;
    }
  });

  console.log('\n---------------------------------------------------');
  if (passedAll) {
    console.log('🎉 ALL AXILOCK SYSTEM TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
}

testAxilockSystem();
