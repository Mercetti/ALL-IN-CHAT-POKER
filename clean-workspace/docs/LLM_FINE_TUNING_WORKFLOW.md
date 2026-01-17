# LLM Fine-Tuning Workflow Guide

## 🎯 Overview

This guide walks you through the complete iterative fine-tuning workflow for Acey's LLM system. The workflow ensures safe, gradual improvement of Acey's capabilities while maintaining system stability.

## 🔄 Complete Workflow

### Phase 1: Data Collection
**Endpoint**: `POST /api/log`
- **Every LLM call** is automatically logged with context, prompts, outputs, and decisions
- **Metadata**: Response time, cost, confidence scores, auto-rule applications
- **Storage**: File-based with automatic cleanup after retention period

### Phase 2: Dataset Preparation  
**Endpoint**: `POST /api/dataset/prepare`
- **Filtering**: Remove low-confidence, rejected, and duplicate entries
- **Task Separation**: Create separate datasets for each task type (game, website, graphics, audio)
- **Format**: JSONL files ready for fine-tuning
- **Quality Control**: Minimum confidence thresholds and approval status filtering

### Phase 3: Simulation Testing
**Endpoint**: `POST /api/simulate`
- **Dry-Run Mode**: Test new model outputs without affecting live system
- **Auto-Rule Consistency**: Apply same filtering in simulation as live
- **Comparison**: A/B test new vs old model outputs
- **Safety Checks**: Detect personality drift and task correctness issues

### Phase 4: Gradual Deployment
**Strategy**: Low-risk → Medium-risk → High-risk tasks
1. **Graphics & Audio** (Low risk, easily rollback)
2. **Website Corrections** (Medium risk, requires approval)
3. **Game Hosting** (High risk, live chat interactions)

### Phase 5: Monitoring & Iteration
- **Real-time Metrics**: Accuracy, response time, error rates
- **Alerts**: Automatic notifications for performance degradation
- **Continuous Learning**: Ongoing data collection and model updates

## 🛠️ Implementation Steps

### 1. Start the Workflow
```bash
curl -X POST http://localhost:8080/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "collectLogs": true,
      "prepareDatasets": true,
      "runSimulations": true,
      "enableFineTuning": false,
      "gradualDeployment": true,
      "monitorMetrics": true,
      "taskTypes": ["game", "website", "graphics", "audio"],
      "deploymentStages": ["graphics", "audio", "website", "game"]
    }
  }'
```

### 2. Monitor Progress
```bash
# Get workflow status
curl http://localhost:8080/api/workflow/status/workflow-1234567890

# List all workflows
curl http://localhost:8080/api/workflow/list
```

### 3. Manual Dataset Preparation
```bash
# Prepare datasets from recent logs
curl -X POST http://localhost:8080/api/dataset/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "taskTypes": ["game", "website"],
    "minConfidence": 0.7,
    "excludeRejected": true
  }'
```

### 4. Run Simulations
```bash
# Test new model outputs
curl -X POST http://localhost:8080/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [...], // Array of test logs
    "config": {
      "dryRun": true,
      "autoRules": true
    }
  }'
```

### 5. Dry-Run Testing
```bash
# Test specific output
curl -X POST http://localhost:8080/api/dryrun \
  -H "Content-Type: application/json" \
  -d '{
    "aceyOutput": {
      "speech": "Test message",
      "intents": [...]
    }
  }'
```

## 📊 Key Features

### Auto-Rule Integration
- **Live Processing**: All chat/game events filtered through auto-rules
- **Simulation Consistency**: Same rules applied in dry-run mode
- **Deterministic**: Same input always produces same filtering result

### Dataset Quality
- **Multi-Task Support**: Separate datasets for different Acey capabilities
- **Format Flexibility**: Instruction-following, classification, and structured output formats
- **Quality Filtering**: Confidence thresholds and approval status

### Safety Mechanisms
- **Gradual Rollout**: Start with low-risk tasks
- **Real-time Monitoring**: Performance metrics and alerts
- **Rollback Capability**: Quick reversion to previous model versions
- **Audit Trail**: Complete logging of all decisions and changes

## 🎮 Usage Examples

### Chat Message Processing
```javascript
// Live processing with auto-rules
const filteredOutput = applyAutoRulesToOutput(aceyOutput);
if (!filteredOutput) {
  console.log('Message rejected by auto-rules');
  return;
}
// Process approved message
```

