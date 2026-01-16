/**
 * Self-Hosted Acey LLM Integration Example
 * Phase 1: Self-Hosted Acey LLM Migration
 * 
 * This example demonstrates the complete self-hosted LLM system
 * with constitutional compliance, fine-tuning, and fallback capabilities
 */

import { Orchestrator, Skill } from './core';
import fs from 'fs';

// Example custom skill implementation
class CustomSkill implements Skill {
  name = 'CustomAnalyzer';
  description = 'Analyze data patterns and provide insights';
  version = '1.0.0';
  permissions = ['analyze_data', 'generate_insights'];
  trustLevel = 2;
  isActive = true;

  async execute(input: any, context: any): Promise<any> {
    // This would normally be handled by the self-hosted LLM
    // But custom skills can have their own logic
    const data = input.data || [];
    const analysis = {
      totalItems: data.length,
      patterns: this.identifyPatterns(data),
      insights: this.generateInsights(data),
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };

    return {
      success: true,
      result: analysis,
      skill: this.name,
      processingTime: Date.now()
    };
  }

  private identifyPatterns(data: any[]): string[] {
    // Pattern identification logic
    return ['increasing_trend', 'seasonal_pattern', 'outlier_detected'];
  }

  private generateInsights(data: any[]): string[] {
    // Insight generation logic
    return ['data_quality_good', 'actionable_insights_available'];
  }
}

