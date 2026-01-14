/**
 * Enhanced LLM Orchestrator with Complete Skill Integration
 * Advanced LLM integration for all 11 skills with comprehensive permissions
 */

import axios from 'axios';
import { EnhancedLLMPayload, LLMOrchestrationResponse } from '../api/llm-enhanced';

const API_BASE_URL = 'http://localhost:8080/api'; // Update to your actual backend URL

// Complete skill permissions mapping for all 11 skills
export const SKILL_PERMISSIONS: Record<string, string[]> = {
  // Current Skills (3-skill setup)
  'stream_ops': [
    'read_system_status', 'read_logs', 'send_notifications', 'suggest_fixes',
    'monitor_streams', 'detect_errors', 'approve_fixes', 'mobile_alerts'
  ],
  'graphics_auto': [
    'create_graphics', 'modify_overlays', 'generate_cosmetics', 'ai_generation',
    'brand_consistency', 'export_graphics', 'template_creation'
  ],
  'audio_mixer': [
    'read_audio_settings', 'suggest_optimizations', 'generate_audio', 'intelligent_mixing',
    'noise_reduction', 'real_time_optimization', 'sound_library_access'
  ],
  
  // Future Skills
  'analytics_insights': [
    'read_analytics', 'generate_reports', 'access_engagement_data', 'performance_predictions',
    'trend_analysis', 'audience_insights', 'revenue_optimization'
  ],
  'event_automation': [
    'schedule_events', 'send_notifications', 'manage_chat', 'peak_time_optimization',
    'event_templates', 'performance_tracking', 'automated_hosting'
  ],
  'moderation_assistant': [
    'read_chat_data', 'apply_moderation_rules', 'enforce_community_rules', 'ai_moderation',
    'spam_detection', 'content_filtering', 'safety_analytics'
  ],
  'custom_personas': [
    'create_ai_personas', 'modify_personality', 'event_behavior', 'temporary_creation',
    'voice_customization', 'text_customization', 'performance_analytics'
  ],
  'chat_games': [
    'host_games', 'manage_leaderboards', 'distribute_prizes', 'interactive_content',
    'game_creation', 'automated_hosting', 'prize_management'
  ],
  'content_summaries': [
    'analyze_content', 'generate_summaries', 'create_clips', 'social_media_generation',
    'highlight_detection', 'multi_platform_publishing', 'content_curation'
  ],
  'voice_effects': [
    'modify_voice', 'apply_effects', 'real_time_transformation', 'voice_modulation',
    'effect_library', 'voice_cloning', 'background_music_integration'
  ],
  'donation_manager': [
    'read_donation_data', 'apply_rewards', 'manage_incentives', 'cosmetic_effects',
    'donor_tier_management', 'personalized_thanks', 'reward_analytics'
  ]
};

// Complete dataset access mapping for all skills
export const SKILL_DATASET_ACCESS: Record<string, string[]> = {
  // Current Skills
  'stream_ops': [
    'stream_metrics', 'error_logs', 'performance_data', 'monitoring_data',
    'alert_history', 'fix_suggestions', 'integration_data'
  ],
  'graphics_auto': [
    'graphic_templates', 'overlay_data', 'cosmetic_library', 'ai_models',
    'brand_assets', 'export_formats', 'generation_history'
  ],
  'audio_mixer': [
    'audio_data', 'audio_settings', 'sound_library', 'mixing_patterns',
    'optimization_history', 'noise_profiles', 'effect_library'
  ],
  
  // Future Skills
  'analytics_insights': [
    'analytics_data', 'engagement_metrics', 'performance_trends', 'audience_data',
    'revenue_data', 'prediction_models', 'insight_reports'
  ],
  'event_automation': [
    'event_data', 'scheduler_data', 'notification_history', 'peak_time_data',
    'event_templates', 'hosting_logs', 'performance_metrics'
  ],
  'moderation_assistant': [
    'chat_logs', 'moderation_history', 'community_rules', 'moderation_patterns',
    'safety_reports', 'content_filters', 'moderation_analytics'
  ],
  'custom_personas': [
    'persona_data', 'personality_traits', 'event_logs', 'voice_models',
    'behavior_patterns', 'customization_history', 'performance_data'
  ],
  'chat_games': [
    'game_data', 'leaderboard_data', 'prize_history', 'game_templates',
    'interaction_logs', 'participation_metrics', 'game_analytics'
  ],
  'content_summaries': [
    'content_data', 'clip_library', 'social_posts', 'summary_models',
    'highlight_data', 'publication_history', 'content_analytics'
  ],
  'voice_effects': [
    'voice_data', 'effect_library', 'transformation_history', 'voice_models',
    'effect_patterns', 'audio_processing_data', 'usage_analytics'
  ],
  'donation_manager': [
    'donation_data', 'reward_history', 'incentive_data', 'cosmetic_library',
    'donor_profiles', 'reward_patterns', 'incentive_analytics'
  ]
};

