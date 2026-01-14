/**
 * Pricing Middleware
 * Enforces pricing rules and feature gating across the application
 */

import { Request, Response, NextFunction } from 'express';
import { pricingService } from '../services/pricingService';

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
    userId: string;
    permissions: string[];
  };
}

/**
 * Middleware to check if tenant can use a feature
 */
export const requireFeature = (feature: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = pricingService.canUseFeature(req.user.tenantId, feature as any);
      
      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: result.reason,
          upgradeTo: result.upgradeTo
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Feature check failed'
      });
    }
  };
};

/**
 * Middleware to check if tenant is within limits
 */
export const requireLimit = (limitType: string, usage: number = 1) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = pricingService.checkLimits(req.user.tenantId, limitType as any, usage);
      
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Limit exceeded',
          remaining: result.remaining,
          upgradeTo: result.upgradeTo
        });
      }

      // Record usage
      pricingService.recordUsage(req.user.tenantId, {
        [limitType]: usage
      } as any);

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Limit check failed'
      });
    }
  };
};

/**
 * Middleware to check skill compatibility
 */
export const requireSkillCompatibility = (skillCategory: string, skillPrice: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = pricingService.isSkillCompatible(req.user.tenantId, skillCategory, skillPrice);
      
      if (!result.compatible) {
        return res.status(403).json({
          success: false,
          error: result.reason
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Skill compatibility check failed'
      });
    }
  };
};

/**
 * Middleware to add pricing context to request
 */
export const addPricingContext = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      return next();
    }

    const entitlement = pricingService.getEntitlement(req.user.tenantId);
    
    if (entitlement) {
      req.pricingContext = {
        tierId: entitlement.tierId,
        features: entitlement.features,
        limits: entitlement.limits,
        usage: entitlement.usage
      };
    }

    next();
  } catch (error) {
    // Don't fail the request, just continue without pricing context
    next();
  }
};

/**
 * Extend Request interface to include pricing context
 */
declare global {
  namespace Express {
    interface Request {
      pricingContext?: {
        tierId: string;
        features: any;
        limits: any;
        usage: any;
      };
    }
  }
}

/**
 * Helper function to check if feature is available in pricing context
 */
export const hasFeatureInContext = (req: AuthenticatedRequest, feature: string): boolean => {
  return req.pricingContext?.features?.[feature] || false;
};

/**
 * Helper function to get remaining limit from pricing context
 */
export const getRemainingLimit = (req: AuthenticatedRequest, limitType: string): number => {
  if (!req.pricingContext) return 0;
  
  const limit = req.pricingContext.limits[limitType];
  const usage = req.pricingContext.usage[limitType];
  
  if (limit === -1) return -1; // Unlimited
  return Math.max(0, limit - usage);
};

/**
 * Middleware to enforce upgrade suggestions
 */
export const suggestUpgrade = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      return next();
    }

    const suggestions = pricingService.getUpgradeSuggestions(req.user.tenantId);
    
    if (suggestions.length > 0) {
      // Add upgrade suggestions to response headers
      res.set('X-Upgrade-Suggestions', JSON.stringify(suggestions));
    }

    next();
  } catch (error) {
    // Don't fail the request, just continue without suggestions
    next();
  }
};

/**
 * Middleware to track usage for analytics
 */
export const trackUsage = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.tenantId) {
        return next();
      }

      // Record usage for analytics
      console.log(`Usage tracked: ${action} for tenant ${req.user.tenantId}`);
      
      // In production, this would send to analytics service
      // analyticsService.trackUsage(req.user.tenantId, action, {
      //   tierId: req.pricingContext?.tierId,
      //   timestamp: Date.now(),
      //   userAgent: req.get('User-Agent'),
      //   ip: req.ip
      // });

      next();
    } catch (error) {
      // Don't fail the request, just continue without tracking
      next();
    }
  };
};

/**
 * Error handler for pricing-related errors
 */
export const pricingErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.code === 'PRICING_LIMIT_EXCEEDED') {
    return res.status(429).json({
      success: false,
      error: 'Pricing limit exceeded',
      upgradeTo: error.upgradeTo,
      remaining: error.remaining
    });
  }

  if (error.code === 'PRICING_FEATURE_NOT_AVAILABLE') {
    return res.status(403).json({
      success: false,
      error: 'Feature not available in current tier',
      upgradeTo: error.upgradeTo
    });
  }

  if (error.code === 'PRICING_SKILL_INCOMPATIBLE') {
    return res.status(403).json({
      success: false,
      error: 'Skill not compatible with current tier',
      reason: error.reason
    });
  }

  next(error);
};

/**
 * Middleware to validate subscription status
 */
export const requireActiveSubscription = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const entitlement = pricingService.getEntitlement(req.user.tenantId);
    
    if (!entitlement) {
      return res.status(402).json({
        success: false,
        error: 'Active subscription required',
        upgradeTo: 'creator-plus'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Subscription validation failed'
    });
  }
};

/**
 * Middleware to check trial status
 */
export const requireTrialOrSubscription = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const entitlement = pricingService.getEntitlement(req.user.tenantId);
    
    if (!entitlement) {
      return res.status(402).json({
        success: false,
        error: 'Trial or subscription required',
        upgradeTo: 'creator-plus',
        trialAvailable: true
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Trial validation failed'
    });
  }
};

/**
 * Middleware to enforce skill store access
 */
export const requireSkillStoreAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = pricingService.canUseFeature(req.user.tenantId, 'skillStoreAccess');
    
    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Skill store access requires Pro tier or higher',
        upgradeTo: result.upgradeTo
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Skill store access check failed'
    });
  }
};

/**
 * Middleware to enforce auto-rules access
 */
export const requireAutoRules = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = pricingService.canUseFeature(req.user.tenantId, 'autoRules');
    
    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Auto-rules require Pro tier or higher',
        upgradeTo: result.upgradeTo
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Auto-rules access check failed'
    });
  }
};

/**
 * Middleware to enforce compliance exports access
 */
export const requireComplianceExports = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = pricingService.canUseFeature(req.user.tenantId, 'complianceExports');
    
    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Compliance exports require Pro tier or higher',
        upgradeTo: result.upgradeTo
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Compliance exports access check failed'
    });
  }
};
