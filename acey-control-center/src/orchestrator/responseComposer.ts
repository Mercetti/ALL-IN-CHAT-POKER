/**
 * Response Composer
 * Composes final user responses from skill results and previews
 */

import { SkillResult } from './toolDispatcher';
import { Preview } from './aceyOrchestrator';

export interface ComposedResponse {
  content: string;
  previews: Preview[];
  metadata: {
    responseType: string;
    hasPreviews: boolean;
    confidence: number;
  };
}

/**
 * Compose response from skill results and previews
 */
export async function composeResponse(
  result: SkillResult,
  previews: Preview[]
): Promise<ComposedResponse> {
  try {
    let content = '';
    let responseType = 'text';
    
    switch (result.metadata.module) {
      case 'modules/code':
        content = composeCodeResponse(result.data);
        responseType = 'code';
        break;
        
      case 'modules/graphics':
        content = composeGraphicsResponse(result.data);
        responseType = 'image';
        break;
        
      case 'modules/audio':
        content = composeAudioResponse(result.data);
        responseType = 'audio';
        break;
        
      case 'modules/link-review':
        content = composeLinkReviewResponse(result.data);
        responseType = 'link_review';
        break;
        
      case 'modules/games':
        content = composeGameResponse(result.data);
        responseType = 'game';
        break;
        
      case 'modules/streaming':
        content = composeStreamResponse(result.data);
        responseType = 'stream';
        break;
        
      default:
        content = composeGeneralResponse(result.data);
        responseType = 'general';
    }
    
    return {
      content,
      previews,
      metadata: {
        responseType,
        hasPreviews: previews.length > 0,
        confidence: result.metadata.confidence
      }
    };
    
  } catch (error) {
    console.error('❌ Response composition error:', error);
    return {
      content: 'Sorry, I had trouble processing that request.',
      previews: [],
      metadata: {
        responseType: 'error',
        hasPreviews: false,
        confidence: 0
      }
    };
  }
}

/**
 * Compose code analysis response
 */
function composeCodeResponse(data: any): string {
  const { analysis, fix, explanation } = data;
  
  let response = '## 🔍 Code Analysis\n\n';
  
  if (analysis.issues && analysis.issues.length > 0) {
    response += '**Issues Found:**\n';
    analysis.issues.forEach((issue: any, index: number) => {
      response += `${index + 1}. ${issue.description}\n`;
    });
    response += '\n';
  } else {
    response += '✅ No issues found in your code!\n\n';
  }
  
  if (fix && fix.suggestion) {
    response += '**💡 Suggested Fix:**\n';
    response += '```' + detectLanguage(data.codeContext) + '\n';
    response += fix.suggestion + '\n';
    response += '```\n\n';
  }
  
  if (explanation) {
    response += '**📝 Explanation:**\n';
    response += explanation + '\n';
  }
  
  return response;
}

/**
 * Compose graphics generation response
 */
function composeGraphicsResponse(data: any): string {
  const { prompt } = data;
  
  let response = '## 🎨 Image Generated\n\n';
  response += '**Prompt:** ' + (prompt || 'Generated based on your request') + '\n\n';
  response += 'Your image is ready below. You can download, regenerate, or edit it using the action buttons.\n\n';
  response += '💡 **Tip:** Be more specific with your descriptions for better results!';
  
  return response;
}

/**
 * Compose audio generation response
 */
function composeAudioResponse(data: any): string {
  const { audioSpec } = data;
  
  let response = '## 🎵 Audio Generated\n\n';
  response += '**Audio Type:** ' + (audioSpec?.type || 'General audio') + '\n\n';
  response += 'Your audio is ready to play below. Use the controls to listen, download, or regenerate.\n\n';
  response += '💡 **Tip:** Specify mood, tempo, or instruments for better results!';
  
  return response;
}

/**
 * Compose link review response
 */
