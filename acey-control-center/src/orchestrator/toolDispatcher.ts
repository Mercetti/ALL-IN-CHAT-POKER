/**
 * Tool Dispatcher
 * Routes intents to appropriate skill modules
 */

import { Intent } from './intentRouter';
import { UserMessage } from './aceyOrchestrator';

export interface SkillResult {
  skillsUsed: string[];
  data: any;
  metadata: {
    processingTime: number;
    module: string;
    confidence: number;
  };
}

/**
 * Dispatch intent to appropriate skill modules
 */
export async function dispatchToSkills(
  intent: Intent,
  input: UserMessage,
  user: any
): Promise<SkillResult> {
  const startTime = Date.now();
  
  try {
    let result: SkillResult;
    
    switch (intent.type) {
      case 'code_help':
        result = await dispatchToCodeModule(intent, input);
        break;
        
      case 'generate_image':
        result = await dispatchToGraphicsModule(intent, input);
        break;
        
      case 'generate_audio':
        result = await dispatchToAudioModule(intent, input);
        break;
        
      case 'review_link':
        result = await dispatchToLinkReviewModule(intent, input);
        break;
        
      case 'start_game':
      case 'chat_interaction':
        result = await dispatchToGamesModule(intent, input);
        break;
        
      case 'stream_monitoring':
      case 'error_detection':
        result = await dispatchToStreamingModule(intent, input);
        break;
        
      default:
        result = await dispatchToGeneralModule(intent, input);
    }
    
    result.metadata.processingTime = Date.now() - startTime;
    return result;
    
  } catch (error) {
    console.error(`❌ Skill dispatch error for ${intent.type}:`, error);
    throw error;
  }
}

/**
 * Code Module Dispatcher
 */
async function dispatchToCodeModule(intent: Intent, input: UserMessage): Promise<SkillResult> {
  // This would integrate with your existing code analysis modules
  const codeContext = await extractCodeFromInput(input.content);
  
  // Mock implementation - replace with actual module calls
  const analysis = await analyzeCode(codeContext);
  const fix = await suggestFix(analysis);
  const explanation = await explainCode(fix);
  
  return {
    skillsUsed: ['code_helper'],
    data: {
      analysis,
      fix,
      explanation,
      codeContext
    },
    metadata: {
      processingTime: 0, // Will be set by dispatcher
      module: 'modules/code',
      confidence: intent.confidence
    }
  };
}

/**
 * Graphics Module Dispatcher
 */
async function dispatchToGraphicsModule(intent: Intent, input: UserMessage): Promise<SkillResult> {
  // This would integrate with your graphics generation modules
  const prompt = buildImagePrompt(intent.entities.description || input.content);
  
  // Mock implementation
  const image = await generateImage(prompt);
  const preview = await createImagePreview(image);
  
  return {
    skillsUsed: ['graphics_wizard'],
    data: {
      image,
      preview,
      prompt
    },
    metadata: {
      processingTime: 0,
      module: 'modules/graphics',
      confidence: intent.confidence
    }
  };
}

/**
 * Audio Module Dispatcher
 */
async function dispatchToAudioModule(intent: Intent, input: UserMessage): Promise<SkillResult> {
  // This would integrate with your audio generation modules
  const audioSpec = parseAudioIntent(intent.entities.description || input.content);
  
  // Mock implementation
  const audioFile = await generateAudio(audioSpec);
  const preview = await createAudioPreview(audioFile);
  
  return {
    skillsUsed: ['audio_maestro'],
    data: {
      audioFile,
      preview,
      audioSpec
    },
    metadata: {
      processingTime: 0,
      module: 'modules/audio',
      confidence: intent.confidence
    }
  };
}

/**
 * Link Review Module Dispatcher
 */
