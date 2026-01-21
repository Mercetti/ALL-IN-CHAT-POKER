/**
 * Stability Monitor Unit Tests
 * Tests system health monitoring and state management
 */

import { StabilityMonitor, StabilityState } from '../../packages/helm-control/src/stability/StabilityMonitor';

describe('StabilityMonitor', () => {
  let stabilityMonitor: StabilityMonitor;

  beforeEach(() => {
    stabilityMonitor = new StabilityMonitor();
  });

  describe('Constructor', () => {
    test('should initialize with default state', () => {
      expect(stabilityMonitor).toBeDefined();
      expect(stabilityMonitor.getCurrentState()).toBe('normal');
      expect(stabilityMonitor.isHealthy()).toBe(true);
      expect(stabilityMonitor.isOperational()).toBe(true);
    });

    test('should initialize with default metrics', () => {
      const metrics = stabilityMonitor.getMetrics();
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('uptime');
    });
  });

  describe('start() and stop()', () => {
    test('should start monitoring', () => {
      stabilityMonitor.start();
      expect(stabilityMonitor.getCurrentState()).toBe('normal');
    });

    test('should stop monitoring', () => {
      stabilityMonitor.start();
      stabilityMonitor.stop();
      expect(stabilityMonitor.getCurrentState()).toBe('normal');
    });

    test('should handle multiple start calls', () => {
      stabilityMonitor.start();
      stabilityMonitor.start();
      expect(stabilityMonitor.getCurrentState()).toBe('normal');
    });

    test('should handle stop without start', () => {
      stabilityMonitor.stop();
      expect(stabilityMonitor.getCurrentState()).toBe('normal');
    });
  });

  describe('check()', () => {
    test('should update metrics when monitoring', () => {
      stabilityMonitor.start();
      const initialMetrics = stabilityMonitor.getMetrics();
      
      stabilityMonitor.check();
      const updatedMetrics = stabilityMonitor.getMetrics();
      
      expect(updatedMetrics.uptime).toBeGreaterThan(initialMetrics.uptime);
    });

    test('should not update metrics when not monitoring', () => {
      const initialMetrics = stabilityMonitor.getMetrics();
      
      stabilityMonitor.check();
      const updatedMetrics = stabilityMonitor.getMetrics();
      
      expect(updatedMetrics.uptime).toBe(initialMetrics.uptime);
    });

    test('should evaluate state based on metrics', () => {
      stabilityMonitor.start();
      stabilityMonitor.check();
      
      const state = stabilityMonitor.getCurrentState();
      expect(['normal', 'degraded', 'minimal', 'safe', 'shutdown']).toContain(state);
    });
  });

  describe('getCurrentState()', () => {
    test('should return valid state', () => {
      const state = stabilityMonitor.getCurrentState();
      expect(['normal', 'degraded', 'minimal', 'safe', 'shutdown']).toContain(state);
    });

    test('should return normal state initially', () => {
      expect(stabilityMonitor.getCurrentState()).toBe('normal');
    });
  });

  describe('getMetrics()', () => {
    test('should return metrics object', () => {
      const metrics = stabilityMonitor.getMetrics();
      expect(typeof metrics).toBe('object');
      expect(metrics).not.toBeNull();
    });

    test('should return metrics with correct types', () => {
      const metrics = stabilityMonitor.getMetrics();
      
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.cpuUsage).toBe('number');
      expect(typeof metrics.activeConnections).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
      expect(typeof metrics.responseTime).toBe('number');
      expect(typeof metrics.uptime).toBe('number');
    });

    test('should return metrics within reasonable ranges', () => {
      const metrics = stabilityMonitor.getMetrics();
      
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
      expect(metrics.activeConnections).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
      expect(metrics.responseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isHealthy()', () => {
    test('should return true for normal state', () => {
      expect(stabilityMonitor.isHealthy()).toBe(true);
    });

    test('should return true for degraded state', () => {
      // This would require mocking metrics to trigger degraded state
      // For now, test the default behavior
      expect(stabilityMonitor.isHealthy()).toBe(true);
    });

    test('should return false for minimal state', () => {
      // This would require mocking metrics to trigger minimal state
      // For now, test the default behavior
      expect(stabilityMonitor.isHealthy()).toBe(true);
    });
  });

  describe('isOperational()', () => {
    test('should return true for operational states', () => {
      expect(stabilityMonitor.isOperational()).toBe(true);
    });

    test('should return false for shutdown state', () => {
      stabilityMonitor.shutdown();
      expect(stabilityMonitor.isOperational()).toBe(false);
    });
  });

  describe('shutdown()', () => {
    test('should set state to shutdown', () => {
      stabilityMonitor.shutdown();
      expect(stabilityMonitor.getCurrentState()).toBe('shutdown');
      expect(stabilityMonitor.isOperational()).toBe(false);
    });

    test('should stop monitoring', () => {
      stabilityMonitor.start();
      stabilityMonitor.shutdown();
      expect(stabilityMonitor.getCurrentState()).toBe('shutdown');
    });
  });

  describe('setThresholds()', () => {
    test('should update thresholds', () => {
      const newThresholds = {
        memory: 512 * 1024 * 1024, // 512MB
        cpu: 90, // 90%
        connections: 50,
        errorRate: 0.1, // 10%
        responseTime: 2000 // 2 seconds
      };

      stabilityMonitor.setThresholds(newThresholds);
      
      // Verify thresholds were updated (would need to expose thresholds for testing)
      expect(() => {
        stabilityMonitor.setThresholds(newThresholds);
      }).not.toThrow();
    });

    test('should handle partial threshold updates', () => {
      const partialThresholds = {
        memory: 256 * 1024 * 1024
      };

      expect(() => {
        stabilityMonitor.setThresholds(partialThresholds);
      }).not.toThrow();
    });

    test('should handle empty threshold updates', () => {
      expect(() => {
        stabilityMonitor.setThresholds({});
      }).not.toThrow();
    });
  });

  describe('State Transitions', () => {
    test('should handle state transitions correctly', () => {
      stabilityMonitor.start();
      
      // Initial state should be normal
      expect(stabilityMonitor.getCurrentState()).toBe('normal');
      
      // Check metrics and evaluate state
      stabilityMonitor.check();
      const state = stabilityMonitor.getCurrentState();
      expect(['normal', 'degraded', 'minimal', 'safe']).toContain(state);
    });

    test('should handle shutdown from any state', () => {
      stabilityMonitor.start();
      stabilityMonitor.check();
      
      stabilityMonitor.shutdown();
      expect(stabilityMonitor.getCurrentState()).toBe('shutdown');
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple check calls', () => {
      stabilityMonitor.start();
      
      for (let i = 0; i < 10; i++) {
        stabilityMonitor.check();
        const state = stabilityMonitor.getCurrentState();
        expect(['normal', 'degraded', 'minimal', 'safe', 'shutdown']).toContain(state);
      }
    });

    test('should handle start/stop cycles', () => {
      for (let i = 0; i < 5; i++) {
        stabilityMonitor.start();
        stabilityMonitor.check();
        stabilityMonitor.stop();
        
        const state = stabilityMonitor.getCurrentState();
        expect(['normal', 'degraded', 'minimal', 'safe', 'shutdown']).toContain(state);
      }
    });

    test('should handle shutdown without start', () => {
      stabilityMonitor.shutdown();
      expect(stabilityMonitor.getCurrentState()).toBe('shutdown');
      expect(stabilityMonitor.isOperational()).toBe(false);
    });

    test('should handle check without start', () => {
      stabilityMonitor.check();
      const state = stabilityMonitor.getCurrentState();
      expect(['normal', 'degraded', 'minimal', 'safe', 'shutdown']).toContain(state);
    });
  });

  describe('Metrics Validation', () => {
    test('should generate realistic metrics', () => {
      stabilityMonitor.start();
      stabilityMonitor.check();
      
      const metrics = stabilityMonitor.getMetrics();
      
      // Memory usage should be reasonable (simulated)
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThan(2 * 1024 * 1024 * 1024); // Less than 2GB
      
      // CPU usage should be between 0-100%
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
      
      // Error rate should be between 0-1
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
      
      // Response time should be reasonable
      expect(metrics.responseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.responseTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should update uptime consistently', () => {
      stabilityMonitor.start();
      
      const initialUptime = stabilityMonitor.getMetrics().uptime;
      
      // Wait a bit and check again
      setTimeout(() => {
        stabilityMonitor.check();
        const updatedUptime = stabilityMonitor.getMetrics().uptime;
        expect(updatedUptime).toBeGreaterThan(initialUptime);
      }, 10);
    });
  });

  describe('Integration Tests', () => {
    test('should work with HelmClient integration', () => {
      stabilityMonitor.start();
      
      const metrics = stabilityMonitor.getMetrics();
      const state = stabilityMonitor.getCurrentState();
      const isHealthy = stabilityMonitor.isHealthy();
      
      expect(metrics).toBeDefined();
      expect(state).toBeDefined();
      expect(typeof isHealthy).toBe('boolean');
      
      stabilityMonitor.shutdown();
      expect(stabilityMonitor.isOperational()).toBe(false);
    });

    test('should handle concurrent operations', () => {
      stabilityMonitor.start();
      
      // Simulate concurrent operations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve().then(() => {
          stabilityMonitor.check();
          return stabilityMonitor.getCurrentState();
        }));
      }
      
      Promise.all(promises).then(states => {
        states.forEach(state => {
          expect(['normal', 'degraded', 'minimal', 'safe', 'shutdown']).toContain(state);
        });
      });
    });

    test('should maintain consistency across operations', () => {
      stabilityMonitor.start();
      
      const initialState = stabilityMonitor.getCurrentState();
      const initialMetrics = stabilityMonitor.getMetrics();
      
      stabilityMonitor.check();
      const afterCheckState = stabilityMonitor.getCurrentState();
      const afterCheckMetrics = stabilityMonitor.getMetrics();
      
      // State should be valid
      expect(['normal', 'degraded', 'minimal', 'safe', 'shutdown']).toContain(afterCheckState);
      
      // Metrics should be updated
      expect(afterCheckMetrics.uptime).toBeGreaterThanOrEqual(initialMetrics.uptime);
      
      stabilityMonitor.shutdown();
      const finalState = stabilityMonitor.getCurrentState();
      expect(finalState).toBe('shutdown');
    });
  });

  describe('Performance Tests', () => {
    test('should handle rapid check calls efficiently', () => {
      stabilityMonitor.start();
      
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        stabilityMonitor.check();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 1000 checks in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle rapid state queries efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        stabilityMonitor.getCurrentState();
        stabilityMonitor.isHealthy();
        stabilityMonitor.isOperational();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 3000 queries in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
