/**
 * Local LLM Example for Acey
 * Demonstrates the complete local Ollama-based system
 * 
 * This example shows how Acey uses 3 different local models
 * through Ollama, all running on the local PC
 */

import { LocalOrchestrator, LocalOrchestratorConfig } from './localOrchestrator';
import path from 'path';

async function demonstrateLocalLLM() {
  console.log('🦙 Acey Local LLM Demo (Ollama)');
  console.log('=================================\n');

  // Configure local orchestrator
  const config: LocalOrchestratorConfig = {
    ollamaPath: 'ollama', // Assumes ollama is in PATH
    modelsPath: path.join(process.cwd(), 'models'),
    enableStreaming: false,
    maxConcurrency: 3,
    timeoutMs: 60000,
    learningEnabled: true,
    qualityThreshold: 0.6
  };

  const orchestrator = new LocalOrchestrator(config);

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    console.log('📊 Initial Status:');
    console.log(JSON.stringify(orchestrator.getStatus(), null, 2));
    console.log('\n');

    // Check model availability
    console.log('🔍 Model Status:');
    const models = orchestrator.getModelStatus();
    models.forEach(model => {
      console.log(`${model.isAvailable ? '✅' : '❌'} ${model.name} (${model.modelId}) - ${model.description}`);
    });
    console.log('\n');

    // Install missing models if needed
    const missingModels = models.filter(m => !m.isAvailable);
    if (missingModels.length > 0) {
      console.log('📦 Installing missing models...');
      await orchestrator.installMissingModels();
      console.log('✅ Model installation complete\n');
    }

    // Demonstrate different skills with their specialized models
    console.log('🎯 Demonstrating Skills with Specialized Models:');
    console.log('=============================================\n');

    // 1. Code Helper with CodeLlama
    console.log('1️⃣ Code Helper (CodeLlama-7B):');
    try {
      const codeResult = await orchestrator.executeSkill('CodeHelper', {
        action: 'analyze_code',
        code: `
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
        `
      }, {
        role: 'developer',
        trustLevel: 2
      });
      
      console.log('✅ Code analysis completed');
      console.log(`   Model: ${codeResult.model}`);
      console.log(`   Confidence: ${(codeResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Execution time: ${codeResult.executionTime}ms`);
    } catch (error) {
      console.log('❌ Code analysis failed:', error);
    }
    console.log('');

    // 2. Security Observer with Deepseek-Coder
    console.log('2️⃣ Security Observer (Deepseek-Coder-6.7B):');
    try {
      const securityResult = await orchestrator.executeSkill('SecurityObserver', {
        action: 'check_permissions',
        user: 'admin',
        resource: 'system_files'
      }, {
        role: 'admin',
        trustLevel: 3
      });
      
      console.log('✅ Security check completed');
      console.log(`   Model: ${securityResult.model}`);
      console.log(`   Confidence: ${(securityResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Execution time: ${securityResult.executionTime}ms`);
    } catch (error) {
      console.log('❌ Security check failed:', error);
    }
    console.log('');

    // 3. Data Analyzer with Mistral
    console.log('3️⃣ Data Analyzer (Mistral-7B):');
    try {
      const dataResult = await orchestrator.executeSkill('DataAnalyzer', {
        action: 'analyze_patterns',
        data: [1, 2, 3, 4, 5, 100, 200, 300],
        analysisType: 'trend'
      }, {
        role: 'user',
        trustLevel: 2
      });
      
      console.log('✅ Data analysis completed');
      console.log(`   Model: ${dataResult.model}`);
      console.log(`   Confidence: ${(dataResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Execution time: ${dataResult.executionTime}ms`);
    } catch (error) {
      console.log('❌ Data analysis failed:', error);
    }
    console.log('');

    // 4. Content Creator with Vicuna
    console.log('4️⃣ Content Creator (Vicuna-13B):');
    try {
      const contentResult = await orchestrator.executeSkill('ContentCreator', {
        action: 'generate_text',
        topic: 'AI security best practices',
        style: 'professional',
        length: 'medium'
      }, {
        role: 'user',
        trustLevel: 2
      });
      
      console.log('✅ Content generation completed');
      console.log(`   Model: ${contentResult.model}`);
      console.log(`   Confidence: ${(contentResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Execution time: ${contentResult.executionTime}ms`);
    } catch (error) {
      console.log('❌ Content generation failed:', error);
    }
    console.log('');

    // 5. Reasoning Engine with Llama2
    console.log('5️⃣ Reasoning Engine (Llama2-13B):');
    try {
      const reasoningResult = await orchestrator.executeSkill('ReasoningEngine', {
        action: 'analyze_scenario',
        scenario: 'A system shows unusual memory usage patterns. What could be the causes?',
        context: 'production_environment'
      }, {
        role: 'admin',
        trustLevel: 3
      });
      
      console.log('✅ Reasoning analysis completed');
      console.log(`   Model: ${reasoningResult.model}`);
      console.log(`   Confidence: ${(reasoningResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Execution time: ${reasoningResult.executionTime}ms`);
    } catch (error) {
      console.log('❌ Reasoning analysis failed:', error);
    }
    console.log('');

    // 6. Link Review with Mistral
    console.log('6️⃣ Link Review (Mistral-7B):');
    try {
      const linkResult = await orchestrator.executeSkill('LinkReview', {
        action: 'analyze_url',
        url: 'https://example.com/security-guidelines',
        analysis_type: 'security'
      }, {
        role: 'user',
        trustLevel: 2
      });
      
      console.log('✅ Link analysis completed');
      console.log(`   Model: ${linkResult.model}`);
      console.log(`   Confidence: ${(linkResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Execution time: ${linkResult.executionTime}ms`);
    } catch (error) {
      console.log('❌ Link analysis failed:', error);
    }
    console.log('');

    // Show execution statistics
    console.log('📈 Execution Statistics:');
    console.log('========================\n');
    const stats = orchestrator.getExecutionStats();
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`${key}: ${count}`);
    });
    console.log('');

    // Show skill information
    console.log('🔍 Skill Information:');
    console.log('====================\n');
    const skills = orchestrator.listSkills();
    for (const skill of skills) {
      const info = orchestrator.getSkillInfo(skill.name);
      console.log(`${skill.name}:`);
      console.log(`  Task Type: ${skill.taskType}`);
      console.log(`  Preferred Model: ${skill.preferredModel}`);
      console.log(`  Trust Level: ${skill.trustLevel}`);
      console.log(`  Executions: ${info.executionStats.total}`);
      console.log(`  Success Rate: ${info.executionStats.total > 0 ? ((info.executionStats.success / info.executionStats.total) * 100).toFixed(1) : 0}%`);
      console.log('');
    }

    // Show learning data
    console.log('📚 Learning Data:');
    console.log('================\n');
    const learningData = orchestrator.getLearningData();
    console.log(`Total learning entries: ${learningData.length}`);
    
    // Group by task type
    const taskGroups: Record<string, number> = {};
    for (const entry of learningData) {
      const taskType = entry.taskType || 'unknown';
      taskGroups[taskType] = (taskGroups[taskType] || 0) + 1;
    }
    
    console.log('Learning data by task type:');
    Object.entries(taskGroups).forEach(([task, count]) => {
      console.log(`  ${task}: ${count} entries`);
    });
    console.log('');

    // Generate performance report
    console.log('📊 Performance Report:');
    console.log('====================\n');
    const reportPath = orchestrator.generatePerformanceReport();
    console.log(`Report generated: ${reportPath}`);
    console.log('');

    // Final system status
    console.log('🎯 Final System Status:');
    console.log('======================\n');
    console.log(JSON.stringify(orchestrator.getStatus(), null, 2));

  } finally {
    // Cleanup
    console.log('\n🔄 Shutting down...');
    await orchestrator.shutdown();
    console.log('✅ Local LLM demo complete!');
  }
}

