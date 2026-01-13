/**
 * Bundle Analyzer
 * Analyzes JavaScript bundles and provides optimization recommendations
 */

class BundleAnalyzer {
  constructor() {
    this.bundles = new Map();
    this.metrics = {
      totalSize: 0,
      totalModules: 0,
      loadTimes: [],
      compressionRatio: 0
    };
  }

  /**
   * Analyze current bundles
   */
  async analyzeBundles() {
    console.log('📊 Analyzing JavaScript bundles...');
    
    const bundleUrls = [
      '/js/admin/dashboard-core.js',
      '/js/admin/loader.js',
      '/js/overlay/overlay-loader.js',
      '/js/overlay/modules/overlay-render-core.js'
    ];

    for (const url of bundleUrls) {
      await this.analyzeBundle(url);
    }

    this.generateReport();
    this.generateRecommendations();
  }

  /**
   * Analyze individual bundle
   */
  async analyzeBundle(url) {
    try {
      const startTime = performance.now();
      
      const response = await fetch(url);
      const content = await response.text();
      
      const loadTime = performance.now() - startTime;
      const size = new Blob([content]).size;
      
      const bundle = {
        url,
        size,
        loadTime,
        content,
        modules: this.extractModules(content),
        dependencies: this.extractDependencies(content),
        compressionRatio: this.calculateCompressionRatio(content)
      };
      
      this.bundles.set(url, bundle);
      this.metrics.totalSize += size;
      this.metrics.totalModules += bundle.modules.length;
      this.metrics.loadTimes.push(loadTime);
      
      console.log(`📦 Analyzed bundle: ${url} (${this.formatBytes(size)})`);
      
    } catch (error) {
      console.error(`Failed to analyze bundle: ${url}`, error);
    }
  }

  /**
   * Extract modules from bundle content
   */
  extractModules(content) {
    const modules = [];
    
    // Look for class definitions
    const classMatches = content.match(/class\s+(\w+)/g);
    if (classMatches) {
      modules.push(...classMatches.map(match => match.replace(/class\s+/, '')));
    }
    
    // Look for function exports
    const exportMatches = content.match(/exports\.(\w+)/g);
    if (exportMatches) {
      modules.push(...exportMatches.map(match => match.replace(/exports\./, '')));
    }
    
    return [...new Set(modules)]; // Remove duplicates
  }

  /**
   * Extract dependencies from bundle content
   */
  extractDependencies(content) {
    const dependencies = [];
    
    // Look for require statements
    const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g);
    if (requireMatches) {
      dependencies.push(...requireMatches.map(match => 
        match.match(/require\(['"]([^'"]+)['"]\)/)[1]
      ));
    }
    
