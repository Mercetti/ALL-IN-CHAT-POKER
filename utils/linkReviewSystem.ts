// External Link Review System for Acey

export type LinkType =
  | 'GitHubRepo'
  | 'Gist'
  | 'Documentation'
  | 'Issue'
  | 'Video'
  | 'API'
  | 'Other';

export interface LinkReviewResult {
  summary: string;
  suggestions: string[];
  actionablePoints: string[];
  confidence: number;
  contentPreview?: string;
}

export interface ReviewFeedback {
  type: 'approve' | 'needs_improvement';
  comment?: string;
  trustScore: number;
  timestamp: number;
}

// Link type detection
export function detectLinkType(url: string): LinkType {
  if (url.includes('github.com') && !url.includes('/gist')) return 'GitHubRepo';
  if (url.includes('gist.github.com')) return 'Gist';
  if (url.includes('/wiki/') || url.includes('/docs/')) return 'Documentation';
  if (url.includes('/issues/')) return 'Issue';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'Video';
  if (url.includes('api.') || url.includes('swagger')) return 'API';
  return 'Other';
}

// Content fetching based on link type
export async function fetchLinkContent(url: string, type: LinkType): Promise<string | null> {
  try {
    switch (type) {
      case 'GitHubRepo':
      case 'Gist':
        return await fetchGitHubContent(url);
      case 'Documentation':
        return await fetchDocumentationContent(url);
      case 'Issue':
        return await fetchIssueContent(url);
      case 'Video':
        return await fetchVideoTranscript(url);
      case 'API':
        return await fetchApiDocumentation(url);
      default:
        return await fetchGenericContent(url);
    }
  } catch (err) {
    console.error('Error fetching link content:', err);
    return null;
  }
}

// GitHub/Gist content fetching
async function fetchGitHubContent(url: string): Promise<string> {
  // Mock implementation - would use GitHub API in production
  const mockContent = `
// GitHub Repository Content
export const exampleFunction = () => {
  console.log('Example function from GitHub repo');
  return 'Hello from GitHub!';
};

// Component or utility code...
export const config = {
  apiUrl: 'https://api.example.com',
  version: '1.0.0'
};
  `;
  return mockContent.trim();
}

// Documentation content fetching
async function fetchDocumentationContent(url: string): Promise<string> {
  // Mock implementation - would parse and extract key sections
  return `
# Documentation Summary

## Getting Started
1. Install dependencies
2. Configure environment
3. Run the application

## API Reference
- Method: getData()
- Method: processData()
- Configuration options

## Troubleshooting
Common issues and solutions...
  `.trim();
}

// Issue content fetching
async function fetchIssueContent(url: string): Promise<string> {
  // Extract issue number and fetch details
  const issueMatch = url.match(/\/issues\/(\d+)/);
  const issueNumber = issueMatch ? issueMatch[1] : 'unknown';
  
  return `
# Issue #${issueNumber}

## Description
This issue describes a problem with the current implementation...

## Proposed Solution
The suggested fix involves updating the component structure...

## Steps to Reproduce
1. Open the application
2. Navigate to settings
3. Click the problematic button

## Expected Behavior
The application should work correctly without errors.

## Actual Behavior
Currently experiencing an error when...
  `.trim();
}

// Video transcript fetching
async function fetchVideoTranscript(url: string): Promise<string> {
  // Mock implementation - would use YouTube API or similar
  return `
# Video Transcript Summary

## Key Points
- Introduction to the main topic
- Step-by-step explanation
- Code examples and demonstrations
- Conclusion and next steps

## Time Stamps
- 0:00 - Introduction
- 1:30 - Main content
- 3:45 - Code examples
- 5:00 - Summary

## Actionable Items
- Try the provided code examples
- Implement the suggested improvements
- Follow up with additional questions
  `.trim();
}

// API documentation fetching
async function fetchApiDocumentation(url: string): Promise<string> {
  // Mock implementation - would parse OpenAPI/Swagger specs
  return `
# API Documentation

## Base URL
${url}

## Endpoints

### GET /api/data
Retrieves data from the system.

**Parameters:**
- \`limit\` (number, optional): Maximum number of items to return
- \`offset\` (number, optional): Number of items to skip

**Response:**
\`\`\`json
{
  "data": [...],
  "total": 100,
  "hasMore": true
}
\`\`\`

### POST /api/process
Processes incoming data.

**Request Body:**
\`\`\`json
{
  "input": "string",
  "options": {...}
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "result": "processed"
}
\`\`\`

## Authentication
API requires Bearer token authentication.

## Rate Limits
- 100 requests per minute
- 1000 requests per hour

## Error Codes
- 400: Bad Request
- 401: Unauthorized
- 429: Too Many Requests
- 500: Internal Server Error
  `.trim();
}

// Generic content fetching
async function fetchGenericContent(url: string): Promise<string> {
  // Safe fallback - extract text content
  return `
# External Content Analysis

## Source
${url}

## Extracted Content
This is external content that has been analyzed for key information...

## Key Takeaways
- Important point 1
- Important point 2
- Important point 3

## Recommendations
Based on the content analysis, here are suggested actions...
  `.trim();
}

