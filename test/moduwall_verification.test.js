/**
 * Automated Unit Test Suite: MODUWALL Grid 2D Reference System Verification
 * Verifies exact 2D single-plane node counts, wall anchor flange counts, 2D sleeve connectors, and port capping.
 */

import { ProductTemplates } from '../js/engine/ProductTemplates.js';

function testModuwallConnections() {
  console.log('🧪 Running MODUWALL Grid 2D Reference System Automated Unit Test Suite...\n');

  const template = ProductTemplates.getTemplate('moduwall_wall_grid');
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
  // TEST 1: 2D Grid Dimensions (3 Bays Wide x 3 Rows High)
  // -------------------------------------------------------------
  console.log('📋 Test 1: 2D Reference Grid Dimensions (3 Bays Wide x 3 Rows High)');
  const g1 = buildGraph({ gridColumns: 3, gridRows: 3, bayWidth: 340, bayHeight: 300 });

  // 1.1 Check Wall Anchor Bracket Count (Top & Bottom Ends)
  const expectedWallConnectors = (3 + 1) * 2; // 4 cols * 2 anchor rows (top and bottom) = 8 wall anchors
  if (g1.wallConnectors.length !== expectedWallConnectors) {
    console.error(`  ❌ FAILED: Expected ${expectedWallConnectors} wall anchors, found ${g1.wallConnectors.length}`);
    passedAll = false;
  } else {
    console.log(`  ✅ Wall-Mount Anchor Bracket Count is exact (${expectedWallConnectors} anchors).`);
  }

  // 1.2 Check Intermediate 2D Sleeve Connector Count
  const expectedConnectors = (3 + 1) * (3 - 1); // 4 cols * 2 intermediate rows = 8 connectors
  if (g1.connectors.length !== expectedConnectors) {
    console.error(`  ❌ FAILED: Expected ${expectedConnectors} 2D sleeve connectors, found ${g1.connectors.length}`);
    passedAll = false;
  } else {
    console.log(`  ✅ Intermediate 2D Sleeve Connector Count is exact (${expectedConnectors} connectors).`);
  }

  // -------------------------------------------------------------
  // TEST 2: 2D Port Capping Logic on Boundary Nodes
  // -------------------------------------------------------------
  console.log('\n📋 Test 2: 2D Port Capping Logic');

  // Check 2.1: Intermediate Left Connector (c=0, r=2, x=0, y=600, z=0)
  const leftConn = g1.connectors.find(c => Math.abs(c.position[0] - 0) < 5 && Math.abs(c.position[1] - 600) < 5 && Math.abs(c.position[2] - 0) < 5);
  if (!leftConn) {
    console.error('  ❌ FAILED: Intermediate Left Connector not found!');
    passedAll = false;
  } else {
    // Left boundary: -X port MUST be capped!
    if (leftConn.openPorts.nx) {
      console.error('  ❌ FAILED: Left Connector (-X) should be CAPPED on outer left boundary!');
      passedAll = false;
    } else {
      console.log('  ✅ Left Boundary Connector (-X port) is CAPPED correctly.');
    }

    // 2D grid: +Z port MUST be capped!
    if (leftConn.openPorts.pz) {
      console.error('  ❌ FAILED: 2D Connector (+Z) should be CAPPED (single plane grid)!');
      passedAll = false;
    } else {
      console.log('  ✅ 2D Grid Connector (+Z depth port) is CAPPED correctly.');
    }
  }

  // Check 2.2: Center Intermediate Connector (c=1, r=2, x=340, y=600, z=0)
  const centerConn = g1.connectors.find(c => Math.abs(c.position[0] - 340) < 5 && Math.abs(c.position[1] - 600) < 5 && Math.abs(c.position[2] - 0) < 5);
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
    console.log('🎉 ALL MODUWALL GRID UNIT TESTS PASSED PERFECTLY!');
  } else {
    console.error('💥 MODUWALL GRID UNIT TESTS FAILED — Refinement Required!');
    process.exit(1);
  }
}

testModuwallConnections();
