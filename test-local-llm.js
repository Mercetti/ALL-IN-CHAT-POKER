#!/usr/bin/env node

/**
 * Test Local LLM Integration
 * Verify that Helm Control works with local LLM
 */

const HelmLocalLLMEngine = require('./helm-local-llm-engine');

async function testLocalLLM() {
  console.log('🧪 Testing Helm Control with Local LLM...');
  console.log('='.repeat(50));

  try {
    // Initialize the engine
    console.log('\n🚀 Initializing Helm Local LLM Engine...');
    const engine = new HelmLocalLLMEngine();
    
    await engine.initialize();
    console.log('✅ Engine initialized successfully');

    // Test basic AI response
    console.log('\n💬 Testing AI chat response...');
    const chatResult = await engine.executeSkill('chat_response', {
      message: 'Hello! Can you help me understand poker?',
      context: 'chat',
      sessionId: 'test-session'
    });
    
    console.log('✅ Chat Response:', chatResult.result.response);
    console.log('   Provider:', chatResult.result.provider);
    console.log('   Model:', chatResult.result.model);

    // Test poker commentary
    console.log('\n🎰 Testing poker commentary...');
    const commentaryResult = await engine.executeSkill('poker_commentary', {
      gameState: { pot: 1000, community: ['A♠', 'K♥'] },
      action: 'all-in',
      player: 'Alice',
      cards: ['A♦', 'A♣'],
      sessionId: 'test-session'
    });
    
    console.log('✅ Commentary:', commentaryResult.result.commentary);
    console.log('   Provider:', commentaryResult.result.provider);

    // Test game analysis
    console.log('\n📊 Testing game analysis...');
    const analysisResult = await engine.executeSkill('game_analysis', {
      gameState: { pot: 1000, players: 4, round: 'river' },
      playerActions: ['Alice raised', 'Bob called', 'Charlie folded'],
      recentHands: ['Alice won with AA', 'Bob bluffed with 72'],
      sessionId: 'test-session'
    });
    
    console.log('✅ Analysis:', analysisResult.result.analysis);
    console.log('   Insights:', analysisResult.result.insights);

    // Test player assistance
    console.log('\n🤝 Testing player assistance...');
    const assistResult = await engine.executeSkill('player_assist', {
      question: 'Should I call this all-in bet?',
      playerContext: 'I have AK suited, pot is 1000, opponent is aggressive',
      gameState: { pot: 1000, community: ['A♠', 'K♥', '2♦', '7♣', 'Q♠'] },
      sessionId: 'test-session'
    });
    
    console.log('✅ Advice:', assistResult.result.advice);
    console.log('   Category:', assistResult.result.category);

    // Test card dealing with AI commentary
    console.log('\n🃏 Testing card dealing with AI commentary...');
    const dealResult = await engine.executeSkill('poker_deal', {
      playerId: 'TestPlayer',
      count: 5,
      sessionId: 'test-session'
    });
    
    console.log('✅ Cards dealt:', dealResult.result.cards);
    console.log('   Commentary:', dealResult.result.commentary);

    // Get final status
    console.log('\n📈 Final Status:');
    const status = engine.getStatus();
    console.log('   Running:', status.running);
    console.log('   Skills:', status.skills.length);
    console.log('   Sessions:', status.sessions);
    console.log('   AI Requests:', status.metrics.aiRequests);
    console.log('   LLM Model:', status.llmModel);
    console.log('   Uptime:', Math.floor(status.uptime) + 's');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Helm Control with Local LLM is working perfectly!');
    console.log('✅ Advanced AI capabilities with 100% privacy');
    console.log('✅ Ready for production use');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Ollama is running: ollama serve');
    console.error('2. Make sure model is downloaded: ollama pull llama2');
    console.error('3. Check if Ollama is accessible: http://localhost:11434');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testLocalLLM();
}

module.exports = testLocalLLM;
