/**
 * User Management Module
 * Admin user management and permissions
 */

window.AdminModules = window.AdminModules || {};

window.AdminModules['user-management'] = {
  name: 'User Management',
  version: '1.0.0',
  
  state: {
    users: [],
    selectedUser: null,
    filters: {
      status: '',
      role: '',
      search: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    },
    loading: false,
    editingUser: null
  },

  async loadContent() {
    return `
      <div class="user-management-section">
        <div class="section-header">
          <h2>User Management</h2>
          <div class="header-actions">
            <button class="btn btn-primary" onclick="AdminModules['user-management'].showAddUserModal()">
              <i class="icon-plus"></i> Add User
            </button>
            <button class="btn btn-secondary" onclick="AdminModules['user-management'].exportUsers()">
              <i class="icon-download"></i> Export
            </button>
          </div>
        </div>

        <div class="user-filters">
          <div class="filter-group">
            <input type="text" 
                   id="user-search" 
                   placeholder="Search users..." 
                   onkeyup="AdminModules['user-management'].handleSearch(event)">
          </div>
          <div class="filter-group">
            <select id="status-filter" onchange="AdminModules['user-management'].handleFilterChange()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div class="filter-group">
            <select id="role-filter" onchange="AdminModules['user-management'].handleFilterChange()">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th onclick="AdminModules['user-management'].sortUsers('username')">
                  Username <i class="icon-sort"></i>
                </th>
                <th onclick="AdminModules['user-management'].sortUsers('email')">
                  Email <i class="icon-sort"></i>
                </th>
                <th onclick="AdminModules['user-management'].sortUsers('role')">
                  Role <i class="icon-sort"></i>
                </th>
                <th onclick="AdminModules['user-management'].sortUsers('status')">
                  Status <i class="icon-sort"></i>
                </th>
                <th onclick="AdminModules['user-management'].sortUsers('lastLogin')">
                  Last Login <i class="icon-sort"></i>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              ${this.renderUsersTable()}
            </tbody>
          </table>
        </div>

        <div class="pagination-container">
          ${this.renderPagination()}
        </div>
      </div>
    `;
  },

  init() {
    this.loadUsers();
    this.setupEventListeners();
  },

  renderUsersTable() {
    if (this.state.loading) {
      return '<tr><td colspan="6" class="loading-row">Loading users...</td></tr>';
    }

    if (this.state.users.length === 0) {
      return '<tr><td colspan="6" class="no-data">No users found</td></tr>';
    }

    return this.state.users.map(user => `
      <tr class="user-row" data-user-id="${user.id}">
        <td class="user-info">
          <div class="user-avatar">
            <img src="${user.avatar || '/assets/default-avatar.png'}" alt="${user.username}">
          </div>
          <div class="user-details">
            <div class="username">${user.username}</div>
            <div class="user-id">ID: ${user.id}</div>
          </div>
        </td>
        <td class="email">${user.email}</td>
        <td class="role">
          <span class="role-badge role-${user.role}">${user.role}</span>
        </td>
        <td class="status">
          <span class="status-badge status-${user.status}">${user.status}</span>
        </td>
        <td class="last-login">
          ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </td>
        <td class="actions">
          <div class="action-buttons">
            <button class="btn btn-sm btn-icon" 
                    onclick="AdminModules['user-management'].editUser('${user.id}')"
                    title="Edit User">
              <i class="icon-edit"></i>
            </button>
            <button class="btn btn-sm btn-icon" 
                    onclick="AdminModules['user-management'].viewUserDetails('${user.id}')"
                    title="View Details">
              <i class="icon-eye"></i>
            </button>
            <button class="btn btn-sm btn-icon" 
                    onclick="AdminModules['user-management'].toggleUserStatus('${user.id}')"
                    title="Toggle Status">
              <i class="icon-toggle"></i>
            </button>
            <button class="btn btn-sm btn-icon btn-danger" 
                    onclick="AdminModules['user-management'].deleteUser('${user.id}')"
                    title="Delete User">
              <i class="icon-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderPagination() {
    const { page, limit, total } = this.state.pagination;
    const totalPages = Math.ceil(total / limit);
    
    if (totalPages <= 1) return '';

    let pagination = '<div class="pagination">';
    
    // Previous button
    pagination += `
      <button class="pagination-btn" 
              onclick="AdminModules['user-management'].goToPage(${page - 1})"
              ${page === 1 ? 'disabled' : ''}>
        <i class="icon-chevron-left"></i>
      </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pagination += `
        <button class="pagination-btn ${i === page ? 'active' : ''}" 
                onclick="AdminModules['user-management'].goToPage(${i})">
          ${i}
        </button>
      `;
    }
    
    // Next button
    pagination += `
      <button class="pagination-btn" 
              onclick="AdminModules['user-management'].goToPage(${page + 1})"
              ${page === totalPages ? 'disabled' : ''}>
        <i class="icon-chevron-right"></i>
      </button>
    `;
    
    pagination += '</div>';
    
    return pagination;
  },

  setupEventListeners() {
    // Listen for user updates
    window.addEventListener('userUpdate', (e) => {
      this.handleUserUpdate(e.detail);
    });
  },

  async loadUsers() {
    this.state.loading = true;
    this.updateUI();

    try {
      const params = new URLSearchParams({
        page: this.state.pagination.page,
        limit: this.state.pagination.limit,
        ...this.state.filters
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      this.state.users = data.users;
      this.state.pagination.total = data.total;
      
    } catch (error) {
      console.error('Failed to load users:', error);
      this.showNotification('Failed to load users', 'error');
    } finally {
      this.state.loading = false;
      this.updateUI();
    }
  },

  async loadUser(userId) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Failed to load user:', error);
      return null;
    }
  },

  handleSearch(event) {
    if (event.key === 'Enter') {
      this.state.filters.search = event.target.value;
      this.state.pagination.page = 1;
      this.loadUsers();
    }
  },

  handleFilterChange() {
    this.state.filters.status = document.getElementById('status-filter').value;
    this.state.filters.role = document.getElementById('role-filter').value;
    this.state.pagination.page = 1;
    this.loadUsers();
  },

  sortUsers(field) {
    this.state.users.sort((a, b) => {
      if (a[field] < b[field]) return -1;
      if (a[field] > b[field]) return 1;
      return 0;
    });
    this.updateUI();
  },

  goToPage(page) {
    if (page < 1 || page > Math.ceil(this.state.pagination.total / this.state.pagination.limit)) {
      return;
    }
    
    this.state.pagination.page = page;
    this.loadUsers();
  },

  showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New User</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="add-user-form" onsubmit="AdminModules['user-management'].handleAddUser(event)">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required>
            </div>
            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" name="role" required>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" name="status" required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Add User</button>
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  async handleAddUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('User added successfully', 'success');
        this.loadUsers();
        event.target.closest('.modal').remove();
      } else {
        this.showNotification(result.message || 'Failed to add user', 'error');
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      this.showNotification('Failed to add user', 'error');
    }
  },

  async editUser(userId) {
    const user = await this.loadUser(userId);
    if (!user) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit User</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="edit-user-form" onsubmit="AdminModules['user-management'].handleEditUser(event, '${userId}')">
            <div class="form-group">
              <label for="edit-username">Username</label>
              <input type="text" id="edit-username" name="username" value="${user.username}" required>
            </div>
            <div class="form-group">
              <label for="edit-email">Email</label>
              <input type="email" id="edit-email" name="email" value="${user.email}" required>
            </div>
            <div class="form-group">
              <label for="edit-role">Role</label>
              <select id="edit-role" name="role" required>
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-status">Status</label>
              <select id="edit-status" name="status" required>
                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>Banned</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-password">New Password (leave blank to keep current)</label>
              <input type="password" id="edit-password" name="password">
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Update User</button>
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  async handleEditUser(event, userId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData);
    
    // Remove empty password
    if (!userData.password) {
      delete userData.password;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('User updated successfully', 'success');
        this.loadUsers();
        event.target.closest('.modal').remove();
      } else {
        this.showNotification(result.message || 'Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      this.showNotification('Failed to update user', 'error');
    }
  },

  async viewUserDetails(userId) {
    const user = await this.loadUser(userId);
    if (!user) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>User Details</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="user-details-view">
            <div class="user-profile">
              <div class="user-avatar-large">
                <img src="${user.avatar || '/assets/default-avatar.png'}" alt="${user.username}">
              </div>
              <h4>${user.username}</h4>
              <p class="user-id">ID: ${user.id}</p>
            </div>
            
            <div class="user-info-grid">
              <div class="info-item">
                <label>Email</label>
                <span>${user.email}</span>
              </div>
              <div class="info-item">
                <label>Role</label>
                <span class="role-badge role-${user.role}">${user.role}</span>
              </div>
              <div class="info-item">
                <label>Status</label>
                <span class="status-badge status-${user.status}">${user.status}</span>
              </div>
              <div class="info-item">
                <label>Created</label>
                <span>${new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div class="info-item">
                <label>Last Login</label>
                <span>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</span>
              </div>
              <div class="info-item">
                <label>Total Games</label>
                <span>${user.totalGames || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  async toggleUserStatus(userId) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
        this.loadUsers();
      } else {
        this.showNotification(result.message || 'Failed to update user status', 'error');
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      this.showNotification('Failed to update user status', 'error');
    }
  },

  async deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('User deleted successfully', 'success');
        this.loadUsers();
      } else {
        this.showNotification(result.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      this.showNotification('Failed to delete user', 'error');
    }
  },

  async exportUsers() {
    try {
      const response = await fetch('/api/admin/users/export');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.showNotification('Users exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export users:', error);
      this.showNotification('Failed to export users', 'error');
    }
  },

  handleUserUpdate(data) {
    const { userId, updates } = data;
    
    const userIndex = this.state.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.state.users[userIndex] = { ...this.state.users[userIndex], ...updates };
      this.updateUI();
    }
  },

  updateUI() {
    const tbody = document.getElementById('users-tbody');
    if (tbody) {
      tbody.innerHTML = this.renderUsersTable();
    }
    
    const paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
      paginationContainer.innerHTML = this.renderPagination();
    }
  },

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
};
