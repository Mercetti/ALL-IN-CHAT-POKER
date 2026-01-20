/**
 * Skill Discovery Example for Acey
 * Phase 3: Emergent Skill Discovery / Dynamic Skill Marketplace
 * 
 * This example demonstrates the complete skill discovery system
 * with usage pattern analysis, proposal generation, and marketplace integration
 */

import { SkillDiscovery, SkillDiscoveryConfig } from './skillDiscovery';
import { LocalOrchestrator } from './localOrchestrator';
import path from 'path';

async function demonstrateSkillDiscovery() {
  console.log('🔍 Acey Skill Discovery Demo');
  console.log('===============================\n');

  // Configure skill discovery
  const config: SkillDiscoveryConfig = {
    logPath: path.join(process.cwd(), 'models', 'skill_discovery'),
    proposalPath: path.join(process.cwd(), 'models', 'proposals'),
    analysisInterval: 5, // minutes
    minPatternFrequency: 10,
    proposalThreshold: 0.7,
    enableAutoAnalysis: true
  };

  const discovery = new SkillDiscovery(config);

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('📊 Initial Status:');
    console.log(JSON.stringify(discovery.getUsageStats(), null, 2));
    console.log('\n');

    // Simulate skill usage patterns
    console.log('🎯 Simulating Skill Usage Patterns:');
    console.log('=====================================\n');

    const usageLogs = [
      // High frequency CodeHelper usage
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        skillName: 'CodeHelper',
        input: { action: 'analyze_code', code: 'function test() { return true; }' },
        output: { success: true, analysis: 'Simple test function' },
        executionTime: 800,
        success: true,
        confidence: 0.9,
        context: { role: 'developer', trustLevel: 2 }
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        skillName: 'CodeHelper',
        input: { action: 'analyze_code', code: 'const x = 1 + 2;' },
        output: { success: true, analysis: 'Simple arithmetic' },
        executionTime: 600,
        success: true,
        confidence: 0.85,
        context: { role: 'developer', trustLevel: 2 }
      },
      // SecurityObserver repeated usage
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        skillName: 'SecurityObserver',
        input: { action: 'check_permissions', user: 'admin' },
        output: { success: true, permissions: 'full_access' },
        executionTime: 1200,
        success: true,
        confidence: 0.95,
        context: { role: 'admin', trustLevel: 3 }
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        skillName: 'SecurityObserver',
        input: { action: 'check_permissions', user: 'user' },
        output: { success: true, permissions: 'limited_access' },
        executionTime: 1000,
        success: true,
        confidence: 0.88,
        context: { role: 'user', trustLevel: 1 }
      },
      // DataAnalyzer usage
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        skillName: 'DataAnalyzer',
        input: { action: 'analyze_patterns', data: [1, 2, 3, 4, 5] },
        output: { success: true, pattern: 'sequential' },
        executionTime: 900,
        success: true,
        confidence: 0.82,
        context: { role: 'user', trustLevel: 2 }
      }
    ];

    // Log usage data
    for (const log of usageLogs) {
      discovery.logUsage(log);
    }

    console.log(`📝 Logged ${usageLogs.length} usage entries`);
    console.log('\n');

    // Run analysis
    console.log('🔍 Running Usage Analysis:');
    console.log('==========================\n');

    const proposals = discovery.analyzeUsage();
    console.log(`💡 Generated ${proposals.length} skill proposals:`);

    for (const proposal of proposals) {
      console.log(`\n📋 ${proposal.name}`);
      console.log(`   Type: ${proposal.type}`);
      console.log(`   Tier: ${proposal.tier}`);
      console.log(`   Based on: ${proposal.basedOn}`);
      console.log(`   Value: ${(proposal.estimatedValue * 100).toFixed(1)}%`);
      console.log(`   Complexity: ${proposal.implementationComplexity}`);
      console.log(`   Reasoning: ${proposal.reasoning}`);
      console.log(`   Status: ${proposal.status}`);
    }

    console.log('\n');

    // Demonstrate proposal approval/rejection
    console.log('🤖 Demonstrating Proposal Management:');
    console.log('=====================================\n');

    if (proposals.length > 0) {
      const firstProposal = proposals[0];
      
      // Approve first proposal
      const approved = discovery.approveProposal(firstProposal.id);
      console.log(`✅ Approval result: ${approved ? 'Approved' : 'Failed'}`);
      
      // Reject second proposal if available
      if (proposals.length > 1) {
        const rejected = discovery.rejectProposal(proposals[1].id, 'Not needed at this time');
        console.log(`❌ Rejection result: ${rejected ? 'Rejected' : 'Failed'}`);
      }
    }

    console.log('\n');

    // Show updated proposal status
    console.log('📊 Updated Proposal Status:');
    console.log('==========================\n');

    const allProposals = discovery.getProposals();
    const statusCounts: Record<string, number> = {};
    
    for (const proposal of allProposals) {
      statusCounts[proposal.status] = (statusCounts[proposal.status] || 0) + 1;
    }

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });

    console.log('\n');

    // Generate discovery report
    console.log('📄 Generating Discovery Report:');
    console.log('==============================\n');

    const reportPath = discovery.generateDiscoveryReport();
    console.log(`Report saved to: ${reportPath}`);

    console.log('\n');

    // Demonstrate integration with orchestrator
    console.log('🔗 Integration with Orchestrator:');
    console.log('================================\n');

    // Create local orchestrator
    const orchestrator = new LocalOrchestrator({
      ollamaPath: 'ollama',
      modelsPath: path.join(process.cwd(), 'models'),
      enableStreaming: false,
      maxConcurrency: 2,
      timeoutMs: 30000,
      learningEnabled: true,
      qualityThreshold: 0.7
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Execute skills to generate real usage data
    console.log('🎯 Executing Skills for Real Usage Data:');
    console.log('========================================\n');

    const skills = [
      { name: 'CodeHelper', input: { action: 'analyze_code', code: 'function hello() { return "Hello"; }' } },
      { name: 'SecurityObserver', input: { action: 'check_permissions', user: 'developer' } },
      { name: 'DataAnalyzer', input: { action: 'analyze_patterns', data: [1, 2, 3, 4, 5] } }
    ];

    for (const skill of skills) {
      try {
        const result = await orchestrator.executeSkill(skill.name, skill.input, {
          role: 'developer',
          trustLevel: 2
        });

        // Log the usage for discovery
        discovery.logUsage({
          timestamp: new Date().toISOString(),
          skillName: skill.name,
          input: skill.input,
          output: result,
          executionTime: result.executionTime || 1000,
          success: result.success || true,
          confidence: result.confidence || 0.8,
          context: { role: 'developer', trustLevel: 2 }
        });

        console.log(`✅ ${skill.name}: Success (${result.executionTime || 'unknown'}ms)`);
      } catch (error) {
        console.log(`❌ ${skill.name}: Failed - ${error}`);
      }
    }

    console.log('\n');

    // Final analysis with real data
    console.log('🔍 Final Analysis with Real Data:');
    console.log('=================================\n');

    const finalProposals = discovery.analyzeUsage();
    console.log(`💡 Final proposals: ${finalProposals.length}`);

    // Show usage statistics
    const stats = discovery.getUsageStats();
    console.log(`📚 Total patterns: ${stats.totalPatterns}`);

    console.log('\n');

    // Final status
    console.log('📊 Final System Status:');
    console.log('=======================\n');
    console.log(JSON.stringify(discovery.getUsageStats(), null, 2));

  } finally {
    // Cleanup
    console.log('\n🔄 Shutting down...');
    await discovery.shutdown();
    console.log('✅ Skill Discovery demo complete!');
  }
}

