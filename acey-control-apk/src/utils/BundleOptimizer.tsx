/**
 * Bundle Optimizer
 * Provides build optimization and lazy loading utilities
 */

import React, { Suspense, lazy } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

// Lazy loaded components
const LazyStatusScreen = lazy(() => import('../../screens/StatusScreen'));
const LazyControlScreen = lazy(() => import('../../screens/ControlScreen'));
const LazyLogsScreen = lazy(() => import('../../screens/LogsScreen'));
const LazyAnalyticsScreen = lazy(() => import('../../screens/AnalyticsScreen'));
const LazySettingsScreen = lazy(() => import('../../screens/SettingsScreen'));

// Bundle analyzer utilities
export class BundleOptimizer {
  private static instance: BundleOptimizer;
  private bundleMetrics: {
    initialLoad: number;
    lazyLoaded: Record<string, number>;
    totalSize: number;
    compressionRatio: number;
  };

  private constructor() {
    this.bundleMetrics = {
      initialLoad: 0,
      lazyLoaded: {},
      totalSize: 0,
      compressionRatio: 0,
    };
  }

  static getInstance(): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer();
    }
    return BundleOptimizer.instance;
  }

  // Bundle size analysis
  analyzeBundleSize(): Promise<{
    initialLoad: number;
    lazyLoaded: Record<string, number>;
    totalSize: number;
    compressionRatio: number;
  }> {
    return new Promise((resolve) => {
      // Simulate bundle analysis
      setTimeout(() => {
        const metrics = {
          initialLoad: 2.1, // MB
          lazyLoaded: {
            StatusScreen: 0.8,
            ControlScreen: 1.2,
            LogsScreen: 0.6,
            AnalyticsScreen: 1.5,
            SettingsScreen: 0.9,
          },
          totalSize: 7.1, // MB
          compressionRatio: 0.65, // 65% compression
        };
        
        this.bundleMetrics = metrics;
        resolve(metrics);
      }, 1000);
    });
  }

  // Performance monitoring
  getPerformanceMetrics() {
    return {
      bundleSize: this.bundleMetrics,
      loadTimes: {
        initial: 1200, // ms
        lazy: {
          StatusScreen: 300,
          ControlScreen: 450,
          LogsScreen: 250,
          AnalyticsScreen: 380,
          SettingsScreen: 320,
        },
      },
      memoryUsage: {
        initial: 45, // MB
        peak: 78, // MB
        average: 62, // MB
      },
    };
  }

  // Optimization recommendations
  getOptimizationRecommendations() {
    return [
      {
        category: 'Bundle Size',
        priority: 'High',
        recommendation: 'Implement code splitting for analytics charts',
        impact: 'Reduce initial bundle by 1.2MB',
        effort: 'Medium',
      },
      {
        category: 'Loading Performance',
        priority: 'Medium',
        recommendation: 'Add skeleton loading states',
        impact: 'Improve perceived performance',
        effort: 'Low',
      },
      {
        category: 'Memory Usage',
        priority: 'Low',
        recommendation: 'Implement virtual scrolling for logs',
        impact: 'Reduce memory by 15MB',
        effort: 'High',
      },
    ];
  }

  // Lazy loading utilities
  createLazyComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) {
    const LazyComponent = lazy(importFunc);
    
    return (props: React.ComponentProps<T>) => (
      <Suspense
        fallback={
          fallback || (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  }
}

// Preloading utilities
export class PreloadManager {
  private static preloadedComponents = new Set<string>();
  private static preloadPromises = new Map<string, Promise<any>>();

  // Preload critical components
  static async preloadCriticalComponents() {
    const critical = ['StatusScreen', 'ControlScreen'];
    
    const promises = critical.map(async (component) => {
      if (!this.preloadedComponents.has(component)) {
        this.preloadedComponents.add(component);
        
        switch (component) {
          case 'StatusScreen':
            await import('../screens/StatusScreen');
            break;
          case 'ControlScreen':
            await import('../screens/ControlScreen');
            break;
        }
      }
    });

    await Promise.all(promises);
  }

  // Preload on-demand components
  static preloadComponent(componentName: string) {
    if (this.preloadedComponents.has(componentName)) {
      return Promise.resolve();
    }

    if (this.preloadPromises.has(componentName)) {
      return this.preloadPromises.get(componentName);
    }

    const promise = this.doPreload(componentName);
    this.preloadPromises.set(componentName, promise);
    
    return promise;
  }

  private static async doPreload(componentName: string) {
    try {
      switch (componentName) {
        case 'AnalyticsScreen':
          await import('../../screens/StatusScreen');
          await import('../../screens/ControlScreen');
          await import('../../screens/AnalyticsScreen');
          await import('../../screens/SettingsScreen');
          await import('../../screens/LogsScreen');
          break;
        default:
          console.warn(`Unknown component: ${componentName}`);
      }
      
      this.preloadedComponents.add(componentName);
    } catch (error) {
      console.error(`Failed to preload ${componentName}:`, error);
    }
  }

  // Get preload status
  static getPreloadStatus() {
    return {
      preloaded: Array.from(this.preloadedComponents),
      inProgress: Array.from(this.preloadPromises.keys()),
      totalComponents: 5,
    };
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = {
    loadTimes: new Map<string, number>(),
    renderTimes: new Map<string, number>(),
    memorySnapshots: [] as Array<{ timestamp: number; usage: number }>,
  };

  // Track component load time
  static trackLoadTime(componentName: string, startTime: number) {
    const loadTime = Date.now() - startTime;
    this.metrics.loadTimes.set(componentName, loadTime);
    
    console.log(`Component ${componentName} loaded in ${loadTime}ms`);
    return loadTime;
  }

  // Track render performance
  static trackRenderTime(componentName: string, renderTime: number) {
    this.metrics.renderTimes.set(componentName, renderTime);
  }

  // Track memory usage
  static trackMemoryUsage() {
    // Simulate memory tracking
    const usage = Math.random() * 100; // MB
    this.metrics.memorySnapshots.push({
      timestamp: Date.now(),
      usage,
    });

    // Keep only last 100 snapshots
    if (this.metrics.memorySnapshots.length > 100) {
      this.metrics.memorySnapshots.shift();
    }
  }

  // Get performance report
  static getPerformanceReport() {
    const loadTimes = Array.from(this.metrics.loadTimes.entries());
    const renderTimes = Array.from(this.metrics.renderTimes.entries());
    
    return {
      loadTimes: Object.fromEntries(loadTimes),
      renderTimes: Object.fromEntries(renderTimes),
      memoryUsage: {
        current: this.metrics.memorySnapshots[this.metrics.memorySnapshots.length - 1]?.usage || 0,
        peak: Math.max(...this.metrics.memorySnapshots.map(s => s.usage)),
        average: this.metrics.memorySnapshots.reduce((sum, s) => sum + s.usage, 0) / this.metrics.memorySnapshots.length,
      },
      recommendations: this.generateRecommendations(),
    };
  }

  private static generateRecommendations() {
    const recommendations = [];
    
    // Analyze load times
    const loadTimes = Array.from(this.metrics.loadTimes.values());
    const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    
    if (avgLoadTime > 500) {
      recommendations.push({
        type: 'Performance',
        priority: 'High',
        message: 'Average load time exceeds 500ms. Consider optimizing bundle size.',
      });
    }

    // Analyze memory usage
    const memorySnapshots = this.metrics.memorySnapshots;
    if (memorySnapshots.length > 0) {
      const peakMemory = Math.max(...memorySnapshots.map(s => s.usage));
      if (peakMemory > 80) {
        recommendations.push({
          type: 'Memory',
          priority: 'Medium',
          message: 'Peak memory usage exceeds 80MB. Consider implementing memory optimization.',
        });
      }
    }

    return recommendations;
  }
}

// Optimization utilities
export const OptimizationUtils = {
  // Debounce function for performance
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize expensive computations
  memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map();
    
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Virtual scrolling utilities
  createVirtualList<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    renderItem: (item: T, index: number) => React.ReactNode
  ) {
    const [scrollTop, setScrollTop] = React.useState(0);
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    const visibleItems = items.slice(startIndex, endIndex);
    
    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
      onScroll: (event: any) => setScrollTop(event.nativeEvent.contentOffset.y),
    };
  },
};

// Lazy loading wrapper component
export const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}> = ({ children, fallback, delay = 200 }) => {
  const [showContent, setShowContent] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!showContent) {
    return fallback || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return <>{children}</>;
};

// Styles
const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f3f4f6',
    minHeight: 200,
  } as const,
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
};

// Export lazy loaded components
export {
  LazyStatusScreen,
  LazyControlScreen,
  LazyLogsScreen,
  LazyAnalyticsScreen,
  LazySettingsScreen,
};