### Simulation Testing
```javascript
// Test new model without affecting live system
const dryRunResult = await fetch('/api/dryrun', {
  method: 'POST',
  body: JSON.stringify({ aceyOutput: testOutput })
});
const { decision, action } = await dryRunResult.json();
```

### Dataset Generation
```javascript
// Convert logs to training data
const datasets = prepareDataset(logs, {
  taskTypes: ['game', 'website'],
  minConfidence: 0.7
});
// datasets.game -> game-dataset.jsonl
// datasets.website -> website-dataset.jsonl
```

## 📈 Monitoring Dashboard

### Available Metrics
- **Processing Statistics**: Total events, auto-rule applications, rejections
- **Performance Metrics**: Response time, cost, accuracy
- **Quality Metrics**: Confidence scores, error rates
- **Deployment Status**: Rollout progress per task type

### Alert Thresholds
```javascript
const alertThresholds = {
  errorRate: 0.05,        // Alert if > 5% errors
  responseTime: 2000,     // Alert if > 2s response time
  confidenceDrop: 0.1,    // Alert if confidence drops 10%
  rejectionRate: 0.2      // Alert if > 20% rejection rate
};
```

## 🔄 Continuous Improvement Loop

1. **Collect**: Log all LLM interactions automatically
2. **Filter**: Apply auto-rules consistently
3. **Prepare**: Generate clean, task-specific datasets
4. **Train**: Fine-tune models with new data
5. **Test**: Run simulations and dry-runs
6. **Deploy**: Gradual rollout with monitoring
7. **Monitor**: Track performance and metrics
8. **Iterate**: Feed results back into step 1

## 🚀 Quick Start Commands

```bash
# 1. Start all services
npm run dev                    # AI Control Center
node server.js                 # Main server

# 2. Start workflow
curl -X POST http://localhost:8080/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{"config": {"enableFineTuning": false}}'

# 3. Test integration
curl -X POST http://localhost:8080/api/log \
  -H "Content-Type: application/json" \
  -d '{"taskType":"game","llmPrompt":"Test","aceyOutput":{"speech":"Test output","intents":[]}}'

# 4. Check results
curl http://localhost:8080/api/logs/stats
curl http://localhost:8080/api/dataset/list
```

## 📝 Best Practices

### Data Quality
- **Minimum Confidence**: Use 0.5-0.7 threshold for training data
- **Reject Handling**: Exclude rejected entries from training sets
- **Task Separation**: Keep different task types separate for specialized models

### Safety First
- **Always Dry-Run**: Test changes before live deployment
- **Gradual Rollout**: Start with low-risk tasks
- **Monitor Closely**: Watch for performance degradation
- **Quick Rollback**: Have previous versions ready for instant rollback

### Performance Optimization
- **Batch Processing**: Process logs in batches for efficiency
- **Caching**: Cache frequently used datasets and models
- **Async Operations**: Run fine-tuning and simulations asynchronously

## 🔧 Troubleshooting

### Common Issues
1. **Dataset Empty**: Check log retention and confidence thresholds
2. **Simulation Mismatch**: Ensure auto-rules are consistent between live and simulation
3. **Performance Degradation**: Monitor response times and error rates
4. **Memory Issues**: Implement log cleanup and retention policies

### Debug Commands
```bash
# Check system health
curl http://localhost:8080/health
curl http://localhost:3001/health

# Check recent logs
curl http://localhost:8080/api/logs?limit=10

# Check workflow status
curl http://localhost:8080/api/workflow/list

# Test auto-rules
curl -X POST http://localhost:8080/api/dryrun \
  -H "Content-Type: application/json" \
  -d '{"aceyOutput":{"speech":"Test","intents":[{"type":"memory_proposal","confidence":0.3}]}}'
```

---

## 🎉 Success Metrics

Your fine-tuning workflow is successful when:

- ✅ **Data Collection**: All LLM calls logged with full context
- ✅ **Quality Datasets**: Clean, task-specific training data generated
- ✅ **Simulation Safety**: New models tested without affecting live system
- ✅ **Gradual Deployment**: Models rolled out safely by risk level
- ✅ **Continuous Monitoring**: Real-time metrics and alerts active
- ✅ **Iterative Improvement**: System continuously learning and improving

This creates a **closed-loop system** where Acey evolves her own LLM capabilities while maintaining safety, reliability, and performance standards.
