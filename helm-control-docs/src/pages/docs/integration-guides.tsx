/**
 * Integration Guides - Helm Control Documentation
 * Step-by-step integration tutorials for different platforms
 */

import React from 'react';

export default function IntegrationGuides() {
  return (
    <div className="container">
      <main>
        <h1>Integration Guides</h1>
        <p>Step-by-step tutorials for integrating Helm Control into your applications.</p>
        
        <div className="guides">
          <div className="guide">
            <h2>🌐 Web Application Integration</h2>
            <p>Integrate Helm Control into your web application using the hosted JS loader.</p>
            
            <div className="steps">
              <div className="step">
                <h3>Step 1: Include the JS Loader</h3>
                <div className="code-block">
                  <pre><code>{`<!-- Add to your HTML head -->
<script src="https://cdn.helmcontrol.ai/helm.js"
        data-api-key="pk_live_your_api_key"
        data-mode="observer">
</script>`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 2: Initialize Helm Control</h3>
                <div className="code-block">
                  <pre><code>{`// Auto-initialization happens automatically
// Or create instance manually
const helm = Helm.create({
  apiKey: 'pk_live_your_api_key',
  mode: 'observer'
});

// Wait for initialization
helm.on('initialized', (data) => {
  console.log('Helm ready:', data.sessionId);
});`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 3: Send Messages</h3>
                <div className="code-block">
                  <pre><code>{`// Send a message
const response = await Helm.send('Hello, how can you help me?');
console.log('Response:', response);

// Enable a skill
await Helm.enableSkill('uptime_monitor');

// Listen for events
Helm.on('response', (data) => {
  console.log('Received:', data);
});`}</code></pre>
                </div>
              </div>
            </div>
            
            <div className="code-block">
              <pre><code>{`// Complete example
<!DOCTYPE html>
<html>
<head>
  <title>Helm Control Integration</title>
  <script src="https://cdn.helmcontrol.ai/helm.js"
          data-api-key="pk_live_your_api_key"
          data-mode="observer">
  </script>
</head>
<body>
  <div id="app">
    <input type="text" id="message" placeholder="Enter message...">
    <button onclick="sendMessage()">Send</button>
    <div id="response"></div>
  </div>

  <script>
    async function sendMessage() {
      const input = document.getElementById('message');
      const responseDiv = document.getElementById('response');
      
      try {
        const response = await Helm.send(input.value);
        responseDiv.textContent = response.response;
      } catch (error) {
        responseDiv.textContent = 'Error: ' + error.message;
      }
    }
  </script>
</body>
</html>`}</code></pre>
            </div>
          </div>
          
          <div className="guide">
            <h2>📱 React Application Integration</h2>
            <p>Integrate Helm Control into your React application using the npm package.</p>
            
            <div className="steps">
              <div className="step">
                <h3>Step 1: Install Package</h3>
                <div className="code-block">
                  <pre><code>{`npm install @helm/control`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 2: Create Helm Hook</h3>
                <div className="code-block">
                  <pre><code>{`import { useState, useEffect } from 'react';
import { HelmClient } from '@helm/control';

function useHelm(config) {
  const [helm, setHelm] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const helmClient = new HelmClient(config);
    
    helmClient.initialize()
      .then(() => {
        setHelm(helmClient);
        const sessionInstance = helmClient.startSession({
          domain: 'react-app',
          userId: 'user123'
        });
        setSession(sessionInstance);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    return () => {
      if (session) {
        session.end();
      }
      if (helm) {
        helm.shutdown();
      }
    };
  }, [config]);

  return { helm, session, loading, error };
}

// Usage in component
function ChatComponent() {
  const { helm, session, loading, error } = useHelm({
    apiKey: 'pk_live_your_api_key',
    environment: 'hosted'
  });

  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const handleSend = async () => {
    if (!session) return;
    
    try {
      const result = await session.send(message);
      setResponse(result.response);
    } catch (err) {
      setResponse('Error: ' + err.message);
    }
  };

  if (loading) return <div>Loading Helm...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message..."
      />
      <button onClick={handleSend}>Send</button>
      <div>{response}</div>
    </div>
  );
}`}</code></pre>
                </div>
              </div>
            </div>
          </div>
          
          <div className="guide">
            <h2>🏢 Enterprise Docker Integration</h2>
            <p>Deploy Helm Control in your enterprise environment using Docker.</p>
            
            <div className="steps">
              <div className="step">
                <h3>Step 1: Create License File</h3>
                <div className="code-block">
                  <pre><code>{`{
  "license_id": "helm-ent-12345",
  "org": "Your Company",
  "tier": "enterprise",
  "skills_allowed": ["*"],
  "max_nodes": 3,
  "expires": "2027-01-01",
  "signature": "BASE64_RSA_SIGNATURE"
}`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 2: Create docker-compose.yml</h3>
                <div className="code-block">
                  <pre><code>{`version: '3.8'

services:
  helm-engine:
    image: helm/control:enterprise
    environment:
      - HELM_LICENSE_PATH=/license/helm.json
      - HELM_CHECKIN_REQUIRED=true
      - HELM_TAMPER_DETECTION=true
    volumes:
      - ./license:/license:ro
      - ./data:/app/data
    ports:
      - "8080:8080"`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 3: Start Services</h3>
                <div className="code-block">
                  <pre><code>{`# Start Helm Control
docker-compose up -d

# Check logs
docker-compose logs helm-engine

# Check health
curl http://localhost:8080/health`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 4: Integrate with Application</h3>
                <div className="code-block">
                  <pre><code>{`import { HelmClient } from '@helm/control';

const helm = new HelmClient({
  environment: 'enterprise',
  licensePath: '/license/helm.json'
});

// License is automatically validated
// Skills are checked against permissions
const session = helm.startSession({
  domain: 'enterprise',
  userId: 'admin'
});`}</code></pre>
                </div>
              </div>
            </div>
          </div>
          
          <div className="guide">
            <h2>🔧 Node.js Integration</h2>
            <p>Integrate Helm Control into your Node.js backend application.</p>
            
            <div className="steps">
              <div className="step">
                <h3>Step 1: Install Package</h3>
                <div className="code-block">
                  <pre><code>{`npm install @helm/control`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 2: Create Helm Service</h3>
                <div className="code-block">
                  <pre><code>{`// helm-service.js
const { HelmClient } = require('@helm/control');

class HelmService {
  constructor(config) {
    this.client = new HelmClient(config);
    this.sessions = new Map();
  }

  async createSession(userId, context = {}) {
    const session = this.client.startSession({
      domain: 'node-app',
      userId,
      ...context
    });
    
    this.sessions.set(userId, session);
    return session;
  }

  async sendMessage(userId, message) {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    return await session.send(message);
  }

  async endSession(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      session.end();
      this.sessions.delete(userId);
    }
  }

  async shutdown() {
    // End all sessions
    for (const [userId, session] of this.sessions) {
      session.end();
    }
    this.sessions.clear();
    
    // Shutdown client
    this.client.shutdown();
  }
}

module.exports = HelmService;`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 3: Use in Express App</h3>
                <div className="code-block">
                  <pre><code>{`// app.js
const express = require('express');
const HelmService = require('./helm-service');

const app = express();
const helmService = new HelmService({
  apiKey: process.env.HELM_API_KEY,
  environment: 'hosted'
});

// Middleware to attach Helm session
app.use((req, res, next) => {
  req.helm = helmService;
  next();
});

app.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    const response = await req.helm.sendMessage(userId, message);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`}</code></pre>
                </div>
              </div>
            </div>
          </div>
          
          <div className="guide">
            <h2>📱 Mobile App Integration</h2>
            <p>Integrate Helm Control into your mobile application.</p>
            
            <div className="steps">
              <div className="step">
                <h3>Step 1: React Native</h3>
                <div className="code-block">
                  <pre><code>{`npm install @helm-control

// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { Helm } from '@helm/control';

function App() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Helm
    Helm.on('initialized', (data) => {
      console.log('Helm ready:', data);
    });
  }, []);

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await Helm.send(message);
      setResponse(result.response);
    } catch (error) {
      setResponse('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Enter message..."
        style={{ marginBottom: 10 }}
      />
      <Button 
        title={loading ? "Sending..." : "Send"}
        onPress={handleSend}
        disabled={loading}
        style={{ marginBottom: 10 }}
      />
      <Text>{response}</Text>
    </View>
  );
}`}</code></pre>
                </div>
              </div>
              
              <div className="step">
                <h3>Step 2: Expo Integration</h3>
                <div className="code-block">
                  <pre><code>{`# app.json
{
  "expo": {
    "name": "your-app",
    "plugins": ["expo-linear-gradient"]
  }
}`}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="troubleshooting">
          <h2>🔧 Troubleshooting</h2>
          
          <div className="issue">
            <h3>Common Issues</h3>
            
            <div className="problem">
              <h4>API Key Invalid</h4>
              <p>Ensure your API key starts with <code>pk_</code> and is at least 32 characters long.</p>
            </div>
            
            <div className="problem">
              <h4>License Validation Failed</h4>
              <p>Check that your license file is properly formatted and not expired.</p>
            </div>
            
            <div className="problem">
              <h4>Connection Issues</h4>
              <p>Verify your network connection and that the Helm Control API is accessible.</p>
            </div>
            
            <div className="problem">
              <h4>Skill Not Allowed</h4>
              <p>Check your license tier and skill permissions.</p>
            </div>
          </div>
          
          <div className="debugging">
            <h3>Debugging Tips</h3>
            <ul>
              <li>Enable debug logging: <code>Helm.on('debug', console.log)</code></li>
              <li>Check browser console for error messages</li>
              <li>Verify API key format and permissions</li>
              <li>Test with simple messages first</li>
              <li>Check network tab for failed requests</li>
            </ul>
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
        
        .guides {
          display: grid;
          gap: 3rem;
        }
        
        .guide {
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          padding: 2rem;
        }
        
        .guide h2 {
          color: #667eea;
          margin-bottom: 1.5rem;
        }
        
        .steps {
          display: grid;
          gap: 2rem;
        }
        
        .step {
          border-left: 3px solid #667eea;
          padding-left: 1rem;
        }
        
        .step h3 {
          color: #333;
          margin-bottom: 1rem;
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
        
        .troubleshooting {
          margin-top: 3rem;
        }
        
        .troubleshooting h2 {
          color: #333;
          margin-bottom: 2rem;
        }
        
        .issue {
          margin-bottom: 2rem;
        }
        
        .issue h4 {
          color: #e74c3c;
          margin-bottom: 0.5rem;
        }
        
        .issue p {
          color: #666;
        }
        
        .debugging {
          margin-top: 2rem;
        }
        
        .debugging h3 {
          color: #333;
          margin-bottom: 1rem;
        }
        
        .debugging ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        
        .debugging li {
          margin-bottom: 0.5rem;
          color: #555;
        }
      `}</style>
    </div>
  );
}
