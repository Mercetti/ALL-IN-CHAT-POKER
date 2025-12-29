/**
 * Enhanced Cosmetic AI System
 * Expanded AI-powered cosmetic generation with more features and public access
 */

const ai = require('../server/ai');
const config = require('../server/config');
const fs = require('fs');
const path = require('path');

class EnhancedCosmeticAI {
  constructor(options = {}) {
    this.options = {
      enablePublicGeneration: options.enablePublicGeneration || false,
      maxConcurrentGenerations: options.maxConcurrentGenerations || 3,
      cacheResults: options.cacheResults !== false,
      generationCooldown: options.generationCooldown || 30000, // 30 seconds
      ...options
    };
    
    this.activeGenerations = new Map(); // user -> generation info
    this.generationCache = new Map(); // hash -> result
    this.userCooldowns = new Map(); // user -> timestamp
    this.cosmeticTypes = [
      'cardBack', 'tableSkin', 'avatarRing', 'nameplate', 
      'chips', 'cardFace', 'dealerButton', 'betSlider', 'playerCard'
    ];
    
    this.stylePresets = {
      neon: {
        description: "Bright, vibrant neon colors with glowing effects",
        keywords: ["neon", "bright", "glow", "vibrant", "electric"],
        colorScheme: "high-contrast, saturated colors"
      },
      minimal: {
        description: "Clean, minimalist design with subtle colors",
        keywords: ["minimal", "clean", "simple", "subtle", "elegant"],
        colorScheme: "low-contrast, muted colors"
      },
      retro: {
        description: "Vintage 80s/90s arcade style with bold colors",
        keywords: ["retro", "arcade", "vintage", "classic", "bold"],
        colorScheme: "high-contrast, primary colors"
      },
      nature: {
        description: "Organic, earthy tones with natural textures",
        keywords: ["nature", "organic", "earth", "natural", "green"],
        colorScheme: "warm, muted natural colors"
      },
      cyberpunk: {
        description: "Futuristic, high-tech aesthetic with neon accents",
        keywords: ["cyberpunk", "futuristic", "tech", "digital", "neon"],
        colorScheme: "dark background with bright accents"
      },
      luxury: {
        description: "Premium, elegant design with metallic finishes",
        keywords: ["luxury", "premium", "elegant", "metallic", "gold"],
        colorScheme: "rich, metallic colors"
      }
    };
    
    this.init();
  }

  init() {
    // Initialize advanced generation templates
    this.generationTemplates = {
      basic: {
        prompt: "Generate a basic cosmetic design with simple colors and clean layout.",
        detailLevel: "minimal"
      },
      detailed: {
        prompt: "Generate a detailed cosmetic design with multiple layers, textures, and effects.",
        detailLevel: "high"
      },
      animated: {
        prompt: "Generate a cosmetic design with animation considerations and frame-by-frame variations.",
        detailLevel: "high"
      },
      branded: {
        prompt: "Generate a branded cosmetic design that prominently features the streamer's identity.",
        detailLevel: "medium"
      }
    };
  }

  /**
   * Generate enhanced cosmetic with multiple options
   */
  async generateEnhancedCosmetic(options) {
    const {
      userId,
      login,
      logoPath,
      preset = 'neon',
      theme = '',
      cosmeticTypes = ['cardBack'],
      style = 'detailed',
      useCache = true,
      palette = null
    } = options;

    // Check cooldowns
    if (!this.canGenerate(userId)) {
      throw new Error('Generation cooldown active. Please wait before generating again.');
    }

    // Check concurrent generation limit
    if (this.activeGenerations.size >= this.options.maxConcurrentGenerations) {
      throw new Error('Too many concurrent generations. Please try again later.');
    }

    try {
      // Mark generation as active
      const generationId = this.startGeneration(userId, options);

      // Extract or validate palette
      const finalPalette = palette || await this.extractPalette(logoPath);

      // Generate designs for each cosmetic type
      const results = {};
      
      for (const cosmeticType of cosmeticTypes) {
        const design = await this.generateCosmeticType(
          cosmeticType,
          login,
          logoPath,
          finalPalette,
          preset,
          theme,
          style
        );
        
        results[cosmeticType] = design;
      }

      // Cache results if enabled
      if (this.options.cacheResults) {
        const cacheKey = this.generateCacheKey(options);
        this.generationCache.set(cacheKey, {
          results,
          timestamp: Date.now(),
          userId
        });
      }

      // Mark generation as complete
      this.completeGeneration(generationId);

      return results;

    } catch (error) {
      // Clean up on error
      this.cleanupGeneration(userId);
      throw error;
    }
  }