    // Look for import statements
    const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      dependencies.push(...importMatches.map(match => 
        match.match(/from\s+['"]([^'"]+)['"]/)[1]
      ));
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Calculate compression ratio
   */
  calculateCompressionRatio(content) {
    // Simple compression simulation
    const originalSize = content.length;
    const compressed = content.replace(/\s+/g, ' ').trim();
    const compressedSize = compressed.length;
    
    return ((originalSize - compressedSize) / originalSize) * 100;
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    console.log('\n📊 Bundle Analysis Report');
    console.log('==========================');
    
    console.log(`Total Bundle Size: ${this.formatBytes(this.metrics.totalSize)}`);
    console.log(`Total Modules: ${this.metrics.totalModules}`);
    console.log(`Average Load Time: ${Math.round(this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length)}ms`);
    
    console.log('\nBundle Details:');
    this.bundles.forEach((bundle, url) => {
      console.log(`\n📦 ${url.split('/').pop()}`);
      console.log(`   Size: ${this.formatBytes(bundle.size)}`);
      console.log(`   Load Time: ${Math.round(bundle.loadTime)}ms`);
      console.log(`   Modules: ${bundle.modules.length}`);
      console.log(`   Dependencies: ${bundle.dependencies.length}`);
      console.log(`   Compression Ratio: ${Math.round(bundle.compressionRatio)}%`);
      
      if (bundle.modules.length > 0) {
        console.log(`   Modules: ${bundle.modules.slice(0, 5).join(', ')}${bundle.modules.length > 5 ? '...' : ''}`);
      }
    });
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    console.log('\n💡 Optimization Recommendations');
    console.log('=============================');
    
    const recommendations = [];
    
    // Check bundle sizes
    this.bundles.forEach((bundle, url) => {
      const bundleName = url.split('/').pop();
      
      if (bundle.size > 100 * 1024) { // > 100KB
        recommendations.push({
          type: 'bundle-size',
          bundle: bundleName,
          message: `${bundleName} is large (${this.formatBytes(bundle.size)}). Consider code splitting.`,
          priority: 'high'
        });
      }
      
      if (bundle.modules.length > 10) {
        recommendations.push({
          type: 'module-count',
          bundle: bundleName,
          message: `${bundleName} contains many modules (${bundle.modules.length}). Consider splitting into smaller modules.`,
          priority: 'medium'
        });
      }
      
      if (bundle.loadTime > 100) {
        recommendations.push({
          type: 'load-time',
          bundle: bundleName,
          message: `${bundleName} loads slowly (${Math.round(bundle.loadTime)}ms). Consider optimization.`,
          priority: 'medium'
        });
      }
      
      if (bundle.compressionRatio < 20) {
        recommendations.push({
          type: 'compression',
          bundle: bundleName,
          message: `${bundleName} has low compression ratio (${Math.round(bundle.compressionRatio)}%). Consider minification.`,
          priority: 'low'
        });
      }
    });
    
    // Check for duplicate dependencies
    const allDependencies = [];
    this.bundles.forEach(bundle => {
      allDependencies.push(...bundle.dependencies);
    });
    
    const duplicateDependencies = allDependencies.filter((dep, index) => 
      allDependencies.indexOf(dep) !== index
    );
    
    if (duplicateDependencies.length > 0) {
      recommendations.push({
        type: 'duplicate-dependencies',
        message: `Found duplicate dependencies: ${[...new Set(duplicateDependencies)].join(', ')}. Consider bundling shared dependencies.`,
        priority: 'medium'
      });
    }
    
    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Display recommendations
    recommendations.forEach((rec, index) => {
      const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${icon} ${index + 1}. ${rec.message}`);
    });
    
    // Generate actionable steps
    this.generateActionableSteps(recommendations);
  }

  /**
   * Generate actionable optimization steps
   */
  generateActionableSteps(recommendations) {
    console.log('\n🛠️ Actionable Steps');
    console.log('===================');
    
    const steps = [];
    
    // Code splitting recommendations
    const largeBundles = recommendations.filter(r => r.type === 'bundle-size');
    if (largeBundles.length > 0) {
      steps.push({
        title: 'Implement Code Splitting',
        description: 'Split large bundles into smaller, loadable chunks',
        bundles: largeBundles.map(r => r.bundle)
      });
    }
    
    // Lazy loading recommendations
    const slowBundles = recommendations.filter(r => r.type === 'load-time');
    if (slowBundles.length > 0) {
      steps.push({
        title: 'Implement Lazy Loading',
        description: 'Load modules only when needed',
        bundles: slowBundles.map(r => r.bundle)
      });
    }
    
    // Compression recommendations
    const compressionRecs = recommendations.filter(r => r.type === 'compression');
    if (compressionRecs.length > 0) {
      steps.push({
        title: 'Enable Compression',
        description: 'Minify and compress JavaScript files',
        bundles: compressionRecs.map(r => r.bundle)
      });
    }
    
    steps.forEach((step, index) => {
      console.log(`\n${index + 1}. ${step.title}`);
      console.log(`   ${step.description}`);
      if (step.bundles) {
        console.log(`   Affected bundles: ${step.bundles.join(', ')}`);
      }
    });
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get bundle statistics
   */
  getBundleStats() {
    return {
      totalBundles: this.bundles.size,
      totalSize: this.metrics.totalSize,
      totalModules: this.metrics.totalModules,
      averageBundleSize: this.metrics.totalSize / this.bundles.size,
      averageLoadTime: this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length,
      bundles: Array.from(this.bundles.entries()).map(([url, bundle]) => ({
        url,
        name: url.split('/').pop(),
        size: bundle.size,
        modules: bundle.modules.length,
        loadTime: bundle.loadTime,
        compressionRatio: bundle.compressionRatio
      }))
    };
  }

  /**
   * Export analysis data
   */
  exportAnalysis() {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      bundles: Array.from(this.bundles.entries()),
      stats: this.getBundleStats()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `bundle-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📊 Bundle analysis exported');
  }

  /**
   * Monitor bundle performance over time
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      this.analyzeBundles();
    }, 60000); // Analyze every minute
  }
}

// Global instance
window.BundleAnalyzer = new BundleAnalyzer();

// Auto-analyze when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.BundleAnalyzer.analyzeBundles();
    }, 2000); // Wait for bundles to load
  });
} else {
  setTimeout(() => {
    window.BundleAnalyzer.analyzeBundles();
  }, 2000);
}
