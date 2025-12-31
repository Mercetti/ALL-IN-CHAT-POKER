// ===== ENHANCED ADMIN DASHBOARD JAVASCRIPT =====

class EnhancedAdminDashboard {
  constructor() {
    this.currentTab = 'dashboard';
    this.refreshInterval = null;
    this.toastContainer = document.getElementById('toast-container');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialData();
    this.startAutoRefresh();
    this.setupKeyboardShortcuts();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Quick actions
    document.getElementById('quick-start-round')?.addEventListener('click', () => this.startRound());
    document.getElementById('quick-add-chips')?.addEventListener('click', () => this.showAddChipsModal());
    document.getElementById('quick-create-lobby')?.addEventListener('click', () => this.createLobby());
    document.getElementById('quick-refresh-data')?.addEventListener('click', () => this.refreshAllData());
    document.getElementById('quick-export')?.addEventListener('click', () => this.exportData());
    document.getElementById('quick-ai-test')?.addEventListener('click', () => this.runAITest());

    // Game controls
    document.getElementById('start-round-btn')?.addEventListener('click', () => this.startRound());
    document.getElementById('start-now-btn')?.addEventListener('click', () => this.startRoundNow());
    document.getElementById('process-draw-btn')?.addEventListener('click', () => this.processDraw());
    document.getElementById('reset-game-btn')?.addEventListener('click', () => this.resetGame());
    document.getElementById('add-ai-btn')?.addEventListener('click', () => this.addAIPlayers());

    // Player management
    document.getElementById('apply-chips-btn')?.addEventListener('click', () => this.adjustPlayerChips());
    document.getElementById('refresh-players')?.addEventListener('click', () => this.refreshPlayers());
    document.getElementById('player-search')?.addEventListener('input', (e) => this.filterPlayers(e.target.value));

    // Lobby management
    document.getElementById('create-lobby-btn')?.addEventListener('click', () => this.createLobby());
    document.getElementById('copy-lobby-btn')?.addEventListener('click', () => this.copyLobbyCode());
    document.getElementById('join-lobby-btn')?.addEventListener('click', () => this.joinLobby());

    // Partner management
    document.getElementById('add-partner-btn')?.addEventListener('click', () => this.showAddPartnerModal());
    document.getElementById('export-partners-btn')?.addEventListener('click', () => this.exportPartners());
    document.getElementById('refresh-partners')?.addEventListener('click', () => this.refreshPartners());
    document.getElementById('partner-search')?.addEventListener('input', (e) => this.filterPartners(e.target.value));
    document.getElementById('partner-tier-filter')?.addEventListener('change', (e) => this.filterPartnersByTier(e.target.value));

    // Cosmetic management
    document.getElementById('import-cosmetics-btn')?.addEventListener('click', () => this.importCosmetics());
    document.getElementById('export-cosmetics-btn')?.addEventListener('click', () => this.exportCosmetics());
    document.getElementById('refresh-proposals')?.addEventListener('click', () => this.refreshProposals());
    document.getElementById('test-proposal')?.addEventListener('click', () => this.testProposal());
    document.getElementById('approve-proposal')?.addEventListener('click', () => this.approveProposal());
    document.getElementById('reject-proposal')?.addEventListener('click', () => this.rejectProposal());
    document.getElementById('refresh-cosmetics')?.addEventListener('click', () => this.refreshCosmetics());
    document.getElementById('cosmetic-search')?.addEventListener('input', (e) => this.filterCosmetics(e.target.value));
    document.getElementById('cosmetic-type-filter')?.addEventListener('change', (e) => this.filterCosmeticsByType(e.target.value));

    // User management
    document.getElementById('add-user-btn')?.addEventListener('click', () => this.showAddUserModal());
    document.getElementById('export-users-btn')?.addEventListener('click', () => this.exportUsers());
    document.getElementById('refresh-users')?.addEventListener('click', () => this.refreshUsers());
    document.getElementById('user-search')?.addEventListener('input', (e) => this.filterUsers(e.target.value));
    document.getElementById('user-status-filter')?.addEventListener('change', (e) => this.filterUsersByStatus(e.target.value));

    // Header actions
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('obs-overlay')?.addEventListener('click', () => this.openOBSOverlay());
    document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());