// Trust level mapping for different skill categories
export const SKILL_TRUST_LEVELS: Record<string, number> = {
  // Monitoring skills - higher trust due to system access
  'stream_ops': 3,
  'analytics_insights': 3,
  
  // Creative skills - medium trust
  'graphics_auto': 2,
  'audio_mixer': 2,
  'voice_effects': 2,
  'content_summaries': 2,
  'custom_personas': 2,
  
  // Automation skills - higher trust due to automated actions
  'event_automation': 3,
  'donation_manager': 3,
  'chat_games': 2,
  
  // Safety-critical skills - highest trust
  'moderation_assistant': 4
};

// Enhanced orchestration function with complete skill integration
export const orchestrateSkillInstallation = async (
  userId: string, 
  skillId: string, 
  tierId: string
): Promise<LLMOrchestrationResponse> => {
  try {
    const payload: EnhancedLLMPayload = {
      userId,
      skillId,
      tierId,
      action: 'install_skill',
      permissions: SKILL_PERMISSIONS[skillId] || [],
      trustLevel: SKILL_TRUST_LEVELS[skillId] || 1,
      datasetAccess: SKILL_DATASET_ACCESS[skillId] || [],
      timestamp: Date.now(),
      metadata: {
        source: 'skill_install',
        userAgent: 'Acey Mobile App',
        skillCategory: getSkillCategory(skillId),
        installationType: 'manual'
      }
    };

    const response = await axios.post(`${API_BASE_URL}/llm/orchestrate`, payload);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to orchestrate skill installation');
    }
    
    console.log(`LLM orchestration completed for skill ${skillId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`LLM orchestration error for skill ${skillId}:`, error);
    throw error;
  }
};

// Batch orchestration for auto-unlocked skills
export const orchestrateBatchSkillInstallation = async (
  userId: string, 
  skillIds: string[], 
  tierId: string
): Promise<LLMOrchestrationResponse[]> => {
  const results: LLMOrchestrationResponse[] = [];
  
  for (const skillId of skillIds) {
    try {
      const result = await orchestrateSkillInstallation(userId, skillId, tierId);
      results.push(result);
    } catch (error) {
      console.error(`Failed to orchestrate skill ${skillId}:`, error);
      // Continue with other skills even if one fails
      results.push({
        success: false,
        permissionsUpdated: [],
        trustLevelUpdated: 0,
        datasetAccessUpdated: [],
        error: `Failed to orchestrate ${skillId}`,
        message: 'Batch installation continued with error'
      });
    }
  }
  
  return results;
};

// Get skill category for metadata
export const getSkillCategory = (skillId: string): string => {
  const categoryMap: Record<string, string> = {
    'stream_ops': 'monitoring',
    'graphics_auto': 'creative',
    'audio_mixer': 'optimization',
    'analytics_insights': 'analytics',
    'event_automation': 'ops_automation',
    'moderation_assistant': 'moderation',
    'custom_personas': 'entertainment',
    'chat_games': 'entertainment',
    'content_summaries': 'content',
    'voice_effects': 'entertainment',
    'donation_manager': 'ops_automation'
  };
  
  return categoryMap[skillId] || 'unknown';
};

// Get skill risk level for additional safety checks
export const getSkillRiskLevel = (skillId: string): 'low' | 'medium' | 'high' => {
  const riskMap: Record<string, 'low' | 'medium' | 'high'> = {
    'stream_ops': 'medium',
    'graphics_auto': 'low',
    'audio_mixer': 'low',
    'analytics_insights': 'medium',
    'event_automation': 'medium',
    'moderation_assistant': 'high',
    'custom_personas': 'low',
    'chat_games': 'low',
    'content_summaries': 'medium',
    'voice_effects': 'low',
    'donation_manager': 'medium'
  };
  
  return riskMap[skillId] || 'low';
};

// Validate skill compatibility with user tier
export const validateSkillCompatibility = (
  skillId: string, 
  userTierId: string
): { compatible: boolean; reason?: string } => {
  const skillRequirements: Record<string, string> = {
    'stream_ops': 'pro',
    'graphics_auto': 'creator-plus',
    'audio_mixer': 'creator-plus',
    'analytics_insights': 'pro',
    'event_automation': 'pro',
    'moderation_assistant': 'enterprise',
    'custom_personas': 'creator-plus',
    'chat_games': 'pro',
    'content_summaries': 'creator-plus',
    'voice_effects': 'creator-plus',
    'donation_manager': 'pro'
  };
  
  const requiredTier = skillRequirements[skillId];
  if (!requiredTier) {
    return { compatible: false, reason: 'Unknown skill requirements' };
  }
  
  const tiers = ['free', 'creator-plus', 'pro', 'enterprise'];
  const requiredIndex = tiers.indexOf(requiredTier);
  const currentIndex = tiers.indexOf(userTierId);
  
  if (currentIndex >= requiredIndex) {
    return { compatible: true };
  }
  
  return { 
    compatible: false, 
    reason: `Requires ${requiredTier} tier or higher` 
  };
};

export default {
  SKILL_PERMISSIONS,
  SKILL_DATASET_ACCESS,
  SKILL_TRUST_LEVELS,
  orchestrateSkillInstallation,
  orchestrateBatchSkillInstallation,
  getSkillCategory,
  getSkillRiskLevel,
  validateSkillCompatibility
};