// LLM analysis function
export async function analyzeExternalLink(url: string): Promise<LinkReviewResult> {
  const type = detectLinkType(url);
  const content = await fetchLinkContent(url, type);
  
  if (!content) {
    return {
      summary: 'Unable to fetch content for analysis',
      suggestions: ['Check if the URL is accessible', 'Try a different link format'],
      actionablePoints: ['Verify URL accessibility', 'Test link in browser'],
      confidence: 0.1
    };
  }

  // Mock LLM analysis - in production this would call your LLM service
  const analysis = await mockLLMAnalysis(content, type);
  
  return {
    summary: analysis.summary,
    suggestions: analysis.suggestions,
    actionablePoints: analysis.actionablePoints,
    confidence: analysis.confidence,
    contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
  };
}

// Mock LLM analysis (replace with actual LLM call)
async function mockLLMAnalysis(content: string, type: LinkType): Promise<{
  summary: string;
  suggestions: string[];
  actionablePoints: string[];
  confidence: number;
}> {
  // Simulate LLM processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const analyses = {
    GitHubRepo: {
      summary: 'GitHub repository with example functions and configuration',
      suggestions: [
        'Review code structure and organization',
        'Check for proper documentation',
        'Verify dependency management',
        'Look for test coverage'
      ],
      actionablePoints: [
        'Clone repository locally',
        'Run npm install to test dependencies',
        'Check for README with setup instructions',
        'Review code for best practices'
      ],
      confidence: 0.85
    },
    Gist: {
      summary: 'Code snippet or utility functions',
      suggestions: [
        'Test the code in a local environment',
        'Check for dependencies or requirements',
        'Review for security considerations',
        'Consider edge cases and error handling'
      ],
      actionablePoints: [
        'Copy code to test file',
        'Run with sample data',
        'Check for syntax errors',
        'Document usage examples'
      ],
      confidence: 0.75
    },
    Documentation: {
      summary: 'Technical documentation with setup and usage instructions',
      suggestions: [
        'Follow installation steps in order',
        'Test configuration options',
        'Check version compatibility',
        'Look for troubleshooting section'
      ],
      actionablePoints: [
        'Complete the getting started guide',
        'Test API endpoints with provided examples',
        'Configure environment variables',
        'Verify system requirements'
      ],
      confidence: 0.90
    },
    Issue: {
      summary: 'Bug report or feature request with reproduction steps',
      suggestions: [
        'Try to reproduce the issue locally',
        'Check if the issue still exists',
        'Look for related issues or pull requests',
        'Review proposed solution for feasibility'
      ],
      actionablePoints: [
        'Follow reproduction steps exactly',
        'Check system environment matches requirements',
        'Test with different input values',
        'Provide additional context if needed'
      ],
      confidence: 0.80
    },
    Video: {
      summary: 'Video tutorial or demonstration with step-by-step instructions',
      suggestions: [
        'Follow along with the video examples',
        'Pause and rewatch complex sections',
        'Try the code examples shown',
        'Check video description for additional resources'
      ],
      actionablePoints: [
        'Set up development environment as shown',
        'Code along with the instructor',
        'Test each example before proceeding',
        'Refer to video description for links'
      ],
      confidence: 0.70
    },
    API: {
      summary: 'API documentation with endpoints and usage examples',
      suggestions: [
        'Test API endpoints with provided examples',
        'Check authentication requirements',
        'Review rate limits and error handling',
        'Look for SDK or client libraries'
      ],
      actionablePoints: [
        'Try GET endpoint first',
        'Test with different parameter combinations',
        'Implement proper error handling',
        'Set up authentication headers'
      ],
      confidence: 0.88
    },
    Other: {
      summary: 'External web content with general information',
      suggestions: [
        'Review content for accuracy and relevance',
        'Check for additional resources or links',
        'Consider context and applicability',
        'Verify information is current'
      ],
      actionablePoints: [
        'Extract key information',
        'Look for supporting documentation',
        'Test any provided examples',
        'Cross-reference with other sources'
      ],
      confidence: 0.60
    }
  };

  return analyses[type] || analyses.Other;
}

// Feedback storage for learning system
export class ReviewFeedbackStore {
  private static instance: ReviewFeedbackStore;
  private feedback: Map<string, ReviewFeedback> = new Map();

  static getInstance(): ReviewFeedbackStore {
    if (!ReviewFeedbackStore.instance) {
      ReviewFeedbackStore.instance = new ReviewFeedbackStore();
    }
    return ReviewFeedbackStore.instance;
  }

  storeFeedback(outputId: string, feedback: ReviewFeedback): void {
    this.feedback.set(outputId, {
      ...feedback,
      timestamp: Date.now()
    });
    
    console.log(`[ReviewFeedback] Stored feedback for ${outputId}:`, feedback);
  }

  getFeedback(outputId: string): ReviewFeedback | undefined {
    return this.feedback.get(outputId);
  }

  getAllFeedback(): ReviewFeedback[] {
    return Array.from(this.feedback.values());
  }

  getFeedbackByType(type: 'approve' | 'needs_improvement'): ReviewFeedback[] {
    return Array.from(this.feedback.values()).filter(f => f.type === type);
  }

  // For LLM training integration
  exportForLearning(): Array<{
    outputId: string;
    feedback: ReviewFeedback;
    content: string;
  }> {
    const exported = [];
    
    for (const [outputId, feedback] of this.feedback.entries()) {
      // In a real implementation, you'd retrieve the actual content
      const content = `External link review content for ${outputId}`;
      
      exported.push({
        outputId,
        feedback,
        content
      });
    }
    
    return exported;
  }
}
