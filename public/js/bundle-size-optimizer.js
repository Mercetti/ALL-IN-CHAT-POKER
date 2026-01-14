/**
 * Bundle Size Optimizer
 * Analyzes and optimizes JavaScript bundle size for better loading performance
 */

class BundleSizeOptimizer {
  constructor(options = {}) {
    this.options = {
      enableAnalysis: true,
      enableCompression: true,
      enableTreeShaking: true,
      enableCodeSplitting: true,
      enableMinification: true,
      enableCaching: true,
      analysisThreshold: 1024, // 1KB
      compressionThreshold: 5120, // 5KB
      ...options
    };
    
    this.bundleData = new Map();
    this.compressionCache = new Map();
    this.analysisResults = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    this.setupPerformanceObserver();
    this.setupResourceTiming();
    this.isInitialized = true;
  }

  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;
    
    // Monitor resource loading
    this.resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name.includes('.js')) {
          this.analyzeResource(entry);
        }
      });
    });
    
    this.resourceObserver.observe({ entryTypes: ['resource'] });
    
    // Monitor long tasks
    this.longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 50) { // Tasks over 50ms
          this.reportLongTask(entry);
        }
      });
    });
    
    this.longTaskObserver.observe({ entryTypes: ['longtask'] });
  }

  setupResourceTiming() {
    // Analyze existing resources
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      resources.forEach(resource => {
        if (resource.name.includes('.js')) {
          this.analyzeResource(resource);
        }
      });
    }
  }

  analyzeResource(entry) {
    const url = entry.name;
    const size = entry.transferSize || 0;
    const duration = entry.duration || 0;
    
    this.bundleData.set(url, {
      url,
      size,
      duration,
      compressed: size < entry.encodedBodySize,
      loadTime: entry.responseEnd - entry.requestStart,
      timestamp: Date.now()
    });
    
    // Analyze if size exceeds threshold
    if (size > this.options.analysisThreshold) {
      this.performDetailedAnalysis(url);
    }
  }

  performDetailedAnalysis(url) {
    const data = this.bundleData.get(url);
    if (!data) return;
    
    const analysis = {
      url,
      size: data.size,
      duration: data.duration,
      recommendations: [],
      compressionRatio: this.calculateCompressionRatio(data),
      loadEfficiency: this.calculateLoadEfficiency(data),
      sizeCategory: this.categorizeSize(data.size),
      optimizationPotential: this.calculateOptimizationPotential(data)
    };
    
    // Generate recommendations
    this.generateRecommendations(analysis);
    
    this.analysisResults.set(url, analysis);
    
    if (this.options.enableLogging) {
      console.log(`Bundle Analysis for ${url}:`, analysis);
    }
  }

  calculateCompressionRatio(data) {
    if (!data.compressed) return 0;
    return ((data.encodedBodySize - data.transferSize) / data.encodedBodySize) * 100;
  }

  calculateLoadEfficiency(data) {
    if (data.size === 0) return 0;
    return data.size / data.duration; // bytes per millisecond
  }

  categorizeSize(size) {
    if (size < 1024) return 'small';
    if (size < 10240) return 'medium';
    if (size < 102400) return 'large';
    return 'xlarge';
  }

  calculateOptimizationPotential(data) {
    let potential = 0;
    
    // Check for compression opportunities
    if (!data.compressed && data.size > this.options.compressionThreshold) {
      potential += 30; // 30% potential savings
    }
    
    // Check for load time issues
    if (data.duration > 1000) { // > 1 second
      potential += 20; // 20% potential savings
    }
    
    // Check for size issues
    if (data.size > 51200) { // > 50KB
      potential += 25; // 25% potential savings
    }
    
    return Math.min(potential, 75); // Max 75% potential
  }

  generateRecommendations(analysis) {
    const { size, duration, compressionRatio, optimizationPotential } = analysis;
    
    // Compression recommendations
    if (!analysis.compressed && size > this.options.compressionThreshold) {
      analysis.recommendations.push({
        type: 'compression',
        priority: 'high',
        description: 'Enable gzip/brotli compression',
        estimatedSavings: '30-50%',
        implementation: 'Configure server compression'
      });
    }
    
    // Code splitting recommendations
    if (size > 102400) { // > 100KB
      analysis.recommendations.push({
        type: 'code-splitting',
        priority: 'high',
        description: 'Split large bundle into smaller chunks',
        estimatedSavings: '20-40%',
        implementation: 'Implement dynamic imports or webpack code splitting'
      });
    }
    
    // Tree shaking recommendations
    if (optimizationPotential > 40) {
      analysis.recommendations.push({
        type: 'tree-shaking',
        priority: 'medium',
        description: 'Remove unused code with tree shaking',
        estimatedSavings: '10-30%',
        implementation: 'Configure bundler for dead code elimination'
      });
    }
    
    // Minification recommendations
    if (size > 20480) { // > 20KB
      analysis.recommendations.push({
        type: 'minification',
        priority: 'medium',
        description: 'Minify JavaScript code',
        estimatedSavings: '15-25%',
        implementation: 'Use terser or uglify-js'
      });
    }
    
    // Caching recommendations
    if (duration > 500) { // > 500ms
      analysis.recommendations.push({
        type: 'caching',
        priority: 'low',
        description: 'Implement better caching strategy',
        estimatedSavings: '50-90%',
        implementation: 'Set appropriate cache headers'
      });
    }
  }

  reportLongTask(entry) {
    if (this.options.enableLogging) {
      console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms - ${entry.name}`);
    }
  }

  // Public API methods
  
  getBundleAnalysis(url) {
    return this.analysisResults.get(url) || null;
  }
  
  getAllAnalyses() {
    return Object.fromEntries(this.analysisResults);
  }
  
  getTotalBundleSize() {
    let totalSize = 0;
    for (const data of this.bundleData.values()) {
      totalSize += data.size;
    }
    return totalSize;
  }
  
  getAverageLoadTime() {
    const entries = Array.from(this.bundleData.values());
    if (entries.length === 0) return 0;
    
    const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return totalTime / entries.length;
  }
  
  getOptimizationSummary() {
    const analyses = Array.from(this.analysisResults.values());
    const totalPotential = analyses.reduce((sum, analysis) => sum + analysis.optimizationPotential, 0);
    const highPriorityCount = analyses.filter(a => 
      a.recommendations.some(r => r.priority === 'high')
    ).length;
    
    return {
      totalBundles: analyses.length,
      totalSize: this.getTotalBundleSize(),
      averageLoadTime: this.getAverageLoadTime(),
      totalOptimizationPotential: totalPotential,
      highPriorityIssues: highPriorityCount,
      recommendations: this.getAllRecommendations()
    };
  }
  
  getAllRecommendations() {
    const allRecommendations = [];
    
    for (const analysis of this.analysisResults.values()) {
      allRecommendations.push(...analysis.recommendations);
    }
    
    // Sort by priority and potential impact
    return allRecommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Sort by estimated savings (rough approximation)
      const savingsA = this.parseSavings(a.estimatedSavings);
      const savingsB = this.parseSavings(b.estimatedSavings);
      return savingsB - savingsA;
    });
  }
  
  parseSavings(savingsString) {
    const match = savingsString.match(/(\d+)-(\d+)/);
    if (match) {
      return (parseInt(match[1]) + parseInt(match[2])) / 2;
    }
    return 0;
  }
  
  // Optimization utilities
  
  async optimizeBundle(url, options = {}) {
    const analysis = this.getBundleAnalysis(url);
    if (!analysis) {
      throw new Error(`No analysis found for ${url}`);
    }
    
    const optimizations = [];
    
    // Apply optimizations based on recommendations
    for (const recommendation of analysis.recommendations) {
      try {
        const result = await this.applyOptimization(url, recommendation, options);
        optimizations.push(result);
      } catch (error) {
        console.error(`Failed to apply ${recommendation.type}:`, error);
      }
    }
    
    return optimizations;
  }
  
  async applyOptimization(url, recommendation, options) {
    switch (recommendation.type) {
      case 'compression':
        return this.applyCompression(url, options);
      case 'code-splitting':
        return this.applyCodeSplitting(url, options);
      case 'tree-shaking':
        return this.applyTreeShaking(url, options);
      case 'minification':
        return this.applyMinification(url, options);
      case 'caching':
        return this.applyCaching(url, options);
      default:
        throw new Error(`Unknown optimization type: ${recommendation.type}`);
    }
  }
  
  async applyCompression(url, options) {
    // This would typically be done server-side
    // For client-side, we can suggest compression settings
    return {
      type: 'compression',
      applied: false,
      message: 'Compression should be configured on the server',
      recommendation: 'Enable gzip/brotli compression with minimum 6 compression level'
    };
  }
  
  async applyCodeSplitting(url, options) {
    // This would typically be done during build
    return {
      type: 'code-splitting',
      applied: false,
      message: 'Code splitting should be done during build process',
      recommendation: 'Use dynamic imports() for lazy loading of non-critical code'
    };
  }
  
  async applyTreeShaking(url, options) {
    // This would typically be done during build
    return {
      type: 'tree-shaking',
      applied: false,
      message: 'Tree shaking should be configured in bundler',
      recommendation: 'Ensure ES6 modules and sideEffects: false in package.json'
    };
  }
  
  async applyMinification(url, options) {
    // This would typically be done during build
    return {
      type: 'minification',
      applied: false,
      message: 'Minification should be done during build',
      recommendation: 'Use terser with mangle and compress options'
    };
  }
  
  async applyCaching(url, options) {
    // This would typically be done server-side
    return {
      type: 'caching',
      applied: false,
      message: 'Caching should be configured on the server',
      recommendation: 'Set Cache-Control headers with appropriate max-age'
    };
  }
  
  // Monitoring and reporting
  
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.generateReport();
    }, 30000); // Every 30 seconds
  }
  
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  generateReport() {
    const summary = this.getOptimizationSummary();
    
    if (this.options.enableLogging) {
      console.log('Bundle Size Optimization Report:', summary);
    }
    
    // Emit custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('bundleOptimizationReport', {
      detail: summary
    }));
    
    return summary;
  }
  
  // Cleanup
  
  destroy() {
    this.stopMonitoring();
    
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
    }
    
    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
    }
    
    this.bundleData.clear();
    this.analysisResults.clear();
    this.compressionCache.clear();
  }
}

// Create global instance
window.bundleSizeOptimizer = new BundleSizeOptimizer({
  enableAnalysis: true,
  enableCompression: true,
  enableTreeShaking: true,
  enableCodeSplitting: true,
  enableMinification: true,
  enableCaching: true,
  enableLogging: true
});

// Global convenience methods
window.getBundleAnalysis = (url) => window.bundleSizeOptimizer.getBundleAnalysis(url);
window.getOptimizationSummary = () => window.bundleSizeOptimizer.getOptimizationSummary();
window.optimizeBundle = (url, options) => window.bundleSizeOptimizer.optimizeBundle(url, options);

// Auto-start monitoring
if (typeof window !== 'undefined') {
  window.bundleSizeOptimizer.startMonitoring();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BundleSizeOptimizer;
}
