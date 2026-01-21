/**
 * API Reference - Helm Control Documentation
 * Complete API documentation for all Helm Control modules
 */

import React from 'react';

export default function APIReference() {
  return (
    <div className="container">
      <main>
        <h1>API Reference</h1>
        <p>Complete API documentation for Helm Control SDK.</p>
        
        <div className="api-sections">
          <div className="section">
            <h2>HelmClient</h2>
            <p>Main SDK client for Helm Control.</p>
            
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

const helm = new HelmClient({
  apiKey: 'your-api-key',
  environment: 'hosted',
  telemetry: true
});`}</code></pre>
            </div>
            
            <div className="methods">
              <h3>Constructor</h3>
              <div className="method-signature">
                <code>new HelmClient(config: HelmClientConfig)</code>
              </div>
              
              <h4>Parameters</h4>
              <ul>
                <li><code>config.apiKey</code> (string) - Your Helm Control API key</li>
                <li><code>config.environment</code> (string) - 'hosted' | 'enterprise'</li>
                <li><code>config.endpoint</code> (string, optional) - Custom endpoint URL</li>
                <li><code>config.telemetry</code> (boolean, optional) - Enable telemetry</li>
                <li><code>config.licensePath</code> (string, optional) - License file path (enterprise)</li>
              </ul>
              
              <h3>Methods</h3>
              
              <div className="method">
                <h4>startSession(context)</h4>
                <div className="method-signature">
                  <code>startSession(context: Record&lt;string, unknown&gt;): HelmSession</code>
                </div>
                <p>Start a new Helm session with the given context.</p>
              </div>
              
              <div className="method">
                <h4>listSkills()</h4>
                <div className="method-signature">
                  <code>listSkills(): SkillManifest[]</code>
                </div>
                <p>Get list of available skills.</p>
              </div>
              
              <div className="method">
                <h4>shutdown()</h4>
                <div className="method-signature">
                  <code>shutdown(): void</code>
                </div>
                <p>Shutdown the Helm client and clean up resources.</p>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>HelmSession</h2>
            <p>Session management for user interactions.</p>
            
            <div className="methods">
              <div className="method">
                <h4>send(message)</h4>
                <div className="method-signature">
                  <code>send(message: string): Promise&lt;any&gt;</code>
                </div>
                <p>Send a message to the session and get a response.</p>
              </div>
              
              <div className="method">
                <h4>end()</h4>
                <div className="method-signature">
                  <code>end(): void</code>
                </div>
                <p>End the session and clean up resources.</p>
              </div>
              
              <div className="method">
                <h4>on(event, handler)</h4>
                <div className="method-signature">
                  <code>on(event: string, handler: Function): void</code>
                </div>
                <p>Register an event handler for the session.</p>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>LicenseManager</h2>
            <p>Enterprise license enforcement and validation.</p>
            
            <div className="methods">
              <div className="method">
                <h4>initialize(licenseSource)</h4>
                <div className="method-signature">
                  <code>initialize(licenseSource: string | HelmLicense): Promise&lt;void&gt;</code>
                </div>
                <p>Initialize license validation.</p>
              </div>
              
              <div className="method">
                <h4>canExecuteSkill(skillId)</h4>
                <div className="method-signature">
                  <code>canExecuteSkill(skillId: string): boolean</code>
                </div>
                <p>Check if a skill is allowed by the license.</p>
              </div>
              
              <div className="method">
                <h4>getLicenseInfo()</h4>
                <div className="method-signature">
                  <code>getLicenseInfo(): LicenseStatus</code>
                </div>
                <p>Get current license status and information.</p>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>EnterpriseAuditLogger</h2>
            <p>Enterprise-grade audit logging with immutable trails.</p>
            
            <div className="methods">
              <div className="method">
                <h4>setMode(mode)</h4>
                <div className="method-signature">
                  <code>setMode(mode: 'standard' | 'audit' | 'incident'): void</code>
                </div>
                <p>Set audit mode (Standard, Audit, or Incident).</p>
              </div>
              
              <div className="method">
                <h4>exportAuditTrail()</h4>
                <div className="method-signature">
                  <code>exportAuditTrail(): string</code>
                </div>
                <p>Export complete audit trail with integrity verification.</p>
              </div>
              
              <div className="method">
                <h4>isSkillAllowed(skillId)</h4>
                <div className="method-signature">
                  <code>isSkillAllowed(skillId: string): boolean</code>
                </div>
                <p>Check if skill is allowed in current audit mode.</p>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>SkillMarketplace</h2>
            <p>Skill marketplace with signature enforcement.</p>
            
            <div className="methods">
              <div className="method">
                <h4>submitSkill(submission)</h4>
                <div className="method-signature">
                  <code>submitSkill(submission: SkillSubmission): Promise&lt;ValidationResult&gt;</code>
                </div>
                <p>Submit a skill for marketplace review.</p>
              </div>
              
              <div className="method">
                <h4>approveSkill(submissionId)</h4>
                <div className="method-signature">
                  <code>approveSkill(submissionId: string): Promise&lt;HelmSkillManifest&gt;</code>
                </div>
                <p>Approve and publish a skill submission.</p>
              </div>
              
              <div className="method">
                <h4>verifySkillSignature(skill)</h4>
                <div className="method-signature">
                  <code>verifySkillSignature(skill: HelmSkillManifest): boolean</code>
                </div>
                <p>Verify skill signature before loading.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="examples">
          <h2>Code Examples</h2>
          
          <div className="example">
            <h3>Basic Usage</h3>
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

// Initialize client
const helm = new HelmClient({
  apiKey: 'pk_live_your_api_key',
  environment: 'hosted',
  telemetry: true
});

// Start session
const session = helm.startSession({
  domain: 'web',
  userId: 'user123'
});

// Send message
const response = await session.send('Hello!');
console.log(response);

// End session
session.end();
helm.shutdown();`}</code></pre>
            </div>
          </div>
          
          <div className="example">
            <h3>Enterprise Deployment</h3>
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

// Enterprise with license file
const helm = new HelmClient({
  apiKey: 'pk_enterprise_your_key',
  environment: 'enterprise',
  licensePath: '/etc/helm/license.json',
  telemetry: true
});

// License is automatically validated
// Skills are checked against license permissions
const session = helm.startSession({
  domain: 'enterprise',
  userId: 'admin'
});`}</code></pre>
            </div>
          </div>
          
          <div className="example">
            <h3>Skill Execution</h3>
            <div className="code-block">
              <pre><code>{`// List available skills
const skills = helm.listSkills();
console.log('Available skills:', skills);

// Execute a skill
const response = await session.send('!analytics');
console.log('Analytics result:', response);

// Check if skill is allowed
const canExecute = helm.license.canExecuteSkill('analytics');
if (canExecute) {
  await session.send('!analytics');
} else {
  console.log('Skill not allowed by license');
}`}</code></pre>
            </div>
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .container {
          max-width: 1000px;
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
        
        .api-sections {
          display: grid;
          gap: 3rem;
        }
        
        .section {
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          padding: 2rem;
        }
        
        .section h2 {
          color: #667eea;
          margin-bottom: 1.5rem;
        }
        
        .methods {
          display: grid;
          gap: 2rem;
        }
        
        .method {
          border-left: 3px solid #667eea;
          padding-left: 1rem;
        }
        
        .method h4 {
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .method-signature {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        
        .method ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        
        .method li {
          margin-bottom: 0.5rem;
          color: #555;
        }
        
        .code-block {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 1rem;
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        
        .code-block pre {
          margin: 0;
        }
        
        .code-block code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
        }
        
        .examples {
          margin-top: 3rem;
        }
        
        .examples h2 {
          color: #333;
          margin-bottom: 2rem;
        }
        
        .example {
          margin-bottom: 2rem;
        }
        
        .example h3 {
          color: #667eea;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
