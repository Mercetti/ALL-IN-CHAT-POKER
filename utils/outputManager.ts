import { SkillType } from '../types/skillStore';

// Re-export SkillType for convenience
export { SkillType };

export interface GeneratedOutput {
  id: string;
  skill: SkillType;
  content: string | ArrayBuffer; // string for code, ArrayBuffer for graphics/audio
  metadata?: Record<string, any>;
  timestamp: Date;
  filename?: string;
}

// Temporary in-memory storage
const memoryOutputs: GeneratedOutput[] = [];

export function addToMemory(output: GeneratedOutput): void {
  memoryOutputs.push(output);
}

export function discardOutput(outputId: string): boolean {
  const index = memoryOutputs.findIndex(o => o.id === outputId);
  if (index !== -1) {
    memoryOutputs.splice(index, 1);
    return true;
  }
  return false;
}

export function getMemoryOutputs(): GeneratedOutput[] {
  return [...memoryOutputs]; // Return copy to prevent external mutation
}

export function getOutputById(outputId: string): GeneratedOutput | undefined {
  return memoryOutputs.find(o => o.id === outputId);
}

export function clearMemory(): void {
  memoryOutputs.length = 0;
}

// Download helper for web/Expo
export async function downloadOutput(output: GeneratedOutput, filename?: string): Promise<void> {
  const finalFilename = filename || output.filename || `acey-output-${output.id}`;
  
  if (typeof output.content === 'string') {
    // Code/text content
    const blob = new Blob([output.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Binary content (graphics/audio)
    const blob = new Blob([output.content]);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Copy to clipboard helper
export async function copyToClipboard(output: GeneratedOutput): Promise<void> {
  if (typeof output.content === 'string') {
    try {
      await navigator.clipboard.writeText(output.content);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = output.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } else {
    throw new Error('Cannot copy binary content to clipboard');
  }
}

// Optional: Add to Acey learning dataset
export async function approveForLearning(outputId: string): Promise<boolean> {
  const output = memoryOutputs.find(o => o.id === outputId);
  if (!output) return false;
  
  try {
    // Send content + metadata to LLM orchestrator dataset
    const learningData = {
      id: output.id,
      skill: output.skill,
      content: output.content,
      metadata: output.metadata,
      timestamp: output.timestamp,
      approvedForLearning: true
    };
    
    // Call your learning API endpoint
    const response = await fetch('/api/learning/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(learningData)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to approve for learning:', error);
    return false;
  }
}

// Generate unique ID for outputs
export function generateOutputId(): string {
  return `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get memory usage statistics
export function getMemoryStats(): {
  totalOutputs: number;
  bySkill: Record<SkillType, number>;
  totalSize: number;
} {
  const bySkill = {} as Record<SkillType, number>;
  let totalSize = 0;
  
  memoryOutputs.forEach(output => {
    bySkill[output.skill] = (bySkill[output.skill] || 0) + 1;
    
    if (typeof output.content === 'string') {
      totalSize += new Blob([output.content]).size;
    } else {
      totalSize += output.content.byteLength;
    }
  });
  
  return {
    totalOutputs: memoryOutputs.length,
    bySkill,
    totalSize
  };
}
