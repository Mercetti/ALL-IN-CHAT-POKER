/**
 * Quick Start Guide - Helm Control Documentation
 */

import React from 'react';

export default function QuickStart() {
  return (
    <div className="container">
      <main>
        <h1>Quick Start</h1>
        <p>Get Helm Control running in your application in just a few minutes.</p>
        
        <div className="steps">
          <div className="step">
            <h2>Step 1: Installation</h2>
            <div className="code-block">
              <pre><code>{`# Install via npm
npm install @helm/control

# Or via yarn
yarn add @helm/control`}</code></pre>
            </div>
          </div>
          
          <div className="step">
            <h2>Step 2: Basic Setup</h2>
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

const helm = new HelmClient({
  apiKey: 'your-api-key',
  environment: 'hosted',
  telemetry: true
});`}</code></pre>
            </div>
          </div>
          
          <div className="step">
            <h2>Step 3: Start a Session</h2>
            <div className="code-block">
              <pre><code>{`const session = helm.startSession({
  domain: 'web',
  userId: 'user123'
});`}</code></pre>
            </div>
          </div>
          
          <div className="step">
            <h2>Step 4: Send Messages</h2>
            <div className="code-block">
              <pre><code>{`const response = await session.send('Hello, how can you help me?');
console.log(response);`}</code></pre>
            </div>
          </div>
          
          <div className="step">
            <h2>Step 5: Clean Shutdown</h2>
            <div className="code-block">
              <pre><code>{`session.end();
helm.shutdown();`}</code></pre>
            </div>
          </div>
        </div>
        
        <div className="examples">
          <h2>Complete Example</h2>
          <div className="code-block">
            <pre><code>{`import { HelmClient } from '@helm/control';

async function runHelm() {
  const helm = new HelmClient({
    apiKey: 'pk_live_your_api_key',
    environment: 'hosted',
    telemetry: true
  });

  const session = helm.startSession({
    domain: 'web',
    userId: 'user123'
  });

  try {
    const response = await session.send('Hello!');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    session.end();
    helm.shutdown();
  }
}

runHelm();`}</code></pre>
          </div>
        </div>
        
        <div className="next-steps">
          <h2>Next Steps</h2>
          <ul>
            <li>📖 <a href="/docs/api">API Reference</a></li>
            <li>🔧 <a href="/docs/integration">Integration Guides</a></li>
            <li>💡 <a href="/docs/examples">Examples</a></li>
            <li>❓ <a href="/docs/troubleshooting">Troubleshooting</a></li>
          </ul>
        </div>
      </main>
      
      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #333;
        }
        
        p {
          color: #666;
          margin-bottom: 2rem;
        }
        
        .steps {
          margin-bottom: 3rem;
        }
        
        .step {
          margin-bottom: 2rem;
          padding: 1.5rem;
          border: 1px solid #e1e1e1;
          border-radius: 8px;
        }
        
        .step h2 {
          color: #667eea;
          margin-bottom: 1rem;
        }
        
        .code-block {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 1rem;
          overflow-x: auto;
        }
        
        .code-block pre {
          margin: 0;
        }
        
        .code-block code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
        }
        
        .examples {
          margin-bottom: 3rem;
        }
        
        .examples h2 {
          color: #333;
          margin-bottom: 1rem;
        }
        
        .next-steps {
          margin-top: 3rem;
        }
        
        .next-steps h2 {
          color: #333;
          margin-bottom: 1rem;
        }
        
        .next-steps ul {
          list-style: none;
          padding: 0;
        }
        
        .next-steps li {
          margin-bottom: 0.5rem;
        }
        
        .next-steps a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }
        
        .next-steps a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
