/**
 * Automated Unit Test Suite: MODUWALL Connection & Port Logic Verification
 * Verifies exact 1-to-1 node-to-dowel connection counts, port capping, wall flange anchors, and shelf placement.
 */

import { ProductTemplates } from '../js/engine/ProductTemplates.js';

function testModuwallConnections() {
  console.log('🧪 Running MODUWALL Automated Connection Unit Test Suite...\n');

  const template = ProductTemplates.getTemplate('moduwall_system');
  let passedAll = true;

  function buildGraph(params) {
    const mergedParams = {};
    for (const [k, v] of Object.entries(template.parameters)) {
      mergedParams[k] = v.value;
    }
    Object.assign(mergedParams, params);
    return template.buildGraph(mergedParams);
  }

  // -------------------------------------------------------------
  // TEST 1: Grid Dimension 3 Columns x 3 Rows
  // -------------------------------------------------------------
  console.log('📋 Test 1: Grid Dimensions (3 Bays Wide x 3 Rows High)');
  const g1 = buildGraph({ gridColumns: 3, gridRows: 3, bayWidth: 340, bayHeight: 300, rackDepth: 180 });

  // 1.1 Check Wall Connector Count
  const expectedWallConnectors = (3 + 1) * (3 + 1); // 4 cols * 4 rows = 16 wall connectors
  if (g1.wallConnectors.length !== expectedWallConnectors) {
    console.error(`  ❌ FAILED: Expected ${expectedWallConnectors} wall connectors, found ${g1.wallConnectors.length}`);
    passedAll = false;
  } else {
    console.log(`  ✅ 3D Wall-Mount Connector Count is exact (${expectedWallConnectors} connectors).`);
  }

  // 1.2 Check Front Connector Count
  const expectedConnectors = (3 + 1) * 3; // 4 cols * 3 active row nodes = 12 connectors
  if (g1.connectors.length !== expectedConnectors) {
    console.error(`  ❌ FAILED: Expected ${expectedConnectors} front connectors, found ${g1.connectors.length}`);
    passedAll = false;
  } else {
    console.log(`  ✅ Front 3D Joint Connector Count is exact (${expectedConnectors} connectors).`);
  }

  // 1.3 Check Floating Shelf Count
  const expectedShelves = 3 * 3; // 9 shelves
  if (g1.mdfShelves.length !== expectedShelves) {
    console.error(`  ❌ FAILED: Expected ${expectedShelves} MDF shelves, found ${g1.mdfShelves.length}`);
    passedAll = false;
  } else {
    console.log(`  ✅ MDF Shelf Count is exact (${expectedShelves} shelves).`);
  }

  // -------------------------------------------------------------
  // TEST 2: Port Capping Logic on Boundary Nodes
  // -------------------------------------------------------------
  console.log('\n📋 Test 2: Boundary Port Capping Logic');

  // Check 2.1: Top-Left Front Connector (c=0, r=3, x=0, y=900, z=180)
  const topLeftConn = g1.connectors.find(c => Math.abs(c.position[0] - 0) < 5 && Math.abs(c.position[1] - 900) < 5 && Math.abs(c.position[2] - 180) < 5);
  if (!topLeftConn) {
    console.error('  ❌ FAILED: Top-Left Front Connector not found!');
    passedAll = false;
  } else {
    // Left boundary: -X port MUST be capped!
    if (topLeftConn.openPorts.nx) {
      console.error('  ❌ FAILED: Top-Left Connector (-X) should be CAPPED on outer left boundary!');
      passedAll = false;
    } else {
      console.log('  ✅ Top-Left Connector (-X port) is CAPPED correctly.');
    }

    // Top boundary: +Y port MUST be capped!
    if (topLeftConn.openPorts.py) {
      console.error('  ❌ FAILED: Top-Left Connector (+Y) should be CAPPED on top row!');
      passedAll = false;
    } else {
      console.log('  ✅ Top-Left Connector (+Y port) is CAPPED correctly.');
    }

    // Front boundary: +Z port MUST be capped!
    if (topLeftConn.openPorts.pz) {
      console.error('  ❌ FAILED: Top-Left Connector (+Z) should be CAPPED!');
      passedAll = false;
    } else {
      console.log('  ✅ Top-Left Connector (+Z port) is CAPPED correctly.');
    }
  }

  // Check 2.2: Center Intermediate Connector (c=1, r=2, x=340, y=600, z=180)
  const centerConn = g1.connectors.find(c => Math.abs(c.position[0] - 340) < 5 && Math.abs(c.position[1] - 600) < 5 && Math.abs(c.position[2] - 180) < 5);
  if (!centerConn) {
    console.error('  ❌ FAILED: Center Intermediate Connector not found!');
    passedAll = false;
  } else {
    // Intermediate node: +X, -X, +Y, -Y must be OPEN!
    if (!centerConn.openPorts.px || !centerConn.openPorts.nx || !centerConn.openPorts.py || !centerConn.openPorts.ny) {
      console.error('  ❌ FAILED: Center Intermediate Connector should have all 4 cross ports OPEN!');
      passedAll = false;
    } else {
      console.log('  ✅ Center Intermediate Connector cross ports (+X, -X, +Y, -Y) are OPEN correctly.');
    }
  }

  // -------------------------------------------------------------
  // TEST 3: Coat & Headphone Peg Toggle
  // -------------------------------------------------------------
  console.log('\n📋 Test 3: Coat & Headphone Peg Toggle');
  const gPegsOff = buildGraph({ gridColumns: 3, gridRows: 3, hasCoatPegs: false });
  if (gPegsOff.hangingPegs.length !== 0) {
    console.error(`  ❌ FAILED: Expected 0 hanging pegs when hasCoatPegs=false, found ${gPegsOff.hangingPegs.length}`);
    passedAll = false;
  } else {
    console.log('  ✅ Hanging Pegs are 100% disabled when hasCoatPegs=false.');
  }

  console.log('\n----------------------------------------');
  if (passedAll) {
    console.log('🎉 ALL MODUWALL UNIT TESTS PASSED PERFECTLY!');
  } else {
    console.error('💥 MODUWALL UNIT TESTS FAILED — Refinement Required!');
    process.exit(1);
  }
}

testModuwallConnections();
