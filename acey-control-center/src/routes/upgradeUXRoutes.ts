/**
 * Upgrade UX API Routes
 * Backend endpoints for upgrade flows and UX copy
 */

import express from 'express';
import { UpgradeUXHelper, upgradeUXCopy, skillCardExamples, upgradeTriggers } from '../services/upgradeUXService';
import { pricingService } from '../services/pricingService';

const router = express.Router();

/**
 * GET /upgrade-ux/copy
 * Get all UX copy for upgrade flows
 */
router.get('/copy', (req, res) => {
  try {
    res.json({
      success: true,
      data: upgradeUXCopy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get UX copy'
    });
  }
});

/**
 * GET /upgrade-ux/tiers
 * Get tier cards with UX formatting
 */
router.get('/tiers', (req, res) => {
  try {
    const pricingTiers = pricingService.getPricingTiers();
    const currentTier = req.query.currentTier as string || 'free';
    
    const tierCards = pricingTiers.map(tier => {
      const uxCard = UpgradeUXHelper.getTierCardCopy(tier.id);
      return {
        id: tier.id,
        name: tier.name,
        price: tier.price === 0 ? 'FREE' : `$${tier.price}/mo`,
        description: tier.description,
        features: Object.entries(tier.features)
          .filter(([_, enabled]) => enabled)
          .map(([feature]) => formatFeatureName(feature)),
        popular: tier.popular,
        current: tier.id === currentTier,
        uxCopy: uxCard
      };
    });
    
    res.json({
      success: true,
      data: tierCards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get tier cards'
    });
  }
});

/**
 * GET /upgrade-ux/skills
 * Get skill cards with compatibility checking
 */
router.get('/skills', (req, res) => {
  try {
    const currentTier = req.query.currentTier as string || 'free';
    
    const skillCards = Object.entries(skillCardExamples).map(([id, skill]) => {
      const skillWithCompat = UpgradeUXHelper.getSkillCardWithCompatibility(id, currentTier);
      return {
        id,
        name: skillWithCompat.name,
        price: skillWithCompat.price,
        description: skillWithCompat.description,
        requirements: skillWithCompat.requirements,
        category: skillWithCompat.category,
        compatible: skillWithCompat.compatible,
        upgradeRequired: skillWithCompat.upgradeRequired,
        uxCopy: skillWithCompat
      };
    });
    
    res.json({
      success: true,
      data: skillCards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get skill cards'
    });
  }
});

/**
 * GET /upgrade-ux/triggers
 * Get all upgrade triggers
 */
router.get('/triggers', (req, res) => {
  try {
    res.json({
      success: true,
      data: upgradeTriggers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get upgrade triggers'
    });
  }
});

/**
 * GET /upgrade-ux/trigger/:triggerId
 * Get specific upgrade trigger
 */
router.get('/trigger/:triggerId', (req, res) => {
  try {
    const { triggerId } = req.params;
    const trigger = upgradeTriggers.find(t => t.trigger === triggerId);
    
    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: 'Trigger not found'
      });
    }
    
    res.json({
      success: true,
      data: trigger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get upgrade trigger'
    });
  }
});

/**
 * GET /upgrade-ux/flow/:tierId
 * Get upgrade flow for specific tier
 */
router.get('/flow/:tierId', (req, res) => {
  try {
    const { tierId } = req.params;
    const flow = UpgradeUXHelper.getUpgradeFlow(tierId);
    
    res.json({
      success: true,
      data: flow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get upgrade flow'
    });
  }
});

/**
 * POST /upgrade-ux/prompt
 * Generate contextual upgrade prompt
 */
