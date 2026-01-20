/**
 * Consolidated Library Manager
 * Merges duplicate LibraryManager files into a single shared utility
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../logger');

const logger = new Logger('libraryManager');

class LibraryManager {
  constructor() {
    this.libraryPath = path.join(__dirname, '../libraries');
    this.cache = new Map(); // Cache for loaded libraries
  }

  /**
   * Load a library file safely
   * @param {string} libraryName - Name of the library to load
   * @returns {Object|null} - Library content or null if failed
   */
  loadLibrary(libraryName) {
    // Check cache first
    if (this.cache.has(libraryName)) {
      return this.cache.get(libraryName);
    }

    try {
      const libraryPath = path.join(this.libraryPath, `${libraryName}.json`);
      
      if (!fs.existsSync(libraryPath)) {
        logger.warn(`Library file not found: ${libraryName}`);
        return null;
      }

      const content = fs.readFileSync(libraryPath, 'utf8');
      const library = JSON.parse(content);
      
      // Cache the loaded library
      this.cache.set(libraryName, library);
      
      logger.info(`Library loaded successfully: ${libraryName}`);
      return library;
      
    } catch (error) {
      logger.error(`Failed to load library: ${libraryName}`, { error: error.message });
      return null;
    }
  }

  /**
   * Save a library file safely
   * @param {string} libraryName - Name of the library
   * @param {Object} data - Library data to save
   * @returns {boolean} - Success status
   */
  saveLibrary(libraryName, data) {
    try {
      const libraryPath = path.join(this.libraryPath, `${libraryName}.json`);
      
      // Ensure library directory exists
      if (!fs.existsSync(this.libraryPath)) {
        fs.mkdirSync(this.libraryPath, { recursive: true });
      }

      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(libraryPath, content, 'utf8');
      
      // Update cache
      this.cache.set(libraryName, data);
      
      logger.info(`Library saved successfully: ${libraryName}`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to save library: ${libraryName}`, { error: error.message });
      return false;
    }
  }

  /**
   * Get all available libraries
   * @returns {string[]} - Array of library names
   */
  getAvailableLibraries() {
    try {
      if (!fs.existsSync(this.libraryPath)) {
        return [];
      }

      const files = fs.readdirSync(this.libraryPath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
        
    } catch (error) {
      logger.error('Failed to get available libraries', { error: error.message });
      return [];
    }
  }

  /**
   * Delete a library file
   * @param {string} libraryName - Name of the library to delete
   * @returns {boolean} - Success status
   */
  deleteLibrary(libraryName) {
    try {
      const libraryPath = path.join(this.libraryPath, `${libraryName}.json`);
      
      if (fs.existsSync(libraryPath)) {
        fs.unlinkSync(libraryPath);
        this.cache.delete(libraryName);
        logger.info(`Library deleted successfully: ${libraryName}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.error(`Failed to delete library: ${libraryName}`, { error: error.message });
      return false;
    }
  }

  /**
   * Validate library structure
   * @param {Object} library - Library data to validate
   * @returns {Object} - Validation result
   */
  validateLibrary(library) {
    const errors = [];
    const warnings = [];

    // Check required structure
    if (!library || typeof library !== 'object') {
      errors.push('Library must be a valid object');
      return { valid: false, errors, warnings };
    }

    // Check for required fields
    if (!library.name || typeof library.name !== 'string') {
      errors.push('Library must have a name field');
    }

    if (!library.version || typeof library.version !== 'string') {
      errors.push('Library must have a version field');
    }

    if (!Array.isArray(library.skills)) {
      errors.push('Library must have a skills array');
    }

    // Check skills structure
    if (library.skills) {
      library.skills.forEach((skill, index) => {
        if (!skill.name || typeof skill.name !== 'string') {
          errors.push(`Skill at index ${index} must have a name`);
        }
        
        if (!skill.code || typeof skill.code !== 'string') {
          errors.push(`Skill ${skill.name} must have code`);
        }
        
        if (skill.code.length > 10000) {
          warnings.push(`Skill ${skill.name} code is very long (${skill.code.length} chars)`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get library statistics
   * @returns {Object} - Statistics about loaded libraries
   */
  getStats() {
    const libraries = this.getAvailableLibraries();
    const loadedLibraries = Array.from(this.cache.keys());
    
    return {
      available: libraries.length,
      loaded: loadedLibraries.length,
      cached: this.cache.size,
      libraryPath: this.libraryPath,
      libraries: libraries.map(name => ({
        name,
        loaded: this.cache.has(name),
        size: this.cache.has(name) ? JSON.stringify(this.cache.get(name)).length : 0
      }))
    };
  }

  /**
   * Clear library cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Library cache cleared');
  }

  /**
   * Search libraries by skill name or code
   * @param {string} query - Search query
   * @returns {Array} - Matching skills
   */
  searchSkills(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [libraryName, library] of this.cache) {
      if (library && library.skills) {
        library.skills.forEach(skill => {
          const nameMatch = skill.name && skill.name.toLowerCase().includes(lowerQuery);
          const codeMatch = skill.code && skill.code.toLowerCase().includes(lowerQuery);
          
          if (nameMatch || codeMatch) {
            results.push({
              library: libraryName,
              skill: skill.name,
              code: skill.code,
              matchType: nameMatch ? 'name' : 'code'
            });
          }
        });
      }
    }

    return results;
  }

  /**
   * Merge two libraries
   * @param {string} targetLibrary - Target library name
   * @param {string} sourceLibrary - Source library name
   * @returns {boolean} - Success status
   */
  mergeLibraries(targetLibrary, sourceLibrary) {
    try {
      const target = this.loadLibrary(targetLibrary);
      const source = this.loadLibrary(sourceLibrary);
      
      if (!target || !source) {
        logger.error('Failed to load libraries for merge');
        return false;
      }

      // Merge skills
      const mergedSkills = [...(target.skills || []), ...(source.skills || [])];
      
      // Remove duplicates based on skill name
      const uniqueSkills = mergedSkills.filter((skill, index, arr) => 
        arr.findIndex(s => s.name === skill.name) === index
      );

      const mergedLibrary = {
        ...target,
        skills: uniqueSkills,
        version: this.incrementVersion(target.version || '1.0.0'),
        merged_at: Date.now(),
        merged_from: sourceLibrary
      };

      const success = this.saveLibrary(targetLibrary, mergedLibrary);
      
      if (success) {
        logger.info(`Libraries merged successfully: ${sourceLibrary} -> ${targetLibrary}`);
      }
      
      return success;
      
    } catch (error) {
      logger.error(`Failed to merge libraries: ${sourceLibrary} -> ${targetLibrary}`, { error: error.message });
      return false;
    }
  }

  /**
   * Increment version number
   * @param {string} version - Current version
   * @returns {string} - Incremented version
   */
  incrementVersion(version) {
    try {
      const parts = version.split('.');
      if (parts.length !== 3) {
        return '1.0.1'; // Default if version format is invalid
      }
      
      parts[2] = (parseInt(parts[2]) + 1).toString();
      return parts.join('.');
      
    } catch (error) {
      logger.error('Failed to increment version', { error: error.message });
      return version;
    }
  }

  /**
   * Export library to file
   * @param {string} libraryName - Library name
   * @param {string} exportPath - Export file path
   * @returns {boolean} - Success status
   */
  exportLibrary(libraryName, exportPath) {
    try {
      const library = this.loadLibrary(libraryName);
      if (!library) {
        logger.error(`Cannot export library: ${libraryName} not found`);
        return false;
      }

      const exportData = {
        ...library,
        exported_at: Date.now(),
        exported_by: 'libraryManager'
      };

      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      logger.info(`Library exported successfully: ${libraryName} -> ${exportPath}`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to export library: ${libraryName}`, { error: error.message });
      return false;
    }
  }
}

// Create singleton instance
const libraryManager = new LibraryManager();

module.exports = {
  LibraryManager,
  libraryManager, // Export singleton instance
  // Convenience methods
  loadLibrary: (name) => libraryManager.loadLibrary(name),
  saveLibrary: (name, data) => libraryManager.saveLibrary(name, data),
  deleteLibrary: (name) => libraryManager.deleteLibrary(name),
  getAvailableLibraries: () => libraryManager.getAvailableLibraries(),
  getStats: () => libraryManager.getStats(),
  searchSkills: (query) => libraryManager.searchSkills(query),
  mergeLibraries: (target, source) => libraryManager.mergeLibraries(target, source),
  exportLibrary: (name, path) => libraryManager.exportLibrary(name, path)
};
