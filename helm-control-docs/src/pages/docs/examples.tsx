/**
 * Examples - Helm Control Documentation
 * Real-world usage examples and patterns
 */

import React from 'react';

export default function Examples() {
  return (
    <div className="container">
      <main>
        <h1>Examples</h1>
        <p>Real-world usage examples and patterns for Helm Control.</p>
        
        <div className="examples">
          <div className="example">
            <h2>📊 Analytics Dashboard</h2>
            <p>Build an analytics dashboard with Helm-powered insights.</p>
            
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

class AnalyticsDashboard {
  constructor() {
    this.helm = new HelmClient({
      apiKey: process.env.HELM_API_KEY,
      environment: 'hosted'
    });
  }

  async getAnalyticsData(timeRange) {
    const session = this.helm.startSession({
      domain: 'analytics',
      userId: 'dashboard-user'
    });

    try {
      const response = await session.send('!analytics ' + JSON.stringify({
        timeRange,
        metrics: ['page_views', 'users', 'conversions', 'revenue']
      }));

      return response.data;
    } finally {
      session.end();
    }
  }

  async generateReport(reportType) {
    const session = this.helm.startSession({
      domain: 'analytics',
      userId: 'dashboard-user'
    });

    try {
      const response = await session.send('!generate_report ' + JSON.stringify({
        type: reportType,
        format: 'pdf',
        includeCharts: true
      }));

      return response.downloadUrl;
    } finally {
      session.end();
    }
  }

  async getRealtimeMetrics() {
    const session = this.helm.startSession({
      domain: 'analytics',
      userId: 'dashboard-user'
    });

    // Set up real-time monitoring
    session.on('metrics_update', (data) => {
      this.updateDashboard(data);
    });

    try {
      await session.send('!start_monitoring');
      return true;
    } finally {
      session.end();
    }
  }
}

// Usage
const dashboard = new AnalyticsDashboard();
const data = await dashboard.getAnalyticsData('7d');
const reportUrl = await dashboard.generateReport('monthly');
await dashboard.getRealtimeMetrics();`}</code></pre>
            </div>
          </div>
          
          <div className="example">
            <h2>🤖 Customer Support Chatbot</h2>
            <p>Create a customer support chatbot with Helm-powered responses.</p>
            
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

class SupportChatbot {
  constructor() {
    this.helm = new HelmClient({
      apiKey: process.env.HELM_API_KEY,
      environment: 'hosted'
    });
    this.knowledgeBase = new Map();
  }

  async initializeKnowledgeBase() {
    const session = this.helm.startSession({
      domain: 'support',
      userId: 'chatbot'
    });

    try {
      // Load knowledge base
      const response = await session.send('!load_knowledge_base');
      response.items.forEach(item => {
        this.knowledgeBase.set(item.id, item);
      });
    } finally {
      session.end();
    }
  }

  async handleCustomerQuery(query, customerId) {
    const session = this.helm.startSession({
      domain: 'support',
      userId: customerId,
      context: {
        customerHistory: await this.getCustomerHistory(customerId),
        knowledgeBase: Array.from(this.knowledgeBase.keys())
      }
    });

    try {
      const response = await session.send(query);
      
      // Log the interaction
      await this.logInteraction(customerId, query, response);
      
      return {
        response: response.response,
        confidence: response.confidence,
        suggestedActions: response.suggestedActions
      };
    } finally {
      session.end();
    }
  }

  async escalateToHuman(interactionId, reason) {
    const session = this.helm.startSession({
      domain: 'support',
      userId: 'escalation'
    });

    try {
      await session.send('!escalate ' + JSON.stringify({
        interactionId,
        reason,
        priority: 'high'
      }));
      
      return true;
    } finally {
      session.end();
    }
  }

  async logInteraction(customerId, query, response) {
    const session = this.helm.startSession({
      domain: 'support',
      userId: 'logging'
    });

    try {
      await session.send('!log_interaction ' + JSON.stringify({
        customerId,
        query,
        response: response.response,
        timestamp: new Date().toISOString()
      }));
    } finally {
      session.end();
    }
  }

  private async getCustomerHistory(customerId) {
    // Implementation for fetching customer history
    return [];
  }
}

// Usage
const chatbot = new SupportChatbot();
await chatbot.initializeKnowledgeBase();

const response = await chatbot.handleCustomerQuery(
  "How do I reset my password?",
  "customer-123"
);

if (response.confidence < 0.7) {
  await chatbot.escalateToHuman(interactionId, "Low confidence response");
}`}</code></pre>
            </div>
          </div>
          
          <div className="example">
            <h2>🔒 Security Monitoring</h2>
            <p>Implement security monitoring with Helm-powered threat detection.</p>
            
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

class SecurityMonitor {
  constructor() {
    this.helm = new HelmClient({
      apiKey: process.env.HELM_API_KEY,
      environment: 'enterprise',
      licensePath: '/etc/helm/license.json'
    });
  }

  async analyzeEvent(event) {
    const session = this.helm.startSession({
      domain: 'security',
      userId: 'security-monitor',
      context: {
        eventType: event.type,
        source: event.source,
        timestamp: event.timestamp,
        severity: event.severity
      }
    });

    try {
      const response = await session.send('!analyze_security_event ' + JSON.stringify({
        event: event,
        context: {
          ip: event.ip,
          userAgent: event.userAgent,
          location: event.location
        }
      }));

      return {
        threatLevel: response.threatLevel,
        confidence: response.confidence,
        recommendedActions: response.actions,
        blocked: response.blocked
      };
    } finally {
      session.end();
    }
  }

  async scanVulnerabilities(target) {
    const session = this.helm.startSession({
      domain: 'security',
      userId: 'vulnerability-scan'
    });

    try {
      const response = await session.send('!vulnerability_scan ' + JSON.stringify({
        target: target,
        scanType: 'comprehensive'
      }));

      return {
        vulnerabilities: response.vulnerabilities,
        riskScore: response.riskScore,
        recommendations: response.recommendations
      };
    } finally {
      session.end();
    }
  }

  async blockIP(ip, reason, duration) {
    const session = this.helm.startSession({
      domain: 'security',
      userId: 'security-admin'
    });

    try {
      await session.send('!block_ip ' + JSON.stringify({
        ip: ip,
        reason: reason,
        duration: duration
      }));

      return true;
    } finally {
      session.end();
    }
  }
}

// Usage
const monitor = new SecurityMonitor();

// Analyze security event
const event = {
  type: 'suspicious_login',
  source: 'web',
  timestamp: new Date().toISOString(),
  severity: 'high',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  location: '/admin'
};

const analysis = await monitor.analyzeEvent(event);
if (analysis.blocked) {
  console.log('Event blocked:', analysis.recommendedActions);
}

// Scan for vulnerabilities
const scanResult = await monitor.scanVulnerabilities('web-server');
console.log('Risk score:', scanResult.riskScore);`}</code></pre>
            </div>
          </div>
          
          <div className="example">
            <h2>📝 Content Moderation</h2>
            <p>Implement content moderation with Helm-powered analysis.</p>
            
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

class ContentModerator {
  constructor() {
    this.helm = new HelmClient({
      apiKey: process.env.HELM_API_KEY,
      environment: 'hosted'
    });
    this.moderationRules = new Map();
  }

  async moderateContent(content, context) {
    const session = this.helm.startSession({
      domain: 'moderation',
      userId: 'moderator',
      context: {
        contentType: context.type,
        author: context.author,
        platform: context.platform
      }
    });

    try {
      const response = await session.send('!moderate_content ' + JSON.stringify({
        content: content,
        rules: this.getModerationRules(context.type),
        context: context
      }));

      return {
        approved: response.approved,
        confidence: response.confidence,
        violations: response.violations,
        suggestedChanges: response.changes
      };
    } finally {
      session.end();
    }
  }

  async batchModerate(contents) {
    const results = [];
    
    for (const content of contents) {
      const result = await this.moderateContent(content, content.context);
      results.push(result);
    }

    return results;
  }

  async trainModerationModel(trainingData) {
    const session = this.helm.startSession({
      domain: 'moderation',
      userId: 'moderator'
    });

    try {
      await session.send('!train_moderation_model ' + JSON.stringify({
        trainingData: trainingData,
        validationSet: this.getValidationSet()
      }));

      return true;
    } finally {
      session.end();
    }
  }

  private getModerationRules(contentType) {
    // Return moderation rules based on content type
    const rules = {
      'text': ['profanity', 'harassment', 'spam', 'hate_speech'],
      'image': ['inappropriate_content', 'violence', 'spam'],
      'video': ['inappropriate_content', 'copyright_violation'],
      'comment': ['harassment', 'spam', 'hate_speech']
    };
    
    return rules[contentType] || [];
  }

  private getValidationSet() {
    // Return validation set for training
    return ['safe_content', 'appropriate_language', 'respectful_communication'];
  }
}

// Usage
const moderator = new ContentModerator();

// Moderate single content
const result = await moderator.moderateContent(
  "This is a test comment",
  { type: 'comment', author: 'user123', platform: 'web' }
);

if (!result.approved) {
  console.log('Content violations:', result.violations);
  console.log('Suggested changes:', result.suggestedChanges);
}

// Batch moderation
const contents = [
  { text: "Good comment", context: { type: 'comment', author: 'user1' } },
  { text: "Bad comment", context: { type: 'comment', author: 'user2' } }
];

const results = await moderator.batchModerate(contents);
console.log('Moderation results:', results);`}</code></pre>
            </div>
          </div>
          
          <div className="example">
            <h2>🏢 Workflow Automation</h2>
            <p>Automate business workflows with Helm-powered orchestration.</p>
            
            <div className="code-block">
              <pre><code>{`import { HelmClient } from '@helm/control';

class WorkflowAutomation {
  constructor() {
    this.helm = new HelmClient({
      apiKey: process.env.HELM_API_KEY,
      environment: 'enterprise',
      licensePath: '/etc/helm/license.json'
    });
    this.workflows = new Map();
  }

  async createWorkflow(name, definition) {
    const session = this.helm.startSession({
      domain: 'workflow',
      userId: 'workflow-admin'
    });

    try {
      const response = await session.send('!create_workflow ' + JSON.stringify({
        name: name,
        definition: definition,
        validation: true
      }));

      this.workflows.set(name, response.workflowId);
      return response.workflowId;
    } finally {
      session.end();
    }
  }

  async executeWorkflow(workflowId, inputs) {
    const session = this.helm.startSession({
      domain: 'workflow',
      userId: 'workflow-executor'
    });

    try {
      const response = await session.send('!execute_workflow ' + JSON.stringify({
        workflowId: workflowId,
        inputs: inputs,
        step: 'start'
      }));

      return {
        status: response.status,
        currentStep: response.currentStep,
        results: response.results,
        nextActions: response.nextActions
      };
    } finally {
      session.end();
    }
  }

  async pauseWorkflow(workflowId) {
    const session = this.helm.startSession({
      domain: 'workflow',
      userId: 'workflow-admin'
    });

    try {
      await session.send('!pause_workflow ' + JSON.stringify({
        workflowId: workflowId
      }));

      return true;
    } finally {
      session.end();
    }
  }

  async getWorkflowStatus(workflowId) {
    const session = this.helm.startSession({
      domain: 'workflow',
      userId: 'workflow-monitor'
    });

    try {
      const response = await session.send('!workflow_status ' + JSON.stringify({
        workflowId: workflowId
      }));

      return {
        status: response.status,
        progress: response.progress,
        currentStep: response.currentStep,
        completedSteps: response.completedSteps
      };
    } finally {
      session.end();
    }
  }
}

// Usage
const automation = new WorkflowAutomation();

// Create approval workflow
const workflowId = await automation.createWorkflow('Document Approval', {
  steps: [
    { name: 'Review', type: 'manual', assignee: 'manager' },
    { name: 'Validate', type: 'automated', rules: ['compliance_check'] },
    { name: 'Approve', type: 'manual', assignee: 'manager' },
    { 'name': 'Publish', type: 'automated', rules: ['format_check'] }
  ]
});

// Execute workflow
const result = await automation.executeWorkflow(workflowId, {
  documentId: 'doc-123',
  author: 'john.doe',
  content: 'Document content here'
});

console.log('Workflow status:', result.status);`}</code></pre>
            </div>
          </div>
        </div>
        
        <div className="patterns">
          <h2>📋 Common Patterns</h2>
          
          <div className="pattern">
            <h3>Session Management Pattern</h3>
            <div className="code-block">
              <pre><code>{`class SessionManager {
  constructor(helmClient) {
    this.helm = helmClient;
    this.sessions = new Map();
  }

  async getSession(userId, context = {}) {
    // Check if session exists
    if (this.sessions.has(userId)) {
      return this.sessions.get(userId);
    }

    // Create new session
    const session = this.helm.startSession({
      domain: 'app',
      userId,
      ...context
    });

    this.sessions.set(userId, session);
    return session;
  }

  async cleanupSession(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      session.end();
      this.sessions.delete(userId);
    }
  }

  async cleanupAllSessions() {
    for (const [userId, session] of this.sessions) {
      session.end();
    }
    this.sessions.clear();
  }
}`}</code></pre>
            </div>
          </div>
          
          <div className="pattern">
            <h3>Error Handling Pattern</h3>
            <div className="code-block">
              <pre><code>{`class HelmService {
  async executeWithRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async safeExecute(session, message) {
    try {
      return await session.send(message);
    } catch (error) {
      console.error('Session error:', error);
      
      // Fallback response
      return {
        response: 'I apologize, but I encountered an error.',
        error: true
      };
    }
  }
}`}</code></pre>
            </div>
          </div>
          
          <div className="pattern">
            <h3>Event-Driven Pattern</h3>
            <div className="code-block">
              <pre><code>{`class EventDrivenHelm {
  constructor(helmClient) {
    this.helm = helmClient;
    this.eventHandlers = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.helm.on('response', (data) => {
      this.handleResponse(data);
    });

    this.helm.on('error', (data) => {
      this.handleError(data);
    });

    this.helm.on('skill_executed', (data) => {
      this.handleSkillExecution(data);
    });
  }

  handleResponse(data) {
    // Emit to all registered handlers
    this.emit('response', data);
  }

  handleError(data) {
    // Log error and emit to handlers
    console.error('Helm error:', data);
    this.emit('error', data);
  }

  handleSkillExecution(data) {
    // Track skill usage
    this.emit('skill_used', data);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
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
        
        .examples {
          display: grid;
          gap: 3rem;
        }
        
        .example {
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          padding: 2rem;
        }
        
        .example h2 {
          color: #667eea;
          margin-bottom: 1.5rem;
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
        
        .patterns {
          margin-top: 3rem;
        }
        
        .patterns h2 {
          color: #333;
          margin-bottom: 2rem;
        }
        
        .pattern {
          margin-bottom: 2rem;
        }
        
        .pattern h3 {
          color: #667eea;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