  /**
   * Generate design for specific cosmetic type
   */
  async generateCosmeticType(type, login, logoPath, palette, preset, theme, style) {
    const template = this.generationTemplates[style] || this.generationTemplates.detailed;
    
    const prompt = this.buildTypeSpecificPrompt(
      type,
      login,
      logoPath,
      palette,
      preset,
      theme,
      template
    );

    const response = await ai.chat([
      {
        role: 'system',
        content: this.getSystemPrompt(type)
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.6,
      maxTokens: 800
    });

    return this.validateAndParseResponse(response, type);
  }

  /**
   * Build type-specific generation prompt
   */
  buildTypeSpecificPrompt(type, login, logoPath, palette, preset, theme, template) {
    const basePrompt = template.prompt;
    
    const typeSpecifics = {
      cardBack: {
        dimensions: "480x680px",
        requirements: "No text on edges, keep center 40% readable, avoid patterns behind card corners",
        layers: ["frame", "center_mark", "pattern", "background"],
        reference: "Similar to existing card backs but with brand colors"
      },
      tableSkin: {
        dimensions: "Match existing table texture dimensions",
        requirements: "Felt texture appearance, seamless pattern, subtle brand integration",
        layers: ["base_texture", "brand_overlay", "highlight_effect"],
        reference: "Use /assets/table-texture.svg as base texture"
      },
      avatarRing: {
        dimensions: "512x512px with transparent center",
        requirements: "Soft glow effect, 40px center hole, brand colors on outer ring",
        layers: ["ring_base", "glow_effect", "brand_elements"],
        reference: "Similar to existing avatar rings but with custom colors"
      },
      nameplate: {
        dimensions: "512x512px with padding",
        requirements: "Readable text area, subtle background, brand accent edges",
        layers: ["background", "text_area", "accent_border"],
        reference: "Use for player name displays with streamer branding"
      },
      chips: {
        dimensions: "Various chip sizes (100, 500, 1000, 5000)",
        requirements: "Denominations clearly visible, 3D appearance, brand colors",
        layers: ["chip_base", "denomination", "edge_highlight"],
        reference: "Similar to existing chip designs but with custom palette"
      },
      cardFace: {
        dimensions: "Standard playing card dimensions",
        requirements: "Clear suits and ranks, high contrast, brand color accents",
        layers: ["card_base", "suit_symbol", "rank_display", "brand_watermark"],
        reference: "Standard poker card faces with brand integration"
      },
      dealerButton: {
        dimensions: "Match existing dealer button dimensions",
        requirements: "Clear text, brand colors, hover state consideration",
        layers: ["button_base", "text", "brand_logo", "hover_effect"],
        reference: "Dealer action buttons with streamer branding"
      },
      betSlider: {
        dimensions: "Match existing bet slider dimensions",
        requirements: "Clear markers, brand colors, smooth appearance",
        layers: ["track_base", "slider_handle", "brand_accent"],
        reference: "Betting sliders with streamer color scheme"
      },
      playerCard: {
        dimensions: "Standard card dimensions for player cards",
        requirements: "Player-friendly design, brand elements, clear visibility",
        layers: ["card_base", "player_info", "brand_elements", "suit_display"],
        reference: "Player cards with subtle brand integration"
      }
    };

    const typeInfo = typeSpecifics[type] || typeSpecifics.cardBack;
    
    return `${basePrompt}

Cosmetic Type: ${type}
Brand: ${login}
Logo: ${logoPath || 'none'}
Palette: ${palette ? palette.join(', ') : 'extract from logo'}
Style Preset: ${preset} - ${this.stylePresets[preset]?.description || ''}
Theme: ${theme || 'none'}
${typeInfo.requirements}

Dimensions: ${typeInfo.dimensions}
Layers: ${typeInfo.layers.join(', ')}
Reference: ${typeInfo.reference}

Output Format: JSON with keys: name, description, colors, layers, dimensions, render_notes`;
  }

  /**
   * Get system prompt for cosmetic generation
   */
  getSystemPrompt(type) {
    return `You are an expert cosmetic designer for poker and gaming applications.

Generate ${type} designs that are:
- Visually appealing and professional
- Consistent with gaming industry standards
- Optimized for performance (no excessive effects)
- Accessible with good contrast ratios
- Brand-appropriate and tasteful

Requirements:
- Use transparent backgrounds
- Maintain aspect ratios and dimensions
- Provide clear layer separation for compositing
- Include render notes for implementation
- Ensure text readability (3:1 contrast minimum)
- Avoid gradients behind important elements
- Keep designs modular and reusable

Output Format: Valid JSON only, no additional text or explanations.`;
  }

  /**
   * Validate and parse AI response
   */
  validateAndParseResponse(response, type) {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields
      const requiredFields = ['name', 'colors', 'layers'];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Validate colors format
      if (!Array.isArray(parsed.colors) || parsed.colors.length < 2) {
        throw new Error('Colors must be an array with at least 2 hex values');
      }
      
      // Validate colors format (hex)
      parsed.colors.forEach(color => {
        if (!/^#[0-9A-Fa-f]{6}$/i.test(color)) {
          throw new Error(`Invalid color format: ${color}. Use hex format #RRGGBB`);
        }
      });
      
      // Add metadata
      parsed.type = type;
      parsed.generatedAt = new Date().toISOString();
      parsed.version = '1.0';
      
      return parsed;
    } catch (error) {
      throw new Error(`Invalid response format: ${error.message}`);
    }
  }

