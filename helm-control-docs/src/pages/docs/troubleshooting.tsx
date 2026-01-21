/**
 * Troubleshooting - Helm Control Documentation
 * Common issues and solutions
 */

import React from 'react';

export default function Troubleshooting() {
  return (
    <div className="container">
      <main>
        <h1>Troubleshooting</h1>
        <p>Common issues and solutions for Helm Control.</p>
        
        <div className="sections">
          <div className="section">
            <h2>🔧 Installation Issues</h2>
            
            <div className="issue">
              <h3>Package Installation Failed</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check your Node.js version (requires 16.0.0 or higher)</li>
                  <li>Clear npm cache: <code>npm cache clean --force</code></li>
                  <li>Try installing with yarn: <code>yarn add @helm/control</code></li>
                  <li>Check network connectivity to npm registry</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>Import Errors</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Ensure you're using TypeScript: <code>import { HelmClient } from '@helm/control'</code></li>
                  <li>Check your tsconfig.json includes module resolution</li>
                  <li>Verify package is installed in node_modules</li>
                  <li>Restart your development server</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>Build Errors</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check for TypeScript compilation errors: <code>npm run build</code></li>
                  <li>Verify all dependencies are installed</li>
                  <li>Check for syntax errors in your code</li>
                  <li>Review error logs for specific issues</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>🔑 Authentication Issues</h2>
            
            <div className="issue">
              <h3>Invalid API Key</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>API key must start with <code>pk_</code></li>
                  <li>API key must be at least 32 characters long</li>
                  <li>API key must contain only alphanumeric characters</li>
                  <li>Check for extra whitespace or special characters</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>License Validation Failed</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Verify license file path is correct</li>
                  <li>Check license file permissions (should be 400)</li>
                  <li>Validate license JSON format</li>
                  <li>Check license expiration date</li>
                  <li>Verify license signature is valid</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>Check-in Failed</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check network connectivity to helmcontrol.ai</li>
                  <li>Verify license ID is valid</li>
                  <li>Check firewall/proxy settings</li>
                  <li>Ensure check-in interval is correct (30 minutes)</li>
                  <li>Verify API endpoint is accessible</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>🚀 Runtime Issues</h2>
            
            <div className="issue">
              <h3>Session Creation Failed</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check API key is valid and active</li>
                  <li>Verify environment is correct (hosted/enterprise)</li>
                  <li>Check for network connectivity</li>
                  <li>Review session context parameters</li>
                  <li>Check browser console for specific error messages</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>Message Sending Failed</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Ensure session is active and not ended</li>
                  <li>Check message format and length</li>
                  <li>Verify skill permissions</li>
                  <li>Check stability monitoring status</li>
                  <li>Review audit logs for errors</li>
                </ul>
              </div>
            </div>
            <div className="issue">
              <h3>Skill Execution Denied</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check skill permissions against user tier</li>
                  <li>Verify skill is allowed by license</li>
                  <li>Check if skill is in incident mode</li>
                  <li>Review skill execution mode (read/write/deploy)</li>
                  <li>Check resource limits</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>Emergency Lock Triggered</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check license validation status</li>
                  <li>Verify check-in connectivity</li>
                  <li>Check for tamper detection alerts</li>
                  <li>Review system resource usage</li>
                  <li>Check for stability failures</li>
                  <li>Review audit logs for security events</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>🌐 Network Issues</h2>
            
            <div className="issue">
              <h3>Connection Timeout</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check network connectivity</li>
                  <li>Verify API endpoint is accessible</li>
                  <li>Check firewall/proxy settings</li>
                  <li>Increase timeout duration</li>
                  <li>Use network monitoring tools</li>
                  <li>Check DNS resolution</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>CORS Errors</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Ensure CORS is configured on server</li>
                  <li>Check allowed origins list</li>
                  <li>Verify preflight requests</li>
                  <li>Check authentication headers</li>
                  <li>Use browser developer tools to debug</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>SSL/TLS Issues</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check SSL certificate validity</li>
                  <li>Verify certificate chain</li>
                  <li>Check certificate common name</li>
                  <li>Ensure HTTPS is properly configured</li>
                  <li>Check browser security settings</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>📱 Performance Issues</h2>
            
            <div className="issue">
              <h3>Slow Response Times</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Check network latency</li>
                  <li>Monitor server resource usage</li>
                  <li>Check for rate limiting</li>
                  <li>Optimize message content</li>
                  <li>Use caching for repeated requests</li>
                  <li>Consider enabling telemetry for performance insights</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>Memory Leaks</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Properly end sessions when done</li>
                  <li>Clean up event listeners</li>
                  <li>Monitor memory usage</li>
                  <li>Use weak references where appropriate</li>
                  <li>Implement proper cleanup in error handlers</li>
                  <li>Use memory profiling tools</li>
                </ul>
              </div>
            </div>
            
            <div className="issue">
              <h3>CPU Usage High</h3>
              <div className="solution">
                <h4>Solution:</h4>
                <ul>
                  <li>Monitor CPU usage patterns</li>
                  <li>Optimize message processing</li>
                  <li>Use worker threads for heavy operations</li>
                  <li>Implement rate limiting</li>
                  <li>Consider enabling stability monitoring</li>
                  <li>Scale horizontally if needed</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="section">
            <h2>🔍 Debugging Tips</h2>
            
            <div className="tips">
              <h3>Enable Debug Logging</h3>
              <ul>
                <li>Set environment variable: <code>HELM_DEBUG=true</code></li>
                <li>Use browser console for client-side debugging</li>
                <li>Check server logs for detailed error information</li>
                <li>Use <code>Helm.on('debug', console.log)</code> for debug events</li>
              </ul>
            </div>
            
              <div className="tips">
                <h3>Network Debugging</h3>
              <ul>
                <li>Use browser network tab to inspect requests</li>
                <li>Check request/response headers</li>
                <li>Monitor WebSocket connections</li>
                <li>Use curl for API testing</li>
                <li>Check response status codes</li>
                <li>Use network throttling simulation</li>
              </ul>
            </div>
            
              <div className="tips">
                <h3>License Debugging</h3>
              <ul>
                <li>Check license file contents</li>
                <li>Verify license signature manually</li>
                <li>Check license expiration date</li>
                <li>Monitor check-in logs</li>
                <li>Use license validation tools</li>
              </ul>
            </div>
            
              <div className="tips">
                <h3>Session Debugging</h3>
                <ul>
                  <li>Use session metadata to track state</li>
                  <li>Log session lifecycle events</li>
                  <li>Monitor session resource usage</li>
                  <li>Check session context validity</li>
                  <li>Use session event handlers for debugging</li>
                </ul>
              </div>
          </div>
          
          <div className="section">
            <h2>📞 Support Resources</h2>
            
            <div className="resources">
              <h3>Getting Help</h3>
              <ul>
                <li><a href="mailto:support@helmcontrol.ai">Email Support</a></li>
                <li><a href="https://docs.helmcontrol.ai">Documentation</a></li>
                <li><a href="https://github.com/helmcontrol/helm-control">GitHub Issues</a></li>
                <li><a href="https://discord.gg/helm">Discord Community</a></li>
              </ul>
            </div>
            
            <div className="resources">
              <h3>Community</h3>
              <ul>
                <li><a href="https://github.com/helmcontrol/helm-control/discussions">GitHub Discussions</a></li>
                <li><a href="https://stackoverflow.com/questions/tagged/helm-control">Stack Overflow</a></li>
                <li><a href="https://reddit.com/r/helmcontrol">Reddit Community</a></li>
                <li><a href="https://twitter.com/helmcontrol">Twitter Updates</a></li>
              </ul>
            </div>
            
              <div className="resources">
                <h3>Enterprise Support</h3>
              <ul>
                <li><a href="mailto:enterprise@helmcontrol.ai">Enterprise Email</a></li>
                <li><a href="https://helmcontrol.ai/enterprise">Enterprise Portal</a></li>
                <li><a href="https://helmcontrol.ai/training">Training & Onboarding</a></li>
                <li><a href="https://helmcontrol.ai/consulting">Consulting Services</a></li>
              </ul>
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
        
        .sections {
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
        
        .issue {
          margin-bottom: 2rem;
          border-left: 3px solid #e74c3c;
          padding-left: 1rem;
        }
        
        .issue h3 {
          color: #e74c3c;
          margin-bottom: 1rem;
        }
        
        .solution h4 {
          color: #28a745;
          margin-bottom: 0.5rem;
        }
        
        .solution ul {
          margin: 0;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .solution li {
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
        
        .tips {
          margin-top: 2rem;
        }
        
        .tips h3 {
          color: #333;
          margin-bottom: 1rem;
        }
        
        .tips ul {
          margin: 0;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .tips li {
          margin-bottom: 0.5rem;
          color: #555;
        }
        
        .resources {
          margin-top: 3rem;
        }
        
        .resources h3 {
          color: #333;
          margin-bottom: 1rem;
        }
        
        .resources ul {
          margin: 0;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .resources li {
          margin-bottom: 0.5rem;
          color: #555;
        }
        
        .resources a {
          color: #667eea;
          text-decoration: none;
        }
        
        .resources a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