    // Activity feed
    document.getElementById('activity-filter')?.addEventListener('change', (e) => this.filterActivity(e.target.value));
    document.getElementById('refresh-activity')?.addEventListener('click', () => this.refreshActivity());
  }

  switchTab(tabName) {
    // Update nav pills
    document.querySelectorAll('.nav-pill').forEach(pill => {
      pill.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`)?.classList.add('active');

    this.currentTab = tabName;

    // Load tab-specific data
    this.loadTabData(tabName);
  }

  loadTabData(tabName) {
    switch (tabName) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'game':
        this.loadGameData();
        break;
      case 'partners':
        this.loadPartnersData();
        break;
      case 'cosmetics':
        this.loadCosmeticsData();
        break;
      case 'users':
        this.loadUsersData();
        break;
    }
  }

  async loadInitialData() {
    try {
      await Promise.all([
        this.loadDashboardData(),
        this.loadGameData(),
        this.loadPartnersData(),
        this.loadCosmeticsData(),
        this.loadUsersData()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showToast('Error loading initial data', 'error');
    }
  }

  async loadDashboardData() {
    try {
      // Simulate API calls - replace with actual API endpoints
      const stats = await this.fetchAPI('/api/admin/stats');
      this.updateDashboardStats(stats);
      
      const activity = await this.fetchAPI('/api/admin/activity');
      this.updateActivityFeed(activity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  updateDashboardStats(stats) {
    // Update stat cards
    this.updateElement('total-players', stats.totalPlayers || 0);
    this.updateElement('total-balance', `$${stats.totalBalance || 0}`);
    this.updateElement('top-winner', stats.topWinner || '-');
    this.updateElement('active-games', stats.activeGames || 0);
    this.updateElement('active-partners', stats.activePartners || 0);
    this.updateElement('system-health', `${stats.systemHealth || 100}%`);

    // Update status indicators
    this.updateElement('player-count', `${stats.currentPlayers || 0} Players`);
    this.updateElement('current-pot', `Pot: $${stats.currentPot || 0}`);
  }

  updateActivityFeed(activities) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    if (!activities || activities.length === 0) {
      activityList.innerHTML = '<div class="no-data">No recent activity</div>';
      return;
    }

    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-desc">${activity.description}</div>
          <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  getActivityIcon(type) {
    const icons = {
      game: '🎮',
      user: '👤',
      partner: '🤝',
      system: '⚙️',
      win: '🏆',
      join: '👋'
    };
    return icons[type] || '📄';
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  async loadGameData() {
    try {
      const gameState = await this.fetchAPI('/api/admin/game/state');
      this.updateGameState(gameState);
      
      const players = await this.fetchAPI('/api/admin/game/players');
      this.updatePlayersTable(players);
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  }

  updateGameState(state) {
    this.updateElement('game-phase', state.phase || 'Waiting');
    this.updateElement('round-number', state.round || 1);
    this.updateElement('round-players', state.players || 0);
    this.updateElement('round-pot', `$${state.pot || 0}`);
    this.updateElement('round-timer', this.formatTimer(state.timer || 0));
  }

  formatTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updatePlayersTable(players) {
    const tbody = document.getElementById('players-tbody');
    if (!tbody) return;

    if (!players || players.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data">No active players</td></tr>';
      return;
    }

    tbody.innerHTML = players.map(player => `
      <tr>
        <td>${player.username}</td>
        <td>$${player.balance}</td>
        <td><span class="status-dot ${player.online ? 'online' : 'offline'}"></span> ${player.status}</td>
        <td>${player.lastAction}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="dashboard.adjustPlayerBalance('${player.username}')">Adjust</button>
        </td>
      </tr>
    `).join('');
  }

  async loadPartnersData() {
    try {
      const partners = await this.fetchAPI('/api/admin/partners');
      this.updatePartnersTable(partners);
      this.updatePartnerStats(partners);
    } catch (error) {
      console.error('Error loading partners data:', error);
    }
  }

  updatePartnersTable(partners) {
    const tbody = document.getElementById('partners-tbody');
    if (!tbody) return;

    if (!partners || partners.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data">No partners found</td></tr>';
      return;
    }

    tbody.innerHTML = partners.map(partner => `
      <tr>
        <td>${partner.username}</td>
        <td><span class="badge">${partner.tier}</span></td>
        <td>${partner.streams30d}</td>
        <td>${partner.avgViewers}</td>
        <td>$${partner.revenue}</td>
        <td><span class="status-dot ${partner.status === 'active' ? 'online' : 'offline'}"></span> ${partner.status}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="dashboard.editPartner('${partner.id}')">Edit</button>
        </td>
      </tr>
    `).join('');
  }

  updatePartnerStats(partners) {
    const activePartners = partners?.filter(p => p.status === 'active').length || 0;
    const totalRevenue = partners?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0;
    const activeStreams = partners?.reduce((sum, p) => sum + (p.activeStreams || 0), 0) || 0;

    this.updateElement('total-partners', partners?.length || 0);
    this.updateElement('partner-revenue', `$${totalRevenue}`);
    this.updateElement('active-streams', activeStreams);
    this.updateElement('conversion-rate', '2.5%'); // Placeholder
  }

  async loadCosmeticsData() {
    try {
      const cosmetics = await this.fetchAPI('/api/admin/cosmetics');
      this.updateCosmeticsTable(cosmetics);
      
      const proposals = await this.fetchAPI('/api/admin/cosmetics/proposals');
      this.updateProposalsList(proposals);
    } catch (error) {
      console.error('Error loading cosmetics data:', error);
    }
  }

  updateCosmeticsTable(cosmetics) {
    const tbody = document.getElementById('cosmetics-tbody');
    if (!tbody) return;

    if (!cosmetics || cosmetics.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">No cosmetics found</td></tr>';
      return;
    }

    tbody.innerHTML = cosmetics.map(cosmetic => `
      <tr>
        <td>${cosmetic.name}</td>
        <td>${cosmetic.type}</td>
        <td>$${cosmetic.price}</td>
        <td><span class="badge">${cosmetic.rarity}</span></td>
        <td><span class="status-dot ${cosmetic.status === 'active' ? 'online' : 'offline'}"></span> ${cosmetic.status}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="dashboard.editCosmetic('${cosmetic.id}')">Edit</button>
        </td>
      </tr>
    `).join('');
  }

  updateProposalsList(proposals) {
    const select = document.getElementById('proposal-select');
    if (!select) return;

    select.innerHTML = '<option value="">Select a proposal to review</option>' +
      (proposals || []).map(proposal => 
        `<option value="${proposal.id}">${proposal.name} - ${proposal.submittedBy}</option>`
      ).join('');
  }

  async loadUsersData() {
    try {
      const users = await this.fetchAPI('/api/admin/users');
      this.updateUsersTable(users);
      this.updateUserStats(users);
    } catch (error) {
      console.error('Error loading users data:', error);
    }
  }

  updateUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.username}</td>
        <td>${user.displayName}</td>
        <td>$${user.balance}</td>
        <td><span class="status-dot ${user.status === 'online' ? 'online' : 'offline'}"></span> ${user.status}</td>
        <td>${this.formatDate(user.joined)}</td>
        <td>${this.formatTime(user.lastActive)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="dashboard.editUser('${user.id}')">Edit</button>
        </td>
      </tr>
    `).join('');
  }

  updateUserStats(users) {
    const onlineUsers = users?.filter(u => u.status === 'online').length || 0;
    const newUsersToday = users?.filter(u => this.isToday(u.joined)).length || 0;
    const avgBalance = users?.reduce((sum, u) => sum + (u.balance || 0), 0) / (users?.length || 1) || 0;

    this.updateElement('total-users', users?.length || 0);
    this.updateElement('online-users', onlineUsers);
    this.updateElement('new-users-today', newUsersToday);
    this.updateElement('avg-balance', `$${Math.round(avgBalance)}`);
  }

  formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString();
  }

  isToday(timestamp) {
    const today = new Date();
    const date = new Date(timestamp);
    return date.toDateString() === today.toDateString();
  }

  // Action Methods
  async startRound() {
    try {
      await this.fetchAPI('/api/admin/game/start', { method: 'POST' });
      this.showToast('Round started successfully', 'success');
      this.loadGameData();
    } catch (error) {
      this.showToast('Error starting round', 'error');
    }
  }

  async startRoundNow() {
    try {
      await this.fetchAPI('/api/admin/game/start-now', { method: 'POST' });
      this.showToast('Round started immediately', 'success');
      this.loadGameData();
    } catch (error) {
      this.showToast('Error starting round', 'error');
    }
  }

  async processDraw() {
    try {
      await this.fetchAPI('/api/admin/game/draw', { method: 'POST' });
      this.showToast('Draw processed successfully', 'success');
      this.loadGameData();
    } catch (error) {
      this.showToast('Error processing draw', 'error');
    }
  }

  async resetGame() {
    if (!confirm('Are you sure you want to reset the game? This will end the current round.')) {
      return;
    }
    
    try {
      await this.fetchAPI('/api/admin/game/reset', { method: 'POST' });
      this.showToast('Game reset successfully', 'success');
      this.loadGameData();
    } catch (error) {
      this.showToast('Error resetting game', 'error');
    }
  }

  async addAIPlayers() {
    try {
      await this.fetchAPI('/api/admin/game/add-ai', { method: 'POST' });
      this.showToast('AI players added successfully', 'success');
      this.loadGameData();
    } catch (error) {
      this.showToast('Error adding AI players', 'error');
    }
  }

  async adjustPlayerChips() {
    const username = document.getElementById('player-username')?.value;
    const amount = document.getElementById('chip-amount')?.value;
    const mode = document.getElementById('adjust-mode')?.value;

    if (!username || !amount) {
      this.showToast('Please fill in all fields', 'warning');
      return;
    }

    try {
      await this.fetchAPI('/api/admin/players/adjust', {
        method: 'POST',
        body: JSON.stringify({ username, amount: parseInt(amount), mode })
      });
      this.showToast('Player balance adjusted successfully', 'success');
      this.loadGameData();
      
      // Clear form
      document.getElementById('player-username').value = '';
      document.getElementById('chip-amount').value = '';
    } catch (error) {
      this.showToast('Error adjusting player balance', 'error');
    }
  }

  async createLobby() {
    try {
      const response = await this.fetchAPI('/api/admin/lobby/create', { method: 'POST' });
      const lobbyCode = response.code;
      
      document.getElementById('lobby-code').value = lobbyCode;
      this.showToast(`Lobby created: ${lobbyCode}`, 'success');
    } catch (error) {
      this.showToast('Error creating lobby', 'error');
    }
  }

  copyLobbyCode() {
    const lobbyCode = document.getElementById('lobby-code')?.value;
    if (!lobbyCode) {
      this.showToast('No lobby code to copy', 'warning');
      return;
    }

    navigator.clipboard.writeText(lobbyCode).then(() => {
      this.showToast('Lobby code copied to clipboard', 'success');
    }).catch(() => {
      this.showToast('Error copying lobby code', 'error');
    });
  }

  async joinLobby() {
    const lobbyCode = document.getElementById('join-lobby-code')?.value;
    if (!lobbyCode) {
      this.showToast('Please enter a lobby code', 'warning');
      return;
    }

    try {
      await this.fetchAPI('/api/admin/lobby/join', {
        method: 'POST',
        body: JSON.stringify({ code: lobbyCode })
      });
      this.showToast(`Joined lobby: ${lobbyCode}`, 'success');
      this.loadGameData();
    } catch (error) {
      this.showToast('Error joining lobby', 'error');
    }
  }

  async refreshAllData() {
    this.showToast('Refreshing all data...', 'info');
    await this.loadInitialData();
    this.showToast('Data refreshed successfully', 'success');
  }

  async exportData() {
    try {
      const data = await this.fetchAPI('/api/admin/export/all');
      this.downloadJSON(data, 'admin-export.json');
      this.showToast('Data exported successfully', 'success');
    } catch (error) {
      this.showToast('Error exporting data', 'error');
    }
  }

  async runAITest() {
    this.showToast('Running AI diagnostics...', 'info');
    try {
      const results = await this.fetchAPI('/admin/ai-tests', { method: 'POST' });
      this.showToast('AI tests completed successfully', 'success');
      console.log('AI Test Results:', results);
    } catch (error) {
      this.showToast('AI tests failed', 'error');
    }
  }

  openOBSOverlay() {
    const token = localStorage.getItem('user_jwt');
    const login = this.decodeLogin(token);
    const url = login ? `/obs-overlay.html?channel=${encodeURIComponent(login)}` : '/obs-overlay.html';
    window.open(url, '_blank', 'noopener'); // OBS overlay needs new tab
  }

  decodeLogin(token) {
    if (!token || typeof token !== 'string') return '';
    try {
      const payload = token.split('.')[1];
      const pad = payload.length % 4 === 2 ? '==' : payload.length % 4 === 3 ? '=' : '';
      const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/') + pad));
      return (data.user || data.login || '').toLowerCase();
    } catch {
      return '';
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    this.showToast('Theme toggled', 'info');
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('user_jwt');
      window.location.href = '/login.html';
    }
  }

  // Utility Methods
  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  async fetchAPI(url, options = {}) {
    const token = localStorage.getItem('user_jwt');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    this.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  startAutoRefresh() {
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadTabData(this.currentTab);
    }, 30000);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + numbers for tab switching
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const tabs = ['dashboard', 'game', 'partners', 'cosmetics', 'users'];
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          this.switchTab(tabs[tabIndex]);
        }
      }

      // Ctrl/Cmd + R for refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        this.refreshAllData();
      }

      // Ctrl/Cmd + E for export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        this.exportData();
      }
    });
  }

  // Filter methods (placeholders for now)
  filterPlayers(searchTerm) {
    console.log('Filter players:', searchTerm);
    // Implement player filtering logic
  }

  filterPartners(searchTerm) {
    console.log('Filter partners:', searchTerm);
    // Implement partner filtering logic
  }

  filterPartnersByTier(tier) {
    console.log('Filter partners by tier:', tier);
    // Implement tier filtering logic
  }

  filterCosmetics(searchTerm) {
    console.log('Filter cosmetics:', searchTerm);
    // Implement cosmetic filtering logic
  }

  filterCosmeticsByType(type) {
    console.log('Filter cosmetics by type:', type);
    // Implement type filtering logic
  }

  filterUsers(searchTerm) {
    console.log('Filter users:', searchTerm);
    // Implement user filtering logic
  }

  filterUsersByStatus(status) {
    console.log('Filter users by status:', status);
    // Implement status filtering logic
  }

  filterActivity(type) {
    console.log('Filter activity:', type);
    // Implement activity filtering logic
  }

  refreshActivity() {
    console.log('Refresh activity');
    this.loadDashboardData();
  }

  // Placeholder methods for modals and advanced features
  showAddChipsModal() {
    this.showToast('Add chips modal - feature coming soon', 'info');
  }

  showAddPartnerModal() {
    this.showToast('Add partner modal - feature coming soon', 'info');
  }

  showAddUserModal() {
    this.showToast('Add user modal - feature coming soon', 'info');
  }

  editPartner(partnerId) {
    this.showToast(`Edit partner ${partnerId} - feature coming soon`, 'info');
  }

  editCosmetic(cosmeticId) {
    this.showToast(`Edit cosmetic ${cosmeticId} - feature coming soon`, 'info');
  }

  editUser(userId) {
    this.showToast(`Edit user ${userId} - feature coming soon`, 'info');
  }

  adjustPlayerBalance(username) {
    document.getElementById('player-username').value = username;
    document.getElementById('player-username').focus();
  }

  // Cosmetic proposal methods
  async refreshProposals() {
    try {
      const proposals = await this.fetchAPI('/api/admin/cosmetics/proposals');
      this.updateProposalsList(proposals);
      this.showToast('Proposals refreshed', 'success');
    } catch (error) {
      this.showToast('Error refreshing proposals', 'error');
    }
  }

  async testProposal() {
    const proposalId = document.getElementById('proposal-select')?.value;
    if (!proposalId) {
      this.showToast('Please select a proposal', 'warning');
      return;
    }

    try {
      await this.fetchAPI(`/api/admin/cosmetics/proposals/${proposalId}/test`, { method: 'POST' });
      this.showToast('Proposal tested on overlay', 'success');
    } catch (error) {
      this.showToast('Error testing proposal', 'error');
    }
  }

  async approveProposal() {
    const proposalId = document.getElementById('proposal-select')?.value;
    if (!proposalId) {
      this.showToast('Please select a proposal', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to approve this proposal?')) {
      return;
    }

    try {
      await this.fetchAPI(`/api/admin/cosmetics/proposals/${proposalId}/approve`, { method: 'POST' });
      this.showToast('Proposal approved successfully', 'success');
      this.refreshProposals();
      this.refreshCosmetics();
    } catch (error) {
      this.showToast('Error approving proposal', 'error');
    }
  }

  async rejectProposal() {
    const proposalId = document.getElementById('proposal-select')?.value;
    if (!proposalId) {
      this.showToast('Please select a proposal', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to reject this proposal?')) {
      return;
    }

    try {
      await this.fetchAPI(`/api/admin/cosmetics/proposals/${proposalId}/reject`, { method: 'POST' });
      this.showToast('Proposal rejected', 'success');
      this.refreshProposals();
    } catch (error) {
      this.showToast('Error rejecting proposal', 'error');
    }
  }

  async importCosmetics() {
    this.showToast('Import cosmetics feature coming soon', 'info');
  }

  async exportCosmetics() {
    try {
      const cosmetics = await this.fetchAPI('/api/admin/cosmetics');
      this.downloadJSON(cosmetics, 'cosmetics-export.json');
      this.showToast('Cosmetics exported successfully', 'success');
    } catch (error) {
      this.showToast('Error exporting cosmetics', 'error');
    }
  }

  async refreshCosmetics() {
    try {
      const cosmetics = await this.fetchAPI('/api/admin/cosmetics');
      this.updateCosmeticsTable(cosmetics);
      this.showToast('Cosmetics refreshed', 'success');
    } catch (error) {
      this.showToast('Error refreshing cosmetics', 'error');
    }
  }

  async exportPartners() {
    try {
      const partners = await this.fetchAPI('/api/admin/partners');
      this.downloadJSON(partners, 'partners-export.json');
      this.showToast('Partners exported successfully', 'success');
    } catch (error) {
      this.showToast('Error exporting partners', 'error');
    }
  }

  async refreshPartners() {
    try {
      const partners = await this.fetchAPI('/api/admin/partners');
      this.updatePartnersTable(partners);
      this.updatePartnerStats(partners);
      this.showToast('Partners refreshed', 'success');
    } catch (error) {
      this.showToast('Error refreshing partners', 'error');
    }
  }

  async refreshPlayers() {
    try {
      const players = await this.fetchAPI('/api/admin/game/players');
      this.updatePlayersTable(players);
      this.showToast('Players refreshed', 'success');
    } catch (error) {
      this.showToast('Error refreshing players', 'error');
    }
  }

  async refreshUsers() {
    try {
      const users = await this.fetchAPI('/api/admin/users');
      this.updateUsersTable(users);
      this.updateUserStats(users);
      this.showToast('Users refreshed', 'success');
    } catch (error) {
      this.showToast('Error refreshing users', 'error');
    }
  }

  async exportUsers() {
    try {
      const users = await this.fetchAPI('/api/admin/users');
      this.downloadJSON(users, 'users-export.json');
      this.showToast('Users exported successfully', 'success');
    } catch (error) {
      this.showToast('Error exporting users', 'error');
    }
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new EnhancedAdminDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.dashboard) {
    window.dashboard.destroy();
  }
});