  /**
   * Extract palette from logo
   */
  async extractPalette(logoPath) {
    if (!logoPath) {
      return null;
    }

    try {
      // This would integrate with your existing palette extraction logic
      // For now, return a default palette
      return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    } catch (error) {
      console.warn('Failed to extract palette from logo:', error);
      return null;
    }
  }

  /**
   * Generate multiple variants of a cosmetic
   */
  async generateVariants(baseDesign, userId) {
    const variants = ['primary', 'alt', 'clean'];
    const results = {};

    for (const variant of variants) {
      const variantPrompt = this.buildVariantPrompt(baseDesign, variant);
      
      try {
        const response = await ai.chat([
          {
            role: 'system',
            content: 'Generate a variant of the provided design. Return only JSON.'
          },
          {
            role: 'user',
            content: variantPrompt
          }
        ], {
          temperature: 0.5,
          maxTokens: 600
        });

        const variantDesign = this.validateAndParseResponse(response, baseDesign.type);
        variantDesign.variant = variant;
        variantDesign.baseDesign = baseDesign.name;
        
        results[variant] = variantDesign;
      } catch (error) {
        console.warn(`Failed to generate variant ${variant}:`, error);
        // Continue with other variants
      }
    }

    return results;
  }

  /**
   * Build variant generation prompt
   */
  buildVariantPrompt(baseDesign, variant) {
    return `Create a ${variant} variant of this design:

Original Design: ${JSON.stringify(baseDesign, null, 2)}

Variant Instructions:
- primary: Keep the main design elements, adjust colors slightly
- alt: Use complementary colors, maintain the same structure
- clean: Simplify the design, use minimal colors and effects

Return only JSON with the modified design.`;
  }

