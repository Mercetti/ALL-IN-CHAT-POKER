# Acey API Reference Documentation

## Overview

This document provides comprehensive API documentation for the Acey Control Center, including all endpoints, WebSocket connections, and usage examples.

## Base URL

```
Development: http://localhost:8080
Production: https://your-domain.com
```

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Core Endpoints

### Health Check

Check if the service is running and healthy.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1642678800000,
  "version": "1.0.0",
  "uptime": 3600
}
```

### Process Request

Main endpoint for processing requests through Acey's intelligence systems.

```http
POST /process
```

**Request Body:**
```json
{
  "prompt": "Your request here",
  "context": {
    "userId": "user123",
    "sessionId": "session456",
    "metadata": {}
  },
  "options": {
    "mode": "standard",
    "priority": "medium",
    "timeout": 30000
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Acey's response",
  "confidence": 0.85,
  "processingTime": 1250,
  "metadata": {
    "mode": "standard",
    "systemsUsed": ["orchestrator", "cognitiveGovernance"],
    "trustScore": 0.9
  }
}
```

## Governance Endpoints

### Get Governance Statistics

Retrieve current governance system statistics.

```http
GET /governance/stats
```

**Response:**
```json
{
  "totalActions": 150,
  "approvalRate": 0.87,
  "humanOverrideRate": 0.12,
  "simulationBlockRate": 0.05,
  "ethicalFailureRate": 0.02,
  "conflictResolutionRate": 0.08,
  "avgGovernanceTime": 2500,
  "systemStats": {
    "humanAuthority": {
      "totalAuthorities": 4,
      "activeAuthorities": 3,
      "pendingDecisions": 2
    },
    "simulations": {
      "totalSimulations": 45,
      "avgRiskScore": 0.3,
      "approvalRate": 0.8
    },
    "ethicalTests": {
      "totalTests": 120,
      "passRate": 0.95,
      "criticalFailures": 0
    },
    "conflicts": {
      "totalConflicts": 8,
      "resolvedConflicts": 7,
      "avgResolutionTime": 1800
    }
  }
}
```

### Get Governance Audit

Export complete governance data for audit purposes.

```http
GET /governance/audit
```

**Response:**
```json
{
  "timestamp": 1642678800000,
  "config": {
    "enableHumanAuthority": true,
    "enableGovernanceSimulations": true,
    "enableEthicalStressTesting": true,
    "enableGoalConflictResolution": true
  },
  "governanceHistory": [
    {
      "actionId": "action_123",
      "finalDecision": "approve",
      "reasoning": "All checks passed",
      "confidence": 0.9,
      "timestamp": 1642678600000
    }
  ],
  "systemData": {
    "humanAuthority": {...},
    "simulations": {...},
    "ethicalTests": {...},
    "conflicts": {...}
  }
}
```

### Submit Human Feedback

Record human feedback for governance decisions.

```http
POST /governance/feedback
```

**Request Body:**
```json
{
  "actionId": "action_123",
  "feedback": "approve",
  "reason": "Decision was appropriate and well-reasoned"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded successfully"
}
```

### Run Auto-Governance

Manually trigger auto-governance processes.

```http
POST /governance/auto-govern
```

**Response:**
```json
{
  "success": true,
  "results": {
    "actionsProcessed": 5,
    "decisionsMade": 5,
    "avgProcessingTime": 1200,
    "issues": []
  }
}
```

## Performance Endpoints

### Get Performance Metrics

Retrieve current system performance metrics.

```http
GET /metrics
```

**Response:**
```json
{
  "cpu": {
    "usage": 0.45,
    "loadAverage": [0.5, 0.6, 0.4],
    "cores": 8
  },
  "memory": {
    "used": 524288000,
    "total": 8589934592,
    "heapUsed": 262144000,
    "heapTotal": 524288000,
    "external": 10485760
  },
  "response": {
    "avgTime": 850,
    "p95Time": 1500,
    "p99Time": 2200,
    "requestsPerSecond": 45
  },
  "cache": {
    "hitRate": 0.78,
    "missRate": 0.22,
    "size": 850,
    "evictions": 12
  },
  "database": {
    "queryTime": 120,
    "connections": 15,
    "errors": 0
  }
}
```

### Get Performance Recommendations

Get system optimization recommendations.

```http
GET /metrics/recommendations
```

**Response:**
```json
{
  "recommendations": [
    "High CPU usage detected - consider scaling or optimizing algorithms",
    "Low cache hit rate - consider adjusting cache strategy or increasing cache size"
  ],
  "severity": "medium",
  "actions": [
    "scale_horizontal",
    "increase_cache_size"
  ]
}
```

## Intelligence System Endpoints

### Multi-Agent Debate

Trigger internal multi-agent debate for complex decisions.

```http
POST /intelligence/debate
```

**Request Body:**
```json
{
  "topic": "Complex decision topic",
  "context": {},
  "participants": ["planner", "skeptic", "executor"],
  "maxRounds": 3
}
```

**Response:**
```json
{
  "debateId": "debate_123",
  "consensus": {
    "decision": "proceed",
    "confidence": 0.82,
    "reasoning": "After deliberation, consensus reached"
  },
  "participants": [
    {
      "role": "planner",
      "position": "support",
      "reasoning": "Strategic benefits outweigh risks"
    }
  ],
  "processingTime": 3500
}
```

### Skill Marketplace

Interact with the internal skill marketplace.

```http
GET /skills/marketplace
```

**Response:**
```json
{
  "marketplace": {
    "totalSkills": 25,
    "activeSkills": 18,
    "totalValue": 850.5,
    "recentTransactions": [
      {
        "skillId": "skill_123",
        "type": "purchase",
        "price": 25.0,
        "timestamp": 1642678600000
      }
    ]
  },
  "skills": [
    {
      "skillId": "skill_123",
      "name": "Data Analysis",
      "description": "Advanced data analysis capabilities",
      "value": 25.0,
      "performance": 0.88,
      "usage": 45
    }
  ]
}
```

### Execute Skill

Execute a specific skill from the marketplace.

```http
POST /skills/execute
```

**Request Body:**
```json
{
  "skillId": "skill_123",
  "input": "Data to process",
  "context": {}
}
```

**Response:**
```json
{
  "success": true,
  "result": "Processed data output",
  "confidence": 0.92,
  "executionTime": 800,
  "cost": 2.5
}
```

## WebSocket Connections

### Real-time Updates

Connect to receive real-time system updates.

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});
```

**Message Types:**

#### Status Update
```json
{
  "type": "status_update",
  "data": {
    "system": "healthy",
    "activeUsers": 15,
    "processingQueue": 3
  },
  "timestamp": 1642678800000
}
```

#### Metrics Update
```json
{
  "type": "metrics_update",
  "data": {
    "cpu": 0.45,
    "memory": 0.62,
    "responseTime": 850
  },
  "timestamp": 1642678800000
}
```

#### Governance Event
```json
{
  "type": "governance_event",
  "data": {
    "actionId": "action_123",
    "decision": "approve",
    "reasoning": "All checks passed"
  },
  "timestamp": 1642678800000
}
```

### Control Interface

WebSocket connection for system control and monitoring.

```javascript
const controlWs = new WebSocket('ws://localhost:8080/control');

// Send command
controlWs.send(JSON.stringify({
  command: 'set_mode',
  parameters: { mode: 'deep' }
}));
```

**Command Types:**

#### Set Mode
```json
{
  "command": "set_mode",
  "parameters": {
    "mode": "minimal|standard|deep|swarm"
  }
}
```

#### Get Status
```json
{
  "command": "get_status",
  "parameters": {}
}
```

#### Run Diagnostic
```json
{
  "command": "run_diagnostic",
  "parameters": {
    "system": "all|governance|performance|intelligence"
  }
}
```

## Error Handling

### Error Response Format

All errors return a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "prompt",
      "issue": "Required field missing"
    }
  },
  "timestamp": 1642678800000
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Invalid request parameters |
| AUTHENTICATION_ERROR | Invalid or missing authentication |
| AUTHORIZATION_ERROR | Insufficient permissions |
| RATE_LIMIT_ERROR | Too many requests |
| SYSTEM_ERROR | Internal system error |
| GOVERNANCE_BLOCK | Action blocked by governance |
| TIMEOUT_ERROR | Request timed out |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Standard endpoints**: 1000 requests per hour
- **Governance endpoints**: 100 requests per hour
- **Performance endpoints**: 200 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642682400
```

## Pagination

List endpoints support pagination:

```http
GET /governance/history?page=1&limit=50
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const AceyAPI = require('acey-api-sdk');

