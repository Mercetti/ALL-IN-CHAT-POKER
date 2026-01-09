import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

interface PerformanceMetrics {
  avgResponseTime: number;
  totalRequests: number;
  errorRate: number;
  cacheHitRate: number;
  queueLength: number;
  modelUsage: Record<string, { count: number; totalTime: number; errors: number }>;
  hourlyStats: Record<string, { requests: number; responseTime: number; errors: number }>;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: string;
  size: number;
  maxSize: number;
}

interface TunnelStatus {
  isTunnel: boolean;
  health: string;
  lastCheck: number;
  timeout: number;
  retryAttempts: number;
}

export default function AIPerformancePanel() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [tunnelStatus, setTunnelStatus] = useState<TunnelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPerformanceData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchPerformanceData, 10000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const response = await apiFetch<{ success: boolean; data: any }>('/admin/ai/performance');
      if (response.success) {
        setMetrics(response.data.performance);
        setCacheStats(response.data.cache);
        setTunnelStatus(response.data.tunnel);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      await apiFetch('/admin/ai/cache/clear', { method: 'POST' });
      await fetchPerformanceData();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const resetMetrics = async () => {
    try {
      await apiFetch('/admin/ai/performance/reset', { method: 'POST' });
      await fetchPerformanceData();
    } catch (error) {
      console.error('Failed to reset metrics:', error);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Performance Monitor</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Performance Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={clearCache}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
          >
            Clear Cache
          </button>
          <button
            onClick={resetMetrics}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Reset Metrics
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {metrics ? formatTime(metrics.avgResponseTime) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {metrics ? formatPercent(metrics.errorRate) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Error Rate</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {cacheStats ? cacheStats.hitRate : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Cache Hit Rate</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {metrics ? metrics.totalRequests.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
      </div>

      {/* Tunnel Status */}
      {tunnelStatus && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Tunnel Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type: </span>
              <span className="font-medium">{tunnelStatus.isTunnel ? 'Cloudflare' : 'Direct'}</span>
            </div>
            <div>
              <span className="text-gray-600">Health: </span>
              <span className={`font-medium ${getHealthColor(tunnelStatus.health)}`}>
                {tunnelStatus.health}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Timeout: </span>
              <span className="font-medium">{tunnelStatus.timeout}ms</span>
            </div>
            <div>
              <span className="text-gray-600">Retries: </span>
              <span className="font-medium">{tunnelStatus.retryAttempts}</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Usage */}
      {metrics && metrics.modelUsage && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Model Usage</h4>
          <div className="space-y-2">
            {Object.entries(metrics.modelUsage).map(([model, stats]) => (
              <div key={model} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{model}</div>
                  <div className="text-sm text-gray-600">
                    {stats.count} requests • {formatTime(stats.totalTime / stats.count)} avg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {stats.errors > 0 ? (
                      <span className="text-red-600">{stats.errors} errors</span>
                    ) : (
                      <span className="text-green-600">No errors</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache Details */}
      {cacheStats && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Cache Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Size: </span>
              <span className="font-medium">{cacheStats.size} / {cacheStats.maxSize}</span>
            </div>
            <div>
              <span className="text-gray-600">Hits: </span>
              <span className="font-medium">{cacheStats.hits.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Misses: </span>
              <span className="font-medium">{cacheStats.misses.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Hit Rate: </span>
              <span className="font-medium">{cacheStats.hitRate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
