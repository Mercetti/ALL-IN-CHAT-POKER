import { ActionLog } from './types';
import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(__dirname, '../data/approvedActions.json');
const DATASET_PATH = path.join(__dirname, '../data/learningDataset.jsonl');

export function logAction(log: ActionLog): void {
  try {
    const logs = fs.existsSync(LOG_PATH) 
      ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')) 
      : [];
    
    logs.push(log);
    
    // Keep only last 1000 logs to prevent file bloat
    const trimmedLogs = logs.slice(-1000);
    
    fs.writeFileSync(LOG_PATH, JSON.stringify(trimmedLogs, null, 2));
    
    // Also append to learning dataset for approved actions
    if (log.status === 'success') {
      appendToLearningDataset(log);
    }
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}

export function appendToLearningDataset(log: ActionLog): void {
  try {
    const datasetEntry = {
      timestamp: log.timestamp,
      site: log.site,
      skill: log.skill,
      action: log.action,
      outcome: log.status,
      context: log.details || '',
      approved: true
    };
    
    const datasetLine = JSON.stringify(datasetEntry) + '\n';
    fs.appendFileSync(DATASET_PATH, datasetLine);
  } catch (error) {
    console.error('Failed to append to learning dataset:', error);
  }
}

export function getLogs(limit: number = 100): ActionLog[] {
  try {
    if (!fs.existsSync(LOG_PATH)) return [];
    
    const logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    return logs.slice(-limit);
  } catch (error) {
    console.error('Failed to read logs:', error);
    return [];
  }
}

export function getLogsBySite(siteId: string, limit: number = 50): ActionLog[] {
  try {
    const allLogs = getLogs(1000); // Get more logs to filter
    return allLogs
      .filter(log => log.site === siteId)
      .slice(-limit);
  } catch (error) {
    console.error('Failed to get logs by site:', error);
    return [];
  }
}

export function getLogsBySkill(skillName: string, limit: number = 50): ActionLog[] {
  try {
    const allLogs = getLogs(1000);
    return allLogs
      .filter(log => log.skill === skillName)
      .slice(-limit);
  } catch (error) {
    console.error('Failed to get logs by skill:', error);
    return [];
  }
}

export function clearLogs(): void {
  try {
    fs.writeFileSync(LOG_PATH, JSON.stringify([], null, 2));
    console.log('Logs cleared successfully');
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
}

export function getLogStats(): {
  total: number;
  success: number;
  warnings: number;
  errors: number;
  bySkill: Record<string, number>;
  bySite: Record<string, number>;
} {
  try {
    const logs = getLogs(10000); // Get all logs for stats
    const stats = {
      total: logs.length,
      success: logs.filter(l => l.status === 'success').length,
      warnings: logs.filter(l => l.status === 'warning').length,
      errors: logs.filter(l => l.status === 'error').length,
      bySkill: {} as Record<string, number>,
      bySite: {} as Record<string, number>
    };
    
    // Count by skill
    logs.forEach(log => {
      stats.bySkill[log.skill] = (stats.bySkill[log.skill] || 0) + 1;
      stats.bySite[log.site] = (stats.bySite[log.site] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to get log stats:', error);
    return {
      total: 0,
      success: 0,
      warnings: 0,
      errors: 0,
      bySkill: {},
      bySite: {}
    };
  }
}
