/**
 * Hybrid LLM Transition Example for Acey
 * Demonstrates the transition from external LLMs to self-hosted capabilities
 * 
 * This example shows how Acey can currently use external LLMs while
 * preparing for future self-hosted model deployment
 */

import { TransitionOrchestrator, TransitionConfig, LLMProvider } from './transitionOrchestrator';
import path from 'path';

async function demonstrateHybridTransition() {
  console.log('🚀 Acey Hybrid LLM Transition Demo');
  console.log('=====================================\n');

  // Configure external providers (current setup)
  const externalProviders: LLMProvider[] = [
    {
      name: 'OpenAI-GPT4',
      type: 'external',
      isAvailable: true,
      priority: 1,
      capabilities: ['text_generation', 'code_generation', 'analysis'],
      costPerRequest: 0.03,
      maxTokens: 8192
    },
    {
      name: 'Anthropic-Claude',
      type: 'external',
      isAvailable: true,
      priority: 2,
      capabilities: ['text_generation', 'analysis', 'reasoning'],
      costPerRequest: 0.015,
      maxTokens: 100000
    },
    {
      name: 'Google-Gemini',
      type: 'external',
      isAvailable: true,
      priority: 3,
      capabilities: ['text_generation', 'multimodal', 'analysis'],
      costPerRequest: 0.0025,
      maxTokens: 32768
    }
  ];

  // Initialize transition orchestrator
  const config: TransitionConfig = {
    modelPath: path.join(process.cwd(), 'models'),
    externalProviders,
    selfHostEnabled: false, // Start with external only
    learningEnabled: true,
    costOptimization: true,
    qualityThreshold: 0.7,
    transitionMode: 'conservative', // Start conservative
    maxSelfHostPercentage: 20 // Start with max 20% self-hosted
  };

  const orchestrator = new TransitionOrchestrator(config);

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('📊 Initial Status:');
    console.log(JSON.stringify(orchestrator.getStatus(), null, 2));
    console.log('\n');

    // Phase 1: External LLM Usage (Current State)
    console.log('🌐 Phase 1: External LLM Usage (Current State)');
    console.log('===============================================\n');

    await executeSkillPhase(orchestrator, 'External LLM Phase');

    // Phase 2: Enable Self-Hosted Model (Future State)
    console.log('🧠 Phase 2: Enable Self-Hosted Model');
    console.log('====================================\n');

    orchestrator.setSelfHostEnabled(true);
    console.log('✅ Self-hosted model enabled');
    console.log('Note: This is simulated - actual model would be loaded here\n');

    await executeSkillPhase(orchestrator, 'Self-Hosted Enabled Phase');

    // Phase 3: Balanced Transition
    console.log('⚖️ Phase 3: Balanced Transition');
    console.log('===============================\n');

    orchestrator.setTransitionMode('balanced');
    orchestrator.setMaxSelfHostPercentage(50);
    console.log('✅ Transition mode: balanced');
    console.log('✅ Max self-host percentage: 50%\n');

    await executeSkillPhase(orchestrator, 'Balanced Transition Phase');

    // Phase 4: Aggressive Transition
    console.log('🚀 Phase 4: Aggressive Transition');
    console.log('================================\n');

    orchestrator.setTransitionMode('aggressive');
    orchestrator.setMaxSelfHostPercentage(80);
    console.log('✅ Transition mode: aggressive');
    console.log('✅ Max self-host percentage: 80%\n');

    await executeSkillPhase(orchestrator, 'Aggressive Transition Phase');

    // Final Analysis
    console.log('📈 Final Transition Analysis');
    console.log('============================\n');

    const finalMetrics = orchestrator.getTransitionMetrics();
    const costAnalysis = orchestrator.hybridLLM.getCostAnalysis();

    console.log('Transition Metrics:');
    console.log(`- Total Requests: ${finalMetrics.totalRequests}`);
    console.log(`- Self-Host Requests: ${finalMetrics.selfHostRequests}`);
    console.log(`- External Requests: ${finalMetrics.externalRequests}`);
    console.log(`- Transition Progress: ${finalMetrics.transitionProgress.toFixed(1)}%`);
    console.log(`- Cost Savings: $${finalMetrics.costSavings.toFixed(4)}`);
    console.log(`- Learning Data Collected: ${finalMetrics.learningDataCollected}`);
    console.log('\n');

    console.log('Provider Performance:');
    console.log(JSON.stringify(costAnalysis, null, 2));
    console.log('\n');

    // Generate reports
    const transitionReport = orchestrator.generateTransitionReport();
    const trainingDataPath = orchestrator.exportTrainingData();

    console.log('📄 Reports Generated:');
    console.log(`- Transition Report: ${transitionReport}`);
    console.log(`- Training Data: ${trainingDataPath}`);
    console.log('\n');

    // Demonstrate learning data usage
    console.log('📚 Learning Data Analysis');
    console.log('========================\n');

    const learningData = orchestrator.getLearningData();
    console.log(`Total learning entries: ${learningData.length}`);

    // Group by skill
    const skillGroups: Record<string, number> = {};
    for (const entry of learningData) {
      // This would need to be mapped back to skill names in production
      const skill = 'Unknown';
      skillGroups[skill] = (skillGroups[skill] || 0) + 1;
    }

    console.log('Learning data by skill:');
    Object.entries(skillGroups).forEach(([skill, count]) => {
      console.log(`- ${skill}: ${count} entries`);
    });

    console.log('\n');

  } finally {
    // Cleanup
    console.log('🔄 Shutting down...');
    await orchestrator.shutdown();
    console.log('✅ Demo complete!');
  }
}

