import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const DATASET_PATH = `${FileSystem.documentDirectory}AceyDataset`;

export interface DatasetEntry {
  skillId: string;
  input: any;
  output: any;
  approvedBy: string;
  timestamp: string;
  skillType: 'code' | 'audio' | 'graphics' | 'link';
  tier: string;
  trustScore?: number;
  metadata?: {
    processingTime?: number;
    modelVersion?: string;
    validationPassed?: boolean;
    userFeedback?: string;
  };
}

// Ensure storage folder exists
export async function ensureDatasetDirectory() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DATASET_PATH);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DATASET_PATH, { intermediates: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to create dataset directory:', error);
    return false;
  }
}

export async function saveApprovedEntry(entry: DatasetEntry): Promise<string> {
  await ensureDatasetDirectory();
  
  const filename = `${DATASET_PATH}/entry_${Date.now()}.json`;
  const jsonEntry = JSON.stringify(entry, null, 2);
  
  try {
    await FileSystem.writeAsStringAsync(filename, jsonEntry);
    console.log(`Dataset entry saved: ${filename}`);
    return filename;
  } catch (error) {
    console.error('Failed to save dataset entry:', error);
    throw error;
  }
}

export async function getDatasetEntries(): Promise<DatasetEntry[]> {
  await ensureDatasetDirectory();
  
  try {
    const files = await FileSystem.readDirectoryAsync(DATASET_PATH);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const entries: DatasetEntry[] = [];
    for (const file of jsonFiles) {
      try {
        const content = await FileSystem.readAsStringAsync(`${DATASET_PATH}/${file}`);
        const entry = JSON.parse(content) as DatasetEntry;
        entries.push(entry);
      } catch (error) {
        console.error(`Failed to read file ${file}:`, error);
      }
    }
    
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Failed to read dataset directory:', error);
    return [];
  }
}

export async function getDatasetStats() {
  const entries = await getDatasetEntries();
  
  const stats = {
    totalEntries: entries.length,
    skillBreakdown: {} as Record<string, number>,
    tierBreakdown: {} as Record<string, number>,
    averageTrustScore: 0,
    recentEntries: entries.slice(0, 10),
    dailyGrowth: {} as Record<string, number>
  };
  
  let totalTrust = 0;
  let trustCount = 0;
  
  entries.forEach(entry => {
    // Skill breakdown
    stats.skillBreakdown[entry.skillType] = (stats.skillBreakdown[entry.skillType] || 0) + 1;
    
    // Tier breakdown
    stats.tierBreakdown[entry.tier] = (stats.tierBreakdown[entry.tier] || 0) + 1;
    
    // Trust score
    if (entry.trustScore !== undefined) {
      totalTrust += entry.trustScore;
      trustCount++;
    }
    
    // Daily growth
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    stats.dailyGrowth[date] = (stats.dailyGrowth[date] || 0) + 1;
  });
  
  stats.averageTrustScore = trustCount > 0 ? totalTrust / trustCount : 0;
  
  return stats;
}

export async function validateDatasetEntry(entry: DatasetEntry): Promise<boolean> {
  // Basic validation rules
  if (!entry.skillId || !entry.input || !entry.output || !entry.approvedBy) {
    return false;
  }
  
  if (!['code', 'audio', 'graphics', 'link'].includes(entry.skillType)) {
    return false;
  }
  
  if (!entry.timestamp || isNaN(new Date(entry.timestamp).getTime())) {
    return false;
  }
  
  // Content-specific validation
  switch (entry.skillType) {
    case 'code':
      if (typeof entry.output !== 'string' || entry.output.length < 10) {
        return false;
      }
      break;
    case 'audio':
      if (!entry.metadata?.validationPassed) {
        return false;
      }
      break;
    case 'graphics':
      if (!entry.metadata?.validationPassed) {
        return false;
      }
      break;
    case 'link':
      if (!entry.output || typeof entry.output !== 'object') {
        return false;
      }
      break;
  }
  
  return true;
}
