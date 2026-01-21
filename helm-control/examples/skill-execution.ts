/**
 * Skill Execution Example - Helm Control SDK
 * Demonstrates skill invocation and permission handling
 */

import { HelmClient } from '@helm/control';

async function skillExecutionExample() {
  const helm = new HelmClient({
    apiKey: 'pk_live_your_api_key_here',
    environment: 'hosted'
  });

  const session = helm.startSession({
    domain: 'poker',
    userId: 'player123'
  });

  try {
    // Execute a skill directly
    const dealResult = await session.send('!deal');
    console.log('Deal result:', dealResult);

    // Execute another skill
    const betResult = await session.send('!bet 100');
    console.log('Bet result:', betResult);

    // Try to execute a skill that might be denied
    const adminResult = await session.send('!admin_reset');
    console.log('Admin result:', adminResult);

  } catch (error) {
    console.error('Skill execution error:', error);
  } finally {
    session.end();
    helm.shutdown();
  }
}

// Permission handling example
async function permissionHandlingExample() {
  const helm = new HelmClient({
    apiKey: 'pk_test_free_tier_key',
    environment: 'hosted'
  });

  const session = helm.startSession({
    domain: 'web',
    userId: 'free_user'
  });

  // This should work for free tier
  const chatResult = await session.send('Hello! Can you help me?');
  console.log('Chat result:', chatResult);

  // This might be denied for free tier
  try {
    const analyticsResult = await session.send('!analytics detailed_report');
    console.log('Analytics result:', analyticsResult);
  } catch (error) {
    console.log('Expected permission error:', error.message);
  }

  session.end();
  helm.shutdown();
}

export { skillExecutionExample, permissionHandlingExample };
