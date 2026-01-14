/**
 * Pricing API Routes
 * Backend endpoints for pricing and entitlement management
 */

import express from 'express';
import { pricingService } from '../services/pricingService';

const router = express.Router();

/**
 * GET /pricing/tiers
 * Get all pricing tiers
 */
router.get('/tiers', (req, res) => {
  try {
    const tiers = pricingService.getPricingTiers();
    
    res.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing tiers'
    });
  }
});

/**
 * GET /pricing/tiers/:tierId
 * Get specific pricing tier
 */
router.get('/tiers/:tierId', (req, res) => {
  try {
    const { tierId } = req.params;
    const tier = pricingService.getPricingTier(tierId);
    
    if (!tier) {
      return res.status(404).json({
        success: false,
        error: 'Tier not found'
      });
    }
    
    res.json({
      success: true,
      data: tier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing tier'
    });
  }
});

/**
 * GET /pricing/entitlement/:tenantId
 * Get tenant entitlement
 */
router.get('/entitlement/:tenantId', (req, res) => {
  try {
    const { tenantId } = req.params;
    const entitlement = pricingService.getEntitlement(tenantId);
    
    if (!entitlement) {
      return res.status(404).json({
        success: false,
        error: 'Entitlement not found'
      });
    }
    
    res.json({
      success: true,
      data: entitlement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get entitlement'
    });
  }
});

/**
 * POST /pricing/entitlement/:tenantId
 * Update tenant entitlement
 */
router.post('/entitlement/:tenantId', (req, res) => {
  try {
    const { tenantId } = req.params;
    const { tierId } = req.body;
    
    if (!tierId) {
      return res.status(400).json({
        success: false,
        error: 'Tier ID required'
      });
    }
    
    const entitlement = pricingService.updateEntitlement(tenantId, tierId);
    
    res.json({
      success: true,
      data: entitlement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update entitlement'
    });
  }
});

/**
 * POST /pricing/check-feature
 * Check if tenant can use feature
 */
router.post('/check-feature', (req, res) => {
  try {
    const { tenantId, feature } = req.body;
    
    if (!tenantId || !feature) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and feature required'
      });
    }
    
    const result = pricingService.canUseFeature(tenantId, feature);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check feature'
    });
  }
});

/**
 * POST /pricing/check-limits
 * Check if tenant is within limits
 */
router.post('/check-limits', (req, res) => {
  try {
    const { tenantId, limitType, usage } = req.body;
    
    if (!tenantId || !limitType || usage === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID, limit type, and usage required'
      });
    }
    
    const result = pricingService.checkLimits(tenantId, limitType, usage);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check limits'
    });
  }
});

/**
 * POST /pricing/record-usage
 * Record usage against limits
 */
router.post('/record-usage', (req, res) => {
  try {
    const { tenantId, usage } = req.body;
    
    if (!tenantId || !usage) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and usage data required'
      });
    }
    
    pricingService.recordUsage(tenantId, usage);
    
    res.json({
      success: true,
      data: { message: 'Usage recorded successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record usage'
    });
  }
});

/**
 * GET /pricing/suggestions/:tenantId
 * Get upgrade suggestions for tenant
 */
router.get('/suggestions/:tenantId', (req, res) => {
  try {
    const { tenantId } = req.params;
    const suggestions = pricingService.getUpgradeSuggestions(tenantId);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get upgrade suggestions'
    });
  }
});

/**
 * POST /pricing/check-skill
 * Check if skill is compatible with tenant's tier
 */
router.post('/check-skill', (req, res) => {
  try {
    const { tenantId, skillCategory, skillPrice } = req.body;
    
    if (!tenantId || !skillCategory) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and skill category required'
      });
    }
    
    const result = pricingService.isSkillCompatible(tenantId, skillCategory, skillPrice);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check skill compatibility'
    });
  }
});

/**
 * GET /pricing/skill-bands
 * Get all skill pricing bands
 */
router.get('/skill-bands', (req, res) => {
  try {
    const bands = pricingService.getSkillPricingBands();
    
    res.json({
      success: true,
      data: bands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get skill pricing bands'
    });
  }
});

/**
 * GET /pricing/skill-bands/:category
 * Get specific skill pricing band
 */
router.get('/skill-bands/:category', (req, res) => {
  try {
    const { category } = req.params;
    const band = pricingService.getSkillPricingBand(category);
    
    if (!band) {
      return res.status(404).json({
        success: false,
        error: 'Skill pricing band not found'
      });
    }
    
    res.json({
      success: true,
      data: band
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get skill pricing band'
    });
  }
});

/**
 * GET /pricing/revenue-projection
 * Get revenue projection (for investors)
 */
router.get('/revenue-projection', (req, res) => {
  try {
    const projection = pricingService.calculateRevenueProjection();
    
    res.json({
      success: true,
      data: projection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate revenue projection'
    });
  }
});

/**
 * GET /pricing/pricing-page
 * Get pricing page data
 */
router.get('/pricing-page', (req, res) => {
  try {
    const pricingPage = pricingService.generatePricingPage();
    
    res.json({
      success: true,
      data: pricingPage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate pricing page data'
    });
  }
});

/**
 * GET /pricing/health
 * Health check for pricing service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'pricing',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