// Demonstrate model specialization
async function demonstrateModelSpecialization() {
  console.log('🎯 Model Specialization Demo');
  console.log('==========================\n');

  const config: LocalOrchestratorConfig = {
    modelsPath: path.join(process.cwd(), 'models'),
    enableStreaming: false,
    maxConcurrency: 2,
    timeoutMs: 30000,
    learningEnabled: true,
    qualityThreshold: 0.7
  };

  const orchestrator = new LocalOrchestrator(config);
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Test same task with different models
    const testCode = 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2); }';
    
    console.log('Testing code analysis with different models:\n');
    
    // Test with CodeLlama (specialized)
    try {
      const result1 = await orchestrator.executeSkill('CodeHelper', {
        action: 'analyze_code',
        code: testCode
      }, { role: 'developer', trustLevel: 2 });
      
      console.log('📝 CodeLlama-7B Result:');
      console.log(`   Confidence: ${(result1.confidence * 100).toFixed(1)}%`);
      console.log(`   Time: ${result1.executionTime}ms`);
      console.log(`   Model: ${result1.model}`);
    } catch (error) {
      console.log('❌ CodeLlama failed:', error);
    }
    
    // Test with Mistral (general)
    try {
      const result2 = await orchestrator.executeSkill('DataAnalyzer', {
        action: 'analyze_code',
        code: testCode
      }, { role: 'developer', trustLevel: 2 });
      
      console.log('📝 Mistral-7B Result:');
      console.log(`   Confidence: ${(result2.confidence * 100).toFixed(1)}%`);
      console.log(`   Time: ${result2.executionTime}ms`);
      console.log(`   Model: ${result2.model}`);
    } catch (error) {
      console.log('❌ Mistral failed:', error);
    }
    
    console.log('\nThis demonstrates how different models specialize for different tasks.\n');

  } finally {
    await orchestrator.shutdown();
  }
}

