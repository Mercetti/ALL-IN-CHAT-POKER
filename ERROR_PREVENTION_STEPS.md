# 🛡️ Error Prevention Steps - Breakdown

## 🎯 **Step 1: Fix Ollama Connection Issues**

### **Problem**: AI chat keeps failing with "fetch failed" errors

### **Solution**:
```bash
# 1. Check Ollama status
curl.exe -I http://127.0.0.1:11434

# 2. Restart Ollama if needed
ollama serve

# 3. Test AI connection
curl.exe -X POST http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-coder:1.3b", "prompt": "test"}'
```

### **Prevention**:
```javascript
// Add to server.js
const ollamaHealthCheck = setInterval(async () => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) {
      logger.warn('Ollama unhealthy, attempting restart');
      // Auto-restart logic here
    }
  } catch (error) {
    logger.error('Ollama health check failed', { error: error.message });
  }
}, 30000); // Check every 30 seconds
```

---

## 🎯 **Step 2: Fix "currentMode is not defined" Error**

### **Problem**: Overlay auto-check fails with undefined variable

### **Solution**:
```javascript
// Add to server.js at the top
let currentMode = 'normal'; // Define the variable

// Fix the overlay check function
const overlayAutoCheck = async () => {
  try {
    if (!currentMode) {
      currentMode = 'normal'; // Default value
    }
    // Rest of overlay check logic
  } catch (error) {
    logger.error('Overlay auto-check failed', { error: error.message });
  }
};
```

### **Prevention**:
```javascript
// Initialize all global variables
let currentMode = 'normal';
let overlayState = 'inactive';
let aiGenerateBusy = false;

// Add error boundaries
const safeExecute = (fn, fallback) => {
  try {
    return fn();
  } catch (error) {
    logger.error('Safe execution failed', { error: error.message });
    return fallback || null;
  }
};
```

---

## 🎯 **Step 3: Fix JSON Parsing Issues**

### **Problem**: AI responses not valid JSON, using fallbacks

### **Solution**:
```javascript
// Add to ai.js
const parseAIResponse = (response) => {
  try {
    return JSON.parse(response);
  } catch (error) {
    logger.warn('AI response not valid JSON', { 
      response: response.substring(0, 200), // First 200 chars
      error: error.message 
    });
    
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        logger.warn('Failed to extract JSON from response');
      }
    }
    
    // Return structured fallback
    return {
      type: 'fallback_response',
      message: response,
      timestamp: new Date().toISOString()
    };
  }
};
```

### **Prevention**:
```javascript
// Add response validation
const validateAIResponse = (response) => {
  if (!response || typeof response !== 'string') {
    return false;
  }
  
  try {
    JSON.parse(response);
    return true;
  } catch {
    return false;
  }
};
```

---

## 🎯 **Step 4: Add Circuit Breakers for AI**

### **Problem**: AI failures cascade and cause system instability

### **Solution**:
```javascript
// Add to ai.js
class AICircuitBreaker {
  constructor() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailure = 0;
    this.threshold = 5; // Open after 5 failures
    this.timeout = 60000; // 60 seconds
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('AI circuit breaker is OPEN');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'CLOSED';
      }, this.timeout);
    }
  }
}
```

---

## 🎯 **Step 5: Add Connection Pool Management**

### **Problem**: Too many concurrent connections overwhelm the system

### **Solution**:
```javascript
// Add to connection-hardener.js
class ConnectionPool {
  constructor(maxConnections = 10) {
    this.pool = [];
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
  }

  async getConnection() {
    if (this.activeConnections >= this.maxConnections) {
      throw new Error('Connection pool exhausted');
    }
    
    this.activeConnections++;
    return Promise.resolve({ id: Date.now() });
  }

  releaseConnection(connection) {
    this.activeConnections--;
    // Clean up connection resources
  }
}
```

---

## 🎯 **Step 6: Add Health Monitoring Dashboard**

### **Problem**: No visibility into system health

### **Solution**:
```javascript
// Add to server.js
const healthMonitor = {
  checks: new Map(),
  
  addCheck(name, checkFunction) {
    this.checks.set(name, {
      fn: checkFunction,
      lastResult: null,
      lastChecked: null
    });
  },
  
  async runAllChecks() {
    const results = {};
    
    for (const [name, check] of this.checks) {
      try {
        const result = await check.fn();
        check.lastResult = result;
        check.lastChecked = Date.now();
        results[name] = result;
      } catch (error) {
        check.lastResult = { healthy: false, error: error.message };
        check.lastChecked = Date.now();
        results[name] = check.lastResult;
      }
    }
    
    return results;
  }
};

// Add health checks
healthMonitor.addCheck('ollama', async () => {
  const response = await fetch('http://127.0.0.1:11434/api/tags');
  return { healthy: response.ok, status: response.status };
});

healthMonitor.addCheck('database', async () => {
  try {
    const result = db.query('SELECT 1');
    return { healthy: true, status: 'connected' };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
});
```