async function dispatchToLinkReviewModule(intent: Intent, input: UserMessage): Promise<SkillResult> {
  // This would integrate with your existing link review service
  const url = intent.entities.url || extractUrlFromInput(input.content);
  
  if (!url) {
    throw new Error('No URL found for link review');
  }
  
  // Import and use your existing link review service
  const { reviewLink } = await import('../api/linkReview');
  const review = await reviewLink(url);
  
  return {
    skillsUsed: ['link_review'],
    data: {
      review,
      url
    },
    metadata: {
      processingTime: 0,
      module: 'modules/link-review',
      confidence: intent.confidence
    }
  };
}

/**
 * Games Module Dispatcher
 */
async function dispatchToGamesModule(intent: Intent, input: UserMessage): Promise<SkillResult> {
  // This would integrate with your games modules
  const gameSpec = parseGameIntent(intent.entities, input.content);
  
  // Mock implementation
  const gameState = await initializeGame(gameSpec);
  
  return {
    skillsUsed: ['ai_cohost_games'],
    data: {
      gameState,
      gameSpec
    },
    metadata: {
      processingTime: 0,
      module: 'modules/games',
      confidence: intent.confidence
    }
  };
}

/**
 * Streaming Module Dispatcher
 */
async function dispatchToStreamingModule(intent: Intent, input: UserMessage): Promise<SkillResult> {
  // This would integrate with your streaming modules
  const streamSpec = parseStreamIntent(intent.entities, input.content);
  
  // Mock implementation
  const streamData = await analyzeStream(streamSpec);
  
  return {
    skillsUsed: ['stream_ops'],
    data: {
      streamData,
      streamSpec
    },
    metadata: {
      processingTime: 0,
      module: 'modules/streaming',
      confidence: intent.confidence
    }
  };
}

/**
 * General Module Dispatcher
 */
async function dispatchToGeneralModule(intent: Intent, input: UserMessage): Promise<SkillResult> {
  // Fallback for general chat/queries
  const response = await generateGeneralResponse(input.content);
  
  return {
    skillsUsed: [],
    data: {
      response,
      type: 'general'
    },
    metadata: {
      processingTime: 0,
      module: 'modules/general',
      confidence: intent.confidence
    }
  };
}

// Helper functions (these would be implemented in their respective modules)
async function extractCodeFromInput(input: string): Promise<string> {
  const codeMatch = input.match(/```[\s\S]*?```|`[^`]+`/g);
  return codeMatch ? codeMatch[0] : input;
}

async function analyzeCode(code: string): Promise<any> {
  return { type: 'analysis', quality: 0.8, issues: [] };
}

async function suggestFix(analysis: any): Promise<any> {
  return { type: 'fix', suggestion: 'No issues found' };
}

async function explainCode(fix: any): Promise<string> {
  return 'Code looks good!';
}

function buildImagePrompt(description: string): string {
  return description || 'Generate an image';
}

async function generateImage(prompt: string): Promise<any> {
  return { type: 'image', url: 'blob://generated-image', prompt };
}

async function createImagePreview(image: any): Promise<any> {
  return { type: 'preview', src: image.url };
}

function parseAudioIntent(description: string): any {
  return { type: 'audio', description };
}

async function generateAudio(spec: any): Promise<any> {
  return { type: 'audio', url: 'blob://generated-audio', spec };
}

async function createAudioPreview(audio: any): Promise<any> {
  return { type: 'preview', src: audio.url };
}

function extractUrlFromInput(input: string): string | null {
  const match = input.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

function parseGameIntent(entities: any, input: string): any {
  return { type: 'game', entities, input };
}

async function initializeGame(spec: any): Promise<any> {
  return { type: 'game', state: 'initialized', spec };
}

function parseStreamIntent(entities: any, input: string): any {
  return { type: 'stream', entities, input };
}

async function analyzeStream(spec: any): Promise<any> {
  return { type: 'stream', status: 'healthy', spec };
}

async function generateGeneralResponse(input: string): Promise<string> {
  return `I understand you said: "${input}". How can I help you?`;
}

export default {
  dispatchToSkills
};