// Demonstrate constitutional compliance
async function demonstrateConstitutionalCompliance() {
  console.log('🔐 Constitutional Compliance Demo');
  console.log('================================\n');

  const config: LocalOrchestratorConfig = {
    modelsPath: path.join(process.cwd(), 'models'),
    enableStreaming: false,
    maxConcurrency: 2,
    timeoutMs: 30000,
    learningEnabled: true,
    qualityThreshold: 0.7
  };

  const orchestrator = new LocalOrchestrator(config);
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Test safe operation
    console.log('1️⃣ Testing safe operation (should succeed):');
    try {
      const result1 = await orchestrator.executeSkill('CodeHelper', {
        action: 'analyze_code',
        code: 'console.log("Hello World");'
      }, {
        role: 'developer',
        trustLevel: 2
      });
      
      console.log('✅ Safe operation succeeded');
      console.log(`   Constitutional compliance: ${result1.constitutionalCompliance}`);
    } catch (error) {
      console.log('❌ Safe operation failed:', error);
    }
    
    // Test dangerous operation (should fail)
    console.log('\n2️⃣ Testing dangerous operation (should fail):');
    try {
      const result2 = await orchestrator.executeSkill('FileTools', {
        action: 'delete_system_files',
        path: '/etc/passwd'
      }, {
        role: 'user',
        trustLevel: 1
      });
      
      console.log('❌ Dangerous operation unexpectedly succeeded');
    } catch (error) {
      console.log('✅ Dangerous operation correctly blocked');
      console.log(`   Error: ${error}`);
    }
    
    // Test high-trust operation
    console.log('\n3️⃣ Testing high-trust operation with admin role:');
    try {
      const result3 = await orchestrator.executeSkill('SecurityObserver', {
        action: 'access_sensitive_logs',
        level: 'detailed'
      }, {
        role: 'admin',
        trustLevel: 3
      });
      
      console.log('✅ High-trust operation succeeded');
      console.log(`   Constitutional compliance: ${result3.constitutionalCompliance}`);
    } catch (error) {
      console.log('❌ High-trust operation failed:', error);
    }

  } finally {
    await orchestrator.shutdown();
  }
}

// Run demonstrations
async function runLocalDemo() {
  try {
    await demonstrateLocalLLM();
    await demonstrateModelSpecialization();
    await demonstrateConstitutionalCompliance();
  } catch (error) {
    console.error('Local LLM demo failed:', error);
  }
}

// Export for use in other modules
export {
  demonstrateLocalLLM,
  demonstrateModelSpecialization,
  demonstrateConstitutionalCompliance,
  runLocalDemo
};

// Run demo if this file is executed directly
if (require.main === module) {
  runLocalDemo().catch(console.error);
}