router.post('/prompt', (req, res) => {
  try {
    const { trigger, userContext } = req.body;
    
    if (!trigger) {
      return res.status(400).json({
        success: false,
        error: 'Trigger required'
      });
    }
    
    const message = UpgradeUXHelper.generateContextualMessage(trigger, userContext);
    const upgradeTrigger = UpgradeUXHelper.getUpgradeTrigger(trigger);
    
    res.json({
      success: true,
      data: {
        message,
        trigger: upgradeTrigger,
        prompt: upgradeTrigger ? UpgradeUXHelper.getUpgradePromptCopy(upgradeTrigger.requiredTier) : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate upgrade prompt'
    });
  }
});

/**
 * GET /upgrade-ux/feature/:featureId
 * Get feature explanation
 */
router.get('/feature/:featureId', (req, res) => {
  try {
    const { featureId } = req.params;
    const explanation = UpgradeUXHelper.getFeatureExplanation(featureId);
    
    if (!explanation) {
      return res.status(404).json({
        success: false,
        error: 'Feature explanation not found'
      });
    }
    
    res.json({
      success: true,
      data: explanation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get feature explanation'
    });
  }
});

/**
 * POST /upgrade-ux/compatibility/skill
 * Check skill compatibility with current tier
 */
router.post('/compatibility/skill', (req, res) => {
  try {
    const { skillId, currentTier } = req.body;
    
    if (!skillId || !currentTier) {
      return res.status(400).json({
        success: false,
        error: 'Skill ID and current tier required'
      });
    }
    
    const skillWithCompat = UpgradeUXHelper.getSkillCardWithCompatibility(skillId, currentTier);
    
    res.json({
      success: true,
      data: skillWithCompat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check skill compatibility'
    });
  }
});

/**
 * GET /upgrade-ux/tooltips
 * Get all tooltip content
 */
router.get('/tooltips', (req, res) => {
  try {
    res.json({
      success: true,
      data: upgradeUXCopy.tooltips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get tooltips'
    });
  }
});

/**
 * GET /upgrade-ux/tooltips/:tooltipId
 * Get specific tooltip
 */
router.get('/tooltips/:tooltipId', (req, res) => {
  try {
    const { tooltipId } = req.params;
    const tooltip = upgradeUXCopy.tooltips[tooltipId as keyof typeof upgradeUXCopy.tooltips];
    
    if (!tooltip) {
      return res.status(404).json({
        success: false,
        error: 'Tooltip not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: tooltipId,
        content: tooltip
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get tooltip'
    });
  }
});

/**
 * POST /upgrade-ux/simulation
 * Simulate upgrade flow for analytics
 */
router.post('/simulation', (req, res) => {
  try {
    const { currentTier, targetTier, userContext } = req.body;
    
    if (!currentTier || !targetTier) {
      return res.status(400).json({
        success: false,
        error: 'Current tier and target tier required'
      });
    }
    
    // Get upgrade flow
    const flow = UpgradeUXHelper.getUpgradeFlow(targetTier);
    
    // Calculate upgrade value
    const currentTierData = pricingService.getPricingTier(currentTier);
    const targetTierData = pricingService.getPricingTier(targetTier);
    
    const valueProps = {
      newFeatures: [],
      priceIncrease: 0,
      trialAvailable: false,
      estimatedValue: 'Enhanced control and automation capabilities'
    };
    
    if (currentTierData && targetTierData) {
      valueProps.priceIncrease = targetTierData.price - currentTierData.price;
      
      // Find new features
      Object.entries(targetTierData.features).forEach(([feature, enabled]) => {
        if (enabled && !currentTierData.features[feature as keyof typeof currentTierData.features]) {
          valueProps.newFeatures.push(formatFeatureName(feature));
        }
      });
    }
    
    // Check if trial is available
    const firstStep = flow[0];
    valueProps.trialAvailable = firstStep?.showTrial || false;
    
    res.json({
      success: true,
      data: {
        flow,
        valueProps,
        simulationId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to simulate upgrade flow'
    });
  }
});

/**
 * GET /upgrade-ux/health
 * Health check for upgrade UX service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'upgrade-ux',
      timestamp: new Date().toISOString(),
      availableTriggers: upgradeTriggers.length,
      availableSkills: Object.keys(skillCardExamples).length
    }
  });
});

/**
 * Helper function to format feature names
 */
function formatFeatureName(feature: string): string {
  return feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

export default router;
