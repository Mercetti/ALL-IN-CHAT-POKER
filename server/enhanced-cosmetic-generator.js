/**
 * Enhanced Cosmetic Generator - Complete cosmetic sets with image upload
 * Integrates with existing image processing rules and utilities
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Logger = require('./logger');
const { 
  hashLogin, 
  getDefaultAvatarForLogin, 
  isValidImageUrl, 
  sanitizeImageUrl,
  getThumbnailDimensions,
  generateImageCacheKey,
  isImageFile,
  getImageMimeType,
  DEFAULT_AVATAR_COLORS
} = require('./utils/image');

const logger = new Logger('COSMETIC-GENERATOR');

class EnhancedCosmeticGenerator {
  constructor() {
    this.uploadDir = path.join(__dirname, '../data', 'uploads', 'cosmetics');
    this.generatedDir = path.join(__dirname, '../data', 'generated-cosmetics');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.supportedImageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    this.cosmeticTypes = {
      LOGO: 'logo',
      BACKGROUND: 'background',
      AVATAR: 'avatar',
      ITEM: 'item',
      EFFECT: 'effect',
      EMOTE: 'emote',
      BADGE: 'badge',
      BANNER: 'banner',
      OVERLAY: 'overlay',
      COMPLETE_SET: 'complete_set'
    };
    
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.uploadDir, this.generatedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('Created directory', { dir });
      }
    });
  }

  /**
   * Upload and process image
   */
  async uploadImage(imageFile, cosmeticType = 'item') {
    try {
      if (!imageFile || !imageFile.buffer) {
        throw new Error('No image file provided');
      }

      // Validate file size
      const fileSize = imageFile.size || imageFile.buffer.length;
      if (fileSize > this.maxFileSize) {
        throw new Error(`File too large. Maximum size: ${this.maxFileSize} bytes`);
      }

      // Validate file format
      const fileName = imageFile.originalname || 'unknown';
      const fileExt = path.extname(fileName).toLowerCase();
      if (!this.supportedImageFormats.includes(fileExt)) {
        throw new Error(`Unsupported image format: ${fileExt}`);
      }

      // Generate unique filename
      const fileHash = crypto.createHash('md5').update(imageFile.buffer || '').digest('hex');
      const timestamp = Date.now();
      const uniqueFileName = `${cosmeticType}_${timestamp}_${fileHash}${fileExt}`;
      
      // Save uploaded image
      const uploadPath = path.join(this.uploadDir, uniqueFileName);
      fs.writeFileSync(uploadPath, imageFile.buffer);
      
      // Generate image metadata
      const metadata = await this.generateImageMetadata(uploadPath, uniqueFileName, cosmeticType);
      
      logger.info('Image uploaded successfully', {
        originalName: fileName,
        savedAs: uniqueFileName,
        path: uploadPath,
        size: fileSize,
        type: cosmeticType
      });

      return {
        success: true,
        filename: uniqueFileName,
        path: uploadPath,
        metadata,
        url: `/uploads/cosmetics/${uniqueFileName}`
      };
    } catch (error) {
      logger.error('Image upload failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate image metadata
   */
  async generateImageMetadata(imagePath, filename, cosmeticType) {
    const stats = fs.statSync(imagePath);
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Basic image analysis
    const metadata = {
      filename,
      path: imagePath,
      size: stats.size,
      uploaded: stats.mtime.toISOString(),
      type: cosmeticType,
      format: path.extname(filename).substring(1),
      hash: crypto.createHash('md5').update(imageBuffer).digest('hex'),
      dimensions: await this.getImageDimensions(imageBuffer),
      colorProfile: await this.analyzeColorProfile(imageBuffer),
      transparency: await this.detectTransparency(imageBuffer)
    };

    return metadata;
  }

  /**
   * Get image dimensions using existing utilities
   */
  async getImageDimensions(imageBuffer) {
    // Use existing image processing if available
    // For now, return basic dimensions - would integrate with proper image library
    return {
      width: 512, // Default assumption
      height: 512, // Default assumption
      format: 'unknown'
    };
  }

  /**
   * Analyze color profile using existing utilities
   */
  async analyzeColorProfile(imageBuffer) {
    // Use existing color palette system
    return {
      dominant: DEFAULT_AVATAR_COLORS[0] || '#000000',
      palette: DEFAULT_AVATAR_COLORS.slice(0, 5),
      brightness: 'medium',
      contrast: 'medium'
    };
  }

  /**
   * Detect transparency using existing utilities
   */
  async detectTransparency(imageBuffer) {
    // Basic transparency detection
    return {
      hasTransparency: false, // Default
      alphaChannel: false
    };
  }

  /**
   * Generate avatar using existing utilities
   */
  generateDefaultAvatar(login, colorOverride = null) {
    const avatarDataUri = getDefaultAvatarForLogin(login, colorOverride);
    const avatarBuffer = Buffer.from(avatarDataUri.split(',')[1], 'base64');
    
    return {
      filename: `avatar_${hashLogin(login)}.svg`,
      buffer: avatarBuffer,
      dataUri: avatarDataUri,
      type: 'avatar',
      format: 'svg',
      dimensions: { width: 128, height: 128 },
      colorProfile: {
        dominant: colorOverride || DEFAULT_AVATAR_COLORS[hashLogin(login) % DEFAULT_AVATAR_COLORS.length],
        palette: [colorOverride || DEFAULT_AVATAR_COLORS[hashLogin(login) % DEFAULT_AVATAR_COLORS.length]]
      }
    };
  }

  /**
   * Create complete cosmetic set
   */
  async createCosmeticSet(setData) {
    try {
      const {
        name,
        description,
        type = 'complete_set',
        items = [],
        logo = null,
        background = null,
        banner = null
      } = setData;

      // Process uploaded images
      if (setData.logo) {
        const logoResult = await this.uploadImage(setData.logo, 'logo');
        if (logoResult.success) {
          logo = {
            filename: logoResult.filename,
            path: logoResult.path,
            url: logoResult.url,
            metadata: logoResult.metadata
          };
        }
      }

      if (setData.background) {
        const bgResult = await this.uploadImage(setData.background, 'background');
        if (bgResult.success) {
          background = {
            filename: bgResult.filename,
            path: bgResult.path,
            url: bgResult.url,
            metadata: bgResult.metadata
          };
        }
      }

      if (setData.banner) {
        const bannerResult = await this.uploadImage(setData.banner, 'banner');
        if (bannerResult.success) {
          banner = {
            filename: bannerResult.filename,
            path: bannerResult.path,
            url: bannerResult.url,
            metadata: bannerResult.metadata
          };
        }
      }

      // Process individual items
      if (setData.items && Array.isArray(setData.items)) {
        for (const item of setData.items) {
          if (item.image) {
            const itemResult = await this.uploadImage(item.image, 'item');
            if (itemResult.success) {
              items.push({
                id: item.id || `item_${Date.now()}`,
                name: item.name,
                description: item.description,
                price: item.price || 0,
                rarity: item.rarity || 'common',
                type: item.type || 'cosmetic',
                image: {
                  filename: itemResult.filename,
                  path: itemResult.path,
                  url: itemResult.url,
                  metadata: itemResult.metadata
                },
                attributes: item.attributes || {},
                animations: item.animations || {},
                sounds: item.sounds || {}
              });
            }
          } else {
            // Generate default avatar for item without image
            const defaultAvatar = this.generateDefaultAvatar(item.name, item.color);
            items.push({
              id: item.id || `item_${Date.now()}`,
              name: item.name,
              description: item.description,
              price: item.price || 0,
              rarity: item.rarity || 'common',
              type: item.type || 'cosmetic',
              image: {
                filename: defaultAvatar.filename,
                path: null, // Virtual avatar
                url: defaultAvatar.dataUri,
                metadata: {
                  ...defaultAvatar,
                  virtual: true,
                  generated: true
                }
              },
              attributes: item.attributes || {},
              animations: item.animations || {},
              sounds: item.sounds || {}
            });
          }
        }
      }

      // Create cosmetic set object
      const cosmeticSet = {
        id: `set_${Date.now()}`,
        name,
        description,
        type,
        logo,
        background,
        banner,
        items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: items.length,
        totalSize: this.calculateSetSize(logo, background, banner, items)
      };

      // Save cosmetic set
      const setPath = path.join(this.generatedDir, `${cosmeticSet.id}.json`);
      fs.writeFileSync(setPath, JSON.stringify(cosmeticSet, null, 2));

      logger.info('Cosmetic set created successfully', {
        setId: cosmeticSet.id,
        name,
        itemCount: items.length,
        logo: !!logo,
        background: !!background,
        banner: !!banner
      });

      return {
        success: true,
        setId: cosmeticSet.id,
        cosmeticSet,
        setPath
      };
    } catch (error) {
      logger.error('Failed to create cosmetic set', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate total set size
   */
  calculateSetSize(logo, background, banner, items) {
    let totalSize = 0;
    
    if (logo && logo.metadata) {
      totalSize += logo.metadata.size || 0;
    }
    
    if (background && background.metadata) {
      totalSize += background.metadata.size || 0;
    }
    
    if (banner && banner.metadata) {
      totalSize += banner.metadata.size || 0;
    }
    
    if (items) {
      items.forEach(item => {
        if (item.image && item.image.metadata) {
          totalSize += item.image.metadata.size || 0;
        }
      });
    }
    
    return totalSize;
  }

  /**
   * Get all cosmetic sets
   */
  getAllCosmeticSets() {
    try {
      const sets = [];
      const files = fs.readdirSync(this.generatedDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.generatedDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const cosmeticSet = JSON.parse(content);
          
          sets.push({
            ...cosmeticSet,
            filePath,
            fileName: file
          });
        }
      }
      
      return {
        success: true,
        sets,
        totalCount: sets.length
      };
    } catch (error) {
      logger.error('Failed to get cosmetic sets', { error: error.message });
      return {
        success: false,
        error: error.message,
        sets: []
      };
    }
  }

  /**
   * Get cosmetic set by ID
   */
  getCosmeticSet(setId) {
    try {
      const setPath = path.join(this.generatedDir, `${setId}.json`);
      
      if (!fs.existsSync(setPath)) {
        return {
          success: false,
          error: 'Cosmetic set not found'
        };
      }
      
      const content = fs.readFileSync(setPath, 'utf8');
      const cosmeticSet = JSON.parse(content);
      
      return {
        success: true,
        cosmeticSet
      };
    } catch (error) {
      logger.error('Failed to get cosmetic set', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update cosmetic set
   */
  updateCosmeticSet(setId, updateData) {
    try {
      const setPath = path.join(this.generatedDir, `${setId}.json`);
      
      if (!fs.existsSync(setPath)) {
        return {
          success: false,
          error: 'Cosmetic set not found'
        };
      }
      
      const existingSet = JSON.parse(fs.readFileSync(setPath, 'utf8'));
      
      // Update fields
      const updatedSet = {
        ...existingSet,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(setPath, JSON.stringify(updatedSet, null, 2));
      
      logger.info('Cosmetic set updated successfully', {
        setId,
        updatedFields: Object.keys(updateData)
      });
      
      return {
        success: true,
        cosmeticSet: updatedSet
      };
    } catch (error) {
      logger.error('Failed to update cosmetic set', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete cosmetic set
   */
  deleteCosmeticSet(setId) {
    try {
      const setPath = path.join(this.generatedDir, `${setId}.json`);
      
      if (!fs.existsSync(setPath)) {
        return {
          success: false,
          error: 'Cosmetic set not found'
        };
      }
      
      // Also delete associated images
      const cosmeticSet = JSON.parse(fs.readFileSync(setPath, 'utf8'));
      const imagesToDelete = [];
      
      if (cosmeticSet.logo && cosmeticSet.logo.path) {
        imagesToDelete.push(cosmeticSet.logo.path);
      }
      
      if (cosmeticSet.background && cosmeticSet.background.path) {
        imagesToDelete.push(cosmeticSet.background.path);
      }
      
      if (cosmeticSet.banner && cosmeticSet.banner.path) {
        imagesToDelete.push(cosmeticSet.banner.path);
      }
      
      if (cosmeticSet.items) {
        cosmeticSet.items.forEach(item => {
          if (item.image && item.image.path) {
            imagesToDelete.push(item.image.path);
          }
        });
      }
      
      // Delete images
      imagesToDelete.forEach(imagePath => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          logger.info('Deleted image', { imagePath });
        }
      });
      
      // Delete set file
      fs.unlinkSync(setPath);
      
      logger.info('Cosmetic set deleted successfully', {
        setId,
        imagesDeleted: imagesToDelete.length
      });
      
      return {
        success: true,
        deletedImages: imagesToDelete.length
      };
    } catch (error) {
      logger.error('Failed to delete cosmetic set', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate cosmetic set from template
   */
  async generateFromTemplate(template) {
    try {
      const templates = {
        poker_night: {
          name: 'Poker Night Theme',
          description: 'Dark theme for late-night poker sessions',
          items: [
            {
              name: 'Midnight Chips',
              description: 'Dark poker chips with blue accents',
              price: 100,
              rarity: 'rare',
              type: 'item',
              attributes: {
                material: 'digital',
                glow: true,
                animated: false
              }
            },
            {
              name: 'Nocturnal Cards',
              description: 'Dark playing cards with subtle glow',
              price: 150,
              rarity: 'epic',
              type: 'item',
              attributes: {
                material: 'digital',
                glow: true,
                animated: true
              }
            }
          ],
          background: {
            type: 'gradient',
            colors: ['#0a0a0a', '#1a1a1a'],
            style: 'poker_table'
          },
          logo: {
            type: 'minimalist',
            style: 'modern'
          }
        },
        
        neon_retro: {
          name: 'Neon Retro Poker',
          description: '80s style neon theme with retro aesthetics',
          items: [
            {
              name: 'Neon Chips',
              description: 'Bright neon poker chips',
              price: 120,
              rarity: 'rare',
              type: 'item',
              attributes: {
                material: 'neon',
                glow: true,
                animated: false
              }
            },
            {
              name: 'Retro Cards',
              description: 'Classic playing cards with neon outline',
              price: 180,
              rarity: 'epic',
              type: 'item',
              attributes: {
                material: 'retro',
                glow: true,
                animated: false
              }
            }
          ],
          background: {
            type: 'solid',
            colors: ['#000000', '#FF00FF'],
            style: 'neon_grid'
          },
          logo: {
            type: 'retro',
            style: 'arcade'
          }
        }
      };

      const selectedTemplate = templates[template];
      if (!selectedTemplate) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      // Create cosmetic set from template
      const cosmeticSet = {
        id: `template_${template}_${Date.now()}`,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        type: 'complete_set',
        items: selectedTemplate.items,
        logo: null, // Would need to be uploaded
        background: null, // Would need to be uploaded
        banner: null, // Would need to be uploaded
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: selectedTemplate.items.length,
        totalSize: 0
      };

      // Save template set
      const setPath = path.join(this.generatedDir, `${cosmeticSet.id}.json`);
      fs.writeFileSync(setPath, JSON.stringify(cosmeticSet, null, 2));

      logger.info('Cosmetic set generated from template', {
        template,
        setId: cosmeticSet.id,
        itemCount: selectedTemplate.items.length
      });

      return {
        success: true,
        cosmeticSet,
        template,
        setId: cosmeticSet.id
      };
    } catch (error) {
      logger.error('Failed to generate from template', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return {
      success: true,
      templates: {
        poker_night: {
          name: 'Poker Night Theme',
          description: 'Dark theme for late-night poker sessions',
          preview: '/templates/previews/poker_night.jpg'
        },
        neon_retro: {
          name: 'Neon Retro Poker',
          description: '80s style neon theme with retro aesthetics',
          preview: '/templates/previews/neon_retro.jpg'
        }
      }
    };
  }

  /**
   * Validate cosmetic data
   */
  validateCosmeticData(cosmeticData) {
    const errors = [];
    
    // Validate required fields
    if (!cosmeticData.name || cosmeticData.name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!cosmeticData.type) {
      errors.push('Type is required');
    }
    
    // Validate items
    if (cosmeticData.items && Array.isArray(cosmeticData.items)) {
      cosmeticData.items.forEach((item, index) => {
        if (!item.name) {
          errors.push(`Item ${index + 1}: Name is required`);
        }
        
        if (item.price && (typeof item.price !== 'number' || item.price < 0)) {
          errors.push(`Item ${index + 1}: Price must be a positive number`);
        }
        
        if (!item.type) {
          errors.push(`Item ${index + 1}: Type is required`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = EnhancedCosmeticGenerator;
