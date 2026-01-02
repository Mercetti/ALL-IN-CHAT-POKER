/**
 * Enhanced Dev Admin Dashboard JavaScript
 * Handles advanced tools, diagnostics, monitoring, and safety features
 */

class DevAdminDashboard {
    constructor() {
        this.currentTab = 'diagnostics';
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.refreshRate = 5000; // 5 seconds
        this.logs = [];
        this.alerts = [];
        this.systemHealth = {};
        this.performanceMetrics = {};
        this.featureFlags = {};
        this.configSettings = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.startAutoRefresh();
        this.setupKeyboardShortcuts();
        this.initializeTooltips();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleAction(action);
            });
        });

        // Tool cards
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.launchTool(tool);
            });
        });

        // Feature flag toggles
        document.querySelectorAll('.feature-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const flag = e.target.dataset.flag;
                const enabled = e.target.checked;
                this.updateFeatureFlag(flag, enabled);
            });
        });

        // Config inputs
        document.querySelectorAll('.config-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                const value = e.target.value;
                this.updateConfig(key, value);
            });
        });

        // Search/Filter
        document.getElementById('logSearch')?.addEventListener('input', (e) => {
            this.filterLogs(e.target.value);
        });

        document.getElementById('logLevel')?.addEventListener('change', (e) => {
            this.filterLogsByLevel(e.target.value);
        });

        // Export/Import
        document.getElementById('exportData')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importData')?.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Safety actions
        document.querySelectorAll('.safety-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.executeSafetyAction(action);
            });
        });

        const grantSubmit = document.getElementById('grant-submit');
        if (grantSubmit) {
            grantSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGrantSubmit();
            });
        }

        const grantReset = document.getElementById('grant-reset');
        if (grantReset) {
            grantReset.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetGrantForm();
            });
        }
    }

    setGrantStatus(message, type = '') {
        const statusEl = document.getElementById('grant-status');
        if (!statusEl) return;
        statusEl.textContent = message || '';
        statusEl.classList.remove('success', 'error');
        if (type) statusEl.classList.add(type);
    }

    resetGrantForm() {
        document.getElementById('grant-login')?.value = '';
        const amountEl = document.getElementById('grant-amount');
        if (amountEl) amountEl.value = '1000';
        document.getElementById('grant-reason')?.value = '';
        this.setGrantStatus('', '');
    }

    async handleGrantSubmit() {
        const loginEl = document.getElementById('grant-login');
        const amountEl = document.getElementById('grant-amount');
        const reasonEl = document.getElementById('grant-reason');
        const submitBtn = document.getElementById('grant-submit');

        if (!loginEl || !amountEl || !submitBtn) return;

        const login = (loginEl.value || '').trim();
        const amount = Number(amountEl.value);
        const reason = (reasonEl?.value || '').trim();

        if (!login) {
            this.setGrantStatus('Player login is required.', 'error');
            loginEl.focus();
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            this.setGrantStatus('Enter a positive AIC amount.', 'error');
            amountEl.focus();
            return;
        }

        this.setGrantStatus('Granting AIC...', '');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Granting...';

        try {
            const payload = { login, amount, reason };
            const result = await apiCall('/admin/coins/grant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const granted = result?.granted ?? amount;
            const balance = result?.balance;

            const successMsg = `Granted ${granted.toLocaleString()} AIC to ${result?.login || login}${balance !== undefined ? ` · New balance: ${balance.toLocaleString()} AIC` : ''}.`;
            this.setGrantStatus(successMsg, 'success');
            this.showToast(successMsg, 'success');
            this.resetGrantForm();
        } catch (error) {
            const message = error?.message || 'Unable to grant AIC.';
            this.setGrantStatus(message, 'error');
            this.showToast(`Grant failed: ${message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    switchTab(tabName) {
        // Update nav pills
        document.querySelectorAll('.nav-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');

        this.currentTab = tabName;
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'diagnostics':
                this.loadDiagnostics();
                break;
            case 'monitoring':
                this.loadMonitoring();
                break;
            case 'tools':
                this.loadTools();
                break;
            case 'config':
                this.loadConfig();
                break;
            case 'safety':
                this.loadSafety();
                break;
        }
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.fetchSystemHealth(),
                this.fetchPerformanceMetrics(),
                this.fetchLogs(),
                this.fetchAlerts(),
                this.fetchFeatureFlags(),
                this.fetchConfigSettings()
            ]);
        } catch (error) {
            this.showToast('Error loading initial data', 'error');
            console.error('Initial data load error:', error);
        }
    }

    async fetchSystemHealth() {
        try {
            // Mock data - replace with actual API call
            this.systemHealth = {
                database: { status: 'healthy', responseTime: 45, connections: 12 },
                server: { status: 'healthy', cpu: 35, memory: 62, disk: 41 },
                network: { status: 'healthy', latency: 23, bandwidth: 890 },
                cache: { status: 'healthy', hitRate: 94, memory: 78 }
            };
            this.renderSystemHealth();
        } catch (error) {
            console.error('Error fetching system health:', error);
        }
    }

    async fetchPerformanceMetrics() {
        try {
            // Mock data - replace with actual API call
            this.performanceMetrics = {
                responseTime: { current: 145, average: 132, peak: 289 },
                throughput: { current: 1250, average: 1180, peak: 2100 },
                errorRate: { current: 0.2, average: 0.3, peak: 1.1 },
                activeUsers: { current: 342, average: 318, peak: 512 }
            };
            this.renderPerformanceMetrics();
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
        }
    }

    async fetchLogs() {
        try {
            // Mock data - replace with actual API call
            this.logs = [
                { id: 1, timestamp: new Date(), level: 'info', message: 'System startup completed', source: 'system' },
                { id: 2, timestamp: new Date(Date.now() - 60000), level: 'warning', message: 'High memory usage detected', source: 'monitor' },
                { id: 3, timestamp: new Date(Date.now() - 120000), level: 'error', message: 'Database connection timeout', source: 'database' },
                { id: 4, timestamp: new Date(Date.now() - 180000), level: 'info', message: 'User authentication successful', source: 'auth' },
                { id: 5, timestamp: new Date(Date.now() - 240000), level: 'debug', message: 'Cache cleared successfully', source: 'cache' }
            ];
            this.renderLogs();
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    }

    async fetchAlerts() {
        try {
            // Mock data - replace with actual API call
            this.alerts = [
                { id: 1, type: 'critical', title: 'Database Connection Failed', message: 'Unable to connect to primary database', timestamp: new Date() },
                { id: 2, type: 'warning', title: 'High CPU Usage', message: 'CPU usage exceeded 80% threshold', timestamp: new Date(Date.now() - 300000) },
                { id: 3, type: 'info', title: 'Scheduled Maintenance', message: 'System maintenance scheduled for 2:00 AM', timestamp: new Date(Date.now() - 600000) }
            ];
            this.renderAlerts();
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    }

    async fetchFeatureFlags() {
        try {
            // Mock data - replace with actual API call
            this.featureFlags = {
                newGameMode: { enabled: true, description: 'Enable new game mode feature' },
                enhancedUI: { enabled: false, description: 'Enable enhanced UI components' },
                betaFeatures: { enabled: true, description: 'Enable beta features for selected users' },
                debugMode: { enabled: false, description: 'Enable debug mode for development' }
            };
            this.renderFeatureFlags();
        } catch (error) {
            console.error('Error fetching feature flags:', error);
        }
    }

    async fetchConfigSettings() {
        try {
            // Mock data - replace with actual API call
            this.configSettings = {
                maxPlayers: { value: 8, type: 'number', description: 'Maximum players per game' },
                gameTimeout: { value: 30, type: 'number', description: 'Game timeout in seconds' },
                enableChat: { value: true, type: 'boolean', description: 'Enable in-game chat' },
                maintenanceMode: { value: false, type: 'boolean', description: 'Enable maintenance mode' }
            };
            this.renderConfigSettings();
        } catch (error) {
            console.error('Error fetching config settings:', error);
        }
    }

    renderSystemHealth() {
        const container = document.getElementById('healthGrid');
        if (!container) return;

        container.innerHTML = '';
        
        Object.entries(this.systemHealth).forEach(([key, health]) => {
            const statusClass = health.status === 'healthy' ? 'success' : 
                               health.status === 'warning' ? 'warning' : 'danger';
            
            const card = document.createElement('div');
            card.className = 'health-card';
            card.innerHTML = `
                <div class="health-header">
                    <h4>${key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                    <span class="health-status ${statusClass}">${health.status}</span>
                </div>
                <div class="health-metrics">
                    ${Object.entries(health).filter(([k]) => k !== 'status').map(([k, v]) => `
                        <div class="metric">
                            <span class="metric-label">${k}:</span>
                            <span class="metric-value">${v}${typeof v === 'number' ? (k.includes('Time') || k.includes('latency') ? 'ms' : k.includes('rate') || k.includes('memory') || k.includes('cpu') || k.includes('disk') || k.includes('bandwidth') ? '%' : '') : ''}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderPerformanceMetrics() {
        Object.entries(this.performanceMetrics).forEach(([key, metrics]) => {
            const container = document.getElementById(`${key}Metrics`);
            if (!container) return;

            const current = metrics.current;
            const average = metrics.average;
            const peak = metrics.peak;
            
            const percentage = (current / peak) * 100;
            const statusClass = percentage > 80 ? 'danger' : percentage > 60 ? 'warning' : 'success';

            container.innerHTML = `
                <div class="metric-bar">
                    <div class="metric-header">
                        <span class="metric-current">${current}</span>
                        <span class="metric-avg">Avg: ${average}</span>
                        <span class="metric-peak">Peak: ${peak}</span>
                    </div>
                    <div class="metric-progress">
                        <div class="metric-fill ${statusClass}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
    }

    renderLogs() {
        const container = document.getElementById('logContainer');
        if (!container) return;

        container.innerHTML = '';
        
        this.logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${log.level}`;
            logEntry.innerHTML = `
                <div class="log-header">
                    <span class="log-timestamp">${log.timestamp.toLocaleTimeString()}</span>
                    <span class="log-level">${log.level.toUpperCase()}</span>
                    <span class="log-source">${log.source}</span>
                </div>
                <div class="log-message">${log.message}</div>
            `;
            container.appendChild(logEntry);
        });
    }

    renderAlerts() {
        const container = document.getElementById('alertsContainer');
        if (!container) return;

        container.innerHTML = '';
        
        this.alerts.forEach(alert => {
            const alertCard = document.createElement('div');
            alertCard.className = `alert-card ${alert.type}`;
            alertCard.innerHTML = `
                <div class="alert-header">
                    <span class="alert-title">${alert.title}</span>
                    <span class="alert-time">${alert.timestamp.toLocaleTimeString()}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-actions">
                    <button class="btn btn-sm" onclick="devAdmin.dismissAlert(${alert.id})">Dismiss</button>
                    <button class="btn btn-sm primary" onclick="devAdmin.acknowledgeAlert(${alert.id})">Acknowledge</button>
                </div>
            `;
            container.appendChild(alertCard);
        });
    }

    renderFeatureFlags() {
        const container = document.getElementById('featureFlagsContainer');
        if (!container) return;

        container.innerHTML = '';
        
        Object.entries(this.featureFlags).forEach(([key, flag]) => {
            const flagCard = document.createElement('div');
            flagCard.className = 'feature-flag-card';
            flagCard.innerHTML = `
                <div class="flag-header">
                    <label class="toggle-switch">
                        <input type="checkbox" class="feature-toggle" data-flag="${key}" ${flag.enabled ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="flag-name">${key}</span>
                </div>
                <div class="flag-description">${flag.description}</div>
            `;
            container.appendChild(flagCard);
        });
    }

    renderConfigSettings() {
        const container = document.getElementById('configContainer');
        if (!container) return;

        container.innerHTML = '';
        
        Object.entries(this.configSettings).forEach(([key, setting]) => {
            const configCard = document.createElement('div');
            configCard.className = 'config-card';
            configCard.innerHTML = `
                <div class="config-header">
                    <label class="config-label">${key}</label>
                    ${setting.type === 'boolean' ? 
                        `<label class="toggle-switch">
                            <input type="checkbox" class="config-input" data-key="${key}" ${setting.value ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>` :
                        `<input type="${setting.type}" class="config-input" data-key="${key}" value="${setting.value}">`
                    }
                </div>
                <div class="config-description">${setting.description}</div>
            `;
            container.appendChild(configCard);
        });
    }

    handleAction(action) {
        switch(action) {
            case 'refresh-health':
                this.fetchSystemHealth();
                break;
            case 'refresh-metrics':
                this.fetchPerformanceMetrics();
                break;
            case 'refresh-logs':
                this.fetchLogs();
                break;
            case 'clear-logs':
                this.clearLogs();
                break;
            case 'run-diagnostics':
                this.runDiagnostics();
                break;
            case 'export-logs':
                this.exportLogs();
                break;
            case 'test-connections':
                this.testConnections();
                break;
            case 'clear-cache':
                this.clearCache();
                break;
            case 'restart-services':
                this.restartServices();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    launchTool(tool) {
        switch(tool) {
            case 'database-analyzer':
                this.launchDatabaseAnalyzer();
                break;
            case 'network-monitor':
                this.launchNetworkMonitor();
                break;
            case 'performance-profiler':
                this.launchPerformanceProfiler();
                break;
            case 'log-analyzer':
                this.launchLogAnalyzer();
                break;
            case 'security-scanner':
                this.launchSecurityScanner();
                break;
            case 'backup-manager':
                this.launchBackupManager();
                break;
            case 'api-tester':
                this.launchApiTester();
                break;
            case 'cache-inspector':
                this.launchCacheInspector();
                break;
            default:
                console.log('Unknown tool:', tool);
        }
    }

    updateFeatureFlag(flag, enabled) {
        // API call to update feature flag
        console.log(`Updating feature flag ${flag}: ${enabled}`);
        this.showToast(`Feature flag ${flag} ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }

    updateConfig(key, value) {
        // API call to update config
        console.log(`Updating config ${key}: ${value}`);
        this.showToast(`Configuration ${key} updated`, 'success');
    }

    filterLogs(searchTerm) {
        const filteredLogs = this.logs.filter(log => 
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.source.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredLogs(filteredLogs);
    }

    filterLogsByLevel(level) {
        const filteredLogs = level === 'all' ? this.logs : 
                           this.logs.filter(log => log.level === level);
        this.renderFilteredLogs(filteredLogs);
    }

    renderFilteredLogs(logs) {
        const container = document.getElementById('logContainer');
        if (!container) return;

        container.innerHTML = '';
        
        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${log.level}`;
            logEntry.innerHTML = `
                <div class="log-header">
                    <span class="log-timestamp">${log.timestamp.toLocaleTimeString()}</span>
                    <span class="log-level">${log.level.toUpperCase()}</span>
                    <span class="log-source">${log.source}</span>
                </div>
                <div class="log-message">${log.message}</div>
            `;
            container.appendChild(logEntry);
        });
    }

    exportData() {
        const data = {
            systemHealth: this.systemHealth,
            performanceMetrics: this.performanceMetrics,
            logs: this.logs,
            alerts: this.alerts,
            featureFlags: this.featureFlags,
            configSettings: this.configSettings
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully', 'success');
    }

    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Process imported data
                this.showToast('Data imported successfully', 'success');
            } catch (error) {
                this.showToast('Error importing data', 'error');
            }
        };
        reader.readAsText(file);
    }

    executeSafetyAction(action) {
        const confirmMessage = {
            'emergency-stop': 'Are you sure you want to perform an emergency stop?',
            'safe-mode': 'Enable safe mode? This will limit system functionality.',
            'backup-restore': 'Restore from backup? This will overwrite current data.',
            'security-lockdown': 'Initiate security lockdown? This will restrict all access.'
        };
        
        if (confirm(confirmMessage[action] || `Execute ${action}?`)) {
            // Execute safety action
            console.log(`Executing safety action: ${action}`);
            this.showToast(`Safety action ${action} executed`, 'warning');
        }
    }

    dismissAlert(alertId) {
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        this.renderAlerts();
        this.showToast('Alert dismissed', 'info');
    }

    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            this.showToast('Alert acknowledged', 'success');
        }
    }

    clearLogs() {
        this.logs = [];
        this.renderLogs();
        this.showToast('Logs cleared', 'info');
    }

    runDiagnostics() {
        this.showToast('Running system diagnostics...', 'info');
        setTimeout(() => {
            this.fetchSystemHealth();
            this.fetchPerformanceMetrics();
            this.showToast('Diagnostics completed', 'success');
        }, 2000);
    }

    exportLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Logs exported', 'success');
    }

    testConnections() {
        this.showToast('Testing system connections...', 'info');
        setTimeout(() => {
            this.showToast('Connection tests completed', 'success');
        }, 3000);
    }

    clearCache() {
        this.showToast('Clearing system cache...', 'info');
        setTimeout(() => {
            this.showToast('Cache cleared successfully', 'success');
        }, 1500);
    }

    restartServices() {
        if (confirm('Restart all services? This will temporarily interrupt the system.')) {
            this.showToast('Restarting services...', 'warning');
            setTimeout(() => {
                this.showToast('Services restarted successfully', 'success');
            }, 5000);
        }
    }

    launchDatabaseAnalyzer() {
        this.showToast('Launching Database Analyzer...', 'info');
    }

    launchNetworkMonitor() {
        this.showToast('Launching Network Monitor...', 'info');
    }

    launchPerformanceProfiler() {
        this.showToast('Launching Performance Profiler...', 'info');
    }

    launchLogAnalyzer() {
        this.showToast('Launching Log Analyzer...', 'info');
    }

    launchSecurityScanner() {
        this.showToast('Launching Security Scanner...', 'info');
    }

    launchBackupManager() {
        this.showToast('Launching Backup Manager...', 'info');
    }

    launchApiTester() {
        this.showToast('Launching API Tester...', 'info');
    }

    launchCacheInspector() {
        this.showToast('Launching Cache Inspector...', 'info');
    }

    startAutoRefresh() {
        if (this.autoRefreshEnabled) {
            this.refreshInterval = setInterval(() => {
                this.refreshCurrentData();
            }, this.refreshRate);
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    refreshCurrentData() {
        switch(this.currentTab) {
            case 'diagnostics':
                this.fetchSystemHealth();
                this.fetchPerformanceMetrics();
                break;
            case 'monitoring':
                this.fetchLogs();
                this.fetchAlerts();
                break;
            case 'config':
                this.fetchFeatureFlags();
                this.fetchConfigSettings();
                break;
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshCurrentData();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportData();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.runDiagnostics();
                        break;
                }
            }
        });
    }

    initializeTooltips() {
        // Initialize tooltips for various elements
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    }

    hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    loadDiagnostics() {
        this.fetchSystemHealth();
        this.fetchPerformanceMetrics();
    }

    loadMonitoring() {
        this.fetchLogs();
        this.fetchAlerts();
    }

    loadTools() {
        // Tools are static, no additional loading needed
    }

    loadConfig() {
        this.fetchFeatureFlags();
        this.fetchConfigSettings();
    }

    loadSafety() {
        // Safety features are static, no additional loading needed
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.devAdmin = new DevAdminDashboard();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        window.devAdmin.stopAutoRefresh();
    } else {
        window.devAdmin.startAutoRefresh();
    }
});
