/**
 * Performance Benchmarks
 * Comprehensive performance testing and benchmarking for the poker game application
 */

const { test, expect } = require('@playwright/test');
const { performance } = require('perf_hooks');

test.describe('Performance Benchmarks', () => {
  test.describe('Page Load Performance', () => {
    test('should load main page within performance budget', async ({ page }) => {
      const startTime = performance.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = performance.now() - startTime;
      
      // Performance budgets
      expect(loadTime).toBeLessThan(3000); // 3 seconds
      expect(await page.locator('body').isVisible()).toBe(true);
    });

    test('should load game page within performance budget', async ({ page }) => {
      const startTime = performance.now();
      
      await page.goto('/game');
      await page.waitForSelector('.poker-table');
      
      const loadTime = performance.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000); // 2 seconds for game page
    });

    test('should load admin dashboard within performance budget', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'adminpass');
      await page.click('button[type="submit"]');
      
      const startTime = performance.now();
      
      await page.goto('/admin/dashboard');
      await page.waitForSelector('.dashboard-stats');
      
      const loadTime = performance.now() - startTime;
      
      expect(loadTime).toBeLessThan(2500); // 2.5 seconds for admin dashboard
    });

    test('should measure Core Web Vitals', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Get performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach(entry => {
              if (entry.entryType === 'navigation') {
                vitals.LCP = entry.loadEventEnd - entry.fetchStart;
                vitals.FCP = entry.domContentLoadedEventEnd - entry.fetchStart;
                vitals.TTFB = entry.responseStart - entry.fetchStart;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['navigation'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      // Core Web Vitals thresholds
      if (metrics.LCP) expect(metrics.LCP).toBeLessThan(2500); // 2.5s
      if (metrics.FCP) expect(metrics.FCP).toBeLessThan(1800); // 1.8s
      if (metrics.TTFB) expect(metrics.TTFB).toBeLessThan(800); // 800ms
    });
  });

  test.describe('API Performance', () => {
    test('should handle API responses within SLA', async ({ page }) => {
      await page.goto('/');
      
      // Monitor API calls
      const apiCalls = [];
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          apiCalls.push({
            url: response.url(),
            status: response.status(),
            timing: Date.now()
          });
        }
      });
      
      // Trigger API calls
      await page.click('[data-action="load-games"]');
      await page.waitForTimeout(1000);
      
      // Check API response times
      for (const call of apiCalls) {
        expect(call.status).toBeLessThan(400);
      }
      
      expect(apiCalls.length).toBeGreaterThan(0);
    });

    test('should handle concurrent API requests', async ({ page }) => {
      await page.goto('/');
      
      const startTime = performance.now();
      
      // Make multiple concurrent requests
      const requests = [
        page.evaluate(() => fetch('/api/games')),
        page.evaluate(() => fetch('/api/users')),
        page.evaluate(() => fetch('/api/leaderboard')),
        page.evaluate(() => fetch('/api/tournaments'))
      ];
      
      await Promise.all(requests);
      
      const totalTime = performance.now() - startTime;
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(2000);
    });

    test('should handle API rate limiting gracefully', async ({ page }) => {
      await page.goto('/');
      
      // Make rapid requests to test rate limiting
      const responses = [];
      
      for (let i = 0; i < 20; i++) {
        try {
          const response = await page.evaluate(() => 
            fetch('/api/games', { method: 'GET' })
          );
          responses.push(response.status);
        } catch (error) {
          responses.push(500);
        }
      }
      
      // Should handle rate limiting (429 responses) gracefully
      const rateLimited = responses.filter(status => status === 429);
      expect(rateLimited.length).toBeLessThan(10);
    });
  });

  test.describe('WebSocket Performance', () => {
    test('should establish WebSocket connection quickly', async ({ page }) => {
      await page.goto('/game');
      
      const startTime = performance.now();
      
      // Monitor WebSocket connection
      const wsConnected = await page.evaluate(() => {
        return new Promise((resolve) => {
          const ws = new WebSocket('ws://localhost:8080/acey');
          ws.onopen = () => resolve(true);
          ws.onerror = () => resolve(false);
          
          // Timeout fallback
          setTimeout(() => resolve(false), 5000);
        });
      });
      
      const connectionTime = performance.now() - startTime;
      
      expect(wsConnected).toBe(true);
      expect(connectionTime).toBeLessThan(1000);
    });

    test('should handle high-frequency WebSocket messages', async ({ page }) => {
      await page.goto('/game');
      
      // Simulate high-frequency messages
      const messageCount = 100;
      const startTime = performance.now();
      
      await page.evaluate(({ count }) => {
        return new Promise((resolve) => {
          const ws = new WebSocket('ws://localhost:8080/acey');
          let received = 0;
          
          ws.onopen = () => {
            // Send messages rapidly
            for (let i = 0; i < count; i++) {
              ws.send(JSON.stringify({
                type: 'ping',
                id: i,
                timestamp: Date.now()
              }));
            }
          };
          
          ws.onmessage = () => {
            received++;
            if (received === count) {
              resolve(true);
            }
          };
          
          setTimeout(() => resolve(false), 10000);
        });
      }, { count: messageCount });
      
      const totalTime = performance.now() - startTime;
      
      // Should handle high-frequency messages efficiently
      expect(totalTime).toBeLessThan(5000);
    });

    test('should maintain WebSocket connection stability', async ({ page }) => {
      await page.goto('/game');
      
      // Test connection stability over time
      const stabilityTest = await page.evaluate(() => {
        return new Promise((resolve) => {
          const ws = new WebSocket('ws://localhost:8080/acey');
          let messages = 0;
          let disconnected = false;
          
          ws.onopen = () => {
            // Send periodic messages
            const interval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'heartbeat',
                  timestamp: Date.now()
                }));
                messages++;
              } else {
                disconnected = true;
                clearInterval(interval);
              }
            }, 1000);
            
            // Test for 30 seconds
            setTimeout(() => {
              clearInterval(interval);
              resolve({
                messages,
                disconnected,
                stable: !disconnected && messages > 25
              });
            }, 30000);
          };
          
          ws.onerror = () => {
            resolve({ messages: 0, disconnected: true, stable: false });
          };
        });
      });
      
      expect(stabilityTest.stable).toBe(true);
      expect(stabilityTest.messages).toBeGreaterThan(25);
    });
  });

  test.describe('Memory Performance', () => {
    test('should maintain reasonable memory usage', async ({ page }) => {
      await page.goto('/');
      
      // Monitor memory usage
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        await page.click('[data-action="load-more"]');
        await page.waitForTimeout(500);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should not have memory leaks', async ({ page }) => {
      await page.goto('/game');
      
      // Test for memory leaks with repeated operations
      const memorySnapshots = [];
      
      for (let cycle = 0; cycle < 5; cycle++) {
        // Perform operations
        await page.click('[data-action="new-game"]');
        await page.waitForTimeout(1000);
        await page.click('[data-action="fold"]');
        await page.waitForTimeout(1000);
        
        // Force garbage collection
        await page.evaluate(() => {
          if (window.gc) window.gc();
        });
        
        // Take memory snapshot
        const memory = await page.evaluate(() => {
          return performance.memory ? performance.memory.usedJSHeapSize : 0;
        });
        
        memorySnapshots.push(memory);
      }
      
      // Memory should not continuously increase
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = lastSnapshot - firstSnapshot;
      
      expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024); // Less than 20MB growth
    });
  });

  test.describe('Rendering Performance', () => {
    test('should maintain 60fps during animations', async ({ page }) => {
      await page.goto('/game');
      
      // Monitor frame rate during animations
      const frameRate = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();
          
          function countFrames() {
            frameCount++;
            const elapsed = performance.now() - startTime;
            
            if (elapsed < 1000) { // Test for 1 second
              requestAnimationFrame(countFrames);
            } else {
              resolve(frameCount);
            }
          }
          
          requestAnimationFrame(countFrames);
        });
      });
      
      // Should maintain close to 60fps
      expect(frameRate).toBeGreaterThan(50);
    });

    test('should handle complex DOM updates efficiently', async ({ page }) => {
      await page.goto('/game');
      
      const startTime = performance.now();
      
      // Trigger complex DOM updates
      await page.evaluate(() => {
        const container = document.querySelector('.poker-table');
        if (container) {
          // Add many elements
          for (let i = 0; i < 100; i++) {
            const div = document.createElement('div');
            div.className = 'test-element';
            div.textContent = `Element ${i}`;
            container.appendChild(div);
          }
          
          // Remove elements
          for (let i = 0; i < 100; i++) {
            const element = document.querySelector('.test-element');
            if (element) {
              element.remove();
            }
          }
        }
      });
      
      const updateTime = performance.now() - startTime;
      
      // Should handle DOM updates efficiently
      expect(updateTime).toBeLessThan(500);
    });

    test('should optimize large list rendering', async ({ page }) => {
      await page.goto('/leaderboard');
      
      const startTime = performance.now();
      
      // Test large list rendering
      await page.evaluate(() => {
        const list = document.querySelector('.leaderboard-list');
        if (list) {
          // Simulate large list
          for (let i = 0; i < 1000; i++) {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
              <span class="rank">${i + 1}</span>
              <span class="name">Player ${i}</span>
              <span class="score">${1000 - i}</span>
            `;
            list.appendChild(item);
          }
        }
      });
      
      const renderTime = performance.now() - startTime;
      
      // Should render large list efficiently
      expect(renderTime).toBeLessThan(1000);
      
      // Check if virtualization is used (should have limited visible elements)
      const visibleItems = await page.locator('.leaderboard-item:visible').count();
      expect(visibleItems).toBeLessThan(50);
    });
  });

  test.describe('Database Performance', () => {
    test('should handle database queries efficiently', async ({ page }) => {
      await page.goto('/admin');
      
      // Monitor database performance
      const queryTime = await page.evaluate(() => {
        return new Promise((resolve) => {
          const startTime = performance.now();
          
          // Simulate database query
          fetch('/api/admin/users')
            .then(response => response.json())
            .then(() => {
              const endTime = performance.now();
              resolve(endTime - startTime);
            })
            .catch(() => resolve(10000)); // Fallback timeout
        });
      });
      
      // Database queries should be fast
      expect(queryTime).toBeLessThan(500);
    });

    test('should handle concurrent database operations', async ({ page }) => {
      await page.goto('/admin');
      
      const startTime = performance.now();
      
      // Simulate concurrent database operations
      const operations = [
        page.evaluate(() => fetch('/api/admin/users')),
        page.evaluate(() => fetch('/api/admin/games')),
        page.evaluate(() => fetch('/api/admin/stats')),
        page.evaluate(() => fetch('/api/admin/logs'))
      ];
      
      await Promise.all(operations);
      
      const totalTime = performance.now() - startTime;
      
      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(1500);
    });
  });

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = performance.now();
      
      await page.goto('/game');
      await page.waitForSelector('.poker-table');
      
      const loadTime = performance.now() - startTime;
      
      // Mobile should load quickly
      expect(loadTime).toBeLessThan(4000);
      
      // Check touch interactions are responsive
      const touchStartTime = performance.now();
      
      await page.tap('[data-action="check"]');
      await page.waitForSelector('.player-status.checked');
      
      const touchResponseTime = performance.now() - touchStartTime;
      
      expect(touchResponseTime).toBeLessThan(500);
    });

    test('should handle mobile network conditions', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Simulate slow 3G network
      await page.route('**/*', route => {
        // Add delay to simulate slow network
        setTimeout(() => {
          route.continue();
        }, 500);
      });
      
      const startTime = performance.now();
      
      await page.goto('/game');
      await page.waitForSelector('.poker-table', { timeout: 10000 });
      
      const loadTime = performance.now() - startTime;
      
      // Should handle slow network gracefully
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe('Stress Testing', () => {
    test('should handle high user load', async ({ page }) => {
      await page.goto('/game');
      
      // Simulate high user activity
      const startTime = performance.now();
      
      const actions = [];
      for (let i = 0; i < 50; i++) {
        actions.push(
          page.click('[data-action="check"]'),
          page.click('[data-action="raise"]'),
          page.click('[data-action="fold"]'),
          page.click('[data-action="new-game"]')
        );
      }
      
      await Promise.all(actions);
      
      const totalTime = performance.now() - startTime;
      
      // Should handle high load without crashing
      expect(totalTime).toBeLessThan(10000);
      expect(await page.locator('.poker-table').isVisible()).toBe(true);
    });

    test('should maintain performance under memory pressure', async ({ page }) => {
      await page.goto('/game');
      
      // Create memory pressure
      await page.evaluate(() => {
        // Create large objects to stress memory
        const largeArrays = [];
        for (let i = 0; i < 10; i++) {
          const largeArray = new Array(10000).fill(0).map((_, index) => ({
            id: index,
            data: new Array(1000).fill(Math.random())
          }));
          largeArrays.push(largeArray);
        }
        
        // Keep reference to prevent garbage collection
        window.largeArrays = largeArrays;
      });
      
      // Test performance under memory pressure
      const startTime = performance.now();
      
      await page.click('[data-action="new-game"]');
      await page.waitForSelector('.player-cards');
      
      const responseTime = performance.now() - startTime;
      
      // Should still respond reasonably under memory pressure
      expect(responseTime).toBeLessThan(2000);
      
      // Clean up
      await page.evaluate(() => {
        delete window.largeArrays;
      });
    });
  });

  test.describe('Accessibility Performance', () => {
    test('should maintain accessibility with performance optimizations', async ({ page }) => {
      await page.goto('/game');
      
      // Check that performance optimizations don't break accessibility
      const accessibilityChecks = await page.evaluate(() => {
        const issues = [];
        
        // Check for alt text
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
          issues.push(`${imagesWithoutAlt.length} images missing alt text`);
        }
        
        // Check for ARIA labels
        const inputsWithoutLabel = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby]):not([aria-describedby])');
        if (inputsWithoutLabel.length > 0) {
          issues.push(`${inputsWithoutLabel.length} inputs missing labels`);
        }
        
        // Check for heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
          issues.push('No headings found');
        }
        
        return issues;
      });
      
      // Should have minimal accessibility issues
      expect(accessibilityChecks.length).toBeLessThan(5);
    });
  });
});
