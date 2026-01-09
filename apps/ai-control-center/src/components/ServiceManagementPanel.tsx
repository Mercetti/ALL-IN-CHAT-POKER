import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

interface ServiceStatus {
  ollama: {
    status: string;
    pid: number | null;
    port: number;
    lastCheck: string | null;
  };
  tunnel: {
    status: string;
    pid: number | null;
    url: string | null;
    lastCheck: string | null;
  };
}

interface ServiceConfig {
  aiProvider: string;
  ollamaHost: string;
  ollamaModel: string;
}

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
}

export default function ServiceManagementPanel() {
  const [services, setServices] = useState<ServiceStatus | null>(null);
  const [config, setConfig] = useState<ServiceConfig | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch service status
  const fetchServiceStatus = async () => {
    try {
      const response = await apiFetch<{ success: boolean; data: { services: ServiceStatus; config: ServiceConfig } }>('/admin/ai/services/status');
      if (response.success) {
        setServices(response.data.services);
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Ollama models
  const fetchModels = async () => {
    try {
      const response = await apiFetch<{ success: boolean; data: { models: OllamaModel[] } }>('/admin/ai/services/ollama/models');
      if (response.success && response.data.models) {
        setModels(response.data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Set some default models if fetch fails
      setModels([
        { name: 'llama3.2:latest', model: 'llama3.2:latest', size: 0, digest: '' },
        { name: 'llama3.2:1b', model: 'llama3.2:1b', size: 0, digest: '' },
        { name: 'codellama:latest', model: 'codellama:latest', size: 0, digest: '' }
      ]);
    }
  };

  // Service control actions
  const handleServiceAction = async (service: 'ollama' | 'tunnel', action: 'start' | 'stop') => {
    setActionLoading(`${service}-${action}`);
    try {
      const response = await apiFetch(`/admin/ai/services/${service}/${action}`, {
        method: 'POST'
      });
      
      if (response.success) {
        // Refresh status after action
        setTimeout(fetchServiceStatus, 1000);
        
        // If tunnel started, fetch models
        if (service === 'ollama' && action === 'start') {
          setTimeout(fetchModels, 3000);
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} ${service}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  // Test connection
  const testConnection = async (provider: string) => {
    setActionLoading(`test-${provider}`);
    try {
      const response = await apiFetch('/admin/ai/services/test-connection', {
        method: 'POST',
        body: JSON.stringify({ provider })
      });
      
      if (response.success) {
        alert(`Connection test: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Update configuration
  const updateConfig = async (updates: Partial<ServiceConfig>) => {
    setActionLoading('config-update');
    try {
      const response = await apiFetch('/admin/ai/services/config/update', {
        method: 'POST',
        body: JSON.stringify(updates)
      });
      
      if (response.success) {
        if (response.data.requiresRestart) {
          alert('Configuration updated! Run these commands and restart:\n\n' + 
                response.data.updates.map((u: any) => u.command).join('\n'));
        } else {
          // Local update - refresh the config
          if (response.data.currentConfig) {
            setConfig(response.data.currentConfig);
          }
          alert(`Configuration updated successfully!`);
        }
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchServiceStatus();
    fetchModels();
    
    // Auto-refresh status every 30 seconds
    const interval = setInterval(fetchServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'stopped': return 'text-red-600 bg-red-100';
      case 'starting': case 'stopping': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Service Management</h2>
        <p className="text-gray-600">Control and monitor local AI services</p>
      </div>

      {/* Ollama Service */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ollama Service</h3>
            <p className="text-sm text-gray-600">Local LLM inference server</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(services?.ollama.status || 'unknown')}`}>
            {services?.ollama.status || 'Unknown'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-sm text-gray-500">Port:</span>
            <span className="ml-2 text-sm font-medium">{services?.ollama.port || 11434}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">PID:</span>
            <span className="ml-2 text-sm font-medium">{services?.ollama.pid || 'N/A'}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleServiceAction('ollama', 'start')}
            disabled={services?.ollama.status === 'running' || actionLoading === 'ollama-start'}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'ollama-start' ? 'Starting...' : 'Start Ollama'}
          </button>
          <button
            onClick={() => handleServiceAction('ollama', 'stop')}
            disabled={services?.ollama.status !== 'running' || actionLoading === 'ollama-stop'}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'ollama-stop' ? 'Stopping...' : 'Stop Ollama'}
          </button>
          <button
            onClick={() => testConnection('ollama')}
            disabled={actionLoading === 'test-ollama'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'test-ollama' ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Models */}
        {models.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Available Models ({models.length})</h4>
            <div className="max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {models.map((model) => (
                  <div key={model.name} className="text-xs text-gray-600 flex justify-between">
                    <span>{model.name}</span>
                    <span>{(model.size / 1024 / 1024 / 1024).toFixed(1)}GB</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cloudflare Tunnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cloudflare Tunnel</h3>
            <p className="text-sm text-gray-600">Secure tunnel to local Ollama</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(services?.tunnel.status || 'unknown')}`}>
            {services?.tunnel.status || 'Unknown'}
          </div>
        </div>

        {services?.tunnel.url && (
          <div className="mb-4">
            <span className="text-sm text-gray-500">Tunnel URL:</span>
            <div className="mt-1 flex items-center gap-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{services.tunnel.url}</code>
              <button
                onClick={() => navigator.clipboard.writeText(services.tunnel.url!)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleServiceAction('tunnel', 'start')}
            disabled={services?.tunnel.status === 'running' || actionLoading === 'tunnel-start'}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'tunnel-start' ? 'Starting...' : 'Start Tunnel'}
          </button>
          <button
            onClick={() => handleServiceAction('tunnel', 'stop')}
            disabled={services?.tunnel.status !== 'running' || actionLoading === 'tunnel-stop'}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'tunnel-stop' ? 'Stopping...' : 'Stop Tunnel'}
          </button>
        </div>
      </div>

      {/* Configuration */}
      {config && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
              <select
                value={config.aiProvider}
                onChange={(e) => updateConfig({ aiProvider: e.target.value })}
                disabled={actionLoading === 'config-update'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ollama">Ollama (Local)</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ollama Host</label>
              <input
                type="text"
                value={config.ollamaHost}
                onChange={(e) => updateConfig({ ollamaHost: e.target.value })}
                disabled={actionLoading === 'config-update'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Model</label>
              <select
                value={config.ollamaModel}
                onChange={(e) => updateConfig({ ollamaModel: e.target.value })}
                disabled={actionLoading === 'config-update'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {models.map((model) => (
                  <option key={model.name} value={model.name}>{model.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => testConnection(config.aiProvider)}
              disabled={actionLoading === `test-${config.aiProvider}`}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === `test-${config.aiProvider}` ? 'Testing...' : 'Test Current Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
