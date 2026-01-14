/**
 * Secure Token Storage with Encryption
 * Implements encrypted storage for authentication tokens and sensitive data
 */

class SecureTokenStorage {
  constructor(options = {}) {
    this.options = {
      encryptionKey: options.encryptionKey || this.generateEncryptionKey(),
      storageType: options.storageType || 'localStorage', // localStorage or sessionStorage
      tokenExpiry: options.tokenExpiry || 24 * 60 * 60 * 1000, // 24 hours
      enableRotation: options.enableRotation !== false,
      ...options
    };
    
    this.encryptionKey = this.options.encryptionKey;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    // Check for Web Crypto API support
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('Web Crypto API not available, falling back to obfuscation');
      this.useEncryption = false;
    } else {
      this.useEncryption = true;
    }
    
    this.isInitialized = true;
  }

  generateEncryptionKey() {
    // Generate a random key for encryption
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async encrypt(data) {
    if (!this.useEncryption) {
      return btoa(data); // Simple base64 encoding as fallback
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Import key
      const keyBuffer = new Uint8Array(this.encryptionKey.match(/.{2}/g).map(byte => parseInt(byte, 16)));
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Encrypt data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return btoa(data); // Fallback to base64
    }
  }

  async decrypt(encryptedData) {
    if (!this.useEncryption) {
      return atob(encryptedData); // Simple base64 decoding as fallback
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);
      
      // Import key
      const keyBuffer = new Uint8Array(this.encryptionKey.match(/.{2}/g).map(byte => parseInt(byte, 16)));
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Decrypt data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encryptedBuffer
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      return atob(encryptedData); // Fallback to base64
    }
  }

  getStorage() {
    return this.options.storageType === 'sessionStorage' ? 
      window.sessionStorage : window.localStorage;
  }

  async setToken(token, metadata = {}) {
    try {
      const storage = this.getStorage();
      const tokenData = {
        token,
        metadata,
        timestamp: Date.now(),
        expires: Date.now() + this.options.tokenExpiry
      };
      
      const encryptedData = await this.encrypt(JSON.stringify(tokenData));
      storage.setItem('authToken', encryptedData);
      
      if (this.options.enableRotation) {
        // Store backup token for rotation
        const backupData = await this.encrypt(JSON.stringify({
          ...tokenData,
          isBackup: true
        }));
        storage.setItem('authTokenBackup', backupData);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to set token:', error);
      return false;
    }
  }

  async getToken() {
    try {
      const storage = this.getStorage();
      const encryptedData = storage.getItem('authToken');
      
      if (!encryptedData) {
        return null;
      }
      
      const tokenData = JSON.parse(await this.decrypt(encryptedData));
      
      // Check if token is expired
      if (Date.now() > tokenData.expires) {
        this.removeToken();
        return null;
      }
      
      return tokenData;
    } catch (error) {
      console.error('Failed to get token:', error);
      
      // Try backup token if available
      if (this.options.enableRotation) {
        return this.getBackupToken();
      }
      
      return null;
    }
  }

  async getBackupToken() {
    try {
      const storage = this.getStorage();
      const encryptedData = storage.getItem('authTokenBackup');
      
      if (!encryptedData) {
        return null;
      }
      
      const tokenData = JSON.parse(await this.decrypt(encryptedData));
      
      // Check if backup token is expired
      if (Date.now() > tokenData.expires) {
        storage.removeItem('authTokenBackup');
        return null;
      }
      
      // Restore from backup
      await this.setToken(tokenData.token, tokenData.metadata);
      return tokenData;
    } catch (error) {
      console.error('Failed to get backup token:', error);
      return null;
    }
  }

  removeToken() {
    const storage = this.getStorage();
    storage.removeItem('authToken');
    storage.removeItem('authTokenBackup');
  }

  async setSecureData(key, data, expiry = null) {
    try {
      const storage = this.getStorage();
      const secureData = {
        data,
        timestamp: Date.now(),
        expires: expiry || (Date.now() + this.options.tokenExpiry)
      };
      
      const encryptedData = await this.encrypt(JSON.stringify(secureData));
      storage.setItem(`secure_${key}`, encryptedData);
      
      return true;
    } catch (error) {
      console.error(`Failed to set secure data for ${key}:`, error);
      return false;
    }
  }

  async getSecureData(key) {
    try {
      const storage = this.getStorage();
      const encryptedData = storage.getItem(`secure_${key}`);
      
      if (!encryptedData) {
        return null;
      }
      
      const secureData = JSON.parse(await this.decrypt(encryptedData));
      
      // Check if data is expired
      if (Date.now() > secureData.expires) {
        storage.removeItem(`secure_${key}`);
        return null;
      }
      
      return secureData.data;
    } catch (error) {
      console.error(`Failed to get secure data for ${key}:`, error);
      return null;
    }
  }

  removeSecureData(key) {
    const storage = this.getStorage();
    storage.removeItem(`secure_${key}`);
  }

  async rotateToken(newToken, metadata = {}) {
    if (!this.options.enableRotation) {
      return await this.setToken(newToken, metadata);
    }
    
    try {
      // Get current token
      const currentToken = await this.getToken();
      if (currentToken) {
        // Move current token to backup
        const storage = this.getStorage();
        const backupData = await this.encrypt(JSON.stringify({
          ...currentToken,
          isBackup: true
        }));
        storage.setItem('authTokenBackup', backupData);
      }
      
      // Set new token
      return await this.setToken(newToken, metadata);
    } catch (error) {
      console.error('Failed to rotate token:', error);
      return false;
    }
  }

  isTokenValid() {
    return this.getToken().then(tokenData => {
      return tokenData !== null;
    });
  }

  getTokenMetadata() {
    return this.getToken().then(tokenData => {
      return tokenData ? tokenData.metadata : null;
    });
  }

  clearAllSecureData() {
    const storage = this.getStorage();
    const keys = Object.keys(storage);
    
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        storage.removeItem(key);
      }
    });
    
    this.removeToken();
  }

  // Utility methods
  generateSecureId() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  hashData(data) {
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
      .then(hash => Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join(''));
  }
}

// Create global instance
window.secureTokenStorage = new SecureTokenStorage({
  encryptionKey: localStorage.getItem('encryptionKey') || undefined,
  storageType: 'localStorage',
  tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  enableRotation: true
});

// Save encryption key if newly generated
if (!localStorage.getItem('encryptionKey')) {
  localStorage.setItem('encryptionKey', window.secureTokenStorage.encryptionKey);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecureTokenStorage;
}
