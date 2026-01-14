import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export interface ApprovedOutput {
  id: string;
  skillType: 'code' | 'audio' | 'graphics' | 'link';
  skillId: string;
  input: any;
  output: {
    snippet?: string;
    url?: string;
    content?: string;
    safe?: boolean;
    categories?: string[];
    confidence?: number;
    summary?: string;
    dimensions?: string;
    duration?: number;
  };
  timestamp: string;
  approvedBy: string;
  tier: string;
  trustScore?: number;
  metadata?: {
    processingTime?: number;
    modelVersion?: string;
    validationPassed?: boolean;
    userFeedback?: string;
    previewUrl?: string;
  };
}

export async function getApprovedOutputs(userToken: string, limit = 20): Promise<ApprovedOutput[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/learning/approved-outputs`, {
      headers: { Authorization: `Bearer ${userToken}` },
      params: { limit }
    });
    return data;
  } catch (error) {
    console.warn('Failed to fetch approved outputs, using mock data:', error);
    
    // Mock data for demo purposes
    const mockOutputs: ApprovedOutput[] = [
      {
        id: 'out_001',
        skillType: 'code',
        skillId: 'code_helper',
        input: { snippet: 'helloWorld function' },
        output: { snippet: `function helloWorld() {\n  console.log("Hello, Acey!");\n  return "Success";\n}` },
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        approvedBy: 'user123',
        tier: 'Pro',
        trustScore: 0.95,
        metadata: {
          processingTime: 1200,
          modelVersion: '1.2.0',
          validationPassed: true,
          userFeedback: 'Clean, well-structured code'
        }
      },
      {
        id: 'out_002',
        skillType: 'audio',
        skillId: 'audio_maestro',
        input: { type: 'bgm', duration: 30 },
        output: { 
          url: 'https://acey-audio.s3.amazonaws.com/preview_001.mp3', 
          duration: 30 
        },
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        approvedBy: 'user123',
        tier: 'Pro',
        trustScore: 0.88,
        metadata: {
          processingTime: 2500,
          modelVersion: '1.2.0',
          validationPassed: true,
          previewUrl: 'https://acey-audio.s3.amazonaws.com/preview_001.mp3'
        }
      },
      {
        id: 'out_003',
        skillType: 'graphics',
        skillId: 'graphics_wizard',
        input: { style: 'neon', theme: 'cyberpunk' },
        output: { 
          url: 'https://acey-graphics.s3.amazonaws.com/preview_001.png', 
          dimensions: '1024x1024' 
        },
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        approvedBy: 'user123',
        tier: 'Creator+',
        trustScore: 0.92,
        metadata: {
          processingTime: 3200,
          modelVersion: '1.2.0',
          validationPassed: true,
          previewUrl: 'https://acey-graphics.s3.amazonaws.com/preview_001.png'
        }
      },
      {
        id: 'out_004',
        skillType: 'link',
        skillId: 'link_review',
        input: { url: 'https://example.com/article' },
        output: { 
          safe: true, 
          categories: ['general', 'technology'], 
          confidence: 0.96,
          summary: 'Safe content for general audiences'
        },
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        approvedBy: 'user123',
        tier: 'Pro',
        trustScore: 0.98,
        metadata: {
          processingTime: 800,
          modelVersion: '1.2.0',
          validationPassed: true
        }
      }
    ];
    
    return mockOutputs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export async function getOutputById(userToken: string, outputId: string): Promise<ApprovedOutput | null> {
  try {
    const { data } = await axios.get(`${BASE_URL}/learning/approved-outputs/${outputId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    return data;
  } catch (error) {
    console.error('Failed to fetch output by ID:', error);
    return null;
  }
}

export async function getOutputsBySkillType(userToken: string, skillType: string): Promise<ApprovedOutput[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/learning/approved-outputs`, {
      headers: { Authorization: `Bearer ${userToken}` },
      params: { skillType, limit: 50 }
    });
    return data;
  } catch (error) {
    console.error('Failed to fetch outputs by skill type:', error);
    return [];
  }
}

export async function searchOutputs(userToken: string, query: string): Promise<ApprovedOutput[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/learning/search-outputs`, {
      headers: { Authorization: `Bearer ${userToken}` },
      params: { q: query, limit: 20 }
    });
    return data;
  } catch (error) {
    console.error('Failed to search outputs:', error);
    return [];
  }
}

export async function getFilteredOutputs(
  userToken: string, 
  filters: {
    skillType?: string;
    userId?: string;
    dateRange?: { start: string; end: string };
    trustScoreMin?: number;
  }
): Promise<ApprovedOutput[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/learning/filtered-outputs`, {
      params: filters,
      headers: { Authorization: `Bearer ${userToken}` },
    });
    return data;
  } catch (error) {
    console.error('Failed to fetch filtered outputs:', error);
    return [];
  }
}