async function executeSkillPhase(orchestrator: TransitionOrchestrator, phaseName: string) {
  console.log(`Executing skills in ${phaseName}...\n`);

  const skills = [
    { name: 'SecurityObserver', input: { action: 'status', context: 'system_health_check' } },
    { name: 'FileTools', input: { action: 'create_archive', files: ['./README.md'], format: 'zip' } },
    { name: 'CodeHelper', input: { action: 'analyze_code', code: 'console.log("Hello World");' } },
    { name: 'GraphicsWizard', input: { action: 'generate_logo', text: 'Acey', style: 'modern' } },
    { name: 'AudioMaestro', input: { action: 'generate_tone', frequency: 440, duration: 1000 } },
    { name: 'LinkReview', input: { action: 'analyze_url', url: 'https://example.com' } }
  ];

  const context = {
    role: 'developer',
    trustLevel: 2
  };

  for (const skill of skills) {
    try {
      console.log(`🎯 Executing ${skill.name}...`);
      const result = await orchestrator.executeSkill(skill.name, skill.input, context);
      
      if (result && result.success) {
        console.log(`✅ ${skill.name}: Success`);
        if (result.provider) {
          console.log(`   Provider: ${result.provider}`);
        }
        if (result.confidence) {
          console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        }
      } else {
        console.log(`❌ ${skill.name}: Failed`);
      }
    } catch (error) {
      console.log(`❌ ${skill.name}: Error - ${error}`);
    }
    console.log('');
  }

  // Show metrics after phase
  const metrics = orchestrator.getTransitionMetrics();
  console.log(`Phase Metrics - Total: ${metrics.totalRequests}, Self-Host: ${metrics.selfHostRequests}, External: ${metrics.externalRequests}`);
  console.log(`Transition Progress: ${metrics.transitionProgress.toFixed(1)}%\n`);
}

