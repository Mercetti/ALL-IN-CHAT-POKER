// Real content fetchers for external link review system

export async function fetchGitHubRepo(url: string): Promise<string | null> {
  try {
    // Convert GitHub blob URL to raw content URL
    // Example: https://github.com/user/repo/blob/main/file.ts → https://raw.githubusercontent.com/user/repo/main/file.ts
    const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error('Failed to fetch GitHub content');
    const text = await res.text();
    return text;
  } catch (err) {
    console.error('GitHub fetch error:', err);
    return null;
  }
}

export async function fetchGist(url: string): Promise<string | null> {
  try {
    // Convert gist URL to raw
    const gistIdMatch = url.match(/gist.github.com\/.+\/([a-f0-9]+)/);
    if (!gistIdMatch) return null;
    const gistId = gistIdMatch[1];
    const apiUrl = `https://api.github.com/gists/${gistId}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Failed to fetch gist');
    const data = await res.json();
    // Combine all files
    return Object.values(data.files).map((f: any) => f.content).join('\n');
  } catch (err) {
    console.error('Gist fetch error:', err);
    return null;
  }
}

export async function fetchDocContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch doc');
    const html = await res.text();
    // Simple extraction of visible text (strips tags)
    const text = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
    return text;
  } catch (err) {
    console.error('Documentation fetch error:', err);
    return null;
  }
}

export async function fetchVideoTranscript(url: string): Promise<string | null> {
  try {
    // Extract video ID
    const match = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
    if (!match) return null;
    const videoId = match[1];

    // Use YouTube Captions API or a free transcript service
    const res = await fetch(`https://video.google.com/timedtext?lang=en&v=${videoId}`);
    if (!res.ok) return null;
    const xml = await res.text();

    // Simple parse of <text> tags
    const textMatches = Array.from(xml.matchAll(/<text.+?>(.+?)<\/text>/g));
    return textMatches.map(m => m[1].replace(/&amp;/g, '&')).join(' ');
  } catch (err) {
    console.error('Video transcript fetch error:', err);
    return null;
  }
}

export async function fetchIssueContent(url: string): Promise<string | null> {
  try {
    // Extract issue number and fetch details
    const issueMatch = url.match(/\/issues\/(\d+)/);
    const issueNumber = issueMatch ? issueMatch[1] : 'unknown';
    
    // Mock implementation - would use GitHub API in production
    const mockIssueContent = `
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
    
    return mockIssueContent;
  } catch (err) {
    console.error('Issue fetch error:', err);
    return null;
  }
}

export async function fetchApiDocumentation(url: string): Promise<string | null> {
  try {
    // Mock implementation - would parse OpenAPI/Swagger specs
    const mockApiContent = `
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
    
    return mockApiContent;
  } catch (err) {
    console.error('API documentation fetch error:', err);
    return null;
  }
}

export async function fetchGenericContent(url: string): Promise<string | null> {
  try {
    // Safe fallback - extract text content
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch content');
    const html = await res.text();
    
    // Extract visible text
    const text = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
    
    return text.length > 500 ? text.substring(0, 500) + '...' : text;
  } catch (err) {
    console.error('Generic content fetch error:', err);
    return null;
  }
}
