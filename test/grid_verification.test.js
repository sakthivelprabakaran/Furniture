/**
 * Automated Unit Test Suite: Independent Extension Toggles Verification
 * Tests that extendLeftPort, extendRightPort, and extendTopPort act 100% independently on their respective ports.
 */

import { ProductTemplates } from '../js/engine/ProductTemplates.js';

function testIndependentExtensionToggles() {
  console.log('🧪 Testing Independent Extension Toggles (Left, Right, Top)...\n');

  const template = ProductTemplates.getTemplate('moduplant_infinite');

  function getGraphFor(params) {
    const mergedParams = {};
    for (const [k, v] of Object.entries(template.parameters)) {
      mergedParams[k] = v.value;
    }
    Object.assign(mergedParams, params);
    return template.buildGraph(mergedParams);
  }

  let passedAll = true;

  // Scenario: Center 3 Tiers, Left 2 Tiers, Right 2 Tiers
  // Column X Positions:
  // - Left Wing outer post: x = -340
  // - Left/Center post: x = 0
  // - Center/Right post: x = 340
  // - Right Wing outer post: x = 680

  // -------------------------------------------------------------
  // TEST 1: ONLY extendLeftPort = true (Right and Top are FALSE)
  // -------------------------------------------------------------
  console.log('📋 Test 1: ONLY extendLeftPort=true');
  const g1 = getGraphFor({
    centerTiers: 3, hasLeftWing: true, leftTiers: 2, hasRightWing: true, rightTiers: 2,
    extendLeftPort: true, extendRightPort: false, extendTopPort: false
  });

  // Check 1.1: Left Wing outer post at Tier 2 (x=-340, y=540): -X port MUST be OPEN!
  const connLeftWingTop = g1.connectors.find(c => Math.abs(c.position[0] - (-340)) < 5 && Math.abs(c.position[1] - 540) < 5 && c.position[2] === 0);
  if (!connLeftWingTop || !connLeftWingTop.openPorts.nx) {
    console.error('  ❌ FAILED: Left Wing Top Connector (-X) should be OPEN when extendLeftPort=true!');
    passedAll = false;
  } else {
    console.log('  ✅ Left Wing Top Connector (-X port) is OPEN correctly.');
  }

  // Check 1.2: Left Wing outer post at Tier 2 (x=-340, y=540): +Y port MUST be CAPPED (since extendTopPort=false)!
  if (connLeftWingTop && connLeftWingTop.openPorts.py) {
    console.error('  ❌ FAILED: Left Wing Top Connector (+Y) should be CAPPED when extendTopPort=false!');
    passedAll = false;
  } else {
    console.log('  ✅ Left Wing Top Connector (+Y port) is CAPPED correctly.');
  }

  // Check 1.3: Right Wing outer post at Tier 2 (x=680, y=540): +X port MUST be CAPPED (since extendRightPort=false)!
  const connRightWingTop = g1.connectors.find(c => Math.abs(c.position[0] - 680) < 5 && Math.abs(c.position[1] - 540) < 5 && c.position[2] === 0);
  if (connRightWingTop && connRightWingTop.openPorts.px) {
    console.error('  ❌ FAILED: Right Wing Top Connector (+X) should be CAPPED when extendRightPort=false!');
    passedAll = false;
  } else {
    console.log('  ✅ Right Wing Top Connector (+X port) is CAPPED correctly.');
  }

  // -------------------------------------------------------------
  // TEST 2: ONLY extendTopPort = true (Left and Right are FALSE)
  // -------------------------------------------------------------
  console.log('\n📋 Test 2: ONLY extendTopPort=true');
  const g2 = getGraphFor({
    centerTiers: 3, hasLeftWing: true, leftTiers: 2, hasRightWing: true, rightTiers: 2,
    extendLeftPort: false, extendRightPort: false, extendTopPort: true
  });

  // Check 2.1: Left Wing Top Connector (x=-340, y=540): +Y port MUST be OPEN!
  const connLeftTop2 = g2.connectors.find(c => Math.abs(c.position[0] - (-340)) < 5 && Math.abs(c.position[1] - 540) < 5 && c.position[2] === 0);
  if (!connLeftTop2 || !connLeftTop2.openPorts.py) {
    console.error('  ❌ FAILED: Left Wing Top Connector (+Y) should be OPEN when extendTopPort=true!');
    passedAll = false;
  } else {
    console.log('  ✅ Left Wing Top Connector (+Y port) is OPEN correctly.');
  }

  // Check 2.2: Left Wing Top Connector (x=-340, y=540): -X port MUST be CAPPED (since extendLeftPort=false)!
  if (connLeftTop2 && connLeftTop2.openPorts.nx) {
    console.error('  ❌ FAILED: Left Wing Top Connector (-X) should be CAPPED when extendLeftPort=false!');
    passedAll = false;
  } else {
    console.log('  ✅ Left Wing Top Connector (-X port) is CAPPED correctly when extendLeftPort=false.');
  }

  console.log('\n----------------------------------------');
  if (passedAll) {
    console.log('🎉 ALL INDEPENDENT TOGGLE UNIT TESTS PASSED PERFECTLY!');
  } else {
    console.error('💥 UNIT TESTS FAILED — Logic Refinements Required!');
  }
}

testIndependentExtensionToggles();
