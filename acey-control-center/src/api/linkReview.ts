/**
 * Link Review Service - Acey's universal link analysis system
 * Handles GitHub repos, gists, documentation, issues, and general URLs
 */

export type LinkType = 'GitHubRepo' | 'Gist' | 'Documentation' | 'Issue' | 'Media' | 'Other';

export interface LinkReview {
  url: string;
  type: LinkType;
  summary: string;
  suggestions: string[];
  highlights: string[];
  rating?: 'excellent' | 'good' | 'needs-work' | 'poor';
  downloadUrl?: string;
  processingTime: number;
}

export interface ReviewOptions {
  includeDownload?: boolean;
  maxContentLength?: number;
  focusAreas?: string[];
}

/**
 * Detect link type from URL
 */
export function detectLinkType(url: string): LinkType {
  if (url.includes('github.com') && !url.includes('/gist')) return 'GitHubRepo';
  if (url.includes('gist.github.com')) return 'Gist';
  if (url.includes('/wiki/') || url.includes('/docs/') || url.includes('documentation')) return 'Documentation';
  if (url.includes('/issues/') || url.includes('/pull/')) return 'Issue';
  if (url.match(/\.(jpg|jpeg|png|gif|mp3|mp4|wav)$/i)) return 'Media';
  return 'Other';
}

/**
 * Fetch content based on link type
 */
export async function fetchContent(url: string, options: ReviewOptions = {}): Promise<string | null> {
  const { maxContentLength = 50000 } = options;
  
  try {
    switch (detectLinkType(url)) {
      case 'GitHubRepo':
        return await fetchGitHubRepo(url, maxContentLength);
      case 'Gist':
        return await fetchGistContent(url);
      case 'Documentation':
        return await fetchDocContent(url, maxContentLength);
      case 'Issue':
        return await fetchIssueContent(url);
      case 'Media':
        return await fetchMediaMetadata(url);
      default:
        return await fetchTextContent(url, maxContentLength);
    }
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
}

/**
 * Fetch GitHub repository content
 */
async function fetchGitHubRepo(url: string, maxLength: number): Promise<string> {
  // Extract owner and repo from URL
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  
  const [, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
  
  const response = await fetch(apiUrl);
  const files = await response.json();
  
  // Focus on main source files
  const sourceFiles = files
    .filter((file: any) => 
      file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|go|rs)$/) &&
      file.size < maxLength
    )
    .slice(0, 10); // Limit to 10 files
  
  let content = `# Repository: ${owner}/${repo}\n\n`;
  
  for (const file of sourceFiles) {
    content += `## ${file.name}\n`;
    const fileResponse = await fetch(file.download_url);
    const fileContent = await fileResponse.text();
    content += fileContent.substring(0, 2000) + '\n\n'; // Truncate large files
  }
  
  return content;
}

/**
 * Fetch GitHub gist content
 */
async function fetchGistContent(url: string): Promise<string> {
  const gistId = url.split('/').pop();
  const response = await fetch(`https://api.github.com/gists/${gistId}`);
  const gist = await response.json();
  
  let content = `# Gist: ${gist.description || 'Untitled'}\n\n`;
  
  for (const [filename, fileData] of Object.entries(gist.files)) {
    content += `## ${filename}\n`;
    content += (fileData as any).content + '\n\n';
  }
  
  return content;
}

/**
 * Fetch documentation content
 */
async function fetchDocContent(url: string, maxLength: number): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  
  // Simple text extraction (in production, use proper HTML parsing)
  const text = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text.substring(0, maxLength);
}

/**
 * Fetch issue/PR content
 */
async function fetchIssueContent(url: string): Promise<string> {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/(\d+)/);
  if (!match) throw new Error('Invalid issue URL');
  
  const [, owner, repo, type, number] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/${type}s/${number}`;
  
  const response = await fetch(apiUrl);
  const issue = await response.json();
  
  let content = `# ${type === 'pull' ? 'Pull Request' : 'Issue'} #${issue.number}\n\n`;
  content += `**Title:** ${issue.title}\n\n`;
  content += `**State:** ${issue.state}\n\n`;
  content += `**Author:** ${issue.user.login}\n\n`;
  content += `**Body:**\n${issue.body}\n\n`;
  
  if (issue.comments > 0) {
    content += `**Comments:** ${issue.comments}\n`;
  }
  
  return content;
}

/**
 * Fetch media metadata
 */
async function fetchMediaMetadata(url: string): Promise<string> {
  return `Media file detected: ${url}\nType: ${url.split('.').pop()}\nNote: Media analysis requires specialized processing.`;
}

/**
 * Fetch general text content
 */
async function fetchTextContent(url: string, maxLength: number): Promise<string> {
  const response = await fetch(url);
  const text = await response.text();
  return text.substring(0, maxLength);
}

/**
 * Analyze content with LLM (placeholder - integrate with existing LLM orchestrator)
 */
export async function analyzeWithLLM(content: string, linkType: LinkType, options: ReviewOptions = {}): Promise<Partial<LinkReview>> {
  // This would integrate with your existing LLM orchestrator
  // For now, return a structured response
  
  const analysis = {
    summary: `Content analysis for ${linkType}`,
    suggestions: [
      'Consider adding more documentation',
      'Review code style consistency',
      'Add error handling'
    ],
    highlights: [
      'Good structure detected',
      'Clear variable naming',
      'Proper error handling in some areas'
    ],
    rating: 'good' as const,
    processingTime: Date.now()
  };
  
  return analysis;
}

/**
 * Complete link review workflow
 */
export async function reviewLink(url: string, options: ReviewOptions = {}): Promise<LinkReview> {
  const startTime = Date.now();
  
  const type = detectLinkType(url);
  const content = await fetchContent(url, options);
  
  if (!content) {
    throw new Error('Unable to fetch content');
  }
  
  const analysis = await analyzeWithLLM(content, type, options);
  
  return {
    url,
    type,
    summary: analysis.summary || 'No summary available',
    suggestions: analysis.suggestions || [],
    highlights: analysis.highlights || [],
    rating: analysis.rating,
    downloadUrl: options.includeDownload ? url : undefined,
    processingTime: Date.now() - startTime
  };
}

/**
 * Batch review multiple links
 */
export async function reviewMultipleLinks(urls: string[], options: ReviewOptions = {}): Promise<LinkReview[]> {
  const reviews = await Promise.all(
    urls.map(url => reviewLink(url, options))
  );
  
  return reviews;
}