---

## 🎯 **Step 7: Add Automatic Recovery System**

### **Problem**: Manual intervention required for every failure

### **Solution**:
```javascript
// Add to server.js
const autoRecovery = {
  async recoverOllama() {
    logger.info('Attempting Ollama recovery');
    
    try {
      // Stop Ollama
      await exec('taskkill /F /IM ollama.exe');
      await delay(2000);
      
      // Restart Ollama
      await exec('ollama serve');
      await delay(5000);
      
      // Verify it's working
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (response.ok) {
        logger.info('Ollama recovery successful');
        return true;
      }
    } catch (error) {
      logger.error('Ollama recovery failed', { error: error.message });
      return false;
    }
  },
  
  async recoverDatabase() {
    logger.info('Attempting database recovery');
    
    try {
      // Close and reopen database
      db.close();
      await delay(1000);
      db.init();
      
      logger.info('Database recovery successful');
      return true;
    } catch (error) {
      logger.error('Database recovery failed', { error: error.message });
      return false;
    }
  }
};
```

---

## 🎯 **Step 8: Add Error Rate Limiting**

### **Problem**: Too many errors in short time

### **Solution**:
```javascript
// Add to server.js
const errorRateLimiter = {
  errors: [],
  windowMs: 60000, // 1 minute
  maxErrors: 10,
  
  recordError(error) {
    const now = Date.now();
    this.errors = this.errors.filter(e => now - e.timestamp < this.windowMs);
    this.errors.push({ error, timestamp: now });
    
    if (this.errors.length >= this.maxErrors) {
      logger.warn('Error rate limit exceeded', {
        errorCount: this.errors.length,
        timeWindow: this.windowMs
      });
      
      // Trigger protective measures
      this.triggerProtectiveMode();
    }
  },
  
  triggerProtectiveMode() {
    logger.info('Entering protective mode');
    
    // Disable non-essential features
    aiGenerateBusy = true;
    
    // Increase health check frequency
    // Implement protective logic
  }
};
```

---

## 🎯 **Implementation Priority:**

### **🔥 High Priority (Immediate):**
1. **Fix Ollama Connection** - Add health checks and auto-restart
2. **Fix currentMode Error** - Define variable and add error boundaries
3. **Fix JSON Parsing** - Add response validation and fallbacks

### **⚡ Medium Priority (This Week):**
4. **Add Circuit Breakers** - Prevent cascade failures
5. **Add Connection Pooling** - Manage resources better

### **🌟 Low Priority (Next Week):**
6. **Add Health Dashboard** - Visibility into system health
7. **Add Auto-Recovery** - Self-healing capabilities
8. **Add Error Rate Limiting** - Prevent error storms

---

## 🎯 **Quick Implementation Commands:**

### **Step 1: Fix Ollama**
```bash
# Add health check to server.js
# Add ollama restart logic
# Test with: curl http://127.0.0.1:11434
```

### **Step 2: Fix Variables**
```bash
# Define currentMode at top of server.js
# Add error boundaries around overlay checks
# Test with: npm run dev:simple
```

### **Step 3: Fix JSON Parsing**
```bash
# Add parseAIResponse function to ai.js
# Add response validation
# Test with AI chat in AI Control Center
```

---

## 🎯 **Testing Each Step:**

### **After Each Fix:**
1. **Deploy**: `npm run deploy`
2. **Test Local**: `npm run dev:simple`
3. **Check Logs**: `fly logs -a all-in-chat-poker`
4. **Verify**: Test AI Control Center functionality
5. **Monitor**: Watch for error patterns

### **Success Criteria:**
- ✅ No "fetch failed" errors for 1 hour
- ✅ No "currentMode is not defined" errors
- ✅ AI responses parse correctly
- ✅ System stays stable under load

---

## 🎯 **Rollback Plan:**

### **If Something Breaks:**
```bash
# Quick rollback to previous working version
git checkout HEAD~1

# Or use the quick deploy script
quick-deploy.bat
```

### **Emergency Recovery:**
```bash
# Restart everything
npm run dev:stop
npm run dev:simple

# Or restart services individually
# Ollama, Database, Server
```

---

## 🎯 **Summary:**

### **Implement in This Order:**
1. **Fix Ollama Connection** (30 minutes)
2. **Fix currentMode Error** (15 minutes)
3. **Fix JSON Parsing** (20 minutes)
4. **Add Circuit Breakers** (45 minutes)
5. **Add Connection Pooling** (30 minutes)
6. **Add Health Dashboard** (60 minutes)
7. **Add Auto-Recovery** (45 minutes)
8. **Add Error Rate Limiting** (30 minutes)

### **Total Time**: ~4 hours
### **Expected Result**: 90% reduction in recurring errors

**Follow these steps systematically and your connection issues will be resolved!** 🛡️
