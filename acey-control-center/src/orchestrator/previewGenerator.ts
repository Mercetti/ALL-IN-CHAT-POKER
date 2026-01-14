/**
 * Preview Generator
 * Creates live previews for different content types
 */

import { SkillResult } from './toolDispatcher';
import { Preview } from './aceyOrchestrator';

/**
 * Generate previews for skill results
 */
export async function generatePreviews(result: SkillResult): Promise<Preview[]> {
  const previews: Preview[] = [];
  
  try {
    switch (result.metadata.module) {
      case 'modules/graphics':
        previews.push(await generateImagePreview(result.data));
        break;
        
      case 'modules/audio':
        previews.push(await generateAudioPreview(result.data));
        break;
        
      case 'modules/code':
        previews.push(await generateCodePreview(result.data));
        break;
        
      case 'modules/link-review':
        previews.push(await generateLinkReviewPreview(result.data));
        break;
        
      case 'modules/games':
        previews.push(await generateGamePreview(result.data));
        break;
        
      case 'modules/streaming':
        previews.push(await generateStreamPreview(result.data));
        break;
        
      default:
        // No preview for general responses
        break;
    }
    
    console.log(`👁️ Generated ${previews.length} preview(s) for ${result.metadata.module}`);
    return previews;
    
  } catch (error) {
    console.error('❌ Preview generation error:', error);
    return [];
  }
}

/**
 * Generate image preview
 */
async function generateImagePreview(data: any): Promise<Preview> {
  return {
    type: 'image',
    src: data.image?.url || 'blob://generated-image',
    actions: ['download', 'regenerate', 'edit'],
    metadata: {
      prompt: data.prompt,
      dimensions: { width: 512, height: 512 },
      format: 'png'
    }
  };
}

/**
 * Generate audio preview
 */
async function generateAudioPreview(data: any): Promise<Preview> {
  return {
    type: 'audio',
    src: data.audioFile?.url || 'blob://generated-audio',
    actions: ['download', 'regenerate', 'play'],
    metadata: {
      duration: data.audioFile?.duration || 30,
      format: 'mp3',
      bitrate: '128kbps',
      controls: true
    }
  };
}

/**
 * Generate code preview
 */
async function generateCodePreview(data: any): Promise<Preview> {
  return {
    type: 'code',
    src: data.codeContext || '',
    actions: ['download', 'copy', 'execute'],
    metadata: {
      language: detectLanguage(data.codeContext),
      lines: data.codeContext?.split('\n').length || 0,
      analysis: data.analysis,
      fix: data.fix
    }
  };
}

/**
 * Generate link review preview
 */
async function generateLinkReviewPreview(data: any): Promise<Preview> {
  return {
    type: 'link_review',
    src: data.url || '',
    actions: ['approve', 'download', 'share'],
    metadata: {
      review: data.review,
      rating: data.review?.rating,
      type: data.review?.type,
      summary: data.review?.summary
    }
  };
}

/**
 * Generate game preview
 */
async function generateGamePreview(data: any): Promise<Preview> {
  return {
    type: 'text', // Games don't have visual/audio previews yet
    src: JSON.stringify(data.gameState),
    actions: ['start', 'join', 'spectate'],
    metadata: {
      gameType: data.gameSpec?.type || 'trivia',
      players: data.gameState?.players || 0,
      status: data.gameState?.status || 'waiting'
    }
  };
}

/**
 * Generate stream preview
 */
async function generateStreamPreview(data: any): Promise<Preview> {
  return {
    type: 'text', // Stream status is text-based
    src: JSON.stringify(data.streamData),
    actions: ['view', 'manage', 'alerts'],
    metadata: {
      status: data.streamData?.status || 'offline',
      viewers: data.streamData?.viewers || 0,
      quality: data.streamData?.quality || 'unknown'
    }
  };
}

/**
 * Detect programming language from code
 */
function detectLanguage(code: string): string {
  if (!code) return 'text';
  
  const patterns = {
    javascript: [/function\s+\w+|const\s+\w+\s*=|=>|import\s+.*from/],
    python: [/def\s+\w+|import\s+\w+|print\(|class\s+\w+:/],
    typescript: [/interface\s+\w+|type\s+\w+\s*=|: string|: number/],
    java: [/public\s+class|private\s+\w+|System\.out\.println/],
    cpp: [/#include|std::|cout\s*<<|int\s+main\(\)/],
    html: [/<html|<div|<p|<script/],
    css: [/{|color:|margin:|padding:|background:/],
    json: [/{\s*".*":|".*":\s*"/],
    sql: [/SELECT|FROM|WHERE|INSERT|UPDATE|DELETE/]
  };
  
  for (const [language, languagePatterns] of Object.entries(patterns)) {
    if (languagePatterns.some(pattern => pattern.test(code))) {
      return language;
    }
  }
  
  return 'text';
}

/**
 * Create blob URL for preview
 */
export function createBlobUrl(data: any, mimeType: string): string {
  try {
    const blob = new Blob([data], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('❌ Blob creation error:', error);
    return '';
  }
}

/**
 * Cleanup blob URLs
 */
export function cleanupBlobUrls(urls: string[]): void {
  urls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Blob cleanup error:', error);
    }
  });
}

/**
 * Get preview actions based on content type
 */
export function getPreviewActions(type: Preview['type']): string[] {
  const actionMap: Record<Preview['type'], string[]> = {
    image: ['download', 'regenerate', 'edit', 'share'],
    audio: ['download', 'regenerate', 'play', 'share'],
    code: ['download', 'copy', 'execute', 'share'],
    link_review: ['approve', 'download', 'share'],
    text: ['copy', 'share']
  };
  
  return actionMap[type] || ['copy', 'share'];
}

export default {
  generatePreviews,
  createBlobUrl,
  cleanupBlobUrls,
  getPreviewActions
};
