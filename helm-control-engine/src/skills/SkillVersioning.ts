export interface SkillVersion {
  skillId: string;
  version: string;
  changelog: string;
  rolledBack?: boolean;
  date: Date;
  author?: string;
  breakingChanges?: boolean;
  migrationRequired?: boolean;
}

export const SkillVersioning: SkillVersion[] = [
  // Initial versions for starter skills
  {
    skillId: 'audioMaestro',
    version: 'v1.0',
    changelog: 'Initial release with basic audio generation capabilities',
    date: new Date('2024-01-01'),
    author: 'Acey Team',
    breakingChanges: false,
    migrationRequired: false,
  },
  {
    skillId: 'graphicsWizard',
    version: 'v1.0',
    changelog: 'Initial release with basic graphics generation capabilities',
    date: new Date('2024-01-01'),
    author: 'Acey Team',
    breakingChanges: false,
    migrationRequired: false,
  },
  {
    skillId: 'codeHelper',
    version: 'v1.0',
    changelog: 'Initial release with code generation and validation',
    date: new Date('2024-01-01'),
    author: 'Acey Team',
    breakingChanges: false,
    migrationRequired: false,
  },
];

export function addSkillVersion(version: Omit<SkillVersion, 'date'>): void {
  SkillVersioning.push({
    ...version,
    date: new Date(),
  });
}

export function getSkillVersions(skillId: string): SkillVersion[] {
  return SkillVersioning
    .filter(version => version.skillId === skillId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getLatestVersion(skillId: string): SkillVersion | undefined {
  const versions = getSkillVersions(skillId);
  return versions[0];
}

export function rollbackSkillVersion(skillId: string, targetVersion: string): boolean {
  const versions = getSkillVersions(skillId);
  const targetVersionEntry = versions.find(v => v.version === targetVersion);
  
  if (!targetVersionEntry) return false;
  
  // Mark current version as rolled back
  const currentVersion = versions[0];
  if (currentVersion) {
    currentVersion.rolledBack = true;
  }
  
  return true;
}

export function hasBreakingChanges(skillId: string, fromVersion: string, toVersion?: string): boolean {
  const versions = getSkillVersions(skillId);
  const fromIndex = versions.findIndex(v => v.version === fromVersion);
  const toIndex = toVersion ? 
    versions.findIndex(v => v.version === toVersion) : 
    0;
  
  if (fromIndex === -1 || toIndex === -1) return false;
  
  const versionRange = versions.slice(toIndex, fromIndex);
  return versionRange.some(v => v.breakingChanges === true);
}

export function requiresMigration(skillId: string, fromVersion: string, toVersion?: string): boolean {
  const versions = getSkillVersions(skillId);
  const fromIndex = versions.findIndex(v => v.version === fromVersion);
  const toIndex = toVersion ? 
    versions.findIndex(v => v.version === toVersion) : 
    0;
  
  if (fromIndex === -1 || toIndex === -1) return false;
  
  const versionRange = versions.slice(toIndex, fromIndex);
  return versionRange.some(v => v.migrationRequired === true);
}

export function getVersionHistory(skillId: string, limit?: number): SkillVersion[] {
  const versions = getSkillVersions(skillId);
  return limit ? versions.slice(0, limit) : versions;
}

export function getRecentVersions(days: number = 30): SkillVersion[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return SkillVersioning
    .filter(version => version.date >= cutoffDate)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