// Demonstrate cost optimization
async function demonstrateCostOptimization() {
  console.log('💰 Cost Optimization Demo');
  console.log('========================\n');

  const config: TransitionConfig = {
    modelPath: path.join(process.cwd(), 'models'),
    externalProviders: [
      {
        name: 'OpenAI-GPT4',
        type: 'external',
        isAvailable: true,
        priority: 1,
        capabilities: ['text_generation', 'code_generation', 'analysis'],
        costPerRequest: 0.03,
        maxTokens: 8192
      },
      {
        name: 'Budget-LLM',
        type: 'external',
        isAvailable: true,
        priority: 10, // Lower priority
        capabilities: ['text_generation'],
        costPerRequest: 0.001, // Much cheaper
        maxTokens: 4096
      }
    ],
    selfHostEnabled: false,
    learningEnabled: true,
    costOptimization: true, // Enable cost optimization
    qualityThreshold: 0.6, // Lower threshold for cost optimization
    transitionMode: 'conservative',
    maxSelfHostPercentage: 0
  };

  const orchestrator = new TransitionOrchestrator(config);
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Execute some skills to see cost optimization in action
    const simpleSkills = [
      { name: 'LinkReview', input: { action: 'analyze_url', url: 'https://example.com' } },
      { name: 'LinkReview', input: { action: 'analyze_url', url: 'https://test.com' } },
      { name: 'LinkReview', input: { action: 'analyze_url', url: 'https://demo.com' } }
    ];

    for (const skill of simpleSkills) {
      await orchestrator.executeSkill(skill.name, skill.input, { role: 'user', trustLevel: 1 });
    }

    const costAnalysis = orchestrator.hybridLLM.getCostAnalysis();
    console.log('Cost Analysis with Optimization:');
    console.log(JSON.stringify(costAnalysis, null, 2));

  } finally {
    await orchestrator.shutdown();
  }
}

// Demonstrate learning data collection
async function demonstrateLearningCollection() {
  console.log('📚 Learning Data Collection Demo');
  console.log('================================\n');

  const config: TransitionConfig = {
    modelPath: path.join(process.cwd(), 'models'),
    externalProviders: [
      {
        name: 'OpenAI-GPT4',
        type: 'external',
        isAvailable: true,
        priority: 1,
        capabilities: ['text_generation', 'code_generation', 'analysis'],
        costPerRequest: 0.03,
        maxTokens: 8192
      }
    ],
    selfHostEnabled: false,
    learningEnabled: true,
    costOptimization: false,
    qualityThreshold: 0.8, // High threshold for quality learning
    transitionMode: 'conservative',
    maxSelfHostPercentage: 0
  };

  const orchestrator = new TransitionOrchestrator(config);
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Execute various skills to generate learning data
    const skills = [
      { name: 'CodeHelper', input: { action: 'analyze_code', code: 'function hello() { return "Hello"; }' } },
      { name: 'CodeHelper', input: { action: 'suggest_improvement', code: 'const x = 1;' } },
      { name: 'SecurityObserver', input: { action: 'check_permissions', user: 'admin' } },
      { name: 'FileTools', input: { action: 'validate_file', path: './test.txt' } }
    ];

    for (const skill of skills) {
      await orchestrator.executeSkill(skill.name, skill.input, { role: 'developer', trustLevel: 2 });
    }

    const learningData = orchestrator.getLearningData();
    console.log(`Collected ${learningData.length} learning entries`);
    
    // Show quality distribution
    const qualityRanges = { high: 0, medium: 0, low: 0 };
    for (const entry of learningData) {
      if (entry.quality >= 0.8) qualityRanges.high++;
      else if (entry.quality >= 0.6) qualityRanges.medium++;
      else qualityRanges.low++;
    }

    console.log('Quality Distribution:');
    console.log(`- High (≥0.8): ${qualityRanges.high}`);
    console.log(`- Medium (0.6-0.8): ${qualityRanges.medium}`);
    console.log(`- Low (<0.6): ${qualityRanges.low}`);

  } finally {
    await orchestrator.shutdown();
  }
}

// Run demonstrations
async function runTransitionDemo() {
  try {
    await demonstrateHybridTransition();
    await demonstrateCostOptimization();
    await demonstrateLearningCollection();
  } catch (error) {
    console.error('Transition demo failed:', error);
  }
}

// Export for use in other modules
export {
  demonstrateHybridTransition,
  demonstrateCostOptimization,
  demonstrateLearningCollection,
  runTransitionDemo
};

// Run demo if this file is executed directly
if (require.main === module) {
  runTransitionDemo().catch(console.error);
}
