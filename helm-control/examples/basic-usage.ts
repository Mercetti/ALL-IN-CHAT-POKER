/**
 * Basic Usage Example - Helm Control SDK
 * Demonstrates simple client setup and session management
 */

import { HelmClient } from '@helm/control';

async function basicUsageExample() {
  // Initialize Helm Client
  const helm = new HelmClient({
    apiKey: 'pk_live_your_api_key_here',
    environment: 'hosted',
    telemetry: true
  });

  try {
    // Start a session
    const session = helm.startSession({
      domain: 'web',
      userId: 'user123',
      channel: 'general'
    });

    // List available skills
    const skills = helm.listSkills();
    console.log('Available skills:', skills);

    // Send a message to the session
    const response = await session.send('Hello, how can you help me?');
    console.log('Response:', response);

    // End the session
    session.end();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean shutdown
    helm.shutdown();
  }
}

// Enterprise usage example
async function enterpriseUsageExample() {
  const helm = new HelmClient({
    apiKey: 'pk_live_enterprise_key',
    environment: 'enterprise',
    endpoint: 'https://api.helmcontrol.ai/v1',
    telemetry: true
  });

  const session = helm.startSession({
    domain: 'enterprise',
    userId: 'admin',
    department: 'IT'
  });

  // Enterprise-specific operations
  const response = await session.send('Run system diagnostics');
  console.log('Enterprise response:', response);

  session.end();
  helm.shutdown();
}

export { basicUsageExample, enterpriseUsageExample };
