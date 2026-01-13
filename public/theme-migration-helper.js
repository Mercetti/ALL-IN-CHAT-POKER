/**
 * Theme Migration Helper
 * Helps migrate from legacy theme systems to the unified theme manager
 */

class ThemeMigrationHelper {
  constructor() {
    this.legacyKeys = [
      'theme',
      'app_theme', 
      'theme-preference',
      'theme-auto-mode',
      'theme_usage'
    ];
    
    this.unifiedKey = 'poker_theme_settings';
  }

  checkMigrationNeeded() {
    // Check if any legacy keys exist
    return this.legacyKeys.some(key => localStorage.getItem(key) !== null);
  }

  performMigration() {
    const migrationData = {
      fromLegacy: {},
      toUnified: {},
      errors: []
    };

    try {
      // Collect legacy data
      this.legacyKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          migrationData.fromLegacy[key] = value;
        }
      });

      // Create unified config
      const unifiedConfig = this.createUnifiedConfig(migrationData.fromLegacy);
      
      // Save unified config
      localStorage.setItem(this.unifiedKey, JSON.stringify(unifiedConfig));
      migrationData.toUnified = unifiedConfig;

      // Clean up legacy keys
      this.cleanupLegacyKeys();
      
      return migrationData;
    } catch (error) {
      migrationData.errors.push(error.message);
      return migrationData;
    }
  }

  createUnifiedConfig(legacyData) {
    const config = {
      currentTheme: 'dark',
      autoMode: false,
      systemPreference: null,
      usage: {},
      customThemes: {},
      migratedAt: new Date().toISOString()
    };

    // Determine current theme
    const themeKeys = ['theme', 'app_theme', 'theme-preference'];
    for (const key of themeKeys) {
      if (legacyData[key] && ['dark', 'light', 'neon', 'retro'].includes(legacyData[key])) {
        config.currentTheme = legacyData[key];
        break;
      }
    }

    // Set auto mode
    if (legacyData['theme-auto-mode']) {
      config.autoMode = legacyData['theme-auto-mode'] === 'true';
    }

    // Migrate usage data
    if (legacyData['theme_usage']) {
      try {
        config.usage = JSON.parse(legacyData['theme_usage']);
      } catch (error) {
        console.warn('Failed to parse theme usage data:', error);
      }
    }

    return config;
  }

  cleanupLegacyKeys() {
    this.legacyKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  showMigrationDialog() {
    // Create migration dialog
    const dialog = document.createElement('div');
    dialog.id = 'theme-migration-dialog';
    dialog.innerHTML = `
      <div class="migration-backdrop"></div>
      <div class="migration-content">
        <div class="migration-header">
          <h3>🎨 Theme System Update</h3>
          <p>We've updated our theme system for better performance and consistency.</p>
        </div>
        <div class="migration-body">
          <p>Your current theme settings will be automatically migrated to the new system.</p>
          <div class="migration-details">
            <h4>What's being migrated:</h4>
            <ul>
              <li>✅ Your current theme preference</li>
              <li>✅ Auto-mode settings</li>
              <li>✅ Theme usage statistics</li>
            </ul>
          </div>
        </div>
        <div class="migration-footer">
          <button id="migrate-now" class="btn btn-primary">Migrate Now</button>
          <button id="migrate-later" class="btn btn-secondary">Later</button>
        </div>
      </div>
    `;

    // Add styles
    const styles = `
      #theme-migration-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .migration-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
      }
      
      .migration-content {
        position: relative;
        background: var(--bg-primary, #ffffff);
        border: 1px solid var(--glass-border, rgba(0, 0, 0, 0.1));
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.2));
      }
      
      .migration-header h3 {
        margin: 0 0 8px 0;
        color: var(--text-primary, #1a1f2c);
      }
      
      .migration-header p {
        margin: 0 0 16px 0;
        color: var(--text-secondary, #6b7280);
      }
      
      .migration-body {
        margin-bottom: 20px;
      }
      
      .migration-details {
        margin-top: 16px;
        padding: 12px;
        background: var(--bg-secondary, #f8f9fa);
        border-radius: 8px;
      }
      
      .migration-details h4 {
        margin: 0 0 8px 0;
        color: var(--text-primary, #1a1f2c);
        font-size: 14px;
      }
      
      .migration-details ul {
        margin: 0;
        padding-left: 20px;
        color: var(--text-secondary, #6b7280);
      }
      
      .migration-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .btn-primary {
        background: var(--primary-color, #0066cc);
        color: white;
      }
      
      .btn-primary:hover {
        opacity: 0.9;
      }
      
      .btn-secondary {
        background: var(--bg-secondary, #f8f9fa);
        color: var(--text-primary, #1a1f2c);
        border: 1px solid var(--glass-border, rgba(0, 0, 0, 0.1));
      }
      
      .btn-secondary:hover {
        background: var(--bg-tertiary, #e9ecef);
      }
    `;

    // Add styles to head
    if (!document.getElementById('migration-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'migration-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    // Add event listeners
    dialog.querySelector('#migrate-now').addEventListener('click', () => {
      const result = this.performMigration();
      console.log('Theme migration completed:', result);
      dialog.remove();
      
      // Show success message
      this.showSuccessMessage();
    });

    dialog.querySelector('#migrate-later').addEventListener('click', () => {
      dialog.remove();
      // Schedule migration for next page load
      localStorage.setItem('theme_migration_pending', 'true');
    });

    // Add to page
    document.body.appendChild(dialog);
  }

  showSuccessMessage() {
    const toast = document.createElement('div');
    toast.className = 'theme-migration-toast';
    toast.innerHTML = '✅ Theme system updated successfully!';
    
    const toastStyles = `
      .theme-migration-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--success-color, #22c55e);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.2));
        z-index: 10001;
        animation: slideInRight 0.3s ease-out;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    
    if (!document.getElementById('migration-toast-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'migration-toast-styles';
      styleSheet.textContent = toastStyles;
      document.head.appendChild(styleSheet);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Auto-migrate on page load if needed
  autoMigrate() {
    if (this.checkMigrationNeeded()) {
      // Check if user previously chose "later"
      if (localStorage.getItem('theme_migration_pending') === 'true') {
        // Auto-migrate now
        this.performMigration();
        localStorage.removeItem('theme_migration_pending');
      } else {
        // Show migration dialog
        setTimeout(() => this.showMigrationDialog(), 1000);
      }
    }
  }
}

// Auto-initialize
const migrationHelper = new ThemeMigrationHelper();

// Run migration check after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => migrationHelper.autoMigrate());
} else {
  migrationHelper.autoMigrate();
}

// Export for manual use
window.themeMigrationHelper = migrationHelper;

export default migrationHelper;
