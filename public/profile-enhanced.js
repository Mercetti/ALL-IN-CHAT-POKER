/**
 * Enhanced Profile Page JavaScript
 * Handles profile management, customization, and user interactions
 */

const DEFAULT_AVATAR_SRC = '/logo.png';

class EnhancedProfile {
  constructor() {
    this.currentTab = 'settings';
    this.profileData = {
      username: '',
      displayName: '',
      avatar: '',
      theme: 'dark',
      startingChips: 1000,
      publicProfile: true,
      showLeaderboard: true,
      streamIntegration: true
    };
    this.stats = {
      roundsPlayed: 0,
      roundsWon: 0,
      handsPlayed: 0,
      playtime: 0,
      totalWon: 0,
      biggestWin: 0
    };
    this.achievements = {
      firstWin: false,
      bigWinner: false,
      marathon: false,
      social: false
    };
    this.partnerProgress = {
      streams: 0,
      avgPlayers: 0,
      uniquePlayers: 0,
      rounds: 0
    };
    this.cosmetics = [];
    this.effects = {
      deal: [],
      win: []
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadProfileData();
    this.loadStats();
    this.loadCosmetics();
    this.loadEffects();
    this.generateLinks();
    this.startRealTimeUpdates();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Header navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = e.currentTarget.dataset.page;
        this.navigateToPage(page);
      });
    });

    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProfileSettings();
      });
    }

    // Avatar upload
    const avatarEditBtn = document.querySelector('.avatar-edit-btn');
    if (avatarEditBtn) {
      avatarEditBtn.addEventListener('click', () => {
        this.openAvatarUpload();
      });
    }

    // Settings toggles
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        this.updateSetting(e.target.id, e.target.checked);
      });
    });

    // Premier branding
    const uploadZone = document.querySelector('.upload-zone');
    if (uploadZone) {
      uploadZone.addEventListener('click', () => {
        document.getElementById('premier-logo').click();
      });
      
      uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary-color, #44ffd2)';
      });
      
      uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
      
      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        this.handleLogoUpload(e.dataTransfer.files[0]);
      });
    }

    const logoInput = document.getElementById('premier-logo');
    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        this.handleLogoUpload(e.target.files[0]);
      });
    }

    const generateBtn = document.getElementById('generate-branding-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateAIBranding();
      });
    }

    // Effect previews
    document.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const effect = e.currentTarget.dataset.effect;
        this.previewEffect(effect);
      });
    });

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.copy;
        this.copyToClipboard(target);
      });
    });

    // Quick actions
    document.getElementById('export-profile-btn')?.addEventListener('click', () => {
      this.exportProfileData();
    });

    document.getElementById('reset-session-btn')?.addEventListener('click', () => {
      this.resetSession();
    });

    document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
      this.clearCache();
    });

    document.getElementById('contact-support-btn')?.addEventListener('click', () => {
      this.contactSupport();
    });

    // Profile actions
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
      this.switchTab('settings');
    });

    document.getElementById('share-profile-btn')?.addEventListener('click', () => {
      this.shareProfile();
    });

    // Reset settings
    document.getElementById('reset-settings-btn')?.addEventListener('click', () => {
      this.resetSettings();
    });
  }

  switchTab(tabName) {
    // Update tab pills
    document.querySelectorAll('.tab-pill').forEach(pill => {
      pill.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');

    this.currentTab = tabName;
    
    // Load tab-specific data
    switch(tabName) {
      case 'customize':
        this.loadCustomizationData();
        break;
      case 'progress':
        this.loadProgressData();
        break;
      case 'links':
        this.loadLinksData();
        break;
    }
  }

  navigateToPage(page) {
    const params = new URLSearchParams(window.location.search || '');
    const channel = params.get('channel') || this.profileData.username || '';
    const channelSuffix = channel ? `?channel=${encodeURIComponent(channel)}` : '';
    
    const pageMap = {
      'store': `store-modern.html${channelSuffix}`,
      'editor': `overlay-editor-enhanced.html${channelSuffix}`,
      'profile': `profile-enhanced.html${channelSuffix}`,
      'admin': `admin-enhanced.html${channelSuffix}`,
      'dev': `admin-dev-enhanced.html${channelSuffix}`
    };
    
    if (pageMap[page]) {
      window.location.href = pageMap[page];
    }
  }

  async loadProfileData() {
    try {
      // First, try to get user data from API
      try {
        const token = localStorage.getItem('user_jwt');
        if (token) {
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            // Update profile data with actual user info
            this.profileData.username = userData.login || this.profileData.username;
            this.profileData.displayName = userData.displayName || userData.login || this.profileData.displayName;
            
            // Store user role info for navigation
            this.userData = userData;
            
            // Update navigation based on user role
            this.updateNavigation();
          }
        }
      } catch (apiError) {
        console.warn('Could not fetch user profile from API:', apiError);
      }
      
      // Load from API or localStorage
      const savedData = localStorage.getItem('profileData');
      if (savedData) {
        this.profileData = { ...this.profileData, ...JSON.parse(savedData) };
      }
      
      // Update UI
      this.updateProfileUI();
      this.generateLinks();
    } catch (error) {
      console.error('Error loading profile data:', error);
      this.showToast('Error loading profile data', 'error');
    }
  }

  updateNavigation() {
    const adminBtn = document.querySelector('[data-page="admin"]');
    if (!adminBtn) return;
    
    if (this.userData) {
      const isDevOrOwner = this.userData.isDev || this.userData.isOwner;
      if (isDevOrOwner && !this.userData.isAdmin) {
        // Show Dev button for dev/owner users who aren't admins
        adminBtn.innerHTML = `
          <span class="nav-icon">🔧</span>
          <span>Dev</span>
        `;
        adminBtn.setAttribute('data-page', 'dev');
      } else if (this.userData.isAdmin) {
        // Show Admin button for admin users
        adminBtn.innerHTML = `
          <span class="nav-icon">⚙️</span>
          <span>Admin</span>
        `;
        adminBtn.setAttribute('data-page', 'admin');
      } else {
        // Hide button for regular users
        adminBtn.style.display = 'none';
      }
    }
  }

  updateProfileUI() {
    // Update sidebar profile info
    const displayNameEl = document.getElementById('profile-display-name');
    const usernameEl = document.getElementById('profile-username');
    const avatarEl = document.getElementById('profile-avatar');
    
    if (displayNameEl) displayNameEl.textContent = this.profileData.displayName || 'Player';
    if (usernameEl) usernameEl.textContent = this.profileData.username ? `@${this.profileData.username}` : '@username';
    if (avatarEl) {
      const preferredAvatar = (this.profileData.avatar || '').trim();
      const initialSrc = preferredAvatar || DEFAULT_AVATAR_SRC;
      avatarEl.dataset.fallbackApplied = 'false';
      avatarEl.src = initialSrc;
      avatarEl.onerror = () => {
        if (avatarEl.dataset.fallbackApplied === 'true') return;
        avatarEl.dataset.fallbackApplied = 'true';
        avatarEl.src = DEFAULT_AVATAR_SRC;
      };
    }

    // Update form fields
    const usernameInput = document.getElementById('profile-username');
    const displayNameInput = document.getElementById('profile-display-name-input');
    const themeSelect = document.getElementById('profile-theme');
    const chipsInput = document.getElementById('profile-starting-chips');
    const avatarUrlInput = document.getElementById('profile-avatar-url');
    
    if (usernameInput) usernameInput.value = this.profileData.username || '';
    if (displayNameInput) displayNameInput.value = this.profileData.displayName || '';
    if (themeSelect) themeSelect.value = this.profileData.theme;
    if (chipsInput) chipsInput.value = this.profileData.startingChips;
    if (avatarUrlInput) avatarUrlInput.value = this.profileData.avatar || '';

    // Update settings toggles
    document.getElementById('public-profile').checked = this.profileData.publicProfile;
    document.getElementById('show-leaderboard').checked = this.profileData.showLeaderboard;
    document.getElementById('stream-integration').checked = this.profileData.streamIntegration;

    // Update badges
    this.updateBadges();
  }

  updateBadges() {
    const partnerBadge = document.getElementById('partner-badge');
    const veteranBadge = document.getElementById('veteran-badge');
    
    // Show partner badge if user is partner
    if (this.isPartner()) {
      partnerBadge.style.display = 'inline-block';
    }
    
    // Show veteran badge if playtime > 100 hours
    if (this.stats.playtime > 6000) {
      veteranBadge.style.display = 'inline-block';
    }
  }

  isPartner() {
    // Check if user meets partner requirements
    return this.partnerProgress.streams >= 4 &&
           this.partnerProgress.avgPlayers >= 10 &&
           this.partnerProgress.uniquePlayers >= 5 &&
           this.partnerProgress.rounds >= 20;
  }

  async saveProfileSettings() {
    try {
      // Get form data (excluding username since it comes from API)
      const formData = {
        displayName: document.getElementById('profile-display-name-input').value,
        theme: document.getElementById('profile-theme').value,
        startingChips: parseInt(document.getElementById('profile-starting-chips').value),
        avatar: document.getElementById('profile-avatar-url').value
      };

      // Update profile data
      this.profileData = { ...this.profileData, ...formData };
      
      // Save to localStorage
      localStorage.setItem('profileData', JSON.stringify(this.profileData));
      
      // Update UI
      this.updateProfileUI();
      
      // Show success message
      this.showToast('Profile settings saved successfully!', 'success');
      
      // In a real app, this would save to the backend
      // await this.saveToBackend(formData);
      
    } catch (error) {
      console.error('Error saving profile settings:', error);
      this.showToast('Error saving profile settings', 'error');
    }
  }

  updateSetting(setting, value) {
    this.profileData[setting] = value;
    localStorage.setItem('profileData', JSON.stringify(this.profileData));
    
    // Apply theme change immediately
    if (setting === 'theme') {
      this.applyTheme(value);
    }
    
    this.showToast(`${setting} updated`, 'success');
  }

  applyTheme(theme) {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    // In a real app, this would apply comprehensive theme changes
  }

  openAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      this.handleAvatarUpload(e.target.files[0]);
    };
    input.click();
  }

  handleAvatarUpload(file) {
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      this.showToast('Image must be less than 2MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.profileData.avatar = e.target.result;
      this.updateProfileUI();
      this.saveProfileSettings();
      this.showToast('Avatar updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }

  handleLogoUpload(file) {
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      this.showToast('Logo must be less than 2MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      // Update upload zone preview
      const uploadZone = document.querySelector('.upload-zone');
      uploadZone.innerHTML = `
        <img src="${e.target.result}" alt="Logo preview" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
        <p style="margin-top: 1rem;">Logo uploaded successfully!</p>
      `;
      
      this.showToast('Logo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }

  generateAIBranding() {
    const preset = document.getElementById('premier-preset').value;
    const notes = document.getElementById('premier-notes').value;
    
    this.showToast('Generating AI branding set...', 'info');
    
    // Simulate AI generation
    setTimeout(() => {
      this.showToast('AI branding set generated successfully!', 'success');
      // In a real app, this would call an AI service
    }, 3000);
  }

  async loadStats() {
    try {
      // Load stats from API or localStorage
      const savedStats = localStorage.getItem('profileStats');
      if (savedStats) {
        this.stats = { ...this.stats, ...JSON.parse(savedStats) };
      }
      
      this.updateStatsUI();
      this.updateAchievements();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  updateStatsUI() {
    // Update sidebar stats
    document.getElementById('stat-rounds').textContent = this.stats.roundsPlayed;
    document.getElementById('stat-wins').textContent = this.stats.roundsWon;
    
    const winRate = this.stats.roundsPlayed > 0 
      ? Math.round((this.stats.roundsWon / this.stats.roundsPlayed) * 100)
      : 0;
    document.getElementById('stat-winrate').textContent = `${winRate}%`;
    
    const playtimeHours = Math.floor(this.stats.playtime / 60);
    document.getElementById('stat-playtime').textContent = `${playtimeHours}h`;
  }

  updateAchievements() {
    // Check achievements
    this.achievements.firstWin = this.stats.roundsWon > 0;
    this.achievements.bigWinner = this.stats.biggestWin >= 1000;
    this.achievements.marathon = this.stats.playtime >= 600; // 10 hours
    this.achievements.social = this.stats.uniquePlayers >= 50; // Assuming we track this
    
    // Update achievement UI
    let hasUnlocked = false;
    Object.entries(this.achievements).forEach(([key, unlocked]) => {
      const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
      if (element) {
        element.textContent = unlocked ? '✅' : '🔒';
        element.className = unlocked ? 'achievement-status unlocked' : 'achievement-status locked';
      }
      if (unlocked) hasUnlocked = true;
    });

    const emptyCard = document.getElementById('achievements-empty');
    if (emptyCard) {
      emptyCard.classList.toggle('hidden', hasUnlocked);
    }
  }

  async loadCosmetics() {
    try {
      // Load cosmetics from API
      const response = await fetch('/catalog');
      const cosmetics = await response.json();
      this.cosmetics = cosmetics || [];
      
      this.renderCosmetics();
    } catch (error) {
      console.error('Error loading cosmetics:', error);
      this.renderCosmeticsLoading();
    }
  }

  renderCosmetics() {
    const grid = document.getElementById('cosmetics-grid');
    const emptyCard = document.getElementById('cosmetics-empty');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!Array.isArray(this.cosmetics) || this.cosmetics.length === 0) {
      if (emptyCard) emptyCard.classList.remove('hidden');
      return;
    }
    
    if (emptyCard) emptyCard.classList.add('hidden');
    
    this.cosmetics.forEach(cosmetic => {
      const card = this.createCosmeticCard(cosmetic);
      grid.appendChild(card);
    });
  }

  createCosmeticCard(cosmetic) {
    const card = document.createElement('div');
    card.className = 'cosmetic-card';
    
    const isOwned = this.checkIfOwned(cosmetic.id);
    const isEquipped = this.checkIfEquipped(cosmetic.id);
    
    card.innerHTML = `
      <div class="cosmetic-visual">
        <img src="${cosmetic.preview || '/assets/cosmetics/default.png'}" alt="${cosmetic.name}">
        ${isEquipped ? '<div class="equipped-badge">EQUIPPED</div>' : ''}
        ${isOwned ? '<div class="owned-badge">OWNED</div>' : ''}
      </div>
      <div class="cosmetic-info">
        <h4>${cosmetic.name}</h4>
        <span class="cosmetic-type">${this.getTypeLabel(cosmetic.type)}</span>
        <span class="cosmetic-rarity ${cosmetic.rarity}">${cosmetic.rarity}</span>
      </div>
      <div class="cosmetic-actions">
        ${isOwned ? 
          `<button class="btn ${isEquipped ? 'btn-success' : 'btn-secondary'} btn-sm" 
                  onclick="enhancedProfile.equipCosmetic('${cosmetic.id}')">
            ${isEquipped ? 'Equipped' : 'Equip'}
          </button>` :
          `<button class="btn btn-primary btn-sm" onclick="enhancedProfile.purchaseCosmetic('${cosmetic.id}')">
            ${cosmetic.price ? `$${cosmetic.price}` : 'Free'}
          </button>`
        }
      </div>
    `;
    
    return card;
  }

  checkIfOwned(cosmeticId) {
    // Check if cosmetic is owned (from localStorage or API)
    const ownedCosmetics = JSON.parse(localStorage.getItem('ownedCosmetics') || '[]');
    return ownedCosmetics.includes(cosmeticId);
  }

  checkIfEquipped(cosmeticId) {
    // Check if cosmetic is equipped
    const equippedCosmetics = JSON.parse(localStorage.getItem('equippedCosmetics') || '{}');
    return Object.values(equippedCosmetics).includes(cosmeticId);
  }

  getTypeLabel(type) {
    const labels = {
      cardBack: 'Card Back',
      cardFace: 'Card Face',
      tableSkin: 'Table Skin',
      avatarRing: 'Avatar Ring',
      chipSkin: 'Chip Skin',
      nameplate: 'Nameplate',
      dealFx: 'Deal Effect',
      winFx: 'Win Effect'
    };
    return labels[type] || 'Cosmetic';
  }

  equipCosmetic(cosmeticId) {
    const cosmetic = this.cosmetics.find(c => c.id === cosmeticId);
    if (!cosmetic) return;
    
    // Save equipped cosmetic
    const equippedCosmetics = JSON.parse(localStorage.getItem('equippedCosmetics') || '{}');
    equippedCosmetics[cosmetic.type] = cosmeticId;
    localStorage.setItem('equippedCosmetics', JSON.stringify(equippedCosmetics));
    
    this.showToast(`${cosmetic.name} equipped!`, 'success');
    this.renderCosmetics();
  }

  purchaseCosmetic(cosmeticId) {
    const cosmetic = this.cosmetics.find(c => c.id === cosmeticId);
    if (!cosmetic) return;
    
    // In a real app, this would process payment
    this.showToast(`${cosmetic.name} purchased!`, 'success');
    
    // Add to owned cosmetics
    const ownedCosmetics = JSON.parse(localStorage.getItem('ownedCosmetics') || '[]');
    ownedCosmetics.push(cosmeticId);
    localStorage.setItem('ownedCosmetics', JSON.stringify(ownedCosmetics));
    
    this.renderCosmetics();
  }

  renderCosmeticsLoading() {
    const grid = document.getElementById('cosmetics-grid');
    if (grid) {
      grid.innerHTML = '<div class="cosmetic-loading">Loading cosmetics...</div>';
    }
    document.getElementById('cosmetics-empty')?.classList.add('hidden');
  }

  async loadEffects() {
    try {
      // Load effects from API
      const response = await fetch('/api/effects');
      const effects = await response.json();
      
      this.effects.deal = effects.deal || [];
      this.effects.win = effects.win || [];
      
      this.populateEffectSelectors();
    } catch (error) {
      console.error('Error loading effects:', error);
    }
  }

  populateEffectSelectors() {
    const dealSelect = document.getElementById('deal-fx-select');
    const winSelect = document.getElementById('win-fx-select');
    
    if (dealSelect) {
      dealSelect.innerHTML = '<option value="">None</option>';
      this.effects.deal.forEach(effect => {
        dealSelect.innerHTML += `<option value="${effect.id}">${effect.name}</option>`;
      });
    }
    
    if (winSelect) {
      winSelect.innerHTML = '<option value="">None</option>';
      this.effects.win.forEach(effect => {
        winSelect.innerHTML += `<option value="${effect.id}">${effect.name}</option>`;
      });
    }
  }

  previewEffect(effectType) {
    const select = document.getElementById(`${effectType}-fx-select`);
    const canvas = document.getElementById(`${effectType}-fx-preview`);
    const effectId = select.value;
    
    if (!effectId || !canvas) return;
    
    const effect = this.effects[effectType].find(e => e.id === effectId);
    if (!effect) return;
    
    // Play effect preview on canvas
    this.playEffectPreview(canvas, effect);
    this.showToast(`Previewing ${effect.name}`, 'info');
  }

  playEffectPreview(canvas, effect) {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Simple effect animation (in a real app, this would be more sophisticated)
    let frame = 0;
    const maxFrames = 30;
    
    const animate = () => {
      if (frame >= maxFrames) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw effect frame
      ctx.fillStyle = `hsla(${frame * 12}, 70%, 50%, ${1 - frame / maxFrames})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      frame++;
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  async loadProgressData() {
    try {
      // Load partner progress from API
      const response = await fetch('/api/partner/progress');
      const progress = await response.json();
      
      this.partnerProgress = { ...this.partnerProgress, ...progress };
      this.updateProgressUI();
    } catch (error) {
      console.error('Error loading progress data:', error);
      // Use mock data for demo
      this.updateProgressUI();
    }
  }

  updateProgressUI() {
    const progressItems = [
      { key: 'streams', current: this.partnerProgress.streams, target: 4 },
      { key: 'avgPlayers', current: this.partnerProgress.avgPlayers, target: 10 },
      { key: 'unique', current: this.partnerProgress.uniquePlayers, target: 5 },
      { key: 'rounds', current: this.partnerProgress.rounds, target: 20 }
    ];
    
    let hasProgress = false;
    progressItems.forEach(item => {
      const percentage = Math.min((item.current / item.target) * 100, 100);
      if (item.current > 0) hasProgress = true;
      
      // Update progress bar
      const fill = document.getElementById(`${item.key}-fill`);
      if (fill) fill.style.width = `${percentage}%`;
      
      // Update progress text
      const value = document.getElementById(`${item.key}-progress`);
      if (value) value.textContent = `${item.current}/${item.target}`;
    });
    
    // Update partner status
    const statusEl = document.getElementById('partner-status');
    if (statusEl) {
      if (this.isPartner()) {
        statusEl.textContent = 'Partner Status: Active';
        statusEl.className = 'status-badge partner';
      } else {
        statusEl.textContent = 'In Progress';
        statusEl.className = 'status-badge progress';
      }
    }

    const emptyCard = document.getElementById('progress-empty');
    if (emptyCard) {
      emptyCard.classList.toggle('hidden', hasProgress || this.isPartner());
    }
  }

  generateLinks() {
    const params = new URLSearchParams(window.location.search || '');
    const username = params.get('channel') || this.profileData.username || 'user';
    
    // Generate streaming links
    const baseUrl = window.location.origin;
    
    const links = {
      overlay: `${baseUrl}/obs-overlay.html?channel=${encodeURIComponent(username)}`,
      admin: `${baseUrl}/admin-enhanced.html?channel=${encodeURIComponent(username)}`,
      leaderboard: `${baseUrl}/leaderboard-overlay.html?channel=${encodeURIComponent(username)}`
    };
    
    const showDevLink = !!(this.userData && (this.userData.isDev || this.userData.isOwner || this.userData.isAdmin));
    const devLinkItem = document.getElementById('dev-link-item');
    if (showDevLink) {
      links.dev = `${baseUrl}/admin-dev-enhanced.html?channel=${encodeURIComponent(username)}`;
      if (devLinkItem) devLinkItem.style.display = 'flex';
    } else if (devLinkItem) {
      devLinkItem.style.display = 'none';
    }
    
    // Update link elements
    Object.entries(links).forEach(([key, url]) => {
      const element = document.getElementById(`${key}-url`);
      if (element) {
        element.textContent = url;
        element.href = url;
      }
    });

    const storeLink = document.getElementById('cosmetics-shop-link');
    if (storeLink) {
      storeLink.href = `store-modern.html?channel=${encodeURIComponent(username)}`;
    }
  }

  loadLinksData() {
    this.generateLinks();
  }

  copyToClipboard(targetId) {
    const element = document.getElementById(targetId);
    if (!element) return;
    
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.showToast('Link copied to clipboard!', 'success');
    });
  }

  exportProfileData() {
    const data = {
      profile: this.profileData,
      stats: this.stats,
      achievements: this.achievements,
      partnerProgress: this.partnerProgress,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-data-${this.profileData.username || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showToast('Profile data exported successfully!', 'success');
  }

  resetSession() {
    if (confirm('Are you sure you want to reset your session? This will log you out.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  }

  clearCache() {
    if (confirm('Are you sure you want to clear all cached data?')) {
      // Clear application cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      // Clear localStorage except for essential data
      const essentialKeys = ['profileData', 'user_jwt'];
      const allData = {};
      essentialKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) allData[key] = value;
      });
      
      localStorage.clear();
      
      // Restore essential data
      Object.entries(allData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      this.showToast('Cache cleared successfully!', 'success');
    }
  }

  contactSupport() {
    const subject = encodeURIComponent('Support Request - All-In Chat Poker');
    const body = encodeURIComponent(`Username: ${this.profileData.username || 'N/A'}
Display Name: ${this.profileData.displayName || 'N/A'}

Please describe your issue or question:`);
    
    window.open(`mailto:allinchatpoker@gmail.com?subject=${subject}&body=${body}`);
  }

  shareProfile() {
    const shareData = {
      title: 'All-In Chat Poker Profile',
      text: `Check out my poker profile! I've played ${this.stats.roundsPlayed} rounds and won ${this.stats.roundsWon} times.`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      this.copyToClipboard('overlay-url');
      this.showToast('Profile link copied to clipboard!', 'success');
    }
  }

  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to default values
      this.profileData = {
        username: this.profileData.username, // Keep username
        displayName: '',
        avatar: '',
        theme: 'dark',
        startingChips: 1000,
        publicProfile: true,
        showLeaderboard: true,
        streamIntegration: true
      };
      
      localStorage.setItem('profileData', JSON.stringify(this.profileData));
      this.updateProfileUI();
      this.showToast('Settings reset to defaults', 'success');
    }
  }

  loadCustomizationData() {
    // Load customization-specific data
    this.loadCosmetics();
    this.loadEffects();
  }

  startRealTimeUpdates() {
    // Update stats every 30 seconds
    setInterval(() => {
      this.loadStats();
    }, 30000);
    
    // Update partner progress every 5 minutes
    setInterval(() => {
      if (this.currentTab === 'progress') {
        this.loadProgressData();
      }
    }, 300000);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
}

// Initialize the enhanced profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedProfile = new EnhancedProfile();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.enhancedProfile) {
    // Refresh data when page becomes visible
    window.enhancedProfile.loadStats();
    if (window.enhancedProfile.currentTab === 'progress') {
      window.enhancedProfile.loadProgressData();
    }
  }
});

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