// Demonstrate marketplace integration
async function demonstrateMarketplaceIntegration() {
  console.log('🛍️  Skill Marketplace Integration Demo');
  console.log('====================================\n');

  const config: SkillDiscoveryConfig = {
    logPath: path.join(process.cwd(), 'models', 'skill_discovery'),
    proposalPath: path.join(process.cwd(), 'models', 'proposals'),
    analysisInterval: 5,
    minPatternFrequency: 5,
    proposalThreshold: 0.6,
    enableAutoAnalysis: true
  };

  const discovery = new SkillDiscovery(config);
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Simulate marketplace data
    console.log('🏪 Simulating Marketplace Data:');
    console.log('===============================\n');

    const marketplaceSkills = [
      {
        id: 'enhanced-code-helper',
        name: 'Enhanced Code Helper',
        description: 'Advanced code analysis with pattern recognition',
        tier: 'Pro',
        type: 'enhancement',
        basedOn: 'CodeHelper',
        status: 'proposed',
        estimatedValue: 0.85,
        implementationComplexity: 'medium'
      },
      {
        id: 'security-specialist',
        name: 'Security Specialist',
        description: 'Specialized security analysis and vulnerability detection',
        tier: 'Enterprise',
        type: 'new_skill',
        basedOn: 'SecurityObserver',
        status: 'approved',
        estimatedValue: 0.92,
        implementationComplexity: 'high'
      },
      {
        id: 'data-analyzer-lite',
        name: 'Data Analyzer Lite',
        description: 'Lightweight data analysis for common use cases',
        tier: 'Free',
        type: 'variant',
        basedOn: 'DataAnalyzer',
        status: 'implemented',
        estimatedValue: 0.78,
        implementationComplexity: 'low'
      }
    ];

    console.log('📋 Available Skills in Marketplace:');
    marketplaceSkills.forEach(skill => {
      console.log(`- ${skill.name} (${skill.tier}) - ${skill.status}`);
    });

    console.log('\n');

    // Simulate user interactions
    console.log('👤 Simulating User Interactions:');
    console.log('================================\n');

    const userActions = [
      { skillId: 'enhanced-code-helper', action: 'view' },
      { skillId: 'enhanced-code-helper', action: 'approve' },
      { skillId: 'security-specialist', action: 'view' },
      { skillId: 'data-analyzer-lite', action: 'install' },
      { skillId: 'enhanced-code-helper', action: 'install' }
    ];

    for (const action of userActions) {
      const skill = marketplaceSkills.find(s => s.id === action.skillId);
      if (skill) {
        console.log(`🎯 User ${action.action}: ${skill.name}`);
        
        // Log usage for discovery
        if (action.action === 'install') {
          discovery.logUsage({
            timestamp: new Date().toISOString(),
            skillName: skill.name,
            input: { action: 'install' },
            output: { success: true, installed: true },
            executionTime: 500,
            success: true,
            confidence: 0.9,
            context: { role: 'user', trustLevel: 2 }
          });
        }
      }
    }

    console.log('\n');

    // Generate marketplace insights
    console.log('📈 Marketplace Insights:');
    console.log('========================\n');

    const stats = discovery.getUsageStats();
    console.log(`Total usage logs: ${stats.totalLogs}`);
    console.log(`Unique skills: ${stats.uniqueSkills}`);
    console.log(`Total proposals: ${stats.totalProposals}`);

    console.log('\n');

    // Recommendations
    console.log('💡 Marketplace Recommendations:');
    console.log('===============================\n');

    const proposals = discovery.getProposals('proposed');
    if (proposals.length > 0) {
      console.log('🔥 Hot proposals to consider:');
      proposals.forEach(proposal => {
        console.log(`- ${proposal.name}: ${(proposal.estimatedValue * 100).toFixed(1)}% value`);
      });
    } else {
      console.log('📊 No pending proposals - marketplace is balanced');
    }

    console.log('\n');

    // Generate marketplace report
    console.log('📄 Generating Marketplace Report:');
    console.log('===============================\n');

    const reportPath = discovery.generateDiscoveryReport();
    console.log(`Marketplace report: ${reportPath}`);

  } finally {
    await discovery.shutdown();
    console.log('✅ Marketplace integration demo complete!');
  }
}

// Run demonstrations
async function runSkillDiscoveryDemo() {
  try {
    await demonstrateSkillDiscovery();
    await demonstrateMarketplaceIntegration();
  } catch (error) {
    console.error('Skill Discovery demo failed:', error);
  }
}

// Export for use in other modules
export {
  demonstrateSkillDiscovery,
  demonstrateMarketplaceIntegration,
  runSkillDiscoveryDemo
};

// Run demo if this file is executed directly
if (require.main === module) {
  runSkillDiscoveryDemo().catch(console.error);
}