function composeLinkReviewResponse(data: any): string {
  const { review, url } = data;
  
  let response = '## 🔗 Link Review\n\n';
  response += '**URL:** ' + url + '\n\n';
  response += '**Type:** ' + (review?.type || 'Unknown') + '\n\n';
  
  if (review?.summary) {
    response += '**📋 Summary:**\n';
    response += review.summary + '\n\n';
  }
  
  if (review?.highlights && review.highlights.length > 0) {
    response += '**✨ Key Highlights:**\n';
    review.highlights.forEach((highlight: string, index: number) => {
      response += `${index + 1}. ${highlight}\n`;
    });
    response += '\n';
  }
  
  if (review?.suggestions && review.suggestions.length > 0) {
    response += '**💡 Suggestions:**\n';
    review.suggestions.forEach((suggestion: string, index: number) => {
      response += `${index + 1}. ${suggestion}\n`;
    });
    response += '\n';
  }
  
  if (review?.rating) {
    const ratingEmoji = {
      excellent: '🟢',
      good: '🟡',
      'needs-work': '🟠',
      poor: '🔴'
    };
    response += '**Rating:** ' + (ratingEmoji[review.rating as keyof typeof ratingEmoji] || '⚪') + ' ' + review.rating.toUpperCase() + '\n\n';
  }
  
  response += 'Use the action buttons below to approve, download, or share this analysis.';
  
  return response;
}

/**
 * Compose game response
 */
function composeGameResponse(data: any): string {
  const { gameSpec, gameState } = data;
  
  let response = '## 🎮 Game Ready\n\n';
  response += '**Game:** ' + (gameSpec?.type || 'Trivia') + '\n\n';
  response += '**Status:** ' + (gameState?.status || 'Waiting for players') + '\n\n';
  
  if (gameState?.players) {
    response += '**Players:** ' + gameState.players + '\n\n';
  }
  
  response += 'Use the action buttons to start the game, join as a player, or spectate.';
  
  return response;
}

/**
 * Compose stream response
 */
function composeStreamResponse(data: any): string {
  const { streamData } = data;
  
  let response = '## 📺 Stream Status\n\n';
  response += '**Status:** ' + (streamData?.status || 'Offline') + '\n\n';
  
  if (streamData?.viewers !== undefined) {
    response += '**Viewers:** ' + streamData.viewers + '\n\n';
  }
  
  if (streamData?.quality) {
    response += '**Quality:** ' + streamData.quality + '\n\n';
  }
  
  if (streamData?.status === 'healthy') {
    response += '✅ Your stream is running smoothly!\n\n';
  } else if (streamData?.status === 'warning') {
    response += '⚠️ Some issues detected. Check your stream settings.\n\n';
  } else if (streamData?.status === 'error') {
    response += '❌ Stream problems detected. Immediate attention required.\n\n';
  }
  
  response += 'Use the action buttons to view detailed metrics, manage settings, or set up alerts.';
  
  return response;
}

/**
 * Compose general response
 */
function composeGeneralResponse(data: any): string {
  if (data.response) {
    return data.response;
  }
  
  return 'I understand your request. How can I help you further?';
}

/**
 * Detect programming language (simplified version)
 */
function detectLanguage(code: string): string {
  if (!code) return '';
  
  if (code.includes('function') || code.includes('const') || code.includes('=>')) return 'javascript';
  if (code.includes('def ') || code.includes('import ')) return 'python';
  if (code.includes('interface') || code.includes(': string')) return 'typescript';
  if (code.includes('public class') || code.includes('System.out')) return 'java';
  if (code.includes('#include') || code.includes('std::')) return 'cpp';
  if (code.includes('<html') || code.includes('<div')) return 'html';
  if (code.includes('color:') || code.includes('margin:')) return 'css';
  
  return '';
}

/**
 * Format response with markdown
 */
export function formatMarkdown(content: string): string {
  // Basic markdown formatting - enhance as needed
  return content
    .replace(/\*\*(.*?)\*\*/g, '**$1**') // Bold
    .replace(/\*(.*?)\*/g, '*$1*') // Italic
    .replace(/`(.*?)`/g, '`$1`') // Inline code
    .replace(/```(.*?)```/gs, '```$1```'); // Code blocks
}

/**
 * Get response type icon
 */
export function getResponseTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    code: '💻',
    image: '🎨',
    audio: '🎵',
    link_review: '🔗',
    game: '🎮',
    stream: '📺',
    general: '💬',
    error: '❌'
  };
  
  return iconMap[type] || '💬';
}

export default {
  composeResponse,
  formatMarkdown,
  getResponseTypeIcon
};
