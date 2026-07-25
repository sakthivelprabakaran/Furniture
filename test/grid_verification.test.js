/**
 * Automated Unit Test Suite: MODUPLANT Connector Ports & Capping Logic
 * Verifies exact Capping & Extension Port topology across staggered wings and user extension toggles.
 */

import { ProductTemplates } from '../js/engine/ProductTemplates.js';

function runConnectorCappingUnitTests() {
  console.log('🧪 Running Comprehensive CONNECTOR PORTS & CAPPING Logic Unit Tests...\n');

  const template = ProductTemplates.getTemplate('moduplant_infinite');

  function getGraphFor(params) {
    const mergedParams = {};
    for (const [k, v] of Object.entries(template.parameters)) {
      mergedParams[k] = v.value;
    }
    Object.assign(mergedParams, params);
    return { graph: template.buildGraph(mergedParams), params: mergedParams };
  }

  let passedAll = true;

  // TEST CASE 1: User's exact scenario: Center 3 Tiers, Left 2 Tiers, Right 2 Tiers, extendLeftPort=true, extendRightPort=true
  console.log('📋 Test Case 1: Center 3, Left 2, Right 2 with extendLeftPort=true & extendRightPort=true');
  const { graph: g1 } = getGraphFor({
    centerTiers: 3,
    hasLeftWing: true, leftTiers: 2,
    hasRightWing: true, rightTiers: 2,
    extendLeftPort: true, extendRightPort: true
  });

  // Center Tower at Tier 3 is at y = 3 * 270 = 810.
  // Left post of Center Tower is x = 0, Right post is x = 340.
  // At Tier 3 (y=810), x=0 connector faces left (-X). Since extendLeftPort=true, nx MUST BE OPEN!
  // At Tier 3 (y=810), x=340 connector faces right (+X). Since extendRightPort=true, px MUST BE OPEN!

  const connCenterTopLeft = g1.connectors.find(c => Math.abs(c.position[0] - 0) < 5 && Math.abs(c.position[1] - 810) < 5 && c.position[2] === 0);
  const connCenterTopRight = g1.connectors.find(c => Math.abs(c.position[0] - 340) < 5 && Math.abs(c.position[1] - 810) < 5 && c.position[2] === 0);

  if (!connCenterTopLeft || !connCenterTopLeft.openPorts.nx) {
    console.error('  ❌ FAILED: Center Tower Tier 3 Left Connector (-X) should be OPEN when extendLeftPort=true!');
    passedAll = false;
  } else {
    console.log('  ✅ Center Tower Tier 3 Left Connector (-X port) is OPEN correctly.');
  }

  if (!connCenterTopRight || !connCenterTopRight.openPorts.px) {
    console.error('  ❌ FAILED: Center Tower Tier 3 Right Connector (+X) should be OPEN when extendRightPort=true!');
    passedAll = false;
  } else {
    console.log('  ✅ Center Tower Tier 3 Right Connector (+X port) is OPEN correctly.');
  }

  // TEST CASE 2: When extension toggles are FALSE, Center Tower Tier 3 facing left (no Left Wing Tier 3) MUST be CAPPED!
  console.log('\n📋 Test Case 2: Center 3, Left 2, Right 2 with extendLeftPort=false & extendRightPort=false');
  const { graph: g2 } = getGraphFor({
    centerTiers: 3,
    hasLeftWing: true, leftTiers: 2,
    hasRightWing: true, rightTiers: 2,
    extendLeftPort: false, extendRightPort: false
  });

  const connCappedLeft = g2.connectors.find(c => Math.abs(c.position[0] - 0) < 5 && Math.abs(c.position[1] - 810) < 5 && c.position[2] === 0);
  const connCappedRight = g2.connectors.find(c => Math.abs(c.position[0] - 340) < 5 && Math.abs(c.position[1] - 810) < 5 && c.position[2] === 0);

  if (connCappedLeft && connCappedLeft.openPorts.nx) {
    console.error('  ❌ FAILED: Center Tower Tier 3 Left Connector (-X) should be CAPPED when extendLeftPort=false!');
    passedAll = false;
  } else {
    console.log('  ✅ Center Tower Tier 3 Left Connector (-X port) is CAPPED correctly.');
  }

  if (connCappedRight && connCappedRight.openPorts.px) {
    console.error('  ❌ FAILED: Center Tower Tier 3 Right Connector (+X) should be CAPPED when extendRightPort=false!');
    passedAll = false;
  } else {
    console.log('  ✅ Center Tower Tier 3 Right Connector (+X port) is CAPPED correctly.');
  }

  // TEST CASE 3: Top Extension Toggle (extendTopPort=true)
  console.log('\n📋 Test Case 3: Top Extension Toggle (extendTopPort=true)');
  const { graph: g3 } = getGraphFor({ centerTiers: 3, extendTopPort: true });
  const connTopCenter = g3.connectors.find(c => Math.abs(c.position[1] - 810) < 5 && c.position[2] === 0);

  if (!connTopCenter || !connTopCenter.openPorts.py) {
    console.error('  ❌ FAILED: Top Connector (+Y) should be OPEN when extendTopPort=true!');
    passedAll = false;
  } else {
    console.log('  ✅ Top Connector (+Y port) is OPEN correctly.');
  }

  console.log('\n----------------------------------------');
  if (passedAll) {
    console.log('🎉 ALL CONNECTOR PORTS & CAPPING UNIT TESTS PASSED PERFECTLY!');
  } else {
    console.error('💥 UNIT TESTS FAILED — Logic Fixes Required!');
  }
}

runConnectorCappingUnitTests();
