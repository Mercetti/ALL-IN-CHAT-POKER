/**
 * Marketing Index
 * Exports all marketing and onboarding modules
 */

export * from './publicLaunch';
export * from './enterpriseOnboarding';

// Marketing utilities
export const launchPhases = {
  PRE_LAUNCH: 'pre-launch',
  CREATOR_BETA: 'creator-beta', 
  PUBLIC_LAUNCH: 'public-launch',
  GROWTH: 'growth'
} as const;

export const marketingChannels = {
  TWITCH: 'twitch',
  YOUTUBE: 'youtube',
  TWITTER: 'twitter',
  DISCORD: 'discord',
  GITHUB: 'github',
  PRODUCT_HUNT: 'product-hunt',
  REDDIT: 'reddit',
  LINKEDIN: 'linkedin'
} as const;

export const launchMessages = {
  SKILLS_NOT_PROMPTS: 'Acey runs skills, not prompts - install only what you need',
  HUMAN_IN_CONTROL: 'Human-in-control - you approve everything, nothing runs automatically',
  ENTERPRISE_READY: 'Enterprise-ready - isolated tenants, audit logs, compliance',
  UNIFIED_CHAT: 'Unified chat - all skills in one interface, no context switching',
  FUTURE_PROOF: 'Future-proof - auto-register new skills without code changes'
} as const;
