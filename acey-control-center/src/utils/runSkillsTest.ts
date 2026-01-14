/**
 * Skills Test Runner
 * Quick test to verify the skills implementation
 */

import { verifySkillsSystem, testInstallationFlow } from './skillsTest';

export const runSkillsTests = async () => {
  console.log('🧪 Starting Skills System Tests...\n');
  
  // Test 1: System Verification
  console.log('📋 Test 1: System Verification');
  const verification = await verifySkillsSystem();
  
  if (verification.success) {
    console.log('✅ PASSED: System verification');
    console.log(`   Found ${verification.skills?.length} skills`);
    verification.skills?.forEach(skill => {
      console.log(`   - ${skill.name} (${skill.requiredTierId}) - $${skill.price}/mo`);
    });
  } else {
    console.log('❌ FAILED: System verification');
    console.log(`   Error: ${verification.message}`);
    verification.errors?.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
  
  console.log('\n📋 Test 2: Installation Flow');
  
  // Test 2: Installation Flow for each skill
  const skills = verification.skills || [];
  for (const skill of skills) {
    console.log(`\n   Testing ${skill.name} installation...`);
    const installation = await testInstallationFlow(skill.id);
    
    if (installation.success) {
      console.log(`   ✅ ${skill.name}: ${installation.message}`);
    } else {
      console.log(`   ❌ ${skill.name}: ${installation.message}`);
    }
    
    // Show first few steps
    installation.steps.slice(0, 3).forEach(step => {
      console.log(`     ${step}`);
    });
  }
  
  console.log('\n🎯 Skills System Tests Complete!');
  console.log('\n📱 Ready to test in the mobile app:');
  console.log('   1. Start the mobile app');
  console.log('   2. Navigate to Skill Store');
  console.log('   3. Try installing Graphics Wizard or Audio Maestro');
  console.log('   4. Verify tier gating works');
  console.log('   5. Check LLM orchestration integration');
};

// Export for use in development
export default runSkillsTests;