  /**
   * Generate themed cosmetic sets
   */
  async generateThemedSet(theme, login, logoPath) {
    const themes = {
      holiday: {
        description: "Holiday-themed with seasonal colors and festive elements",
        colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFD700"],
        elements: ["snowflakes", "stars", "hearts", "ornaments"]
      },
      esports: {
        description: "Esports-themed with competitive colors and dynamic elements",
        colors: ["#FF1744", "#2196F3", "#4CAF50", "#FFC107"],
        elements: ["lightning", "shields", "trophies", "medals"]
      },
      seasonal: {
        description: "Seasonal themes with appropriate colors and nature elements",
        colors: ["#8BC34A", "#FF9800", "#795548", "#607D8B"],
        elements: ["leaves", "flowers", "snow", "sun"]
      },
      anniversary: {
        description: "Anniversary celebration with premium metallic elements",
        colors: ["#FFD700", "#C0C0C0", "#4169E1", "#F50057"],
        elements: ["confetti", "ribbons", "stars", "balloons"]
      }
    };

    const themeConfig = themes[theme];
    if (!themeConfig) {
      throw new Error(`Unknown theme: ${theme}`);
    }

    const prompt = `Generate a themed cosmetic set for ${theme}.

Brand: ${login}
Theme: ${themeConfig.description}
Colors: ${themeConfig.colors.join(', ')}
Elements: ${themeConfig.elements.join(', ')}

Generate designs for: cardBack, tableSkin, avatarRing, nameplate
Each design should incorporate the theme elements and colors while maintaining brand recognition.

Return JSON with all four cosmetic types.`;

    try {
      const response = await ai.chat([
        {
          role: 'system',
          content: 'Generate themed cosmetic sets. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.6,
        maxTokens: 1000
      });

      return this.validateAndParseResponse(response, 'themedSet');
    } catch (error) {
      throw new Error(`Failed to generate themed set: ${error.message}`);
    }
  }

  /**
   * Check if user can generate
   */
  startGeneration(userId, options) {
    const generationId = `${userId}-${Date.now()}`;
    
    this.activeGenerations.set(userId, {
      id: generationId,
      startTime: Date.now(),
      options
    });
    
    this.userCooldowns.set(userId, Date.now());
    
    return generationId;
  }

  /**
   * Complete generation tracking
   */
  completeGeneration(generationId) {
    // Find and remove from active generations
    for (const [userId, generation] of this.activeGenerations.entries()) {
      if (generation.id === generationId) {
        this.activeGenerations.delete(userId);
        break;
      }
    }
  }

  /**
   * Clean up generation on error
   */
  cleanupGeneration(userId) {
    this.activeGenerations.delete(userId);
    this.userCooldowns.delete(userId);
  }

  /**
   * Generate cache key
   */
  generateCacheKey(options) {
    const keyParts = [
      options.login || 'anonymous',
      options.preset || 'neon',
      options.theme || '',
      options.cosmeticTypes?.join(',') || 'cardBack',
      options.style || 'detailed'
    ];
    
    return keyParts.join('|');
  }

  /**
   * Get generation status
   */
  getGenerationStatus(userId) {
    const active = this.activeGenerations.get(userId);
    const cooldown = this.userCooldowns.get(userId) || 0;
    
    return {
      canGenerate: this.canGenerate(userId),
      cooldownRemaining: Math.max(0, this.options.generationCooldown - (Date.now() - cooldown)),
      activeGeneration: active,
      totalActive: this.activeGenerations.size,
      maxConcurrent: this.options.maxConcurrentGenerations
    };
  }

  /**
   * Get available style presets
   */
  getAvailablePresets() {
    return Object.keys(this.stylePresets).map(key => ({
      name: key,
      description: this.stylePresets[key].description,
      keywords: this.stylePresets[key].keywords
    }));
  }

  /**
   * Get available cosmetic types
   */
  getAvailableTypes() {
    return this.cosmeticTypes.map(type => ({
      name: type,
      description: this.getCosmeticDescription(type)
    }));
  }

  /**
   * Get cosmetic type description
   */
  getCosmeticDescription(type) {
    const descriptions = {
      cardBack: "Custom design for playing card backs",
      tableSkin: "Branded texture for the poker table",
      avatarRing: "Decorative ring around player avatars",
      nameplate: "Branded display for player names",
      chips: "Custom design for betting chips",
      cardFace: "Custom design for card faces",
      dealerButton: "Branded dealer action buttons",
      betSlider: "Custom betting interface elements",
      playerCard: "Custom design for player cards"
    };
    
    return descriptions[type] || "Custom cosmetic design";
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.generationCache.clear();
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      enabled: this.options.enablePublicGeneration,
      maxConcurrent: this.options.maxConcurrentGenerations,
      activeGenerations: this.activeGenerations.size,
      cacheSize: this.generationCache.size,
      cooldownTime: this.options.generationCooldown,
      availablePresets: this.getAvailablePresets(),
      availableTypes: this.getAvailableTypes()
    };
  }
}

module.exports = EnhancedCosmeticAI;