const client = new AceyAPI({
  baseURL: 'http://localhost:8080',
  apiKey: 'your-api-key'
});

// Process a request
const result = await client.process({
  prompt: 'Analyze this data',
  context: { userId: 'user123' }
});

// Get governance stats
const stats = await client.governance.getStats();

// Connect to WebSocket
const ws = client.connectWebSocket();
ws.on('governance_event', (event) => {
  console.log('Governance event:', event);
});
```

### Python

```python
import acey_api

client = acey_api.Client(
    base_url='http://localhost:8080',
    api_key='your-api-key'
)

# Process a request
result = client.process(
    prompt='Analyze this data',
    context={'user_id': 'user123'}
)

# Get governance stats
stats = client.governance.get_stats()

# Connect to WebSocket
ws = client.connect_websocket()
for event in ws.events():
    if event.type == 'governance_event':
        print(f"Governance event: {event.data}")
```

### cURL

```bash
# Process request
curl -X POST http://localhost:8080/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "prompt": "Analyze this data",
    "context": {"userId": "user123"}
  }'

# Get governance stats
curl -X GET http://localhost:8080/governance/stats \
  -H "Authorization: Bearer your-token"

# WebSocket connection
wscat -c ws://localhost:8080/ws
```

## Testing

### Health Check Test

```bash
curl -I http://localhost:8080/health
```

Expected: `200 OK`

### API Test

```bash
curl -X POST http://localhost:8080/process \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, Acey!"}'
```

### WebSocket Test

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', () => {
  console.log('Connected to WebSocket');
});

ws.on('message', (data) => {
  console.log('Received:', JSON.parse(data));
});
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if the server is running
2. **Authentication Errors**: Verify API key and permissions
3. **Timeout Errors**: Increase timeout values or check system load
4. **Rate Limiting**: Wait for rate limit reset or reduce request frequency

### Debug Mode

Enable debug mode for additional logging:

```bash
DEBUG=acey:* npm start
```

### Health Monitoring

Monitor system health:

```bash
# Check health
curl http://localhost:8080/health

# Check metrics
curl http://localhost:8080/metrics

# Check governance status
curl http://localhost:8080/governance/stats
```

## Versioning

API versioning follows semantic versioning:

- **v1.x.x**: Current stable version
- **v2.x.x**: Beta features (opt-in)
- **v3.x.x**: Experimental features

Include version in requests:

```http
GET /v1/health
Accept: application/vnd.acey.v1+json
```

## Changelog

### v1.0.0
- Initial API release
- Core processing endpoints
- Governance system integration
- Performance monitoring
- WebSocket support

### v1.1.0 (Planned)
- Enhanced error handling
- Additional intelligence system endpoints
- Improved WebSocket events
- Batch processing support

---

For more detailed information about specific systems, refer to the individual system documentation and code comments.
