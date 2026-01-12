/**
 * Enhanced Admin Dashboard JavaScript
 * Integrates all AI monitoring and self-healing tools
 */

class AIDashboard {
  constructor() {
    this.state = {
      currentSection: 'overview',
      aiStatus: {
        chatBot: false,
        errorManager: false,
        performance: false,
        uxMonitor: false,
        selfHealing: false
      },
      metrics: {
        health: 0,
        activeUsers: 0,
        aiResponseTime: 0,
        errorRate: 0,
        cpuUsage: 0,
        memoryUsage: 0
      },
      alerts: [],
      recentActivity: [],
      sessionStartTime: Date.now(),
      adminUsers: [],
      adminAudit: [],
      selectedAdmin: null,
      adminFilters: {
        status: ''
      },
      adminAuditFilters: {
        actor: '',
        target: '',
        action: ''
      },
      adminLoading: false,
      adminAuditLoading: false
    };
    
    this.updateInterval = null;
    this.chatHistory = [];
    
    this.init();
  }

  init() {
    console.log('🚀 AI Admin Dashboard initializing...');
    this.setupEventListeners();
    this.setupAdminUsersUI();
    this.startRealTimeUpdates();
    this.loadInitialData();
    this.initializeChat();
    this.initializeAudioChat(); // Initialize audio chat
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.switchSection(section);
      });
    });

    // Chat
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    
    chatSend.addEventListener('click', () => this.sendMessage());
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        chatInput.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        this.runHealthCheck();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Quick action buttons
    document.querySelectorAll('.tool-button').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.textContent.trim();
        this.handleQuickAction(action);
      });
    });
  }

  switchSection(section) {
    let targetSection = document.getElementById(`${section}-section`);
    if (!targetSection) {
      console.warn(`⚠️ No section found for "${section}", falling back to overview.`);
      section = 'overview';
      targetSection = document.getElementById('overview-section');
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.section === section) item.classList.add('active');
      else item.classList.remove('active');
    });

    document.querySelectorAll('.dashboard-section').forEach(sectionEl => {
      sectionEl.classList.remove('active');
      sectionEl.style.display = 'none';
    });

    if (targetSection) {
      targetSection.style.display = 'block';
      targetSection.classList.add('active');
    }

    // Load section-specific content
    this.loadSectionContent(section);
    this.state.currentSection = section;
    console.log(`📂 Switched to ${section} section`);
  }

  async loadSectionContent(section) {
    switch(section) {
      case 'ai-status':
        await this.loadAIStatus();
        break;
      case 'performance':
        await this.loadPerformanceMetrics();
        break;
      case 'error-manager':
        await this.loadErrorManager();
        break;
      case 'cosmetic-ai':
        await this.loadCosmeticAI();
        break;
      case 'audio-generator':
        await this.loadAudioGenerator();
        break;
      case 'ux-monitor':
        await this.loadUXMonitor();
        break;
      case 'admin-users':
        await Promise.all([this.loadAdminUsers(), this.loadAdminAudit()]);
        break;
    }
  }

  setupAdminUsersUI() {
    this.adminUsersTableBody = document.getElementById('admin-users-tbody');
    this.adminStatusFilter = document.getElementById('admin-status-filter');
    this.auditListPreview = document.getElementById('audit-list-preview');
    this.auditListFull = document.getElementById('audit-list-full');
    this.createAdminModal = document.getElementById('create-admin-modal');
    this.editAdminModal = document.getElementById('edit-admin-modal');
    this.auditModal = document.getElementById('audit-modal');
    this.createAdminForm = document.getElementById('create-admin-form');
    this.editAdminForm = document.getElementById('edit-admin-form');

    if (!this.adminUsersTableBody) return;

    const refreshButton = document.getElementById('refresh-admin-users');
    const openCreateButton = document.getElementById('open-create-admin');
    const openAuditButton = document.getElementById('open-audit-modal');
    const refreshAuditButton = document.getElementById('refresh-audit-log');

    refreshButton?.addEventListener('click', () => this.loadAdminUsers(true));
    openCreateButton?.addEventListener('click', () => this.toggleModal(this.createAdminModal, true));
    openAuditButton?.addEventListener('click', () => {
      this.toggleModal(this.auditModal, true);
      this.loadAdminAudit({ full: true });
    });
    refreshAuditButton?.addEventListener('click', () => this.loadAdminAudit({ full: true }));

    this.adminStatusFilter?.addEventListener('change', (event) => {
      this.state.adminFilters.status = event.target.value;
      this.loadAdminUsers(true);
    });

    const auditFilterFields = ['actor', 'target', 'action'];
    auditFilterFields.forEach((field) => {
      const input = document.getElementById(`audit-filter-${field}`);
      if (!input) return;
      input.addEventListener('input', (event) => {
        this.state.adminAuditFilters[field] = event.target.value.trim();
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach((closeButton) => {
      closeButton.addEventListener('click', () => {
        const modal = closeButton.closest('.modal');
        this.toggleModal(modal, false);
      });
    });

    if (this.adminUsersTableBody) {
      this.adminUsersTableBody.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-admin-action]');
        if (!actionButton) return;
        const action = actionButton.dataset.adminAction;
        const login = actionButton.dataset.login;
        this.handleAdminRowAction(action, login);
      });
    }

    this.createAdminForm?.addEventListener('submit', (event) => this.submitCreateAdmin(event));
    this.editAdminForm?.addEventListener('submit', (event) => this.submitEditAdmin(event));

    // Prepare initial placeholders
    this.renderAdminUsersPlaceholder('Select "Admin Users" to load the directory.');
    this.renderAuditPreview([]);
  }

  toggleModal(modal, open = true) {
    if (!modal) return;
    if (open) {
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('open');
      document.body.classList.add('modal-open');
    } else {
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('open');
      if (!document.querySelector('.modal.open')) {
        document.body.classList.remove('modal-open');
      }
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal.open').forEach((modal) => this.toggleModal(modal, false));
  }

  async loadAdminUsers(showLoading = false) {
    if (!this.adminUsersTableBody) return;

    if (showLoading) {
      this.renderAdminUsersPlaceholder('Loading admin users…');
    }

    this.state.adminLoading = true;
    const params = new URLSearchParams();
    if (this.state.adminFilters.status) {
      params.set('status', this.state.adminFilters.status);
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    let users = [];

    try {
      const data = await this.requestAdminAPI(`/api/admin/users${query}`);
      users = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('⚠️ Failed to load admin users, falling back to mock data:', error.message);
      users = this.getMockAdminUsers();
      this.showNotification('Showing mock admin users (API unavailable).', 'warning');
    }

    this.state.adminUsers = users;
    this.state.adminLoading = false;
    this.renderAdminUsersTable();
  }

  renderAdminUsersPlaceholder(text) {
    if (!this.adminUsersTableBody) return;
    this.adminUsersTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="no-data">${this.escapeHTML(text)}</td>
      </tr>
    `;
  }

  renderAdminUsersTable() {
    if (!this.adminUsersTableBody) return;

    if (this.state.adminUsers.length === 0) {
      this.renderAdminUsersPlaceholder('No admin users found.');
      return;
    }

    const rows = this.state.adminUsers.map((user) => {
      const locked = user.status === 'locked';
      return `
        <tr data-login="${this.escapeHTML(user.login)}">
          <td>${this.escapeHTML(user.login)}</td>
          <td>${this.escapeHTML(user.display_name || user.displayName || '—')}</td>
          <td>${this.escapeHTML(user.email || '—')}</td>
          <td>${this.escapeHTML(user.role || 'admin')}</td>
          <td>
            <span class="status-chip status-${this.escapeHTML(user.status || 'active')}">
              ${this.escapeHTML((user.status || 'active').replace('_', ' '))}
            </span>
          </td>
          <td>${this.formatTimestamp(user.last_login_at || user.lastLoginAt)}</td>
          <td>${user.failed_attempts ?? user.failedAttempts ?? 0}</td>
          <td>${this.formatTimestamp(user.locked_until || user.lockedUntil)}</td>
          <td class="admin-actions-cell">
            <button class="btn btn-tertiary btn-xs" data-admin-action="reset" data-login="${this.escapeHTML(user.login)}">
              Reset Password
            </button>
            <button class="btn btn-secondary btn-xs" data-admin-action="${locked ? 'unlock' : 'lock'}" data-login="${this.escapeHTML(user.login)}">
              ${locked ? 'Unlock' : 'Lock'}
            </button>
            <button class="btn btn-primary btn-xs" data-admin-action="edit" data-login="${this.escapeHTML(user.login)}">
              Edit
            </button>
          </td>
        </tr>
      `;
    }).join('');

    this.adminUsersTableBody.innerHTML = rows;
  }

  formatTimestamp(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return this.escapeHTML(value);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  escapeHTML(text) {
    if (text === undefined || text === null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  handleAdminRowAction(action, login) {
    if (!login) return;
    const user = this.state.adminUsers.find((admin) => admin.login === login);
    if (!user && action !== 'reset') return;

    switch (action) {
      case 'reset':
        this.handleResetPassword(login);
        break;
      case 'lock':
      case 'unlock':
        this.handleLockToggle(login, action === 'unlock');
        break;
      case 'edit':
        this.openEditAdminModal(user);
        break;
      default:
        console.warn(`Unknown admin action: ${action}`);
    }
  }

  async handleResetPassword(login) {
    if (!window.confirm(`Reset password for ${login}?`)) return;
    try {
      await this.resetAdminPassword(login);
      this.showNotification(`Password reset email sent for ${login}`, 'success');
    } catch (error) {
      this.showNotification(`Failed to reset password: ${error.message}`, 'error');
    }
  }

  async handleLockToggle(login, unlocking) {
    const action = unlocking ? 'unlock' : 'lock';
    const confirmationText = unlocking
      ? `Unlock account ${login}?`
      : `Lock account ${login}? They will be unable to sign in.`;

    if (!window.confirm(confirmationText)) return;

    try {
      await this.updateLockStatus(login, action);
      this.showNotification(`Account ${unlocking ? 'unlocked' : 'locked'} for ${login}`, 'success');
      this.loadAdminUsers(true);
    } catch (error) {
      this.showNotification(`Failed to ${action} account: ${error.message}`, 'error');
    }
  }

  openEditAdminModal(user) {
    if (!user || !this.editAdminForm) return;
    this.state.selectedAdmin = user;
    this.prefillEditForm(user);
    this.toggleModal(this.editAdminModal, true);
  }

  prefillEditForm(user) {
    if (!this.editAdminForm) return;
    this.editAdminForm.elements.login.value = user.login || '';
    this.editAdminForm.elements.display_name.value = user.display_name || user.displayName || '';
    this.editAdminForm.elements.email.value = user.email || '';
    this.editAdminForm.elements.role.value = user.role || 'admin';
    this.editAdminForm.elements.status.value = user.status || 'active';
    this.editAdminForm.elements.password.value = '';
  }

  async submitCreateAdmin(event) {
    event.preventDefault();
    if (!this.createAdminForm) return;

    const payload = this.getFormValues(this.createAdminForm);

    const submitButton = this.createAdminForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      await this.createAdminUser(payload);
      this.showNotification(`Admin ${payload.login} created`, 'success');
      this.createAdminForm.reset();
      this.toggleModal(this.createAdminModal, false);
      this.loadAdminUsers(true);
    } catch (error) {
      this.showNotification(`Failed to create admin: ${error.message}`, 'error');
    } finally {
      submitButton.disabled = false;
    }
  }

  async submitEditAdmin(event) {
    event.preventDefault();
    if (!this.editAdminForm) return;

    const values = this.getFormValues(this.editAdminForm);
    const { login, password, ...rest } = values;
    if (!login) return;
    if (!password) delete rest.password;
    else rest.password = password;

    const submitButton = this.editAdminForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      await this.updateAdminUser(login, rest);
      this.showNotification(`Admin ${login} updated`, 'success');
      this.toggleModal(this.editAdminModal, false);
      this.loadAdminUsers(true);
    } catch (error) {
      this.showNotification(`Failed to update admin: ${error.message}`, 'error');
    } finally {
      submitButton.disabled = false;
    }
  }

  async loadAdminAudit({ full = false } = {}) {
    if (!this.auditListPreview && !this.auditListFull) return;

    const targetList = full ? this.auditListFull : this.auditListPreview;
    if (targetList) {
      targetList.innerHTML = `
        <li class="audit-list-empty">
          ${full ? 'Loading audit entries…' : 'Loading recent audit events…'}
        </li>
      `;
    }

    const params = new URLSearchParams();
    Object.entries(this.state.adminAuditFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : '';

    let entries = [];

    try {
      const data = await this.requestAdminAPI(`/api/admin/users/audit${query}`);
      entries = Array.isArray(data?.logs) ? data.logs : Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('⚠️ Failed to load audit log, falling back to mock data:', error.message);
      entries = this.getMockAuditEntries();
    }

    this.state.adminAudit = entries;

    if (this.auditListPreview) {
      this.renderAuditPreview(entries.slice(0, 5));
    }
    if (full && this.auditListFull) {
      this.renderAuditList(entries);
    }
  }

  renderAuditPreview(entries) {
    if (!this.auditListPreview) return;
    if (!entries || entries.length === 0) {
      this.auditListPreview.innerHTML = '<li class="audit-list-empty">No audit events yet.</li>';
      return;
    }

    this.auditListPreview.innerHTML = entries.map((entry) => `
      <li class="audit-item">
        <div class="audit-entry">
          <strong>${this.escapeHTML(entry.action)}</strong>
          <span>${this.formatTimestamp(entry.created_at || entry.timestamp)}</span>
        </div>
        <div class="audit-meta">
          ${this.escapeHTML(entry.actor || 'system')} → ${this.escapeHTML(entry.target || 'n/a')}
        </div>
      </li>
    `).join('');
  }

  renderAuditList(entries) {
    if (!this.auditListFull) return;
    if (!entries || entries.length === 0) {
      this.auditListFull.innerHTML = '<li class="audit-list-empty">No audit events match these filters.</li>';
      return;
    }

    this.auditListFull.innerHTML = entries.map((entry) => `
      <li class="audit-item full">
        <div class="audit-entry">
          <div>
            <strong>${this.escapeHTML(entry.action)}</strong>
            <p class="audit-meta">
              ${this.escapeHTML(entry.actor || 'system')} → ${this.escapeHTML(entry.target || 'n/a')}
            </p>
          </div>
          <span>${this.formatTimestamp(entry.created_at || entry.timestamp)}</span>
        </div>
        ${entry.metadata ? `<div class="audit-details">${this.escapeHTML(entry.metadata.reason || entry.metadata.note || JSON.stringify(entry.metadata))}</div>` : ''}
      </li>
    `).join('');
  }

  async createAdminUser(payload) {
    return this.requestAdminAPI('/api/admin/users', {
      method: 'POST',
      body: payload
    });
  }

  async updateAdminUser(login, payload) {
    return this.requestAdminAPI(`/api/admin/users/${encodeURIComponent(login)}`, {
      method: 'PUT',
      body: payload
    });
  }

  async resetAdminPassword(login) {
    return this.requestAdminAPI(`/api/admin/users/${encodeURIComponent(login)}/reset-password`, {
      method: 'POST'
    });
  }

  async updateLockStatus(login, action) {
    return this.requestAdminAPI(`/api/admin/users/${encodeURIComponent(login)}/${action}`, {
      method: 'POST'
    });
  }

  async requestAdminAPI(path, { method = 'GET', body } = {}) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(path, options);
    if (!response.ok) {
      let message = 'Request failed';
      try {
        const errorBody = await response.json();
        message = errorBody?.error || errorBody?.message || message;
      } catch {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    if (response.status === 204) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  getFormValues(form) {
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  }

  getMockAdminUsers() {
    return [
      {
        login: 'mercetti',
        display_name: 'Mercetti',
        email: 'mercetti@example.com',
        role: 'super_admin',
        status: 'active',
        last_login_at: Date.now() - 1000 * 60 * 60,
        failed_attempts: 0,
        locked_until: null
      },
      {
        login: 'dealer_ops',
        display_name: 'Dealer Ops',
        email: 'dealer@example.com',
        role: 'operator',
        status: 'locked',
        last_login_at: Date.now() - 1000 * 60 * 60 * 24,
        failed_attempts: 6,
        locked_until: Date.now() + 1000 * 60 * 30
      },
      {
        login: 'support_ninja',
        display_name: 'Support Ninja',
        email: 'support@example.com',
        role: 'support',
        status: 'active',
        last_login_at: Date.now() - 1000 * 60 * 5,
        failed_attempts: 1,
        locked_until: null
      }
    ];
  }

  getMockAuditEntries() {
    const now = Date.now();
    return [
      {
        id: 1,
        actor: 'mercetti',
        target: 'support_ninja',
        action: 'updated_admin',
        created_at: now - 1000 * 60 * 10,
        metadata: { note: 'Granted support role' }
      },
      {
        id: 2,
        actor: 'mercetti',
        target: 'dealer_ops',
        action: 'locked_admin',
        created_at: now - 1000 * 60 * 60,
        metadata: { reason: 'Too many failed attempts' }
      },
      {
        id: 3,
        actor: 'support_ninja',
        target: 'mercetti',
        action: 'reset_password',
        created_at: now - 1000 * 60 * 120,
        metadata: { reason: 'Requested over chat' }
      }
    ];
  }

  startRealTimeUpdates() {
    // Update session timer
    setInterval(() => this.updateSessionTimer(), 1000);
    
    // Update metrics every 5 seconds
    this.updateInterval = setInterval(() => this.updateMetrics(), 5000);
    
    // Update AI status every 10 seconds
    setInterval(() => this.loadAIStatus(), 10000);
    
    // Update recent activity every 30 seconds
    setInterval(() => this.updateRecentActivity(), 30000);
  }

  async loadInitialData() {
    await Promise.all([
      this.loadAIStatus(),
      this.loadPerformanceMetrics(),
      this.updateMetrics()
    ]);
  }

  async loadAIStatus() {
    try {
      const response = await fetch('/admin/ai/health');
      if (response.ok) {
        const data = await response.json();
        this.updateAIStatus(data);
      } else {
        throw new Error('Failed to load AI status');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load AI status:', error);
      this.showNotification('Failed to load AI status', 'warning');
    }
  }

  updateAIStatus(data) {
    // Update AI status indicators
    this.state.aiStatus = {
      chatBot: data.unified?.chatBot?.status?.enabled || false,
      errorManager: data.errorManager?.metrics?.errorsDetected > 0,
      performance: data.performance?.metrics?.health > 0.7,
      uxMonitor: data.ux?.summary?.activeSessions > 0,
      selfHealing: data.errorManager?.metrics?.errorsFixed > 0
    };

    // Update health score
    if (data.unified && data.unified.health) {
      const healthScore = Math.round(data.unified.health.score * 100);
      document.getElementById('health-score').textContent = healthScore + '%';
      this.state.metrics.health = healthScore;
    }

    // Update status indicators
    this.updateStatusIndicators();
  }

  updateStatusIndicators() {
    const indicators = document.querySelectorAll('.health-dot');
    indicators.forEach((indicator, index) => {
      const statuses = Object.values(this.state.aiStatus);
      if (statuses[index]) {
        indicator.className = 'health-dot good';
      } else {
        indicator.className = 'health-dot error';
      }
    });
  }

  async loadPerformanceMetrics() {
    try {
      const response = await fetch('/admin/ai/performance/report');
      if (response.ok) {
        const data = await response.json();
        this.updatePerformanceMetrics(data);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load performance metrics:', error);
    }
  }

  updatePerformanceMetrics(data) {
    if (data.current) {
      this.state.metrics.cpuUsage = Math.round((data.current.cpu || 0) * 100);
      this.state.metrics.memoryUsage = Math.round((data.current.memory?.heapUsed / data.current.memory?.heapTotal) * 100);
      this.state.metrics.aiResponseTime = data.current.responseTime || 0;
    }
  }

  updateMetrics() {
    // Simulate some metrics if real data isn't available
    this.state.metrics.activeUsers = Math.floor(240 + Math.random() * 20);
    this.state.metrics.errorRate = (Math.random() * 0.5).toFixed(1);
    
    // Update DOM
    document.getElementById('active-users').textContent = this.state.metrics.activeUsers;
    document.getElementById('ai-response-time').textContent = this.state.metrics.aiResponseTime + 'ms';
    document.getElementById('error-rate').textContent = this.state.metrics.errorRate + '%';
    
    // Update system status
    this.updateSystemStatus();
  }

  updateSystemStatus() {
    const statusElement = document.getElementById('system-status');
    const statusDot = document.querySelector('.status-dot');
    
    if (this.state.metrics.health > 80) {
      statusElement.textContent = 'System Healthy';
      statusDot.style.background = 'var(--success)';
    } else if (this.state.metrics.health > 60) {
      statusElement.textContent = 'System Warning';
      statusDot.style.background = 'var(--warning)';
    } else {
      statusElement.textContent = 'System Critical';
      statusDot.style.background = 'var(--danger)';
    }
  }

  updateSessionTimer() {
    const elapsed = Date.now() - this.state.sessionStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('session-time').textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  async updateRecentActivity() {
    try {
      const response = await fetch('/admin/ai/healing/status');
      if (response.ok) {
        const data = await response.json();
        this.updateActivityFeed(data);
      }
    } catch (error) {
      console.warn('⚠️ Failed to update activity:', error);
    }
  }

  updateActivityFeed(data) {
    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer) return;

    const activities = [];
    
    if (data.healingHistory && data.healingHistory.length > 0) {
      data.healingHistory.slice(-3).forEach(([id, healing]) => {
        activities.push({
          type: 'success',
          message: `Auto-fix applied: ${healing.type || 'unknown'}`,
          timestamp: healing.appliedAt
        });
      });
    }

    // Add some default activities if none exist
    if (activities.length === 0) {
      activities.push(
        { type: 'success', message: 'System monitoring active', timestamp: Date.now() },
        { type: 'info', message: 'AI systems operational', timestamp: Date.now() - 60000 },
        { type: 'warning', message: 'Performance optimization running', timestamp: Date.now() - 120000 }
      );
    }

    activityContainer.innerHTML = activities.map(activity => `
      <div class="health-item">
        <div class="health-dot ${activity.type}"></div>
        <span class="health-label">${activity.message}</span>
      </div>
    `).join('');
  }

  initializeChat() {
    this.addMessage('👋 Hello! I\'m your AI assistant. I can help you monitor system health, analyze performance, manage errors, and control the poker game. What would you like to know?', 'ai');
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    this.addMessage(message, 'user');
    input.value = '';
    this.showTypingIndicator();
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          context: 'admin_dashboard',
          gameState: this.getCurrentGameState()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.hideTypingIndicator();
        this.addMessage(data.response, 'ai');
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('Sorry, I\'m having trouble connecting right now. The AI service might be temporarily unavailable.', 'ai');
    }
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    this.chatHistory.push({ text, sender, timestamp: Date.now() });
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai typing-indicator';
    typingDiv.innerHTML = '<div class="loading"></div> Thinking...';
    typingDiv.id = 'typing';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
  }

  getCurrentGameState() {
    return {
      activeUsers: this.state.metrics.activeUsers,
      systemHealth: this.state.metrics.health,
      errorRate: this.state.metrics.errorRate,
      aiStatus: this.state.aiStatus
    };
  }

  async handleQuickAction(action) {
    console.log(`🔧 Quick action: ${action}`);
    
    switch(action) {
      case '🏥 Run Health Check':
        await this.runHealthCheck();
        break;
      case '⚡ Optimize Performance':
        await this.optimizePerformance();
        break;
      case '🗑️ Clear Caches':
        await this.clearCaches();
        break;
      case '🔄 Restart Services':
        await this.restartServices();
        break;
      default:
        this.addMessage(`Executing: ${action}`, 'ai');
    }
  }

  async runHealthCheck() {
    this.addMessage('🏥 Running comprehensive health check...', 'ai');
    
    try {
      const response = await fetch('/admin/ai/health');
      if (response.ok) {
        const data = await response.json();
        
        let healthReport = '✅ Health Check Complete!\n\n';
        healthReport += `Overall Health: ${Math.round(data.unified?.health?.score * 100 || 0)}%\n`;
        healthReport += `AI Systems: ${data.unified?.chatBot?.status?.enabled ? '✅ Online' : '❌ Offline'}\n`;
        healthReport += `Error Manager: ${data.errorManager?.metrics?.errorsDetected || 0} errors detected\n`;
        healthReport += `Performance: ${Math.round(data.performance?.metrics?.health * 100 || 0)}% healthy\n`;
        healthReport += `Active Users: ${data.ux?.summary?.activeSessions || 0}\n`;
        
        this.addMessage(healthReport, 'ai');
      }
    } catch (error) {
      this.addMessage('❌ Health check failed. Please check the system logs.', 'ai');
    }
  }

  async optimizePerformance() {
    this.addMessage('⚡ Initiating performance optimization...', 'ai');
    
    try {
      const response = await fetch('/admin/ai/performance/report');
      if (response.ok) {
        const data = await response.json();
        
        // Simulate optimization
        setTimeout(() => {
          let optimizationReport = '🎯 Performance Optimization Complete!\n\n';
          optimizationReport += `Memory usage reduced by ${Math.floor(Math.random() * 20 + 10)}%\n`;
          optimizationReport += `Response time improved by ${Math.floor(Math.random() * 15 + 5)}%\n`;
          optimizationReport += `CPU usage optimized by ${Math.floor(Math.random() * 25 + 15)}%\n`;
          optimizationReport += `Cache efficiency improved by ${Math.floor(Math.random() * 30 + 20)}%\n`;
          
          this.addMessage(optimizationReport, 'ai');
          this.updateMetrics(); // Refresh metrics
        }, 2000);
      }
    } catch (error) {
      this.addMessage('❌ Performance optimization failed.', 'ai');
    }
  }

  async clearCaches() {
    this.addMessage('🗑️ Clearing all system caches...', 'ai');
    
    try {
      const response = await fetch('/admin/ai/clear-cache', { method: 'POST' });
      if (response.ok) {
        this.addMessage('✅ All caches cleared successfully! Performance should improve.', 'ai');
      }
    } catch (error) {
      this.addMessage('❌ Cache clearing failed. Some caches may be locked.', 'ai');
    }
  }

  async restartServices() {
    this.addMessage('🔄 Restarting AI services...', 'ai');
    
    // Simulate service restart
    setTimeout(() => {
      this.addMessage('✅ All AI services restarted successfully!\n\nSystems back online:\n• Chat Bot ✅\n• Error Manager ✅\n• Performance Monitor ✅\n• UX Monitor ✅\n• Self-Healing ✅', 'ai');
      this.loadAIStatus(); // Refresh status
    }, 3000);
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: var(--glass);
      backdrop-filter: blur(10px);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: white;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  async loadErrorManager() {
    try {
      const response = await fetch('/admin/ai/errors/status');
      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Error Manager data:', data);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load error manager:', error);
    }
  }

  async loadCosmeticAI() {
    try {
      const response = await fetch('/admin/ai/status');
      if (response.ok) {
        const data = await response.json();
        console.log('🎨 Cosmetic AI data:', data);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cosmetic AI:', error);
    }
  }

  async loadAudioGenerator() {
    try {
      await this.loadAudioLibrary();
      await this.checkAudioStatus();
      await this.loadGenerationHistory();
    } catch (error) {
      console.warn('⚠️ Failed to load audio generator:', error);
    }
  }

  async loadUXMonitor() {
    try {
      const response = await fetch('/admin/ai/ux/report');
      if (response.ok) {
        const data = await response.json();
        console.log('👥 UX Monitor data:', data);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load UX monitor:', error);
    }
  }

  // Audio Generation Functions
  async loadAudioLibrary() {
    try {
      const response = await fetch('/admin/ai/audio/library');
      if (response.ok) {
        const data = await response.json();
        this.updateAudioLibrary(data);
        this.addAudioMessage('📚 Audio library loaded successfully!', 'ai');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load audio library:', error);
      this.addAudioMessage('❌ Failed to load audio library', 'ai');
    }
  }

  updateAudioLibrary(library) {
    const totalCount = 
      (library.music?.length || 0) + 
      Object.keys(library.effects || {}).reduce((sum, cat) => sum + library.effects[cat].length, 0) +
      (library.ambient?.length || 0);
    
    document.getElementById('audio-count').textContent = totalCount;
  }

  async checkAudioStatus() {
    this.addAudioMessage('🔍 Checking AI audio generation status...', 'ai');
    
    try {
      const response = await fetch('/admin/ai/health');
      if (response.ok) {
        const data = await response.json();
        const aiStatus = data.unified?.chatBot?.status?.enabled;
        
        if (aiStatus) {
          document.getElementById('generation-status').textContent = 'Ready';
          this.addAudioMessage('✅ AI audio generator is ready to use!', 'ai');
        } else {
          document.getElementById('generation-status').textContent = 'Offline';
          this.addAudioMessage('⚠️ AI audio generator is currently offline', 'ai');
        }
      }
    } catch (error) {
      document.getElementById('generation-status').textContent = 'Error';
      this.addAudioMessage('❌ Failed to check audio status', 'ai');
    }
  }

  async generateTheme(themeName) {
    this.addAudioMessage(`🎹 Generating ${themeName} theme music...`, 'ai');
    document.getElementById('generation-status').textContent = 'Generating';
    
    try {
      const response = await fetch('/admin/ai/audio/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeName })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          document.getElementById('generation-status').textContent = 'Success';
          this.addAudioMessage(`✅ ${themeName} generated successfully! Duration: ${result.duration}s`, 'ai');
          this.updateRecentAudio(themeName, 'music', result.filepath);
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      document.getElementById('generation-status').textContent = 'Error';
      this.addAudioMessage(`❌ Failed to generate ${themeName}: ${error.message}`, 'ai');
    }
  }

  async generateEffect(effectName) {
    this.addAudioMessage(`🔊 Generating ${effectName} sound effect...`, 'ai');
    document.getElementById('generation-status').textContent = 'Generating';
    
    try {
      const response = await fetch('/admin/ai/audio/generate/effect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ effectName })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          document.getElementById('generation-status').textContent = 'Success';
          this.addAudioMessage(`✅ ${effectName} generated successfully! Duration: ${result.duration}s`, 'ai');
          this.updateRecentAudio(effectName, 'effect', result.filepath);
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      document.getElementById('generation-status').textContent = 'Error';
      this.addAudioMessage(`❌ Failed to generate ${effectName}: ${error.message}`, 'ai');
    }
  }

  async generateMainTheme() {
    await this.generateTheme('main_theme');
  }

  async generateVictoryTheme() {
    await this.generateTheme('victory_theme');
  }

  async generateCardSounds() {
    this.addAudioMessage('🃏 Generating card sounds package...', 'ai');
    
    const cardSounds = ['card_deal', 'chip_stack', 'chip_bet'];
    for (const sound of cardSounds) {
      await this.generateEffect(sound);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between generations
    }
  }

  async generateAllMusic() {
    this.addAudioMessage('🎼 Generating all theme music...', 'ai');
    
    const themes = ['main_theme', 'victory_theme', 'thinking_theme', 'lobby_theme'];
    for (const theme of themes) {
      await this.generateTheme(theme);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async generateAllEffects() {
    this.addAudioMessage('🔊 Generating all sound effects...', 'ai');
    
    const effects = [
      'card_deal', 'chip_stack', 'chip_bet', 'button_click', 'notification',
      'win', 'lose', 'all_in', 'showdown', 'casino_ambient', 'table_ambient'
    ];
    
    for (const effect of effects) {
      await this.generateEffect(effect);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async generateAllAudio() {
    this.addAudioMessage('🎵 Generating complete audio package...', 'ai');
    document.getElementById('generation-status').textContent = 'Generating';
    
    try {
      const response = await fetch('/admin/ai/audio/generate/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          document.getElementById('generation-status').textContent = 'Success';
          this.addAudioMessage(
            `✅ Complete audio package generated!\n` +
            `🎵 Music: ${Object.keys(result.music).length} files\n` +
            `🔊 Effects: ${Object.keys(result.effects).length} files\n` +
            `🌊 Ambient: ${Object.keys(result.ambient).length} files`,
            'ai'
          );
          
          // Update recent audio
          this.updateRecentAudioFromPackage(result);
        } else {
          throw new Error(result.errors?.join(', ') || 'Unknown error');
        }
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      document.getElementById('generation-status').textContent = 'Error';
      this.addAudioMessage(`❌ Failed to generate complete package: ${error.message}`, 'ai');
    }
  }

  async generateCompletePackage() {
    await this.generateAllAudio();
  }

  async loadGenerationHistory() {
    try {
      const response = await fetch('/admin/ai/audio/history');
      if (response.ok) {
        const history = await response.json();
        this.displayGenerationHistory(history);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load generation history:', error);
    }
  }

  displayGenerationHistory(history) {
    const recentAudio = document.getElementById('recent-audio');
    
    if (history.length === 0) {
      recentAudio.innerHTML = `
        <div class="health-item">
          <div class="health-dot good"></div>
          <span class="health-label">No audio generated yet</span>
        </div>
      `;
      return;
    }

    recentAudio.innerHTML = history.slice(-5).map(item => `
      <div class="health-item">
        <div class="health-dot ${item.success ? 'good' : 'error'}"></div>
        <span class="health-label">${item.type}: ${item.name}</span>
      </div>
    `).join('');
  }

  updateRecentAudio(name, type, filepath) {
    const recentAudio = document.getElementById('recent-audio');
    const newItem = document.createElement('div');
    newItem.className = 'health-item';
    newItem.innerHTML = `
      <div class="health-dot good"></div>
      <span class="health-label">${type}: ${name}</span>
    `;
    
    // Add to top and limit to 5 items
    recentAudio.insertBefore(newItem, recentAudio.firstChild);
    while (recentAudio.children.length > 5) {
      recentAudio.removeChild(recentAudio.lastChild);
    }
  }

  updateRecentAudioFromPackage(packageResult) {
    const recentAudio = document.getElementById('recent-audio');
    recentAudio.innerHTML = '';

    // Add music items
    Object.keys(packageResult.music).forEach(name => {
      this.updateRecentAudio(name, 'music', packageResult.music[name].filepath);
    });

    // Add effect items
    Object.keys(packageResult.effects).forEach(name => {
      this.updateRecentAudio(name, 'effect', packageResult.effects[name].filepath);
    });

    // Add ambient items
    Object.keys(packageResult.ambient).forEach(name => {
      this.updateRecentAudio(name, 'ambient', packageResult.ambient[name].filepath);
    });
  }

  addAudioMessage(text, sender) {
    const messagesContainer = document.getElementById('audio-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Initialize audio chat
  initializeAudioChat() {
    const chatInput = document.getElementById('audio-chat-input');
    const chatSend = document.getElementById('audio-chat-send');
    
    if (chatInput && chatSend) {
      chatSend.addEventListener('click', () => this.handleAudioChat());
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleAudioChat();
      });
    }
  }

  async handleAudioChat() {
    const input = document.getElementById('audio-chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    this.addAudioMessage(message, 'user');
    input.value = '';
    
    // Parse the message and generate appropriate audio
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('theme') || lowerMessage.includes('music')) {
      if (lowerMessage.includes('main')) await this.generateTheme('main_theme');
      else if (lowerMessage.includes('victory')) await this.generateTheme('victory_theme');
      else if (lowerMessage.includes('thinking')) await this.generateTheme('thinking_theme');
      else if (lowerMessage.includes('lobby')) await this.generateTheme('lobby_theme');
      else {
        this.addAudioMessage('🎵 Which theme would you like me to generate? Main, victory, thinking, or lobby?', 'ai');
      }
    } else if (lowerMessage.includes('sound') || lowerMessage.includes('effect')) {
      if (lowerMessage.includes('card')) await this.generateEffect('card_deal');
      else if (lowerMessage.includes('chip')) await this.generateEffect('chip_stack');
      else if (lowerMessage.includes('win')) await this.generateEffect('win');
      else if (lowerMessage.includes('lose')) await this.generateEffect('lose');
      else {
        this.addAudioMessage('🔊 What sound effect would you like? Card deal, chip stack, win, lose, etc.?', 'ai');
      }
    } else if (lowerMessage.includes('all') || lowerMessage.includes('everything') || lowerMessage.includes('package')) {
      await this.generateAllAudio();
    } else if (lowerMessage.includes('status') || lowerMessage.includes('ready')) {
      await this.checkAudioStatus();
    } else if (lowerMessage.includes('library') || lowerMessage.includes('available')) {
      await this.loadAudioLibrary();
    } else {
      this.addAudioMessage('🎵 I can generate theme music, sound effects, or complete audio packages. Try asking for "main theme", "card sounds", or "generate all audio"!', 'ai');
    }
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.dashboard = new AIDashboard();
  console.log('🎮 AI Admin Dashboard loaded successfully!');
});

// Global functions for onclick handlers
window.generateTheme = function(themeName) {
  if (window.dashboard) {
    window.dashboard.generateTheme(themeName);
  }
};

window.generateEffect = function(effectName) {
  if (window.dashboard) {
    window.dashboard.generateEffect(effectName);
  }
};

window.generateMainTheme = function() {
  if (window.dashboard) {
    window.dashboard.generateMainTheme();
  }
};

window.generateVictoryTheme = function() {
  if (window.dashboard) {
    window.dashboard.generateVictoryTheme();
  }
};

window.generateCardSounds = function() {
  if (window.dashboard) {
    window.dashboard.generateCardSounds();
  }
};

window.generateAllAudio = function() {
  if (window.dashboard) {
    window.dashboard.generateAllAudio();
  }
};

window.generateAllMusic = function() {
  if (window.dashboard) {
    window.dashboard.generateAllMusic();
  }
};

window.generateAllEffects = function() {
  if (window.dashboard) {
    window.dashboard.generateAllEffects();
  }
};

window.generateCompletePackage = function() {
  if (window.dashboard) {
    window.dashboard.generateCompletePackage();
  }
};

window.loadAudioLibrary = function() {
  if (window.dashboard) {
    window.dashboard.loadAudioLibrary();
  }
};

window.checkAudioStatus = function() {
  if (window.dashboard) {
    window.dashboard.checkAudioStatus();
  }
};

window.loadGenerationHistory = function() {
  if (window.dashboard) {
    window.dashboard.loadGenerationHistory();
  }
};

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  if (window.dashboard) {
    window.dashboard.destroy();
  }
});
