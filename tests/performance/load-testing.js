/**
 * Load Testing Utility
 * Comprehensive load testing and stress testing for the poker game application
 */

class LoadTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8080';
    this.concurrentUsers = options.concurrentUsers || 10;
    this.testDuration = options.testDuration || 60000; // 60 seconds
    this.rampUpTime = options.rampUpTime || 10000; // 10 seconds
    this.requests = [];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Run load test
   */
  async runLoadTest() {
    console.log('🚀 Starting load test...');
    console.log(`📊 Concurrent users: ${this.concurrentUsers}`);
    console.log(`⏱️ Test duration: ${this.testDuration}ms`);
    console.log(`📈 Ramp-up time: ${this.rampUpTime}ms`);
    
    this.metrics.startTime = Date.now();
    
    // Start concurrent users
    const userPromises = [];
    for (let i = 0; i < this.concurrentUsers; i++) {
      const delay = (i / this.concurrentUsers) * this.rampUpTime;
      userPromises.push(this.simulateUser(delay));
    }
    
    // Wait for test completion
    await Promise.all(userPromises);
    
    this.metrics.endTime = Date.now();
    
    // Generate report
    const report = this.generateReport();
    console.log('✅ Load test completed');
    console.log('📊 Performance Report:');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * Simulate a single user
   */
  async simulateUser(delay = 0) {
    // Wait for ramp-up delay
    if (delay > 0) {
      await this.sleep(delay);
    }
    
    const endTime = this.metrics.startTime + this.testDuration;
    let userId = Math.random().toString(36).substr(2, 9);
    
    while (Date.now() < endTime) {
      try {
        // Simulate user actions
        await this.performUserActions(userId);
        
        // Random delay between actions (1-5 seconds)
        await this.sleep(Math.random() * 4000 + 1000);
      } catch (error) {
        this.metrics.errors.push({
          userId,
          error: error.message,
          timestamp: Date.now()
        });
        this.metrics.failedRequests++;
        
        // Small delay before retry
        await this.sleep(1000);
      }
    }
  }

  /**
   * Perform user actions
   */
  async performUserActions(userId) {
    const actions = [
      () => this.loadHomePage(),
      () => this.loadGamePage(),
      () => this.makeAPIRequest('/api/games'),
      () => this.makeAPIRequest('/api/users'),
      () => this.makeAPIRequest('/api/leaderboard'),
      () => this.simulateWebSocketConnection(),
      () => this.simulateGameActions()
    ];
    
    // Random action selection
    const action = actions[Math.floor(Math.random() * actions.length)];
    await action();
  }

  /**
   * Load home page
   */
  async loadHomePage() {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('GET', '/');
      
      if (response.ok) {
        this.metrics.successfulRequests++;
        this.metrics.responseTimes.push(Date.now() - startTime);
      } else {
        this.metrics.failedRequests++;
      }
      
      this.metrics.totalRequests++;
    } catch (error) {
      this.metrics.failedRequests++;
      this.metrics.totalRequests++;
      throw error;
    }
  }

  /**
   * Load game page
   */
  async loadGamePage() {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('GET', '/game');
      
      if (response.ok) {
        this.metrics.successfulRequests++;
        this.metrics.responseTimes.push(Date.now() - startTime);
      } else {
        this.metrics.failedRequests++;
      }
      
      this.metrics.totalRequests++;
    } catch (error) {
      this.metrics.failedRequests++;
      this.metrics.totalRequests++;
      throw error;
    }
  }

  /**
   * Make API request
   */
  async makeAPIRequest(endpoint) {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('GET', endpoint);
      
      if (response.ok) {
        this.metrics.successfulRequests++;
        this.metrics.responseTimes.push(Date.now() - startTime);
      } else {
        this.metrics.failedRequests++;
      }
      
      this.metrics.totalRequests++;
    } catch (error) {
      this.metrics.failedRequests++;
      this.metrics.totalRequests++;
      throw error;
    }
  }

  /**
   * Simulate WebSocket connection
   */
  async simulateWebSocketConnection() {
    const startTime = Date.now();
    
    try {
      const ws = new WebSocket('ws://localhost:8080/acey');
      
      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          const connectionTime = Date.now() - startTime;
          this.metrics.successfulRequests++;
          this.metrics.responseTimes.push(connectionTime);
          this.metrics.totalRequests++;
          
          // Send test message
          ws.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          });
          
          // Close after short delay
          setTimeout(() => {
            ws.close();
            resolve();
          }, 1000);
        };
        
        ws.onerror = () => {
          this.metrics.failedRequests++;
          this.metrics.totalRequests++;
          reject(new Error('WebSocket connection failed'));
        };
        
        setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
      });
    } catch (error) {
      // Already handled in the promise
    }
  }

  /**
   * Simulate game actions
   */
  async simulateGameActions() {
    const actions = [
      '/api/game/join',
      '/api/game/bet',
      '/api/game/fold',
      '/api/game/check',
      '/api/game/raise'
    ];
    
    const action = actions[Math.floor(Math.random() * actions.length)];
    await this.makeAPIRequest(action);
  }

  /**
   * Make HTTP request
   */
  async makeRequest(method, url, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTester/1.0'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(this.baseUrl + url, options);
    return response;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const duration = this.metrics.endTime - this.metrics.startTime;
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) / this.metrics.responseTimes.length
      : 0;
    
    const requestsPerSecond = (this.metrics.totalRequests / duration) * 1000;
    const successRate = (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
    
    // Calculate percentiles
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const percentiles = {
      p50: this.getPercentile(sortedTimes, 50),
      p90: this.getPercentile(sortedTimes, 90),
      p95: this.getPercentile(sortedTimes, 95),
      p99: this.getPercentile(sortedTimes, 99)
    };
    
    return {
      summary: {
        duration,
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        requestsPerSecond: Math.round(requestsPerSecond),
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime)
      },
      percentiles,
      errors: this.metrics.errors,
      performance: {
        excellent: successRate > 95 && avgResponseTime < 500,
        good: successRate > 90 && avgResponseTime < 1000,
        fair: successRate > 80 && avgResponseTime < 2000,
        poor: successRate <= 80 || avgResponseTime >= 2000
      }
    };
  }

  /**
   * Calculate percentile
   */
  getPercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Run stress test
   */
  async runStressTest() {
    console.log('💪 Starting stress test...');
    
    // Start with low load and gradually increase
    const maxUsers = 100;
    const stepSize = 10;
    
    for (let users = stepSize; users <= maxUsers; users += stepSize) {
      console.log(`📊 Testing with ${users} concurrent users...`);
      
      this.concurrentUsers = users;
      this.testDuration = 30000; // 30 seconds per step
      this.rampUpTime = 5000; // 5 seconds ramp-up
      
      const report = await this.runLoadTest();
      
      // Check if system is struggling
      if (report.summary.successRate < 80 || report.summary.avgResponseTime > 2000) {
        console.log(`⚠️ System struggling at ${users} users. Stress test stopped.`);
        break;
      }
      
      // Brief pause between steps
      await this.sleep(5000);
    }
  }

  /**
   * Run spike test
   */
  async runSpikeTest() {
    console.log('📈 Starting spike test...');
    
    // Baseline load
    this.concurrentUsers = 10;
    this.testDuration = 30000;
    this.rampUpTime = 5000;
    
    console.log('📊 Establishing baseline...');
    await this.runLoadTest();
    
    // Spike to high load
    this.concurrentUsers = 50;
    this.testDuration = 10000; // 10 seconds spike
    this.rampUpTime = 1000; // Quick ramp-up
    
    console.log('📊 Applying spike load...');
    const spikeReport = await this.runLoadTest();
    
    // Return to baseline
    this.concurrentUsers = 10;
    this.testDuration = 30000;
    this.rampUpTime = 5000;
    
    console.log('📊 Returning to baseline...');
    const recoveryReport = await this.runLoadTest();
    
    return {
      baseline: recoveryReport,
      spike: spikeReport,
      recovered: recoveryReport.summary.successRate > 90
    };
  }

  /**
   * Run endurance test
   */
  async runEnduranceTest() {
    console.log('🏃 Starting endurance test...');
    
    this.concurrentUsers = 20;
    this.testDuration = 300000; // 5 minutes
    this.rampUpTime = 30000; // 30 seconds ramp-up
    
    const report = await this.runLoadTest();
    
    // Check for performance degradation
    const halfwayPoint = this.metrics.startTime + (this.testDuration / 2);
    const firstHalf = this.metrics.responseTimes.filter(t => t < halfwayPoint);
    const secondHalf = this.metrics.responseTimes.filter(t => t >= halfwayPoint);
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, t) => sum + t, 0) / firstHalf.length 
      : 0;
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, t) => sum + t, 0) / secondHalf.length 
      : 0;
    
    const degradation = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    return {
      ...report,
      endurance: {
        degradation: Math.round(degradation * 100) / 100,
        stable: degradation < 20 // Less than 20% degradation is considered stable
      }
    };
  }
}

module.exports = LoadTester;