async function demonstrateSelfHostedLLM() {
  console.log('🚀 Self-Hosted Acey LLM Integration Demo');
  console.log('==========================================\n');

  // Initialize orchestrator with self-hosted LLM
  const orchestrator = new Orchestrator({
    modelPath: 'D:/AceyLLM',
    fallbackEnabled: true,
    fineTuneEnabled: true,
    constitutionalMode: 'strict',
    maxConcurrentExecutions: 3
  });

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Register custom skill
    const customSkill = new CustomSkill();
    orchestrator.registerSkill('CustomAnalyzer', customSkill);

    console.log('📊 Orchestrator Status:');
    console.log(JSON.stringify(orchestrator.getStatus(), null, 2));
    console.log('\n');

    // Demonstrate skill execution through self-hosted LLM
    console.log('🎯 Executing Skills Through Self-Hosted LLM:');
    console.log('--------------------------------------------\n');

    // Test 1: Security Observer
    console.log('1️⃣ Security Observer Skill:');
    try {
      const securityResult = await orchestrator.executeSkill('SecurityObserver', {
        action: 'status',
        context: 'system_health_check'
      }, {
        role: 'admin',
        trustLevel: 3
      });
      
      console.log('✅ Security Observer Result:', JSON.stringify(securityResult, null, 2));
    } catch (error) {
      console.log('❌ Security Observer Error:', error);
    }
    console.log('\n');

    // Test 2: File Tools
    console.log('2️⃣ File Tools Skill:');
    try {
      const fileResult = await orchestrator.executeSkill('FileTools', {
        action: 'create_archive',
        files: ['./README.md', './package.json'],
        format: 'zip'
      }, {
        role: 'developer',
        trustLevel: 2
      });
      
      console.log('✅ File Tools Result:', JSON.stringify(fileResult, null, 2));
    } catch (error) {
      console.log('❌ File Tools Error:', error);
    }
    console.log('\n');

    // Test 3: Custom Skill
    console.log('3️⃣ Custom Analyzer Skill:');
    try {
      const customResult = await orchestrator.executeSkill('CustomAnalyzer', {
        data: [1, 2, 3, 4, 5, 100, 200, 300],
        analysisType: 'trend'
      }, {
        role: 'user',
        trustLevel: 2
      });
      
      console.log('✅ Custom Analyzer Result:', JSON.stringify(customResult, null, 2));
    } catch (error) {
      console.log('❌ Custom Analyzer Error:', error);
    }
    console.log('\n');

    // Test 4: Constitutional Compliance
    console.log('4️⃣ Constitutional Compliance Test:');
    try {
      // This should fail due to insufficient permissions
      const restrictedResult = await orchestrator.executeSkill('FileTools', {
        action: 'delete_system_files',
        path: '/etc/passwd'
      }, {
        role: 'user',
        trustLevel: 1
      });
      
      console.log('❌ Unexpected success:', restrictedResult);
    } catch (error) {
      console.log('✅ Constitutional compliance working:', error);
    }
    console.log('\n');

    // Demonstrate training dataset
    console.log('📝 Training Dataset Management:');
    console.log('--------------------------------\n');

    // Get training data for a skill
    const securityTrainingData = orchestrator.getTrainingDataset('SecurityObserver');
    console.log(`Security Observer training entries: ${securityTrainingData.length}`);

    // Get master training dataset
    const masterTrainingData = orchestrator.getMasterTrainingDataset();
    console.log(`Master training entries: ${masterTrainingData.length}`);

    // Generate training report
    const reportPath = orchestrator.generateTrainingReport();
    console.log(`Training report generated: ${reportPath}`);

    console.log('\n');

    // Demonstrate execution statistics
    console.log('📈 Execution Statistics:');
    console.log('------------------------\n');
    console.log(JSON.stringify(orchestrator.getExecutionStats(), null, 2));
    console.log('\n');

    // Demonstrate skill information
    console.log('🔍 Skill Information:');
    console.log('--------------------\n');
    
    const skills = ['SecurityObserver', 'FileTools', 'CustomAnalyzer'];
    for (const skillName of skills) {
      const skillInfo = orchestrator.getSkillInfo(skillName);
      console.log(`${skillName}:`, JSON.stringify(skillInfo, null, 2));
      console.log('');
    }

    // Test fallback mode
    console.log('🔄 Testing Fallback Mode:');
    console.log('--------------------------\n');
    
    // Disable self-hosted LLM to test fallback
    orchestrator.setFallbackMode(true);
    console.log('Fallback mode enabled');
    
    try {
      const fallbackResult = await orchestrator.executeSkill('CodeHelper', {
        action: 'analyze_code',
        code: 'console.log("Hello World");'
      }, {
        role: 'developer',
        trustLevel: 2
      });
      
      console.log('✅ Fallback execution result:', JSON.stringify(fallbackResult, null, 2));
    } catch (error) {
      console.log('❌ Fallback failed:', error);
    }

    console.log('\n');

    // Demonstrate concurrent execution
    console.log('⚡ Concurrent Execution Test:');
    console.log('-----------------------------\n');
    
    const concurrentPromises = [
      orchestrator.executeSkill('GraphicsWizard', { type: 'logo', text: 'Acey' }, { role: 'user', trustLevel: 2 }),
      orchestrator.executeSkill('AudioMaestro', { type: 'tone', frequency: 440 }, { role: 'user', trustLevel: 2 }),
      orchestrator.executeSkill('LinkReview', { url: 'https://example.com' }, { role: 'user', trustLevel: 2 })
    ];

    const concurrentResults = await Promise.allSettled(concurrentPromises);
    
    concurrentResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Concurrent task ${index + 1}: Success`);
      } else {
        console.log(`❌ Concurrent task ${index + 1}:`, result.reason);
      }
    });

    console.log('\n');

    // Final status
    console.log('📊 Final Orchestrator Status:');
    console.log('------------------------------\n');
    console.log(JSON.stringify(orchestrator.getStatus(), null, 2));

  } finally {
    // Cleanup
    console.log('\n🔄 Shutting down...');
    await orchestrator.shutdown();
    console.log('✅ Demo complete!');
  }
}

// Demonstrate fine-tune dataset management
async function demonstrateDatasetManagement() {
  console.log('📊 Dataset Management Demo');
  console.log('==========================\n');

  const { FineTuneDatasetManager } = require('./dataset/fineTune');
  
  const datasetManager = new FineTuneDatasetManager('D:/AceyLLM');

  // Create sample training data
  const sampleData = [
    {
      input: { action: 'monitor_systems', type: 'security_check' },
      output: { success: true, alerts: [], system_status: 'healthy' },
      timestamp: new Date().toISOString(),
      skillName: 'SecurityObserver',
      executionTime: 1200,
      success: true,
      constitutionalCompliance: true,
      quality: 0.9
    },
    {
      input: { action: 'create_archive', files: ['test.txt'], format: 'zip' },
      output: { success: true, archive_path: '/tmp/archive.zip', size: 1024 },
      timestamp: new Date().toISOString(),
      skillName: 'FileTools',
      executionTime: 800,
      success: true,
      constitutionalCompliance: true,
      quality: 0.85
    }
  ];

  // Analyze dataset
  const analysis = datasetManager.analyzeDataset(sampleData);
  console.log('Dataset Analysis:');
  console.log('- Total Entries:', analysis.stats.totalEntries);
  console.log('- Average Quality:', (analysis.stats.averageQuality * 100).toFixed(1) + '%');
  console.log('- Success Rate:', (analysis.stats.successRate * 100).toFixed(1) + '%');
  console.log('- Constitutional Compliance:', (analysis.stats.constitutionalComplianceRate * 100).toFixed(1) + '%');
  console.log('\nInsights:');
  analysis.insights.forEach(insight => console.log('- ' + insight));
  console.log('\nRecommendations:');
  analysis.recommendations.forEach(rec => console.log('- ' + rec));

  console.log('\n');
}

// Run demonstrations
async function runDemo() {
  try {
    await demonstrateSelfHostedLLM();
    await demonstrateDatasetManagement();
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Export for use in other modules
export {
  demonstrateSelfHostedLLM,
  demonstrateDatasetManagement,
  runDemo,
  CustomSkill
};

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}
