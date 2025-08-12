/**
 * Performance Monitor Utility
 * Monitors and reports on dashboard performance metrics
 */
class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            enableLogging: options.enableLogging !== false,
            enableReporting: options.enableReporting !== false,
            reportingEndpoint: options.reportingEndpoint || '/api/performance-metrics.php',
            reportingInterval: options.reportingInterval || 60000, // 1 minute
            thresholds: {
                slowApiCall: options.slowApiCall || 2000, // 2 seconds
                slowPageLoad: options.slowPageLoad || 3000, // 3 seconds
                slowComponentRender: options.slowComponentRender || 500, // 500ms
                ...options.thresholds
            },
            ...options
        };
        
        this.metrics = {
            apiCalls: [],
            pageLoads: [],
            componentRenders: [],
            errors: [],
            userInteractions: []
        };
        
        this.timers = new Map();
        this.reportingTimer = null;
        
        this.init();
    }
    
    init() {
        this.setupPerformanceObserver();
        this.setupErrorTracking();
        this.startReporting();
        this.measureInitialLoad();
    }
    
    /**
     * Setup Performance Observer for automatic metrics collection
     */
    setupPerformanceObserver() {
        if (!window.PerformanceObserver) return;
        
        try {
            // Observe navigation timing
            const navObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPageLoad(entry);
                }
            });
            navObserver.observe({ entryTypes: ['navigation'] });
            
            // Observe resource timing (for API calls)
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name.includes('/api/')) {
                        this.recordApiCall(entry);
                    }
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            
            // Observe paint timing
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPaintTiming(entry);
                }
            });
            paintObserver.observe({ entryTypes: ['paint'] });
            
        } catch (error) {
            console.warn('Performance Observer not fully supported:', error);
        }
    }
    
    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now()
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: Date.now()
            });
        });
    }
    
    /**
     * Measure initial page load
     */
    measureInitialLoad() {
        if (document.readyState === 'complete') {
            this.recordInitialLoadMetrics();
        } else {
            window.addEventListener('load', () => {
                this.recordInitialLoadMetrics();
            });
        }
    }
    
    /**
     * Record initial load metrics
     */
    recordInitialLoadMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.recordPageLoad(navigation);
        }
        
        // Record paint timings
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => this.recordPaintTiming(entry));
    }
    
    /**
     * Start a performance timer
     */
    startTimer(name, metadata = {}) {
        this.timers.set(name, {
            startTime: performance.now(),
            metadata
        });
    }
    
    /**
     * End a performance timer and record the metric
     */
    endTimer(name, category = 'custom') {
        const timer = this.timers.get(name);
        if (!timer) {
            console.warn(`Timer '${name}' not found`);
            return null;
        }
        
        const duration = performance.now() - timer.startTime;
        this.timers.delete(name);
        
        const metric = {
            name,
            duration,
            category,
            timestamp: Date.now(),
            ...timer.metadata
        };
        
        // Record based on category
        switch (category) {
            case 'api':
                this.recordApiCallMetric(metric);
                break;
            case 'component':
                this.recordComponentRender(metric);
                break;
            case 'interaction':
                this.recordUserInteraction(metric);
                break;
            default:
                this.recordCustomMetric(metric);
        }
        
        return metric;
    }
    
    /**
     * Record API call performance
     */
    recordApiCall(entry) {
        const metric = {
            url: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            cached: entry.transferSize === 0,
            timestamp: Date.now(),
            slow: entry.duration > this.options.thresholds.slowApiCall
        };
        
        this.metrics.apiCalls.push(metric);
        this.limitMetricsArray(this.metrics.apiCalls, 100);
        
        if (this.options.enableLogging && metric.slow) {
            console.warn(`Slow API call detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
    }
    
    /**
     * Record API call metric from timer
     */
    recordApiCallMetric(metric) {
        this.metrics.apiCalls.push({
            ...metric,
            slow: metric.duration > this.options.thresholds.slowApiCall
        });
        this.limitMetricsArray(this.metrics.apiCalls, 100);
        
        if (this.options.enableLogging && metric.duration > this.options.thresholds.slowApiCall) {
            console.warn(`Slow API call: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
        }
    }
    
    /**
     * Record page load performance
     */
    recordPageLoad(entry) {
        const metric = {
            url: entry.name || window.location.href,
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstByte: entry.responseStart - entry.requestStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            timestamp: Date.now(),
            slow: (entry.loadEventEnd - entry.navigationStart) > this.options.thresholds.slowPageLoad
        };
        
        this.metrics.pageLoads.push(metric);
        this.limitMetricsArray(this.metrics.pageLoads, 50);
        
        if (this.options.enableLogging) {
            console.log(`Page load metrics:`, metric);
        }
    }
    
    /**
     * Record paint timing
     */
    recordPaintTiming(entry) {
        const metric = {
            name: entry.name,
            startTime: entry.startTime,
            timestamp: Date.now()
        };
        
        if (!this.metrics.paintTimings) {
            this.metrics.paintTimings = [];
        }
        
        this.metrics.paintTimings.push(metric);
        
        if (this.options.enableLogging) {
            console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        }
    }
    
    /**
     * Record component render performance
     */
    recordComponentRender(metric) {
        this.metrics.componentRenders.push({
            ...metric,
            slow: metric.duration > this.options.thresholds.slowComponentRender
        });
        this.limitMetricsArray(this.metrics.componentRenders, 100);
        
        if (this.options.enableLogging && metric.duration > this.options.thresholds.slowComponentRender) {
            console.warn(`Slow component render: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
        }
    }
    
    /**
     * Record user interaction performance
     */
    recordUserInteraction(metric) {
        this.metrics.userInteractions.push(metric);
        this.limitMetricsArray(this.metrics.userInteractions, 100);
        
        if (this.options.enableLogging) {
            console.log(`User interaction: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
        }
    }
    
    /**
     * Record custom metric
     */
    recordCustomMetric(metric) {
        if (!this.metrics.custom) {
            this.metrics.custom = [];
        }
        
        this.metrics.custom.push(metric);
        this.limitMetricsArray(this.metrics.custom, 100);
    }
    
    /**
     * Record error
     */
    recordError(error) {
        this.metrics.errors.push(error);
        this.limitMetricsArray(this.metrics.errors, 50);
        
        if (this.options.enableLogging) {
            console.error('Performance Monitor - Error recorded:', error);
        }
    }
    
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        return {
            timestamp: now,
            apiCalls: {
                total: this.metrics.apiCalls.length,
                recent: this.metrics.apiCalls.filter(m => m.timestamp > oneMinuteAgo).length,
                slow: this.metrics.apiCalls.filter(m => m.slow).length,
                averageDuration: this.calculateAverage(this.metrics.apiCalls, 'duration')
            },
            pageLoads: {
                total: this.metrics.pageLoads.length,
                slow: this.metrics.pageLoads.filter(m => m.slow).length,
                averageLoadTime: this.calculateAverage(this.metrics.pageLoads, 'loadTime')
            },
            componentRenders: {
                total: this.metrics.componentRenders.length,
                recent: this.metrics.componentRenders.filter(m => m.timestamp > oneMinuteAgo).length,
                slow: this.metrics.componentRenders.filter(m => m.slow).length,
                averageDuration: this.calculateAverage(this.metrics.componentRenders, 'duration')
            },
            errors: {
                total: this.metrics.errors.length,
                recent: this.metrics.errors.filter(m => m.timestamp > oneMinuteAgo).length
            },
            memory: this.getMemoryInfo(),
            connection: this.getConnectionInfo()
        };
    }
    
    /**
     * Get memory information
     */
    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
    
    /**
     * Get connection information
     */
    getConnectionInfo() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }
    
    /**
     * Calculate average of a metric
     */
    calculateAverage(metrics, property) {
        if (metrics.length === 0) return 0;
        
        const sum = metrics.reduce((acc, metric) => acc + (metric[property] || 0), 0);
        return Math.round(sum / metrics.length);
    }
    
    /**
     * Limit metrics array size
     */
    limitMetricsArray(array, maxSize) {
        if (array.length > maxSize) {
            array.splice(0, array.length - maxSize);
        }
    }
    
    /**
     * Start performance reporting
     */
    startReporting() {
        if (!this.options.enableReporting) return;
        
        this.reportingTimer = setInterval(() => {
            this.sendPerformanceReport();
        }, this.options.reportingInterval);
    }
    
    /**
     * Send performance report to server
     */
    async sendPerformanceReport() {
        try {
            const summary = this.getPerformanceSummary();
            
            // Only send if there's meaningful data
            if (summary.apiCalls.total === 0 && summary.componentRenders.total === 0) {
                return;
            }
            
            const response = await fetch(this.options.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'performance_metrics',
                    data: summary,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                })
            });
            
            if (!response.ok) {
                console.warn('Failed to send performance report:', response.status);
            }
            
        } catch (error) {
            console.warn('Error sending performance report:', error);
        }
    }
    
    /**
     * Create performance-aware fetch wrapper
     */
    createPerformanceFetch() {
        return async (url, options = {}) => {
            const startTime = performance.now();
            const timerId = `fetch_${url}_${Date.now()}`;
            
            this.startTimer(timerId, {
                url,
                method: options.method || 'GET'
            });
            
            try {
                const response = await fetch(url, options);
                const duration = performance.now() - startTime;
                
                this.endTimer(timerId, 'api');
                
                // Record additional metrics
                this.recordApiCallMetric({
                    name: url,
                    duration,
                    status: response.status,
                    success: response.ok,
                    method: options.method || 'GET',
                    timestamp: Date.now()
                });
                
                return response;
                
            } catch (error) {
                const duration = performance.now() - startTime;
                
                this.endTimer(timerId, 'api');
                this.recordError({
                    type: 'fetch',
                    message: error.message,
                    url,
                    duration,
                    timestamp: Date.now()
                });
                
                throw error;
            }
        };
    }
    
    /**
     * Measure component performance
     */
    measureComponent(name, fn) {
        return async (...args) => {
            this.startTimer(name, { component: name });
            
            try {
                const result = await fn(...args);
                this.endTimer(name, 'component');
                return result;
            } catch (error) {
                this.endTimer(name, 'component');
                this.recordError({
                    type: 'component',
                    component: name,
                    message: error.message,
                    stack: error.stack,
                    timestamp: Date.now()
                });
                throw error;
            }
        };
    }
    
    /**
     * Stop performance monitoring
     */
    stop() {
        if (this.reportingTimer) {
            clearInterval(this.reportingTimer);
            this.reportingTimer = null;
        }
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics = {
            apiCalls: [],
            pageLoads: [],
            componentRenders: [],
            errors: [],
            userInteractions: []
        };
    }
}

// Create global performance monitor instance
let performanceMonitor = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        performanceMonitor = new PerformanceMonitor();
        window.performanceMonitor = performanceMonitor;
    });
} else {
    performanceMonitor = new PerformanceMonitor();
    window.performanceMonitor = performanceMonitor;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}