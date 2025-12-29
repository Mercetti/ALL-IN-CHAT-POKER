// Performance Optimizer for All-In Chat Poker Enhanced Pages
class PerformanceOptimizer {
    constructor() {
        this.config = {
            lazyLoadThreshold: 200,
            imagePlaceholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiLz48L3JlY3Q+PC9zdmc+',
            bundleDelay: 100,
            cacheExpiry: 3600000, // 1 hour
            enableServiceWorker: true
        };
        
        this.cache = new Map();
        this.observer = null;
        this.loadedAssets = new Set();
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupScriptBundling();
        this.setupResourceHints();
        this.setupPerformanceMonitoring();
        this.setupServiceWorker();
        this.setupCriticalResourceLoading();
    }

    setupLazyLoading() {
        // Intersection Observer for lazy loading
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: `${this.config.lazyLoadThreshold}px`,
            threshold: 0.1
        });

        // Observe lazy-loadable elements
        this.observeLazyElements();
    }

    observeLazyElements() {
        // Images
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.observer.observe(img);
        });

        // Background images
        document.querySelectorAll('[data-bg]').forEach(element => {
            this.observer.observe(element);
        });

        // Videos
        document.querySelectorAll('video[data-src]').forEach(video => {
            this.observer.observe(video);
        });

        // Iframes
        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            this.observer.observe(iframe);
        });
    }

    loadElement(element) {
        const tagName = element.tagName.toLowerCase();
        
        switch(tagName) {
            case 'img':
                this.loadImage(element);
                break;
            default:
                if (element.dataset.src) {
                    this.loadGenericElement(element);
                }
                if (element.dataset.bg) {
                    this.loadBackgroundImage(element);
                }
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src || this.loadedAssets.has(src)) return;

        // Add loading state
        img.classList.add('loading');
        
        // Create new image to preload
        const newImg = new Image();
        newImg.onload = () => {
            img.src = src;
            img.classList.remove('loading');
            img.classList.add('loaded');
            this.loadedAssets.add(src);
            this.cacheAsset(src, 'image');
        };
        
        newImg.onerror = () => {
            img.classList.remove('loading');
            img.classList.add('error');
            this.handleImageError(img, src);
        };
        
        newImg.src = src;
    }

    loadBackgroundImage(element) {
        const bg = element.dataset.bg;
        if (!bg || this.loadedAssets.has(bg)) return;

        const newImg = new Image();
        newImg.onload = () => {
            element.style.backgroundImage = `url(${bg})`;
            element.classList.add('bg-loaded');
            this.loadedAssets.add(bg);
            this.cacheAsset(bg, 'image');
        };
        
        newImg.src = bg;
    }

    loadGenericElement(element) {
        const src = element.dataset.src;
        if (!src || this.loadedAssets.has(src)) return;

        element.onload = () => {
            element.classList.add('loaded');
            this.loadedAssets.add(src);
            this.cacheAsset(src, element.tagName.toLowerCase());
        };
        
        element.src = src;
    }

    handleImageError(img, src) {
        // Try to load from cache or use placeholder
        const cached = this.getCachedAsset(src);
        if (cached) {
            img.src = cached;
        } else {
            img.src = this.config.imagePlaceholder;
        }
    }

    setupImageOptimization() {
        // Optimize existing images
        document.querySelectorAll('img:not([data-optimized])').forEach(img => {
            this.optimizeImage(img);
            img.setAttribute('data-optimized', 'true');
        });
    }

    optimizeImage(img) {
        // Add loading="lazy" to images that don't have it
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }

        // Add proper dimensions if missing
        if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
            const rect = img.getBoundingClientRect();
            if (rect.width && rect.height) {
                img.setAttribute('width', rect.width);
                img.setAttribute('height', rect.height);
            }
        }

        // Convert to data-src for lazy loading if not already
        if (img.src && !img.dataset.src) {
            img.dataset.src = img.src;
            img.src = this.config.imagePlaceholder;
            img.classList.add('lazy-load');
            this.observer?.observe(img);
        }
    }

    setupScriptBundling() {
        // Bundle JavaScript files
        this.bundleScripts();
        
        // Setup dynamic loading
        this.setupDynamicScriptLoading();
    }

    bundleScripts() {
        // Identify scripts that can be bundled
        const scripts = document.querySelectorAll('script[src]');
        const bundleGroups = this.groupScriptsByPriority(scripts);
        
        // Load bundles with appropriate priority
        Object.entries(bundleGroups).forEach(([priority, group]) => {
            this.loadScriptBundle(group, priority);
        });
    }

    groupScriptsByPriority(scripts) {
        const groups = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };

        scripts.forEach(script => {
            const src = script.src;
            const priority = this.getScriptPriority(src);
            groups[priority].push(src);
        });

        return groups;
    }

    getScriptPriority(src) {
        // Determine script priority based on filename and path
        if (src.includes('theme-manager') || src.includes('js-enhanced-common')) {
            return 'critical';
        } else if (src.includes('component') || src.includes('enhanced')) {
            return 'high';
        } else if (src.includes('demo') || src.includes('example')) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    loadScriptBundle(scripts, priority) {
        const delay = this.getDelayByPriority(priority);
        
        setTimeout(() => {
            scripts.forEach(src => {
                this.loadScript(src);
            });
        }, delay);
    }

    getDelayByPriority(priority) {
        const delays = {
            critical: 0,
            high: 100,
            medium: 300,
            low: 500
        };
        return delays[priority] || 0;
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupDynamicScriptLoading() {
        // Add data-load-on-demand attribute to scripts
        document.querySelectorAll('script[data-load-on-demand]').forEach(script => {
            const trigger = script.dataset.trigger;
            if (trigger) {
                this.setupTrigger(trigger, script);
            }
        });
    }

    setupTrigger(trigger, script) {
        switch(trigger) {
            case 'click':
                document.addEventListener('click', () => this.loadScript(script.src), { once: true });
                break;
            case 'scroll':
                this.setupScrollTrigger(script);
                break;
            case 'hover':
                this.setupHoverTrigger(script);
                break;
        }
    }

    setupScrollTrigger(script) {
        let loaded = false;
        const scrollHandler = () => {
            if (!loaded && window.scrollY > 100) {
                this.loadScript(script.src);
                loaded = true;
                window.removeEventListener('scroll', scrollHandler);
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    setupHoverTrigger(script) {
        const element = document.querySelector(script.dataset.target);
        if (element) {
            element.addEventListener('mouseenter', () => this.loadScript(script.src), { once: true });
        }
    }

    setupResourceHints() {
        // Add DNS prefetch hints
        this.addDNSPrefetch();
        
        // Add preconnect hints
        this.addPreconnect();
        
        // Add preload hints for critical resources
        this.addPreloadHints();
    }

    addDNSPrefetch() {
        const domains = [
            'fonts.googleapis.com',
            'cdnjs.cloudflare.com',
            'www.google-analytics.com'
        ];

        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
    }

    addPreconnect() {
        const domains = [
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];

        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = `https://${domain}`;
            document.head.appendChild(link);
        });
    }

    addPreloadHints() {
        // Preload critical fonts
        this.preloadFonts();
        
        // Preload critical images
        this.preloadCriticalImages();
        
        // Preload critical scripts
        this.preloadCriticalScripts();
    }

    preloadFonts() {
        const fonts = [
            'Inter:wght@400;500;600;700',
            'Space Grotesk:wght@400;500;600;700'
        ];

        fonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '&')}`;
            document.head.appendChild(link);
        });
    }

    preloadCriticalImages() {
        const criticalImages = [
            'logo.png',
            'hero-bg.jpg'
        ];

        criticalImages.forEach(image => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = image;
            document.head.appendChild(link);
        });
    }

    preloadCriticalScripts() {
        const criticalScripts = [
            'theme-manager.js',
            'js-enhanced-common.js'
        ];

        criticalScripts.forEach(script => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = script;
            document.head.appendChild(link);
        });
    }

    setupCriticalResourceLoading() {
        // Load critical CSS inline
        this.inlineCriticalCSS();
        
        // Load critical fonts synchronously
        this.loadCriticalFonts();
    }

    inlineCriticalCSS() {
        // Critical CSS would be inlined here
        // This is a placeholder for the actual implementation
        const criticalCSS = `
            /* Critical CSS would be inlined here */
            body { margin: 0; font-family: 'Inter', sans-serif; }
            .glass-panel { background: rgba(255, 255, 255, 0.05); }
        `;
        
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.appendChild(style);
    }

    loadCriticalFonts() {
        // Load critical fonts synchronously
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        document.head.appendChild(link);
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();
        
        // Track resource loading performance
        this.trackResourcePerformance();
        
        // Monitor memory usage
        this.monitorMemoryUsage();
    }

    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        this.observeLCP();
        
        // First Input Delay (FID)
        this.observeFID();
        
        // Cumulative Layout Shift (CLS)
        this.observeCLS();
    }

    observeLCP() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.recordMetric('LCP', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
    }

    observeFID() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (entry.processingStart && entry.startTime) {
                    this.recordMetric('FID', entry.processingStart - entry.startTime);
                }
            });
        }).observe({ entryTypes: ['first-input'] });
    }

    observeCLS() {
        let clsValue = 0;
        
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.recordMetric('CLS', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
    }

    recordMetric(name, value) {
        // Store metrics for analysis
        const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '{}');
        metrics[name] = {
            value,
            timestamp: Date.now(),
            url: window.location.href
        };
        localStorage.setItem('performance_metrics', JSON.stringify(metrics));
        
        // Report to analytics if available
        this.reportMetric(name, value);
    }

    reportMetric(name, value) {
        // Report to analytics service
        if (window.gtag) {
            window.gtag('event', 'web_vital', {
                metric_name: name,
                metric_value: Math.round(value),
                metric_rating: this.getMetricRating(name, value)
            });
        }
    }

    getMetricRating(name, value) {
        const thresholds = {
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 }
        };
        
        const threshold = thresholds[name];
        if (!threshold) return 'unknown';
        
        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    }

    trackResourcePerformance() {
        // Track resource loading times
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.entryType === 'resource') {
                    this.cacheResourceTiming(entry);
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }

    cacheResourceTiming(entry) {
        const key = `${entry.name}-${entry.startTime}`;
        this.cache.set(key, {
            duration: entry.duration,
            size: entry.transferSize,
            type: entry.initiatorType
        });
    }

    monitorMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const memoryInfo = {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit
            };
            
            // Store memory usage periodically
            setInterval(() => {
                this.recordMemoryUsage(memoryInfo);
            }, 30000); // Every 30 seconds
        }
    }

    recordMemoryUsage(memoryInfo) {
        const usage = {
            used: memoryInfo.used,
            total: memoryInfo.total,
            limit: memoryInfo.limit,
            percentage: (memoryInfo.used / memoryInfo.limit) * 100,
            timestamp: Date.now()
        };
        
        localStorage.setItem('memory_usage', JSON.stringify(usage));
    }

    setupServiceWorker() {
        if (!this.config.enableServiceWorker || !('serviceWorker' in navigator)) {
            return;
        }

        // Register service worker
        if (navigator.serviceWorker.controller) {
            console.log('Service worker already active');
        } else {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service worker registration failed:', error);
                });
        }
    }

    // Caching utilities
    cacheAsset(key, type) {
        const cacheKey = `${type}-${key}`;
        this.cache.set(cacheKey, {
            data: key,
            type,
            timestamp: Date.now()
        });
    }

    getCachedAsset(key) {
        for (const [cacheKey, value] of this.cache) {
            if (value.data === key && this.isCacheValid(value.timestamp)) {
                return value.data;
            }
        }
        return null;
    }

    isCacheValid(timestamp) {
        return (Date.now() - timestamp) < this.config.cacheExpiry;
    }

    // Public API
    preloadResource(url, type = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = type;
        link.href = url;
        document.head.appendChild(link);
    }

    loadResourceOnDemand(url, type = 'script') {
        return this.loadScript(url);
    }

    getPerformanceMetrics() {
        return {
            coreWebVitals: JSON.parse(localStorage.getItem('performance_metrics') || '{}'),
            resourceTiming: Array.from(this.cache.values()),
            memoryUsage: JSON.parse(localStorage.getItem('memory_usage') || '{}')
        };
    }

    clearCache() {
        this.cache.clear();
        localStorage.removeItem('performance_metrics');
        localStorage.removeItem('memory_usage');
    }

    optimizePage() {
        // Run all optimizations
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupResourceHints();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});

// Export for potential external use
window.PerformanceOptimizer = PerformanceOptimizer;
